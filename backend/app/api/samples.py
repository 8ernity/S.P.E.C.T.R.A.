import os
import json
from fastapi import APIRouter
from ..core.config import settings
from ..core.errors import SpectraError
from ..schemas.samples import SampleManifestResponse, SampleMetadata

router = APIRouter(prefix="/samples", tags=["Samples"])

@router.get("", response_model=SampleManifestResponse)
def get_sample_manifest():
    manifest_path = os.path.join(settings.SAMPLES_DIR, "manifest.json")
    if not os.path.exists(manifest_path):
        raise SpectraError("NOT_FOUND", "Sample manifest not found on server.")
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data

@router.get("/{sample_id}", response_model=SampleMetadata)
def get_sample_detail(sample_id: str):
    folder = os.path.join(settings.SAMPLES_DIR, sample_id)
    meta_path = os.path.join(folder, "metadata.json")
    if not os.path.exists(meta_path):
        raise SpectraError("NOT_FOUND", f"Sample case '{sample_id}' not found.")
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    return meta
