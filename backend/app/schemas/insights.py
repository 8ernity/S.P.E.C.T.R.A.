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

class RegulatoryNotice(BaseModel):
    analysisId: str
    generatedAt: str
    jurisdiction: str
    noticeTitle: str
    caseTrackingNumber: str
    statutoryBasis: List[str]
    geospatialEvidenceSummary: str
    directives: List[str]
    complianceDeadlineDays: int = 14
    signOffEntity: str
    provider: str

class ParcelDiagnostic(BaseModel):
    analysisId: str
    parcelId: int
    generatedAt: str
    morphologyType: str
    severity: str  # "Critical" | "High" | "Moderate" | "Low"
    interpretation: str
    environmentalRisk: str
    recommendedFieldCheck: str
    provider: str

class TimeTravelNarrative(BaseModel):
    analysisId: str
    generatedAt: str
    periodSpan: str
    headline: str
    chronologicalStory: str
    driversOfChange: List[str]
    longTermOutlook: str
    provider: str

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None
    analysisId: Optional[str] = None
    uiContext: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
    category: Optional[str] = None
    timestamp: str
    provider: str
