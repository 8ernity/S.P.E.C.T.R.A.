from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from ..schemas.analysis import AnalysisResult
from ..schemas.insights import IncidentInsight
from ..schemas.reports import ReportData

def build_report_data(analysis: AnalysisResult, insight: Optional[IncidentInsight]) -> ReportData:
    now_iso = datetime.now(timezone.utc).isoformat()
    
    methodology_notes = [
        f"Algorithm: {analysis.method.upper()} change analysis performed at {analysis.provenance.algorithmVersion}.",
        f"Processing threshold applied: {analysis.measurements.thresholdUsed} over normalized raster space.",
        "Deterministic pixel analysis: only valid unmasked observation pixels are counted in percentage denominators.",
        "Spectral indices (NDVI/NDWI/NBR) require calibrated multispectral bands (Sentinel-2 L2A BOA reflectance).",
        "AI Incident Intelligence outputs provide explanatory hypotheses, not legal determinations or field-verified emergency declarations."
    ]
    
    citations = [
        "McFeeters, S. K. (1996). The use of the Normalized Difference Water Index (NDWI) in the delineation of open water features. International Journal of Remote Sensing, 17(7), 1425-1432.",
        "Rouse, J. W., Haas, R. H., Schell, J. A., & Deering, D. W. (1974). Monitoring vegetation systems in the Great Plains with ERTS. NASA SP-351, 309-317.",
        "Otsu, N. (1979). A threshold selection method from gray-level histograms. IEEE Transactions on Systems, Man, and Cybernetics, 9(1), 62-66.",
        "European Space Agency (ESA). Copernicus Sentinel-2 User Handbook (Level-2A Surface Reflectance).",
        "Adaption Labs (2026). Responses API & Adaptive Intelligence Reference. https://docs.adaptionlabs.ai"
    ]
    
    system_info = {
        "engine": "SPECTRA - Satellite Precision Earth Change Tracking & Rapid Analytics",
        "version": analysis.provenance.algorithmVersion,
        "runtime": "Python 3.11 / FastAPI Geospatial Engine",
        "satellite": analysis.provenance.satellite or "Earth Observation Platform",
        "crs": analysis.provenance.crs or "Local Project Grid",
        "groundResolution": f"{analysis.provenance.resolutionMeters}m" if analysis.provenance.resolutionMeters else "Relative Pixel Array"
    }
    
    return ReportData(
        reportId=f"REP-{analysis.analysisId}",
        generatedAt=now_iso,
        title=f"SPECTRA Change Intelligence Dossier: {analysis.sourceTitle}",
        analysis=analysis,
        insight=insight,
        systemInfo=system_info,
        methodologyNotes=methodology_notes,
        citations=citations
    )
