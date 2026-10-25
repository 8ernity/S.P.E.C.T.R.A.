import os
import cv2
import numpy as np
from PIL import Image
from typing import Dict, List, Tuple, Optional, Any
from ..schemas.analysis import Measurements, ConnectedRegion, HistogramBin

def analyze_regions_and_render_overlay(
    diff_or_delta: np.ndarray,
    threshold: float,
    analysis_id: str,
    output_dir: str,
    is_signed_delta: bool = False,
    resolution_m: Optional[float] = None,
    min_region_pixels: int = 15,
    smoothing_kernel: int = 3,
    index_before: Optional[np.ndarray] = None,
    index_after: Optional[np.ndarray] = None
) -> Tuple[Measurements, List[ConnectedRegion], List[HistogramBin], str, str]:
    """
    Evaluates changed pixels, connected regions, statistics and renders an RGBA overlay image.
    """
    h, w = diff_or_delta.shape
    total_pixels = h * w
    
    # Create binary mask based on threshold
    if is_signed_delta:
        # Changed if magnitude of change exceeds threshold
        binary_mask = (np.abs(diff_or_delta) >= threshold).astype(np.uint8)
    else:
        binary_mask = (diff_or_delta >= threshold).astype(np.uint8)
        
    # Optional morphological cleanup
    if smoothing_kernel > 1:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (smoothing_kernel, smoothing_kernel))
        binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        
    changed_pixels = int(np.sum(binary_mask))
    valid_pixels = total_pixels
    change_pct = round(100.0 * float(changed_pixels) / float(max(1, valid_pixels)), 2)
    
    # Calculate affected area in km² if resolution is known
    area_km2 = None
    if resolution_m and resolution_m > 0:
        area_km2 = round(float(changed_pixels) * (float(resolution_m) ** 2) / 1_000_000.0, 4)
        
    # Mean delta over changed pixels
    if changed_pixels > 0:
        mean_delta = float(np.mean(diff_or_delta[binary_mask == 1]))
    else:
        mean_delta = 0.0
        
    mean_idx_b = float(np.mean(index_before)) if index_before is not None else None
    mean_idx_a = float(np.mean(index_after)) if index_after is not None else None
    
    # Connected component analysis
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
    regions: List[ConnectedRegion] = []
    
    # Sort regions by pixel count descending (skipping background 0)
    region_indices = []
    for i in range(1, num_labels):
        area = int(stats[i, cv2.CC_STAT_AREA])
        if area >= min_region_pixels:
            region_indices.append((area, i))
            
    region_indices.sort(key=lambda x: x[0], reverse=True)
    num_change_regions = len(region_indices)
    mean_reg_size = round(float(np.mean([x[0] for x in region_indices])), 1) if region_indices else 0.0
    
    # PS 05: Classify anomaly type & distinguish Natural Events vs Potential Human-Made Damage
    if is_signed_delta:
        if mean_delta < -0.2:
            detected_anomaly = "Forest Destruction & Canopy Clearing"
            nature_class = "Potential Human-Made Damage"
            confidence = 0.92
        elif mean_delta > 0.15:
            detected_anomaly = "Coastal Inundation & Shoreline Shift"
            nature_class = "Natural Event"
            confidence = 0.88
        else:
            detected_anomaly = "Vegetation Stress & Micro-Transition"
            nature_class = "Natural Event"
            confidence = 0.80
    else:
        if mean_delta > 0.25:
            detected_anomaly = "Unusual Land Excavation & Groundwork"
            nature_class = "Potential Human-Made Damage"
            confidence = 0.90
        else:
            detected_anomaly = "Surface Reflectance Variance"
            nature_class = "Natural Event"
            confidence = 0.78

    measurements = Measurements(
        changedPixels=changed_pixels,
        validPixels=valid_pixels,
        changePercentage=change_pct,
        affectedAreaKm2=area_km2,
        meanDelta=round(mean_delta, 4),
        coverageFraction=1.0,
        meanIndexBefore=round(mean_idx_b, 4) if mean_idx_b is not None else None,
        meanIndexAfter=round(mean_idx_a, 4) if mean_idx_a is not None else None,
        thresholdUsed=round(threshold, 4),
        detectedAnomaly=detected_anomaly,
        natureClassification=nature_class,
        natureConfidence=confidence,
        numRegions=num_change_regions,
        meanRegionSize=mean_reg_size
    )
    
    # Limit to top 50 regions for performance and display
    for rank, (area, i) in enumerate(region_indices[:50], start=1):
        x = int(stats[i, cv2.CC_STAT_LEFT])
        y = int(stats[i, cv2.CC_STAT_TOP])
        width = int(stats[i, cv2.CC_STAT_WIDTH])
        height = int(stats[i, cv2.CC_STAT_HEIGHT])
        cx = float(centroids[i][0])
        cy = float(centroids[i][1])
        
        region_mask = (labels == i)
        reg_mean_delta = float(np.mean(diff_or_delta[region_mask])) if area > 0 else 0.0
        reg_area_km2 = round(area * (float(resolution_m) ** 2) / 1_000_000.0, 4) if resolution_m else None
        
        # Categorization based on delta sign and magnitude
        if is_signed_delta:
            if reg_mean_delta < -0.35:
                cat = "Severe Canopy Clearing"
                reg_nature = "Potential Human-Made Damage"
            elif reg_mean_delta < -0.15:
                cat = "Vegetation Canopy Decline"
                reg_nature = "Potential Human-Made Damage"
            elif reg_mean_delta > 0.25:
                cat = "Water Extent Surge"
                reg_nature = "Natural Event"
            else:
                cat = "Marginal Transition"
                reg_nature = "Natural Event"
        else:
            if reg_mean_delta > 0.35:
                cat = "Excavation Pit / Pavement"
                reg_nature = "Potential Human-Made Damage"
            elif reg_mean_delta > 0.2:
                cat = "Infrastructural Footprint"
                reg_nature = "Potential Human-Made Damage"
            else:
                cat = "Surface Variance"
                reg_nature = "Natural Event"
                
        regions.append(ConnectedRegion(
            id=rank,
            maskPixelCount=area,
            bboxPixels=[x, y, width, height],
            centroidPixels=[round(cx, 1), round(cy, 1)],
            areaKm2=reg_area_km2,
            meanDelta=round(reg_mean_delta, 4),
            categorySuggestion=cat,
            nature=reg_nature
        ))
        
    # Generate 20-bin histogram of values
    hist_bins: List[HistogramBin] = []
    hist_min = float(np.min(diff_or_delta))
    hist_max = float(np.max(diff_or_delta))
    if hist_min == hist_max:
        hist_max += 0.01
        
    counts, edges = np.histogram(diff_or_delta, bins=20, range=(hist_min, hist_max))
    for c, start, end in zip(counts, edges[:-1], edges[1:]):
        pct = round(100.0 * float(c) / float(total_pixels), 2)
        hist_bins.append(HistogramBin(
            rangeStart=round(float(start), 3),
            rangeEnd=round(float(end), 3),
            pixelCount=int(c),
            percentage=pct
        ))
        
    # Render RGBA overlay
    # Transparent background: Alpha = 0
    overlay = np.zeros((h, w, 4), dtype=np.uint8)
    
    if changed_pixels > 0:
        if is_signed_delta:
            # Color map based on delta:
            # Negative (loss / stress): Red to Orange (#EF4444 / #F97316)
            # Positive (gain / water surge): Cyan to Emerald (#06B6D4 / #10B981)
            neg_mask = (binary_mask == 1) & (diff_or_delta < 0)
            pos_mask = (binary_mask == 1) & (diff_or_delta >= 0)
            
            # Red/Orange for negative
            overlay[neg_mask, 0] = 239  # R
            overlay[neg_mask, 1] = 68   # G
            overlay[neg_mask, 2] = 68   # B
            overlay[neg_mask, 3] = 190  # Alpha
            
            # Cyan for positive
            overlay[pos_mask, 0] = 6    # R
            overlay[pos_mask, 1] = 182  # G
            overlay[pos_mask, 2] = 212  # B
            overlay[pos_mask, 3] = 190  # Alpha
        else:
            # Heatmap colormap for difference magnitude
            # High diff = Magenta/Red (#E11D48), Medium diff = Electric Violet (#8B5CF6)
            u8_diff = np.clip(diff_or_delta * 255.0, 0, 255).astype(np.uint8)
            colored = cv2.applyColorMap(u8_diff, cv2.COLORMAP_JET)
            
            overlay[binary_mask == 1, 0] = colored[binary_mask == 1, 2]  # R (convert BGR to RGB)
            overlay[binary_mask == 1, 1] = colored[binary_mask == 1, 1]  # G
            overlay[binary_mask == 1, 2] = colored[binary_mask == 1, 0]  # B
            overlay[binary_mask == 1, 3] = 185                           # Alpha
            
        # Draw clean glowing borders around connected components
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, contours, -1, (255, 255, 255, 240), 1)
        
    os.makedirs(output_dir, exist_ok=True)
    overlay_filename = f"overlay_{analysis_id}.png"
    overlay_path = os.path.join(output_dir, overlay_filename)
    Image.fromarray(overlay).save(overlay_path, format="PNG")

    # Render dedicated scientific change heatmap with colorbar (matching Sentinel-2 NDVI Delta / Intensity style)
    heatmap_filename = f"heatmap_{analysis_id}.png"
    heatmap_path = os.path.join(output_dir, heatmap_filename)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(7, 6), dpi=150)
        fig.patch.set_facecolor('#0f172a')  # Dark sleek background
        ax.set_facecolor('#0f172a')

        if is_signed_delta:
            # Diverging colormap: Red for vegetation/surface loss, White near 0, Blue for gain (RdBu)
            im = ax.imshow(diff_or_delta, cmap='RdBu', vmin=-0.6, vmax=0.6)
            title_text = "Raster Delta Heatmap"
            subtitle = "Blue = Gain / Water Influx  |  Red = Loss / Decline"
        else:
            # Change magnitude: Black -> Red -> Orange -> Yellow -> White (hot or inferno)
            im = ax.imshow(diff_or_delta, cmap='hot', vmin=0.0, vmax=max(0.6, float(np.percentile(diff_or_delta, 98))))
            title_text = "Intensity of Changes"
            subtitle = "Continuous Euclidean Vector Displacement"

        ax.set_title(f"{title_text}\n{subtitle}", color='#f8fafc', fontsize=11, fontweight='bold', pad=10)
        ax.axis('off')

        cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
        cbar.ax.yaxis.set_tick_params(color='#cbd5e1', labelsize=9)
        plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#cbd5e1')
        cbar.outline.set_edgecolor('#475569')

        fig.tight_layout()
        fig.savefig(heatmap_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
        plt.close(fig)
    except Exception as e:
        # Fallback to pure PIL/cv2 if matplotlib fails
        colored_raw = cv2.applyColorMap(np.clip(np.abs(diff_or_delta) * 255.0, 0, 255).astype(np.uint8), cv2.COLORMAP_HOT)
        Image.fromarray(cv2.cvtColor(colored_raw, cv2.COLOR_BGR2RGB)).save(heatmap_path, format="PNG")

    # Automatically prune older ephemeral overlay & heatmap files (keep only latest 3)
    try:
        for prefix in ("overlay_ana_", "heatmap_ana_"):
            files = sorted(
                [
                    os.path.join(output_dir, f)
                    for f in os.listdir(output_dir)
                    if f.startswith(prefix) and f.endswith(".png")
                ],
                key=lambda p: os.path.getmtime(p),
            )
            if len(files) > 3:
                for old_f in files[:-3]:
                    try:
                        os.remove(old_f)
                    except OSError:
                        pass
    except Exception:
        pass
    
    return measurements, regions, hist_bins, overlay_filename, heatmap_filename
