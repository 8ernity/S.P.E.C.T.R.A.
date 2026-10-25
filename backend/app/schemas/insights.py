from pydantic import BaseModel, Field
from typing import List, Optional

class IncidentInsight(BaseModel):
    provider: str  # "adaption" | "local_fallback"
    model: Optional[str] = None
    analysisId: str
    generatedAt: str
    summary: str
    observations: List[str]
    possibleExplanations: List[str]
    caveats: List[str]
    verificationSteps: List[str]
    reviewPriority: str  # "low" | "medium" | "high" | "insufficient_evidence"
    evidenceUsed: List[str]
    groundedDatasetId: Optional[str] = None
    providerStatus: str  # "success" | "fallback" | "error"
    providerMessage: Optional[str] = None
