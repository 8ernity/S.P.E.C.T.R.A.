import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .core.config import settings
from .api import health, samples, uploads, analysis, insights, reports, stac

app = FastAPI(
    title="SPECTRA - Satellite Precision Earth Change Tracking & Rapid Analytics",
    description="Scientific geospatial change detection and incident intelligence platform",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS + ["*"],  # Permissive for local dev demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mounts for sample images and generated cache
if os.path.exists(settings.SAMPLES_DIR):
    app.mount("/samples", StaticFiles(directory=settings.SAMPLES_DIR), name="samples")
    
if os.path.exists(settings.TEMP_DATA_DIR):
    app.mount("/cache", StaticFiles(directory=settings.TEMP_DATA_DIR), name="cache")

# Include API v1 routers
api_prefix = settings.API_PREFIX
app.include_router(health.router, prefix=api_prefix)
app.include_router(samples.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(analysis.router, prefix=api_prefix)
app.include_router(insights.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(stac.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs": "/docs",
        "apiPrefix": settings.API_PREFIX
    }
