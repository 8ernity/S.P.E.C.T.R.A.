from fastapi import APIRouter
from ..core.errors import SpectraError
from ..schemas.reports import ReportData
from ..services.report_service import build_report_data
from .analysis import ANALYSIS_STORE
from .insights import INSIGHT_STORE

router = APIRouter(prefix="/analyses", tags=["Reports"])

@router.get("/{analysis_id}/report.json", response_model=ReportData)
def get_analysis_report(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
        
    analysis = ANALYSIS_STORE[analysis_id]
    insight = INSIGHT_STORE.get(analysis_id)
    report = build_report_data(analysis, insight)
    return report
