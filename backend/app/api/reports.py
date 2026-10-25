from fastapi import APIRouter
from fastapi.responses import Response
from ..core.errors import SpectraError
from ..schemas.reports import ReportData
from ..services.report_service import build_report_data
from ..services.pdf_report_generator import generate_dossier_pdf
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

@router.get("/{analysis_id}/report.pdf")
def get_analysis_report_pdf(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise SpectraError("NOT_FOUND", f"Analysis '{analysis_id}' not found.")
        
    analysis = ANALYSIS_STORE[analysis_id]
    insight = INSIGHT_STORE.get(analysis_id)
    report = build_report_data(analysis, insight)
    pdf_bytes = generate_dossier_pdf(report)
    
    filename = f"SPECTRA_Dossier_{analysis_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )

