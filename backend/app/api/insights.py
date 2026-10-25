from fastapi import APIRouter, Query
from typing import Dict, Optional, List
from ..core.errors import SpectraError
from ..schemas.insights import (
    IncidentInsight,
    RegulatoryNotice,
    ParcelDiagnostic,
    TimeTravelNarrative,
    ChatRequest,
    ChatResponse,
)
from ..services.adaption_service import (
    generate_incident_insight,
    generate_regulatory_notice,
    generate_parcel_diagnostics,
    generate_timetravel_narrative,
    ask_adaption_copilot,
)
from .analysis import ANALYSIS_STORE

router = APIRouter(prefix="/analyses", tags=["Insights"])

# Cache for generated insights and notices
INSIGHT_STORE: Dict[str, IncidentInsight] = {}
NOTICE_STORE: Dict[str, RegulatoryNotice] = {}
DIAGNOSTIC_STORE: Dict[str, ParcelDiagnostic] = {}
NARRATIVE_STORE: Dict[str, TimeTravelNarrative] = {}

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

@router.post("/{analysis_id}/regulatory-notice", response_model=RegulatoryNotice)
def create_regulatory_notice(analysis_id: str, jurisdiction: Optional[str] = None):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    analysis = ANALYSIS_STORE[analysis_id]
    notice = generate_regulatory_notice(analysis, jurisdiction)
    NOTICE_STORE[analysis_id] = notice
    return notice

@router.get("/{analysis_id}/regulatory-notice", response_model=RegulatoryNotice)
def get_regulatory_notice(analysis_id: str):
    if analysis_id in NOTICE_STORE:
        return NOTICE_STORE[analysis_id]
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    analysis = ANALYSIS_STORE[analysis_id]
    notice = generate_regulatory_notice(analysis)
    NOTICE_STORE[analysis_id] = notice
    return notice

@router.post("/{analysis_id}/parcels/{parcel_id}/diagnostics", response_model=ParcelDiagnostic)
def get_or_create_parcel_diagnostic(analysis_id: str, parcel_id: int):
    cache_key = f"{analysis_id}_{parcel_id}"
    if cache_key in DIAGNOSTIC_STORE:
        return DIAGNOSTIC_STORE[cache_key]
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    analysis = ANALYSIS_STORE[analysis_id]
    diag = generate_parcel_diagnostics(analysis, parcel_id)
    DIAGNOSTIC_STORE[cache_key] = diag
    return diag

@router.post("/{analysis_id}/timetravel-narrative", response_model=TimeTravelNarrative)
def create_timetravel_narrative(
    analysis_id: str,
    baselineYear: int = Query(2017),
    comparisonYear: int = Query(2024),
    minLon: Optional[float] = None,
    minLat: Optional[float] = None
):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
    analysis = ANALYSIS_STORE[analysis_id]
    coords = [minLon, minLat] if minLon is not None and minLat is not None else None
    narrative = generate_timetravel_narrative(analysis, baselineYear, comparisonYear, coords)
    NARRATIVE_STORE[analysis_id] = narrative
    return narrative

chat_router = APIRouter(prefix="/chat", tags=["Copilot"])

@chat_router.post("", response_model=ChatResponse)
@router.post("/chat", response_model=ChatResponse)
def chat_copilot(req: ChatRequest):
    analysis = None
    if req.analysisId and req.analysisId in ANALYSIS_STORE:
        analysis = ANALYSIS_STORE[req.analysisId]
    return ask_adaption_copilot(
        message=req.message,
        history=req.history,
        analysis=analysis,
        ui_context=req.uiContext
    )
