import os
import json
import numpy as np
from PIL import Image
from typing import Dict, Any, Tuple, Optional
from ..core.errors import SpectraError

def load_raster_pair(
    before_path: str,
    after_path: str,
    bands_before_path: Optional[str] = None,
    bands_after_path: Optional[str] = None
) -> Tuple[np.ndarray, np.ndarray, Dict[str, np.ndarray], Dict[str, np.ndarray], Dict[str, Any]]:
    """
    Loads an aligned raster pair.
    Returns:
      - rgb_before: (H, W, 3) float32 in [0, 1]
      - rgb_after: (H, W, 3) float32 in [0, 1]
      - bands_before: dict mapping band name (e.g. B04, B08) to (H, W) float32 in [0, 1]
      - bands_after: dict mapping band name to (H, W) float32 in [0, 1]
      - metadata: dict of warnings, CRS, resolution, etc.
    """
    if not os.path.exists(before_path) or not os.path.exists(after_path):
        raise SpectraError("MISSING_FILE", f"One or both image files not found: {before_path}, {after_path}")
        
    warnings = []
    
    # Load RGB PIL images
    try:
        pil_b = Image.open(before_path).convert("RGB")
        pil_a = Image.open(after_path).convert("RGB")
    except Exception as e:
        raise SpectraError("UNSUPPORTED_FORMAT", f"Failed to decode image raster: {str(e)}")
        
    w_b, h_b = pil_b.size
    w_a, h_a = pil_a.size
    
    if (w_b, h_b) != (w_a, h_a):
        warnings.append(
            f"Dimension mismatch between baseline ({w_b}x{h_b}) and comparison ({w_a}x{h_a}). Resized comparison to match baseline for visual demo; precision measurements should be treated with caution."
        )
        pil_a = pil_a.resize((w_b, h_b), Image.Resampling.BILINEAR)
        
    rgb_before = np.array(pil_b, dtype=np.float32) / 255.0
    rgb_after = np.array(pil_a, dtype=np.float32) / 255.0
    
    bands_before = {}
    bands_after = {}
    
    # Check if multispectral band files exist (.npz)
    if bands_before_path and os.path.exists(bands_before_path):
        try:
            with np.load(bands_before_path) as data:
                for k in data.files:
                    bands_before[k] = data[k].astype(np.float32)
        except Exception as e:
            warnings.append(f"Could not load multispectral bands for baseline: {str(e)}")
            
    if bands_after_path and os.path.exists(bands_after_path):
        try:
            with np.load(bands_after_path) as data:
                for k in data.files:
                    bands_after[k] = data[k].astype(np.float32)
        except Exception as e:
            warnings.append(f"Could not load multispectral bands for comparison: {str(e)}")
            
    meta = {
        "width": pil_b.width,
        "height": pil_b.height,
        "warnings": warnings,
        "has_multispectral": len(bands_before) > 0 and len(bands_after) > 0
    }
    
    return rgb_before, rgb_after, bands_before, bands_after, meta
