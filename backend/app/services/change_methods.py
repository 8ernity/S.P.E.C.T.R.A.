import numpy as np
import cv2
from typing import Dict, Tuple, Optional
from ..core.errors import SpectraError

EPSILON = 1e-6

def compute_spectral_index(band_a: np.ndarray, band_b: np.ndarray) -> np.ndarray:
    """
    Computes normalized difference index: (band_a - band_b) / (band_a + band_b + EPSILON)
    Clips output to [-1.0, 1.0] and handles nodata / zero denominator cleanly.
    """
    denom = band_a + band_b
    valid_mask = denom > EPSILON
    idx = np.zeros_like(band_a, dtype=np.float32)
    np.divide(band_a - band_b, denom + EPSILON, out=idx, where=valid_mask)
    return np.clip(idx, -1.0, 1.0)


def run_ndvi(bands_before: Dict[str, np.ndarray], bands_after: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes Sentinel-2 NDVI = (B08 - B04) / (B08 + B04)
    Returns: (index_before, index_after, delta_index)
    """
    if "B04" not in bands_before or "B08" not in bands_before or "B04" not in bands_after or "B08" not in bands_after:
        raise SpectraError(
            "INCOMPATIBLE_BANDS",
            "NDVI requires Red (B04) and Near-Infrared (B08) channels. Multispectral bands are not available for this scene.",
            details={"required": ["B04", "B08"]}
        )
    idx_b = compute_spectral_index(bands_before["B08"], bands_before["B04"])
    idx_a = compute_spectral_index(bands_after["B08"], bands_after["B04"])
    delta = idx_a - idx_b
    return idx_b, idx_a, delta


def run_ndwi(bands_before: Dict[str, np.ndarray], bands_after: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes Sentinel-2 McFeeters NDWI = (B03 - B08) / (B03 + B08)
    Returns: (index_before, index_after, delta_index)
    """
    if "B03" not in bands_before or "B08" not in bands_before or "B03" not in bands_after or "B08" not in bands_after:
        raise SpectraError(
            "INCOMPATIBLE_BANDS",
            "NDWI requires Green (B03) and Near-Infrared (B08) channels.",
            details={"required": ["B03", "B08"]}
        )
    idx_b = compute_spectral_index(bands_before["B03"], bands_before["B08"])
    idx_a = compute_spectral_index(bands_after["B03"], bands_after["B08"])
    delta = idx_a - idx_b
    return idx_b, idx_a, delta


def run_nbr(bands_before: Dict[str, np.ndarray], bands_after: Dict[str, np.ndarray]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Computes Sentinel-2 NBR = (B08 - B12) / (B08 + B12)
    Returns: (index_before, index_after, delta_index)
    """
    if "B08" not in bands_before or "B12" not in bands_before or "B08" not in bands_after or "B12" not in bands_after:
        raise SpectraError(
            "INCOMPATIBLE_BANDS",
            "NBR requires Near-Infrared (B08) and Shortwave-Infrared (B12) channels.",
            details={"required": ["B08", "B12"]}
        )
    idx_b = compute_spectral_index(bands_before["B08"], bands_before["B12"])
    idx_a = compute_spectral_index(bands_after["B08"], bands_after["B12"])
    delta = idx_a - idx_b
    return idx_b, idx_a, delta


def run_rgb_difference(rgb_before: np.ndarray, rgb_after: np.ndarray) -> np.ndarray:
    """
    Normalized Euclidean distance in RGB color space:
    diff = sqrt((R1-R2)^2 + (G1-G2)^2 + (B1-B2)^2) / sqrt(3)
    Output values are bounded in [0.0, 1.0].
    """
    diff_sq = np.sum((rgb_after - rgb_before) ** 2, axis=-1)
    diff = np.sqrt(diff_sq) / np.sqrt(3.0)
    return np.clip(diff, 0.0, 1.0)


def run_cvd(bands_before: Dict[str, np.ndarray], bands_after: Dict[str, np.ndarray]) -> np.ndarray:
    """
    Change Vector Detection magnitude across all matching bands:
    CVD = sqrt(sum((band_after_i - band_before_i)^2)) / sqrt(N)
    """
    common_keys = [k for k in bands_before if k in bands_after]
    if not common_keys:
        raise SpectraError("INCOMPATIBLE_BANDS", "No matching bands found for Change Vector Detection.")
    diff_sq_sum = np.zeros_like(next(iter(bands_before.values())), dtype=np.float32)
    for k in common_keys:
        diff_sq_sum += (bands_after[k] - bands_before[k]) ** 2
    cvd_magnitude = np.sqrt(diff_sq_sum) / np.sqrt(float(len(common_keys)))
    return np.clip(cvd_magnitude, 0.0, 1.0)


def compute_otsu_threshold(diff_array: np.ndarray) -> float:
    """
    Calculates Otsu's optimal threshold on a normalized [0, 1] difference map.
    Returns a float in [0.0, 1.0].
    """
    u8 = np.clip(diff_array * 255.0, 0, 255).astype(np.uint8)
    thresh_val, _ = cv2.threshold(u8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return float(thresh_val / 255.0)
