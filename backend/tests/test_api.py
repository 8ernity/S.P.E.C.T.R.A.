import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["system"] == "SPECTRA"
    assert "adaptionConfigured" in data

def test_get_samples():
    res = client.get("/api/v1/samples")
    assert res.status_code == 200
    data = res.json()
    assert "cases" in data
    assert len(data["cases"]) >= 3

def test_run_analysis_vegetation_sample():
    req = {
        "source": {"sampleId": "vegetation-demo"},
        "method": "ndvi",
        "threshold": 0.15
    }
    res = client.post("/api/v1/analyses", json=req)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert data["mode"] == "scientific"
    assert data["method"] == "ndvi"
    assert data["measurements"]["changedPixels"] > 0
    assert data["measurements"]["changePercentage"] > 0
    assert len(data["regions"]) > 0
    assert data["visuals"]["overlayUrl"].startswith("/api/v1/analyses/")
    
    # Check overlay route
    ana_id = data["analysisId"]
    overlay_res = client.get(f"/api/v1/analyses/{ana_id}/overlay.png")
    assert overlay_res.status_code == 200
    assert overlay_res.headers["content-type"] == "image/png"

def test_generate_insight_for_analysis():
    req = {
        "source": {"sampleId": "vegetation-demo"},
        "method": "ndvi"
    }
    ana_res = client.post("/api/v1/analyses", json=req).json()
    ana_id = ana_res["analysisId"]
    
    insight_res = client.post(f"/api/v1/analyses/{ana_id}/insights")
    assert insight_res.status_code == 200
    data = insight_res.json()
    assert "summary" in data
    assert "observations" in data
    assert "possibleExplanations" in data
    assert data["providerStatus"] in ["success", "fallback"]

def test_generate_report():
    req = {
        "source": {"sampleId": "vegetation-demo"},
        "method": "ndvi"
    }
    ana_res = client.post("/api/v1/analyses", json=req).json()
    ana_id = ana_res["analysisId"]
    
    report_res = client.get(f"/api/v1/analyses/{ana_id}/report.json")
    assert report_res.status_code == 200
    rep = report_res.json()
    assert "reportId" in rep
    assert "methodologyNotes" in rep
    assert len(rep["citations"]) > 0
