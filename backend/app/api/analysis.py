import os
import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import FileResponse
from typing import Dict, Any, Optional

from ..core.config import settings
from ..core.errors import SpectraError
from ..schemas.analysis import AnalysisRequest, AnalysisResult, Visuals, Provenance
from ..services.raster_io import load_raster_pair
from ..services.change_methods import (
    run_ndvi, run_ndwi, run_nbr, run_rgb_difference, run_cvd, compute_otsu_threshold
)
from ..services.region_stats import analyze_regions_and_render_overlay

router = APIRouter(prefix="/analyses", tags=["Analysis"])

# In-memory storage for active session analyses
ANALYSIS_STORE: Dict[str, AnalysisResult] = {}

@router.post("", response_model=AnalysisResult)
def create_analysis(req: AnalysisRequest):
    analysis_id = f"ana_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    warnings = []
    
    # 1. Resolve source files and metadata
    if req.source.sampleId:
        sample_folder = os.path.join(settings.SAMPLES_DIR, req.source.sampleId)
        if not os.path.exists(sample_folder):
            raise SpectraError("NOT_FOUND", f"Sample case '{req.source.sampleId}' not found.")
            
        before_path = os.path.join(sample_folder, "before.png")
        after_path = os.path.join(sample_folder, "after.png")
        bands_b_path = os.path.join(sample_folder, "before_bands.npz")
        bands_a_path = os.path.join(sample_folder, "after_bands.npz")
        
        meta_file = os.path.join(sample_folder, "metadata.json")
        sample_meta = {}
        if os.path.exists(meta_file):
            with open(meta_file, "r", encoding="utf-8") as f:
                sample_meta = json.load(f)
                
        source_title = sample_meta.get("title", req.source.sampleId)
        satellite = sample_meta.get("satellite", "Sentinel-2 MSI")
        sensor = sample_meta.get("sensor", "MSI Optical")
        crs = sample_meta.get("crs", "EPSG:32645")
        resolution_m = sample_meta.get("resolutionMeters", 10.0)
        acquired_b = sample_meta.get("acquiredBefore")
        acquired_a = sample_meta.get("acquiredAfter")
        origin = "sample"
        before_url = f"/samples/{req.source.sampleId}/before.png"
        after_url = f"/samples/{req.source.sampleId}/after.png"
        
    elif req.source.pairId:
        pair_folder = os.path.join(settings.TEMP_DATA_DIR, req.source.pairId)
        if not os.path.exists(pair_folder):
            raise SpectraError("NOT_FOUND", f"Uploaded pair '{req.source.pairId}' not found.")
            
        # Find files
        files = os.listdir(pair_folder)
        before_file = next((f for f in files if f.startswith("before")), None)
        after_file = next((f for f in files if f.startswith("after")), None)
        if not before_file or not after_file:
            raise SpectraError("MISSING_FILE", "Upload directory missing before/after pair.")
            
        before_path = os.path.join(pair_folder, before_file)
        after_path = os.path.join(pair_folder, after_file)
        bands_b_path = None
        bands_a_path = None
        
        source_title = f"Uploaded Pair ({before_file} vs {after_file})"
        satellite = "User Provided Optical Sensor"
        sensor = "RGB Camera / Optical Sensor"
        crs = None
        resolution_m = None
        acquired_b = None
        acquired_a = None
        origin = "upload"
        warnings.append("Uploaded optical pair lacks verified geographic coordinates. Absolute area measurements are disabled.")
        before_url = f"/cache/{req.source.pairId}/{before_file}"
        after_url = f"/cache/{req.source.pairId}/{after_file}"
    else:
        raise SpectraError("INVALID_REQUEST", "Either sampleId or pairId must be specified in request source.")

    # 2. Load rasters
    rgb_b, rgb_a, bands_b, bands_a, load_meta = load_raster_pair(
        before_path, after_path, bands_b_path, bands_a_path
    )
    warnings.extend(load_meta.get("warnings", []))
    
    # 3. Method routing and computation
    method = req.method.lower().strip()
    is_signed = False
    index_b = None
    index_a = None
    
    if method == "ndvi":
        if not load_meta["has_multispectral"]:
            raise SpectraError(
                "INCOMPATIBLE_BANDS",
                "NDVI requires Red (B04) and Near-Infrared (B08) channels. Multispectral data is not available for this input.",
                details={"required": ["B04", "B08"], "available": list(bands_b.keys())}
            )
        mode = "scientific"
        index_b, index_a, diff_or_delta = run_ndvi(bands_b, bands_a)
        is_signed = True
        default_thresh = 0.15
        
    elif method == "ndwi":
        if not load_meta["has_multispectral"]:
            raise SpectraError(
                "INCOMPATIBLE_BANDS",
                "NDWI requires Green (B03) and Near-Infrared (B08) channels.",
                details={"required": ["B03", "B08"]}
            )
        mode = "scientific"
        index_b, index_a, diff_or_delta = run_ndwi(bands_b, bands_a)
        is_signed = True
        default_thresh = 0.20
        
    elif method == "nbr":
        if not load_meta["has_multispectral"] or "B12" not in bands_b:
            raise SpectraError(
                "INCOMPATIBLE_BANDS",
                "NBR requires Near-Infrared (B08) and Shortwave-Infrared (B12) channels.",
                details={"required": ["B08", "B12"]}
            )
        mode = "scientific"
        index_b, index_a, diff_or_delta = run_nbr(bands_b, bands_a)
        is_signed = True
        default_thresh = 0.18
        
    elif method == "cvd":
        mode = "scientific" if load_meta["has_multispectral"] else "visual"
        if load_meta["has_multispectral"]:
            diff_or_delta = run_cvd(bands_b, bands_a)
        else:
            diff_or_delta = run_rgb_difference(rgb_b, rgb_a)
        is_signed = False
        default_thresh = 0.20
        
    elif method in ["otsu", "threshold"]:
        mode = "visual"
        diff_or_delta = run_rgb_difference(rgb_b, rgb_a)
        is_signed = False
        if method == "otsu":
            default_thresh = compute_otsu_threshold(diff_or_delta)
        else:
            default_thresh = 0.22
    else:
        raise SpectraError("INVALID_METHOD", f"Unsupported analysis method '{req.method}'. Supported: ndvi, ndwi, nbr, otsu, threshold, cvd.")

    # 4. Resolve threshold
    threshold_to_use = req.threshold if (req.threshold is not None and req.threshold > 0) else default_thresh
    
    # 5. Extract parameters
    params = req.parameters or {}
    min_region_pixels = params.get("minRegionPixels", 15)
    smoothing_kernel = params.get("smoothingKernel", 3)
    
    # 6. Analyze regions and render RGBA overlay
    measurements, regions, histogram, overlay_filename, heatmap_filename = analyze_regions_and_render_overlay(
        diff_or_delta=diff_or_delta,
        threshold=threshold_to_use,
        analysis_id=analysis_id,
        output_dir=settings.TEMP_DATA_DIR,
        is_signed_delta=is_signed,
        resolution_m=resolution_m,
        min_region_pixels=min_region_pixels,
        smoothing_kernel=smoothing_kernel,
        index_before=index_b,
        index_after=index_a
    )
    
    overlay_url = f"/api/v1/analyses/{analysis_id}/overlay.png"
    heatmap_url = f"/api/v1/analyses/{analysis_id}/heatmap.png"
    
    provenance = Provenance(
        origin=origin,
        crs=crs,
        resolutionMeters=resolution_m,
        sourceSceneIds=[f"{req.source.sampleId or req.source.pairId}"],
        acquiredBefore=acquired_b,
        acquiredAfter=acquired_a,
        sensor=sensor,
        satellite=satellite,
        algorithmVersion="SPECTRA-v1.0",
        computedAt=now_iso
    )
    
    visuals = Visuals(
        beforeUrl=before_url,
        afterUrl=after_url,
        overlayUrl=overlay_url,
        differenceHeatmapUrl=heatmap_url
    )
    
    citations = [
        "Sentinel-2 L2A BOA Multispectral Imagery: European Space Agency / Copernicus.",
        f"SPECTRA Mathematical Engine: {method.upper()} raster delta and connected component segmentation."
    ]
    
    result = AnalysisResult(
        analysisId=analysis_id,
        status="completed",
        mode=mode,
        method=method,
        sourceTitle=source_title,
        measurements=measurements,
        regions=regions,
        histogram=histogram,
        visuals=visuals,
        provenance=provenance,
        warnings=warnings,
        citations=citations
    )
    
    ANALYSIS_STORE[analysis_id] = result
    return result

@router.get("/{analysis_id}", response_model=AnalysisResult)
def get_analysis(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    return ANALYSIS_STORE[analysis_id]

@router.get("/{analysis_id}/overlay.png")
def get_overlay_image(analysis_id: str):
    overlay_path = os.path.join(settings.TEMP_DATA_DIR, f"overlay_{analysis_id}.png")
    if not os.path.exists(overlay_path):
        raise SpectraError("NOT_FOUND", f"Overlay image for analysis '{analysis_id}' not found.")
    return FileResponse(
        overlay_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"}
    )

@router.get("/{analysis_id}/heatmap.png")
def get_heatmap_image(analysis_id: str):
    heatmap_path = os.path.join(settings.TEMP_DATA_DIR, f"heatmap_{analysis_id}.png")
    if not os.path.exists(heatmap_path):
        raise SpectraError("NOT_FOUND", f"Heatmap image for analysis '{analysis_id}' not found.")
    return FileResponse(
        heatmap_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"}
    )
