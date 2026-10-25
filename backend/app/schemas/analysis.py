from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any

class SourceTarget(BaseModel):
    sampleId: Optional[str] = None
    pairId: Optional[str] = None

class AnalysisRequest(BaseModel):
    source: SourceTarget
    method: str  # "ndvi" | "ndwi" | "nbr" | "threshold" | "otsu" | "cvd"
    threshold: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict)

class HistogramBin(BaseModel):
    rangeStart: float
    rangeEnd: float
    pixelCount: int
    percentage: float

class ConnectedRegion(BaseModel):
    id: int
    maskPixelCount: int
    bboxPixels: List[int]  # [x, y, w, h]
    centroidPixels: List[float]  # [cx, cy]
    areaKm2: Optional[float] = None
    meanDelta: Optional[float] = None
    categorySuggestion: Optional[str] = None

class Measurements(BaseModel):
    changedPixels: int
    validPixels: int
    changePercentage: float
    affectedAreaKm2: Optional[float] = None
    meanDelta: float
    coverageFraction: float
    meanIndexBefore: Optional[float] = None
    meanIndexAfter: Optional[float] = None
    thresholdUsed: float

class Visuals(BaseModel):
    beforeUrl: str
    afterUrl: str
    overlayUrl: str
    differenceHeatmapUrl: Optional[str] = None

class Provenance(BaseModel):
    origin: str  # "sample" | "upload" | "stac"
    crs: Optional[str] = None
    resolutionMeters: Optional[float] = None
    geoTransform: Optional[List[float]] = None
    sourceSceneIds: List[str] = Field(default_factory=list)
    acquiredBefore: Optional[str] = None
    acquiredAfter: Optional[str] = None
    sensor: Optional[str] = None
    satellite: Optional[str] = None
    algorithmVersion: str = "SPECTRA-v1.0"
    computedAt: str

class AnalysisResult(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    analysisId: str
    status: str  # "completed" | "processing" | "failed"
    mode: str    # "scientific" | "visual"
    method: str
    sourceTitle: str
    measurements: Measurements
    regions: List[ConnectedRegion]
    histogram: List[HistogramBin]
    visuals: Visuals
    provenance: Provenance
    warnings: List[str]
    citations: List[str]
