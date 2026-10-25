from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from .analysis import AnalysisResult
from .insights import IncidentInsight

class ReportData(BaseModel):
    reportId: str
    generatedAt: str
    title: str
    analysis: AnalysisResult
    insight: Optional[IncidentInsight] = None
    systemInfo: Dict[str, Any]
    methodologyNotes: List[str]
    citations: List[str]
