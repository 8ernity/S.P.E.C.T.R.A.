# SPECTRA (S.P.E.C.T.R.A)
## Satellite Precision Earth Change Tracking & Rapid Analytics

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.3+-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0+-38B2AC.svg)](https://tailwindcss.com/)
[![Adaption Labs](https://img.shields.io/badge/Sponsor-Adaption_Labs-indigo.svg)](https://adaptionlabs.ai/app)

---

## 1. Overview & Vision

**SPECTRA** is a high-precision Earth Observation and environmental change-intelligence platform designed to compare satellite observations over multiple dates and periods. It computes verified raster metrics (NDVI, NDWI, NBR with multispectral bands, and Otsu/CVD for optical imagery), delineates changed spatial regions with connected component clustering, and synthesizes actionable intelligence through an **Adaption Labs** cognitive reasoning layer.

### Visual Design System
The user interface reproduces the luminous, atmospheric design language of the **CrimeRakshak** analytics command center:
- **Atmospheric Canvas:** Soft pastel mesh gradient (`#dcecff` → `#f4f8ff` → `#edfcf6`)
- **Powder-Blue Rail:** Collapsible sidebar with active white pill navigation
- **Frosted Glass Cards:** Semi-translucent panels (`rgba(255,255,255,0.76)`), 24px rounded corners, and soft drop shadows
- **Interactive Studio:** Draggable before/after comparison slider, Recharts cluster donut, histogram distribution, and instant print-ready dossier generation

---

## 2. Key Capabilities & Mathematical Foundations

### 2.1 Multi-Spectral Remote Sensing Indices
- **NDVI (Normalized Difference Vegetation Index):**
  $$\text{NDVI} = \frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04} + \varepsilon}$$
  Isolates photosynthetic chlorophyll activity using Sentinel-2 Near-Infrared (B08, 10m) and Red (B04, 10m).
- **NDWI (McFeeters Open Water Index):**
  $$\text{NDWI} = \frac{\text{B03} - \text{B08}}{\text{B03} + \text{B08} + \varepsilon}$$
  Delineates waterbodies and flood extent using Green (B03, 10m) and Near-Infrared (B08, 10m).
- **NBR (Normalized Burn Ratio):**
  $$\text{NBR} = \frac{\text{B08} - \text{B12}}{\text{B08} + \text{B12} + \varepsilon}$$
  Assesses wildfire burn scars and char severity using NIR (B08, 10m) and SWIR-2 (B12, 20m).

### 2.2 Optical Change Detection
- **Otsu's Bimodal Thresholding:** Automatically calculates non-parametric optimal segmentation threshold on 256-bin difference histograms.
- **CVD (Change Vector Detection):** Multi-spectral Euclidean displacement magnitude across all matching bands.
- **Connected Component Clustering:** `cv2.connectedComponentsWithStats` ranks spatial parcels by pixel area, bounding box, centroid, and projected surface area in $\text{km}^2$.

### 2.3 Adaption Labs Sponsor Integration
- Uses official Python SDK `adaption` (`Adaption().responses.create`).
- Submits structured JSON measurement payloads (changed pixels, valid pixels, delta values, top clusters).
- Strictly distinguishes **auditable measurements** from **AI hypotheses**.
- In the absence of an API key, automatically displays an honest, deterministic baseline evaluation with a clear status beacon.

---

## 3. Project Structure

```text
S.P.E.C.T.R.A/
├── backend/                  # Python 3.11 / FastAPI Geospatial Engine
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint, CORS, static routes
│   │   ├── core/             # config.py, errors.py
│   │   ├── schemas/          # Pydantic models (analysis, insights, samples, reports)
│   │   ├── services/         # raster_io, change_methods, region_stats, adaption_service, report_service
│   │   └── api/              # /health, /samples, /uploads, /analyses, /insights, /reports
│   ├── tests/                # pytest unit and integration test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Sidebar, Header, KpiRow, ComparisonSlider, ChangeBreakdownCard, AdaptionInsightCard, UploadModal, ReportModal
│   │   ├── pages/            # Overview, ComparisonView, AnalysisView, EnvironmentView, ExplorerView, IntelligenceView, ReportsView, MethodologyView
│   │   ├── lib/              # api.ts (typed backend client)
│   │   ├── types/            # spectra.ts (shared domain types)
│   │   └── index.css         # CrimeRakshak design tokens, mesh gradients, glass cards
│   ├── package.json
│   └── vite.config.ts
├── samples/                  # Bundled offline sample scenes
│   ├── manifest.json
│   ├── vegetation-demo/      # Amazon canopy clear-cut with B02-B12 multispectral bands
│   ├── coastal-demo/         # Sundarbans tidal inundation & erosion with B02-B08 bands
│   └── urban-excavation-demo/# East Kolkata peri-urban expansion & excavation
├── scripts/                  # seed_samples.py
├── docs/                     # PRD.md, assets/UI_reference_CrimeRakshak.png
├── start-all.bat             # Master startup script (launches both services)
├── _run-backend.bat          # Launches FastAPI backend on port 8000
└── _run-frontend.bat         # Launches Vite dev server on port 5173
```

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### 4.2 Automated One-Click Start (Windows)
Double-click `start-all.bat` or run:
```bat
start-all.bat
```

### 4.3 Manual Start

**Backend:**
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
- App UI: `http://localhost:5173`

---

## 5. Adaption Labs Configuration

To activate live sponsor AI inference:
1. Create an API key at [Adaption Labs Console](https://adaptionlabs.ai/app).
2. Create `backend/.env` with:
   ```dotenv
   ADAPTION_API_KEY=your_adaption_api_key_here
   ADAPTION_MODEL=qwen3.5-397b
   ```
3. Restart the backend service. The dashboard status chip will indicate **Adaption AI Online**.

---

## 6. Testing

Run backend scientific and API tests:
```bash
cd backend
.\.venv\Scripts\pytest -v
```
All 9 core tests pass verifying NDVI math, zero-denominator safeguards, Otsu thresholding, connected components, and API routes.

---

## 7. Ethical and Scientific Disclaimers
1. **Decision Support Only:** SPECTRA outputs assist environmental monitors and researchers. They do not constitute autonomous emergency declarations or legal proof of violation without ground verification.
2. **Honest Metrics:** Pixel area in $\text{km}^2$ is calculated only when verified spatial resolution (meters/pixel) and CRS metadata exist.
3. **Model Transparency:** Adaption LLM responses provide explanatory hypotheses; raster math remains deterministic and auditable.
