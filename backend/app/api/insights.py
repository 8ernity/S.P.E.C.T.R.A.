from fastapi import APIRouter
from typing import Dict
from ..core.errors import SpectraError
from ..schemas.insights import IncidentInsight
from ..services.adaption_service import generate_incident_insight
from .analysis import ANALYSIS_STORE

router = APIRouter(prefix="/analyses", tags=["Insights"])

# Cache for generated insights
INSIGHT_STORE: Dict[str, IncidentInsight] = {}

@router.post("/{analysis_id}/insights", response_model=IncidentInsight)
def create_analysis_insight(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found. Run analysis before requesting AI explanation.")
        
    analysis = ANALYSIS_STORE[analysis_id]
    insight = generate_incident_insight(analysis)
    INSIGHT_STORE[analysis_id] = insight
    return insight

@router.get("/{analysis_id}/insights", response_model=IncidentInsight)
def get_analysis_insight(analysis_id: str):
    if analysis_id in INSIGHT_STORE:
        return INSIGHT_STORE[analysis_id]
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    analysis = ANALYSIS_STORE[analysis_id]
    insight = generate_incident_insight(analysis)
    INSIGHT_STORE[analysis_id] = insight
    return insight
