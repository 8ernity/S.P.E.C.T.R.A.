import numpy as np
import pytest
from app.services.change_methods import (
    compute_spectral_index, run_ndvi, run_ndwi, run_nbr, run_rgb_difference
)
from app.core.errors import SpectraError

def test_spectral_index_math():
    a = np.array([0.6, 0.4, 0.0], dtype=np.float32)
    b = np.array([0.2, 0.4, 0.0], dtype=np.float32)
    idx = compute_spectral_index(a, b)
    
    # (0.6 - 0.2) / (0.6 + 0.2) = 0.4 / 0.8 = 0.5
    assert np.isclose(idx[0], 0.5, atol=1e-3)
    # (0.4 - 0.4) / (0.4 + 0.4) = 0.0
    assert np.isclose(idx[1], 0.0, atol=1e-3)
    # Zero denominator handled cleanly without NaN
    assert not np.isnan(idx[2])

def test_ndvi_calculation():
    bands_b = {
        "B04": np.full((10, 10), 0.05, dtype=np.float32),  # Red low
        "B08": np.full((10, 10), 0.55, dtype=np.float32)   # NIR high -> healthy forest
    }
    bands_a = {
        "B04": np.full((10, 10), 0.25, dtype=np.float32),  # Red up
        "B08": np.full((10, 10), 0.15, dtype=np.float32)   # NIR drop -> clear-cut
    }
    
    idx_b, idx_a, delta = run_ndvi(bands_b, bands_a)
    # Baseline NDVI: (0.55 - 0.05) / (0.55 + 0.05) = 0.50 / 0.60 = 0.833
    assert np.allclose(idx_b, 0.833, atol=1e-2)
    # Comparison NDVI: (0.15 - 0.25) / (0.15 + 0.25) = -0.10 / 0.40 = -0.25
    assert np.allclose(idx_a, -0.25, atol=1e-2)
    # Delta should be negative (vegetation loss)
    assert np.all(delta < 0)

def test_incompatible_bands_raises_error():
    bands_missing = {"B02": np.ones((10, 10), dtype=np.float32)}
    with pytest.raises(SpectraError) as exc:
        run_ndvi(bands_missing, bands_missing)
    assert exc.value.status_code == 400

def test_rgb_difference_identical():
    img = np.ones((20, 20, 3), dtype=np.float32)
    diff = run_rgb_difference(img, img)
    assert np.all(diff == 0.0)
