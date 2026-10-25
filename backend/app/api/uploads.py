import os
import uuid
from fastapi import APIRouter, UploadFile, File
from PIL import Image
from ..core.config import settings
from ..core.errors import SpectraError

router = APIRouter(prefix="/uploads", tags=["Uploads"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}
MAX_BYTES = settings.UPLOAD_MAX_MB * 1024 * 1024

@router.post("/pair")
async def upload_pair(
    before: UploadFile = File(...),
    after: UploadFile = File(...)
):
    # Validate extension
    ext_b = os.path.splitext(before.filename or "")[1].lower()
    ext_a = os.path.splitext(after.filename or "")[1].lower()
    
    if ext_b not in ALLOWED_EXTENSIONS or ext_a not in ALLOWED_EXTENSIONS:
        raise SpectraError(
            "UNSUPPORTED_FORMAT",
            f"Unsupported file format. Supported: PNG, JPEG, GeoTIFF. Received {ext_b}, {ext_a}."
        )
        
    pair_id = f"pair_{uuid.uuid4().hex[:12]}"
    pair_dir = os.path.join(settings.TEMP_DATA_DIR, pair_id)
    os.makedirs(pair_dir, exist_ok=True)
    
    path_b = os.path.join(pair_dir, f"before{ext_b}")
    path_a = os.path.join(pair_dir, f"after{ext_a}")
    
    content_b = await before.read()
    content_a = await after.read()
    
    if len(content_b) > MAX_BYTES or len(content_a) > MAX_BYTES:
        raise SpectraError(
            "FILE_TOO_LARGE",
            f"File exceeds maximum upload size of {settings.UPLOAD_MAX_MB}MB."
        )
        
    with open(path_b, "wb") as f:
        f.write(content_b)
    with open(path_a, "wb") as f:
        f.write(content_a)
        
    # Check dimensions
    try:
        pil_b = Image.open(path_b)
        pil_a = Image.open(path_a)
    except Exception as e:
        raise SpectraError("UNSUPPORTED_FORMAT", f"Failed to parse uploaded image: {str(e)}")
        
    warnings = []
    if pil_b.size != pil_a.size:
        warnings.append(
            f"Dimension mismatch between uploaded images ({pil_b.size[0]}x{pil_b.size[1]} vs {pil_a.size[0]}x{pil_a.size[1]}). Automatic alignment/resizing will be applied for visual comparison with caveats."
        )
        
    return {
        "pairId": pair_id,
        "beforeFilename": before.filename,
        "afterFilename": after.filename,
        "beforeDimensions": list(pil_b.size),
        "afterDimensions": list(pil_a.size),
        "isMultispectral": False,
        "supportedMethods": ["threshold", "otsu", "cvd"],
        "recommendedMethod": "otsu",
        "warnings": warnings
    }
