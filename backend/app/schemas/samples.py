from pydantic import BaseModel, Field
from typing import List, Optional, Any

class SampleMetadata(BaseModel):
    id: str
    title: str
    description: str
    type: str  # "scientific" | "visual"
    category: str
    acquiredBefore: Optional[str] = None
    acquiredAfter: Optional[str] = None
    satellite: str
    sensor: Optional[str] = None
    crs: Optional[str] = None
    resolutionMeters: Optional[float] = None
    pixelSize: List[int]
    geoTransform: Optional[List[float]] = None
    availableBands: List[str]
    supportedMethods: List[str]
    recommendedMethod: str
    recommendedThreshold: float = 0.15
    isMultispectral: bool
    isGeoreferenced: bool
    cloudCoverFraction: float = 0.0
    credit: str

class SampleSummary(BaseModel):
    id: str
    title: str
    category: str
    type: str
    folder: str
    beforeThumb: str
    afterThumb: str
    satellite: str
    supportedMethods: List[str]
    recommendedMethod: str
    isOfflineReady: bool

class SampleManifestResponse(BaseModel):
    system: str
    version: str
    cases: List[SampleSummary]
