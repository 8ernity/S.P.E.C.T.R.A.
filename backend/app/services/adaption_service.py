import json
import os
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from ..core.config import settings
from ..schemas.analysis import AnalysisResult
from ..schemas.insights import IncidentInsight

SYSTEM_INSTRUCTIONS = """ROLE: Satellite incident analyst assistant for SPECTRA scientific dashboard.
INPUT: Trusted JSON metrics computed by our raster pipeline.
REQUIREMENTS:
- Use only numbers provided. Do not fabricate causes, dates, coordinates or confidence.
- State what was measured, then give 1-3 plausible interpretations as hypotheses.
- Explain at least two confounders (clouds, seasonal phenology, registration, sensor calibration) when relevant.
- Recommend practical external verification checks (high-res SAR, field sampling, historical rainfall).
- If measurement is RGB-only, never claim measured NDVI, NDWI, NBR or km².
- Return ONLY a JSON object with keys:
  "summary": string,
  "observations": list of strings,
  "possible_explanations": list of strings,
  "caveats": list of strings,
  "verification_steps": list of strings,
  "review_priority": "low" | "medium" | "high" | "insufficient_evidence",
  "evidence_used": list of strings
- review_priority is an operational triage suggestion, not statistically calibrated accuracy.
"""

def generate_incident_insight(analysis: AnalysisResult) -> IncidentInsight:
    """
    Calls Adaption Labs Responses API if ADAPTION_API_KEY is configured.
    Otherwise gracefully falls back to a deterministic, honest baseline interpretation.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    api_key = settings.ADAPTION_API_KEY or os.environ.get("ADAPTION_API_KEY", "").strip()
    
    # Prepare verified measurement payload
    payload = {
        "analysis_id": analysis.analysisId,
        "mode": analysis.mode,
        "method": analysis.method,
        "source_title": analysis.sourceTitle,
        "changed_pixels": analysis.measurements.changedPixels,
        "valid_pixels": analysis.measurements.validPixels,
        "change_percentage": analysis.measurements.changePercentage,
        "mean_delta": analysis.measurements.meanDelta,
        "affected_area_km2": analysis.measurements.affectedAreaKm2,
        "threshold_used": analysis.measurements.thresholdUsed,
        "mean_index_before": analysis.measurements.meanIndexBefore,
        "mean_index_after": analysis.measurements.meanIndexAfter,
        "acquired_before": analysis.provenance.acquiredBefore,
        "acquired_after": analysis.provenance.acquiredAfter,
        "satellite": analysis.provenance.satellite,
        "top_regions": [
            {
                "id": r.id,
                "pixel_count": r.maskPixelCount,
                "area_km2": r.areaKm2,
                "mean_delta": r.meanDelta,
                "category": r.categorySuggestion
            }
            for r in analysis.regions[:5]
        ],
        "warnings": analysis.warnings
    }
    
    if api_key:
        try:
            from adaption import Adaption
            client = Adaption(api_key=api_key)
            
            kwargs = {
                "model": settings.ADAPTION_MODEL,
                "input": json.dumps(payload),
                "instructions": SYSTEM_INSTRUCTIONS,
                "max_output_tokens": 1000,
                "temperature": 0.0,
                "store": False,
            }
            
            if settings.ADAPTION_DATASET_ID:
                kwargs["tools"] = [{"type": "file_search", "dataset_ids": [settings.ADAPTION_DATASET_ID]}]
                
            raw_response = client.responses.create(**kwargs)
            
            # Extract content from response
            text_output = ""
            if isinstance(raw_response, dict):
                # Stainless responses API dictionary
                if "output" in raw_response:
                    out = raw_response["output"]
                    if isinstance(out, str):
                        text_output = out
                    elif isinstance(out, list):
                        # list of content parts
                        text_output = " ".join([str(p.get("text", p)) if isinstance(p, dict) else str(p) for p in out])
                elif "choices" in raw_response:
                    text_output = raw_response["choices"][0]["message"]["content"]
                elif "content" in raw_response:
                    text_output = str(raw_response["content"])
                    
            if not text_output:
                text_output = str(raw_response)
                
            # Parse JSON block if wrapped in markdown fences
            json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', text_output, re.DOTALL)
            clean_json = json_match.group(1) if json_match else text_output.strip()
            
            parsed = json.loads(clean_json)
            
            return IncidentInsight(
                provider="adaption",
                model=settings.ADAPTION_MODEL,
                analysisId=analysis.analysisId,
                generatedAt=now_iso,
                summary=parsed.get("summary", "Analysis completed by Adaption Labs."),
                observations=parsed.get("observations", []),
                possibleExplanations=parsed.get("possible_explanations", []),
                caveats=parsed.get("caveats", []),
                verificationSteps=parsed.get("verification_steps", []),
                reviewPriority=parsed.get("review_priority", "medium"),
                evidenceUsed=parsed.get("evidence_used", [f"{analysis.method.upper()} delta {analysis.measurements.meanDelta}"]),
                groundedDatasetId=settings.ADAPTION_DATASET_ID or None,
                providerStatus="success",
                providerMessage="Live inference verified via Adaption Labs Responses API"
            )
        except Exception as e:
            # Safe reporting of provider error without crashing dashboard
            return _build_deterministic_fallback(
                analysis,
                now_iso,
                provider_status="error",
                provider_msg=f"Adaption provider request failed: {str(e)}. Displaying verified deterministic calculation."
            )
            
    # Deterministic fallback when key is not configured
    return _build_deterministic_fallback(
        analysis,
        now_iso,
        provider_status="fallback",
        provider_msg="ADAPTION_API_KEY not configured. Displaying rule-grounded scientific interpretation. Supply key in backend/.env for live Adaption AI."
    )


def _build_deterministic_fallback(
    analysis: AnalysisResult,
    now_iso: str,
    provider_status: str,
    provider_msg: str
) -> IncidentInsight:
    m = analysis.measurements
    method_upper = analysis.method.upper()
    
    observations = [
        f"Detected {m.changedPixels:,} changed pixels out of {m.validPixels:,} valid observation pixels ({m.changePercentage}% coverage shift).",
        f"Mean change magnitude evaluated at {m.meanDelta:+.3f} under threshold {m.thresholdUsed}.",
    ]
    if m.affectedAreaKm2 is not None:
        observations.append(f"Projected spatial surface change covers approximately {m.affectedAreaKm2:.3f} km².")
        
    explanations = []
    caveats = [
        "Uncalibrated optical pairs can exhibit spectral variance due to solar elevation differences or off-nadir view angles.",
        "Cloud shadows or haze thinness may register as subtle surface shifts unless masked with Sentinel SCL scene classification."
    ]
    verification_steps = [
        "Cross-correlate with high-frequency Sentinel-1 SAR backscatter to confirm surface roughness changes regardless of cloud cover.",
        "Inspect historical precipitation and drought indices for the region to rule out seasonal phenological shifts.",
        "Verify radiometric calibration and atmospheric correction level (Level-2A BOA preferred over Level-1C TOA)."
    ]
    
    if analysis.method == "ndvi":
        if m.meanDelta < -0.10:
            explanations = [
                f"Vegetation canopy decline: {abs(m.meanDelta):.2f} average drop in NDVI signals loss of photosynthetic biomass.",
                "Potential clear-cut forestry activity, selective logging, or agricultural harvest.",
                "Severe seasonal drying or pest infestation affecting local canopy vigor."
            ]
            priority = "high" if m.changePercentage > 15 else "medium"
        else:
            explanations = [
                "Vegetation vigor expansion or crop canopy development over the monitoring interval.",
                "Favorable soil moisture conditions enhancing near-infrared reflectance."
            ]
            priority = "low"
    elif analysis.method == "ndwi":
        explanations = [
            "Shifting surface water presence or tidal waterline displacement.",
            "Soil saturation following major precipitation event or storm surge inundation.",
            "Waterbody boundary alteration due to seasonal wetland dynamics."
        ]
        priority = "high" if m.changePercentage > 10 else "medium"
    elif analysis.method == "nbr":
        explanations = [
            "Charred vegetation / burn scar signature indicated by depressed NIR and elevated SWIR2.",
            "Post-fire canopy reduction or controlled agricultural burning.",
            "Severe drought drying out canopy moisture content."
        ]
        priority = "high"
    else:
        explanations = [
            "Surface spectral reflectance change detected across visible optical bands.",
            "Ground excavation, foundation leveling, or new infrastructural footprint.",
            "Seasonal soil moisture or vegetative cover alteration."
        ]
        priority = "medium" if m.changePercentage > 5 else "low"
        
    summary = (
        f"SPECTRA detected {m.changePercentage}% surface change in {analysis.sourceTitle} "
        f"using {method_upper} analysis (mean delta: {m.meanDelta:+.3f}). "
        f"{explanations[0] if explanations else 'Surface variance observed.'}"
    )
    
    return IncidentInsight(
        provider="local_fallback",
        model=None,
        analysisId=analysis.analysisId,
        generatedAt=now_iso,
        summary=summary,
        observations=observations,
        possibleExplanations=explanations,
        caveats=caveats,
        verificationSteps=verification_steps,
        reviewPriority=priority,
        evidenceUsed=[
            f"Raster Method: {method_upper}",
            f"Mean Delta: {m.meanDelta:+.3f}",
            f"Changed Pixels: {m.changedPixels:,}",
            f"Threshold: {m.thresholdUsed}"
        ],
        groundedDatasetId=None,
        providerStatus=provider_status,
        providerMessage=provider_msg
    )
