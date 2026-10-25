import os
import io
import time
import uuid
import logging
import urllib.request
import json
import numpy as np
from PIL import Image
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from ..core.config import settings
from ..core.errors import SpectraError
from ..schemas.analysis import AnalysisResult
from .analysis import analyze_pair_internal, ANALYSIS_STORE

router = APIRouter(prefix="/stac", tags=["Earth Search STAC Time-Travel"])
logger = logging.getLogger(__name__)

EARTH_SEARCH_URL = "https://earth-search.aws.element84.com/v1/search"

class TimeTravelSearchRequest(BaseModel):
    bbox: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")
    baselineYear: int = Field(default=2019, description="Historical year (2016-2023)")
    comparisonYear: int = Field(default=2024, description="Recent year")
    month: int = Field(default=5, description="Month of year (1-12) to match seasons")
    maxCloudCover: int = Field(default=20, description="Max cloud cover percentage")
    method: str = Field(default="ndvi", description="ndvi, cvd, otsu, threshold")
    threshold: Optional[float] = None

def query_stac_scene(bbox: List[float], start_date: str, end_date: str, max_cloud: int) -> Optional[Dict[str, Any]]:
    payload = {
        "collections": ["sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "query": {
            "eo:cloud_cover": {"lt": max_cloud}
        },
        "sortby": [{"field": "properties.eo:cloud_cover", "direction": "asc"}],
        "limit": 1
    }
    req = urllib.request.Request(
        EARTH_SEARCH_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "SPECTRA-STAC-Client/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            if res.status == 200:
                body = json.loads(res.read().decode("utf-8"))
                features = body.get("features", [])
                if features:
                    return features[0]
    except Exception as e:
        logger.warning(f"STAC search error for date range {start_date} to {end_date}: {e}")
    return None

def download_image_from_url(url: str, timeout: int = 15) -> Image.Image:
    headers = {"User-Agent": "SPECTRA-Client/1.0"}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        content = res.read()
        return Image.open(io.BytesIO(content))

@router.post("/time-travel", response_model=AnalysisResult)
def time_travel_analysis(req: TimeTravelSearchRequest):
    """
    Search historical Earth Search STAC Sentinel-2 imagery for bbox at baselineYear vs comparisonYear,
    download true color rasters, and perform change detection analysis.
    """
    if len(req.bbox) != 4:
        raise SpectraError("INVALID_BBOX", "bbox must contain exactly 4 coordinates: [min_lon, min_lat, max_lon, max_lat]")

    month_str = f"{req.month:02d}"
    # Approximate 60-day seasonal window centered on selected month
    start_m = max(1, req.month - 1)
    end_m = min(12, req.month + 1)

    t1_start = f"{req.baselineYear}-{start_m:02d}-01"
    t1_end = f"{req.baselineYear}-{end_m:02d}-28"

    t2_start = f"{req.comparisonYear}-{start_m:02d}-01"
    t2_end = f"{req.comparisonYear}-{end_m:02d}-28"

    # Query baseline (T1)
    scene_t1 = query_stac_scene(req.bbox, t1_start, t1_end, req.maxCloudCover)
    if not scene_t1:
        # Fallback with relaxed cloud cover
        scene_t1 = query_stac_scene(req.bbox, f"{req.baselineYear}-01-01", f"{req.baselineYear}-12-31", 60)
        if not scene_t1:
            raise SpectraError("NO_HISTORICAL_SCENE", f"No Sentinel-2 scene found for baseline year {req.baselineYear} within coordinates {req.bbox}.")

    # Query comparison (T2)
    scene_t2 = query_stac_scene(req.bbox, t2_start, t2_end, req.maxCloudCover)
    if not scene_t2:
        scene_t2 = query_stac_scene(req.bbox, f"{req.comparisonYear}-01-01", f"{req.comparisonYear}-12-31", 60)
        if not scene_t2:
            raise SpectraError("NO_RECENT_SCENE", f"No Sentinel-2 scene found for comparison year {req.comparisonYear} within coordinates {req.bbox}.")

    # Extract asset URLs (prefer thumbnail or visual)
    t1_url = scene_t1.get("assets", {}).get("thumbnail", {}).get("href")
    t2_url = scene_t2.get("assets", {}).get("thumbnail", {}).get("href")

    if not t1_url or not t2_url:
        raise SpectraError("MISSING_ASSETS", "Selected STAC scenes do not provide thumbnail or visual imagery.")

    # Create temporary directory for pair
    pair_id = f"stac_{uuid.uuid4().hex[:10]}"
    pair_dir = os.path.join(settings.TEMP_DATA_DIR, pair_id)
    os.makedirs(pair_dir, exist_ok=True)

    try:
        img_b = download_image_from_url(t1_url).convert("RGB")
        img_a = download_image_from_url(t2_url).convert("RGB")

        # Resize to match smallest common dimension if different
        if img_b.size != img_a.size:
            target_size = (min(img_b.width, img_a.width), min(img_b.height, img_a.height))
            img_b = img_b.resize(target_size, Image.Resampling.LANCZOS)
            img_a = img_a.resize(target_size, Image.Resampling.LANCZOS)

        before_filename = "before.png"
        after_filename = "after.png"
        img_b.save(os.path.join(pair_dir, before_filename), format="PNG")
        img_a.save(os.path.join(pair_dir, after_filename), format="PNG")

        date_t1 = scene_t1.get("properties", {}).get("datetime", f"{req.baselineYear}-06-15T00:00:00Z")[:10]
        date_t2 = scene_t2.get("properties", {}).get("datetime", f"{req.comparisonYear}-06-15T00:00:00Z")[:10]
        cloud_t1 = round(scene_t1.get("properties", {}).get("eo:cloud_cover", 0.0), 1)
        cloud_t2 = round(scene_t2.get("properties", {}).get("eo:cloud_cover", 0.0), 1)

        source_title = f"STAC Time-Travel: [{req.bbox[0]:.2f}, {req.bbox[1]:.2f}] ({date_t1} vs {date_t2})"

        # Execute change detection using SPECTRA core engine
        from ..schemas.analysis import AnalysisRequest, AnalysisSource
        analysis_req = AnalysisRequest(
            source=AnalysisSource(pairId=pair_id),
            method=req.method,
            threshold=req.threshold or 0.20
        )

        result = analyze_pair_internal(analysis_req, custom_title=source_title, acquired_b=date_t1, acquired_a=date_t2)
        result.citations.append(f"Earth Search STAC (AWS): Baseline Cloud Cover {cloud_t1}%, Comparison Cloud Cover {cloud_t2}%.")
        return result

    except Exception as e:
        logger.error(f"Error processing STAC pair: {e}")
        raise SpectraError("STAC_PROCESSING_FAILED", f"Failed to download and process STAC rasters: {str(e)}")
