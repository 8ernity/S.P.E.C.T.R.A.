import os
import io
import math
import time
import uuid
import logging
import urllib.request
import json
import numpy as np
from PIL import Image
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple

from ..core.config import settings
from ..core.errors import SpectraError
from ..schemas.analysis import AnalysisResult
from .analysis import analyze_pair_internal, ANALYSIS_STORE

router = APIRouter(prefix="/stac", tags=["Earth Search STAC Time-Travel"])
logger = logging.getLogger(__name__)

PLANETARY_COMPUTER_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
EARTH_SEARCH_URL = "https://earth-search.aws.element84.com/v1/search"

class TimeTravelSearchRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    baselineYear: int = Field(default=2019, description="Historical year (2016-2023)")
    comparisonYear: int = Field(default=2024, description="Recent year")
    month: int = Field(default=5, description="Month of year (1-12) to match seasons")
    maxCloudCover: int = Field(default=20, description="Max cloud cover percentage")
    method: str = Field(default="ndvi", description="ndvi, cvd, otsu, threshold")
    threshold: Optional[float] = None

def reverse_geocode(lat: float, lon: float) -> str:
    """
    Reverse geocodes (lat, lon) to a human-readable city/region/country name.
    Falls back cleanly to coordinates if unavailable.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat:.4f}&lon={lon:.4f}&zoom=10"
        headers = {"User-Agent": "SPECTRA-Satellite-Intelligence/1.0"}
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=4) as res:
            if res.status == 200:
                data = json.loads(res.read().decode("utf-8"))
                addr = data.get("address", {})
                parts = []
                for k in ["city", "town", "village", "county", "state", "country"]:
                    v = addr.get(k)
                    if v and v not in parts:
                        parts.append(v)
                if parts:
                    return ", ".join(parts[:3])
                display = data.get("display_name", "")
                if display:
                    return ", ".join(display.split(",")[:3]).strip()
    except Exception as e:
        logger.debug(f"Reverse geocode lookup bypassed: {e}")
    
    lat_h = f"{abs(lat):.2f}°{'N' if lat >= 0 else 'S'}"
    lon_h = f"{abs(lon):.2f}°{'E' if lon >= 0 else 'W'}"
    return f"Geographic Sector [{lat_h}, {lon_h}]"

def clean_black_swath_border(img: Image.Image) -> Image.Image:
    """
    Detects any diagonal black swath edges (pure [0, 0, 0] nodata pixels)
    and fills them cleanly using Telea inpainting so no black void remains.
    """
    try:
        import cv2
        arr = np.array(img)
        black_mask = (arr[..., 0] == 0) & (arr[..., 1] == 0) & (arr[..., 2] == 0)
        black_ratio = black_mask.mean()
        if 0.001 < black_ratio <= 0.65:
            mask_uint8 = black_mask.astype(np.uint8) * 255
            rgb = arr[..., :3].copy()
            filled = cv2.inpaint(rgb, mask_uint8, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
            return Image.fromarray(filled)
    except Exception as e:
        logger.debug(f"Swath inpaint skipped: {e}")
    return img

def query_stac_scene(
    bbox: List[float],
    start_date: str,
    end_date: str,
    max_cloud: int
) -> Optional[Tuple[str, str, float, Optional[List[float]], bool, Optional[str]]]:
    """
    Queries STAC for a Sentinel-2 scene covering the requested bounding box.
    Returns Tuple of (preview_image_url, acquired_date, cloud_cover, granule_bbox, is_dynamically_cropped, fallback_url) or None.
    Uses official Planetary Computer TiTiler dynamic item bbox endpoint:
      https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{minx},{miny},{maxx},{maxy}/{w}x{h}.png
    Prioritizes full-coverage orbit passes with 0% nodata to prevent swath cutoffs.
    """
    # 1. Try Microsoft Planetary Computer
    payload_pc = {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "query": {
            "eo:cloud_cover": {"lt": max_cloud}
        },
        "limit": 6
    }
    try:
        req = urllib.request.Request(
            PLANETARY_COMPUTER_STAC_URL,
            data=json.dumps(payload_pc).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SPECTRA-STAC-Client/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                body = json.loads(res.read().decode("utf-8"))
                features = body.get("features", [])
                if features:
                    # Sort candidates by combined score: nodata percentage strongly penalized over cloud cover
                    features.sort(key=lambda f: (
                        float(f.get("properties", {}).get("s2:nodata_pixel_percentage", 0.0)) * 3.0 +
                        float(f.get("properties", {}).get("eo:cloud_cover", 0.0))
                    ))

                    # Calculate ground-projected aspect ratio to prevent stretching
                    center_lat = (bbox[1] + bbox[3]) / 2.0
                    dx = abs(bbox[2] - bbox[0]) * math.cos(math.radians(center_lat))
                    dy = abs(bbox[3] - bbox[1])
                    aspect = dx / dy if dy > 0 else 1.0
                    max_dim = 1024
                    if aspect >= 1.0:
                        w = max_dim
                        h = max(256, min(max_dim, int(round(max_dim / aspect))))
                    else:
                        h = max_dim
                        w = max(256, min(max_dim, int(round(max_dim * aspect))))

                    minx, miny, maxx, maxy = bbox

                    best_candidate = None
                    for f in features:
                        item_id = f.get("id")
                        collection_id = f.get("collection", "sentinel-2-l2a")
                        granule_bbox = f.get("bbox")
                        assets = f.get("assets", {})
                        fallback_url = (
                            assets.get("rendered_preview", {}).get("href")
                            or assets.get("thumbnail", {}).get("href")
                            or assets.get("visual", {}).get("href")
                        )

                        # Official Planetary Computer Data API dynamic bounding box crop endpoint
                        cropped_url = (
                            f"https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/"
                            f"{minx},{miny},{maxx},{maxy}/{w}x{h}.png"
                            f"?collection={collection_id}&item={item_id}&assets=visual"
                        )
                        dt = f.get("properties", {}).get("datetime", start_date)[:10]
                        cloud = float(f.get("properties", {}).get("eo:cloud_cover", 0.0))
                        nodata_pct = float(f.get("properties", {}).get("s2:nodata_pixel_percentage", 0.0))

                        candidate = (cropped_url, dt, cloud, granule_bbox, True, fallback_url)
                        if best_candidate is None:
                            best_candidate = candidate

                        # If tile has 0% nodata, it is 100% full coverage with zero swath edge
                        if nodata_pct == 0.0:
                            return candidate

                    if best_candidate:
                        return best_candidate
    except Exception as e:
        logger.warning(f"Planetary Computer search warning: {e}")

    # 2. Fallback to Earth Search AWS
    payload_es = {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "query": {
            "eo:cloud_cover": {"lt": max_cloud}
        },
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
        "limit": 1
    }
    try:
        req = urllib.request.Request(
            EARTH_SEARCH_URL,
            data=json.dumps(payload_es).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "SPECTRA-STAC-Client/1.0"}
        )
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                body = json.loads(res.read().decode("utf-8"))
                features = body.get("features", [])
                if features:
                    f = features[0]
                    granule_bbox = f.get("bbox")
                    assets = f.get("assets", {})
                    url = assets.get("thumbnail", {}).get("href") or assets.get("visual", {}).get("href")
                    if url and not url.startswith("s3://"):
                        dt = f.get("properties", {}).get("datetime", start_date)[:10]
                        cloud = float(f.get("properties", {}).get("eo:cloud_cover", 0.0))
                        return (url, dt, cloud, granule_bbox, False, None)
    except Exception as e:
        logger.warning(f"Earth Search fallback warning: {e}")

    return None

def crop_image_to_bbox(img: Image.Image, granule_bbox: Optional[List[float]], target_bbox: List[float]) -> Image.Image:
    """
    Spatially crops a full-granule satellite raster to the user's requested bounding box.
    Used as an offline or secondary fallback if dynamic STAC preview cropping is unavailable.
    """
    if not granule_bbox or len(granule_bbox) != 4 or len(target_bbox) != 4:
        return img
    g_minx, g_miny, g_maxx, g_maxy = granule_bbox
    t_minx, t_miny, t_maxx, t_maxy = target_bbox

    t_minx = max(g_minx, min(g_maxx, t_minx))
    t_maxx = max(g_minx, min(g_maxx, t_maxx))
    t_miny = max(g_miny, min(g_maxy, t_miny))
    t_maxy = max(g_miny, min(g_maxy, t_maxy))

    w, h = img.size
    g_w = g_maxx - g_minx
    g_h = g_maxy - g_miny
    if g_w <= 0 or g_h <= 0:
        return img

    x1 = int(((t_minx - g_minx) / g_w) * w)
    x2 = int(((t_maxx - g_minx) / g_w) * w)
    # North is at top of image (y=0 corresponds to max_lat g_maxy)
    y1 = int(((g_maxy - t_maxy) / g_h) * h)
    y2 = int(((g_maxy - t_miny) / g_h) * h)

    x1, x2 = max(0, min(w, x1)), max(0, min(w, x2))
    y1, y2 = max(0, min(h, y1)), max(0, min(h, y2))

    if (x2 - x1) >= 5 and (y2 - y1) >= 5:
        cropped = img.crop((x1, y1, x2, y2))
        if cropped.width < 256 or cropped.height < 256:
            cropped = cropped.resize((max(512, cropped.width * 4), max(512, cropped.height * 4)), Image.Resampling.LANCZOS)
        return cropped
    return img

def download_image_from_url(url: str, timeout: int = 25) -> Image.Image:
    headers = {"User-Agent": "SPECTRA-Client/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        content = res.read()
        return Image.open(io.BytesIO(content))

def download_stac_raster(
    url: str,
    is_dynamically_cropped: bool,
    granule_bbox: Optional[List[float]],
    target_bbox: List[float],
    fallback_url: Optional[str] = None
) -> Image.Image:
    """
    Downloads STAC raster with automatic fallback:
    1. Downloads dynamic cropped endpoint from Planetary Computer.
    2. If that fails or if only full thumbnail was available, falls back and crops locally using bounding box coordinates.
    3. Cleans any diagonal swath edge cutoffs using Telea inpainting.
    """
    try:
        img = download_image_from_url(url)
        if not is_dynamically_cropped and granule_bbox:
            img = crop_image_to_bbox(img, granule_bbox, target_bbox)
        img = clean_black_swath_border(img)
        return img
    except Exception as e:
        logger.warning(f"Primary dynamic raster download from {url} encountered issue: {e}")
        if fallback_url:
            logger.info(f"Retrying with fallback STAC raster ({fallback_url}) and applying local spatial crop")
            img = download_image_from_url(fallback_url)
            if granule_bbox:
                img = crop_image_to_bbox(img, granule_bbox, target_bbox)
            img = clean_black_swath_border(img)
            return img
        raise

@router.post("/time-travel", response_model=AnalysisResult)
def time_travel_analysis(req: TimeTravelSearchRequest):
    """
    Search historical Planetary STAC Sentinel-2 imagery for bbox at baselineYear vs comparisonYear,
    download true color rasters cropped precisely to the user's study area, and perform change detection analysis.
    """
    if len(req.bbox) != 4:
        raise SpectraError("INVALID_BBOX", "bbox must contain exactly 4 coordinates: [min_lon, min_lat, max_lon, max_lat]")

    # Approximate 60-day seasonal window centered on selected month
    start_m = max(1, req.month - 1)
    end_m = min(12, req.month + 1)

    t1_start = f"{req.baselineYear}-{start_m:02d}-01"
    t1_end = f"{req.baselineYear}-{end_m:02d}-28"

    t2_start = f"{req.comparisonYear}-{start_m:02d}-01"
    t2_end = f"{req.comparisonYear}-{end_m:02d}-28"

    # Query baseline (T1)
    t1_data = query_stac_scene(req.bbox, t1_start, t1_end, req.maxCloudCover)
    if not t1_data:
        # Fallback with wider seasonal window and relaxed cloud cover
        t1_data = query_stac_scene(req.bbox, f"{req.baselineYear}-01-01", f"{req.baselineYear}-12-31", 60)
        if not t1_data:
            raise SpectraError("NO_HISTORICAL_SCENE", f"No Sentinel-2 scene found for baseline year {req.baselineYear} within coordinates {req.bbox}.")

    # Query comparison (T2)
    t2_data = query_stac_scene(req.bbox, t2_start, t2_end, req.maxCloudCover)
    if not t2_data:
        t2_data = query_stac_scene(req.bbox, f"{req.comparisonYear}-01-01", f"{req.comparisonYear}-12-31", 60)
        if not t2_data:
            raise SpectraError("NO_RECENT_SCENE", f"No Sentinel-2 scene found for comparison year {req.comparisonYear} within coordinates {req.bbox}.")

    t1_url, date_t1, cloud_t1, g_bbox1, is_cropped1, fallback_url1 = t1_data
    t2_url, date_t2, cloud_t2, g_bbox2, is_cropped2, fallback_url2 = t2_data

    # Create temporary directory for pair
    pair_id = f"stac_{uuid.uuid4().hex[:10]}"
    pair_dir = os.path.join(settings.TEMP_DATA_DIR, pair_id)
    os.makedirs(pair_dir, exist_ok=True)

    try:
        img_b = download_stac_raster(t1_url, is_cropped1, g_bbox1, req.bbox, fallback_url1).convert("RGB")
        img_a = download_stac_raster(t2_url, is_cropped2, g_bbox2, req.bbox, fallback_url2).convert("RGB")

        # Resize to match smallest common dimension if different
        if img_b.size != img_a.size:
            target_size = (min(img_b.width, img_a.width), min(img_b.height, img_a.height))
            img_b = img_b.resize(target_size, Image.Resampling.LANCZOS)
            img_a = img_a.resize(target_size, Image.Resampling.LANCZOS)

        before_filename = "before.png"
        after_filename = "after.png"
        img_b.save(os.path.join(pair_dir, before_filename), format="PNG")
        img_a.save(os.path.join(pair_dir, after_filename), format="PNG")

        center_lon = (req.bbox[0] + req.bbox[2]) / 2.0
        center_lat = (req.bbox[1] + req.bbox[3]) / 2.0
        location_name = reverse_geocode(center_lat, center_lon)

        source_title = f"{location_name} Sentinel-2 [{center_lat:.2f}°, {center_lon:.2f}°] ({date_t1} vs {date_t2})"

        # Method routing: STAC true-color previews are RGB.
        # If user picked NDVI/NDWI (which requires raw NIR/SWIR bands), automatically use CVD (Change Vector Magnitude) or Otsu
        effective_method = req.method
        if effective_method in ["ndvi", "ndwi", "nbr"]:
            effective_method = "cvd"

        # Execute change detection using SPECTRA core engine
        from ..schemas.analysis import AnalysisRequest, SourceTarget
        analysis_req = AnalysisRequest(
            source=SourceTarget(pairId=pair_id),
            method=effective_method,
            threshold=req.threshold or 0.20
        )

        result = analyze_pair_internal(analysis_req, custom_title=source_title, acquired_b=date_t1, acquired_a=date_t2)
        result.citations.append(f"Target Location: {location_name} (Centroid: {center_lat:.4f}, {center_lon:.4f}).")
        result.citations.append(f"Planetary STAC: Baseline Cloud Cover {cloud_t1}%, Comparison Cloud Cover {cloud_t2}%.")
        return result

    except Exception as e:
        logger.error(f"Error processing STAC pair: {e}")
        raise SpectraError("STAC_PROCESSING_FAILED", f"Failed to download and process STAC rasters: {str(e)}")
