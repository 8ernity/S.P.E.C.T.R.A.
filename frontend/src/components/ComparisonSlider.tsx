import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SlidersHorizontal,
  Layers,
  Columns,
  Maximize2,
  Calendar,
  Eye,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
  overlayUrl?: string;
  differenceHeatmapUrl?: string | null;
  beforeDate?: string | null;
  afterDate?: string | null;
  title: string;
  satellite?: string | null;
  method: string;
  onMethodChange?: (newMethod: string) => void;
  threshold: number;
  onThresholdChange?: (val: number) => void;
  onRecompute?: () => void;
  loading?: boolean;
  onOpenUpload?: () => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeUrl,
  afterUrl,
  overlayUrl,
  differenceHeatmapUrl,
  beforeDate,
  afterDate,
  title,
  satellite,
  method,
  onMethodChange,
  threshold,
  onThresholdChange,
  onRecompute,
  loading = false,
  onOpenUpload,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'split_heatmap' | 'heatmap' | 'overlay' | 'side_by_side'>('split');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(85);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver to always track exact container width for subpixel clipping
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Detect image's natural aspect ratio so it is never cropped
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const handlePointerDown = () => setIsDragging(true);
  const handlePointerUp = () => setIsDragging(false);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const pos = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(Math.min(Math.max(pos, 0), 100));
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove]);

  return (
    <div className="spectra-card p-5 lg:p-6 mb-6">
      {/* Viewer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg lg:text-xl font-bold text-[#102543] font-['Outfit'] flex items-center gap-2">
            <span>Before / After Earth Observation</span>
            {satellite && (
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {satellite}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Drag the divider or switch layers to inspect surface change dynamics
          </p>
        </div>

        {/* View Mode Pills, Fit Mode & Upload Action */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Fit vs Fill Toggle */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            <button
              onClick={() => setFitMode('fit')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                fitMode === 'fit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Display entire image with zero cropping"
            >
              Fit Full Image
            </button>
            <button
              onClick={() => setFitMode('fill')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                fitMode === 'fill'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Expand to fill widescreen container"
            >
              Fill Frame
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              Split Baseline/Scene
            </button>
            <button
              onClick={() => setViewMode('split_heatmap')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === 'split_heatmap'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Interactive slider comparing Scene against the Intensity Heatmap"
            >
              Slider vs Heatmap
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
              title="Display scientific continuous change intensity / delta heatmap with colorbar"
            >
              Delta Heatmap
            </button>
            <button
              onClick={() => setViewMode('overlay')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === 'overlay'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              Mask Overlay
            </button>
            <button
              onClick={() => setViewMode('side_by_side')}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                viewMode === 'side_by_side'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-xs font-bold shadow-sm transition-all"
              title="Upload your own before/after optical or satellite pair"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
              <span>Upload Custom Pair</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        ref={containerRef}
        style={fitMode === 'fit' ? { aspectRatio: `${aspectRatio}` } : undefined}
        className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner select-none cursor-ew-resize border border-white/60 mx-auto transition-all ${
          fitMode === 'fit' ? 'max-h-[580px] max-w-[680px]' : 'aspect-[16/10] sm:aspect-[16/9] max-h-[540px]'
        }`}
        onPointerDown={handlePointerDown}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-cyan-400" />
            <span className="text-xs font-semibold tracking-wider uppercase">
              Computing Raster Delta...
            </span>
          </div>
        )}

        {viewMode === 'split' && (
          <>
            {/* After Image (Full width background) */}
            <img
              src={afterUrl}
              alt="Comparison Scene"
              onLoad={handleImageLoad}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                fitMode === 'fit' ? 'object-fill' : 'object-cover'
              }`}
            />

            {/* Optional Overlay on After Scene */}
            {overlayUrl && (
              <img
                src={overlayUrl}
                alt="Change Mask Overlay"
                style={{ opacity: overlayOpacity / 100 }}
                className={`absolute inset-0 w-full h-full pointer-events-none mix-blend-screen ${
                  fitMode === 'fit' ? 'object-fill' : 'object-cover'
                }`}
              />
            )}

            {/* Before Image (Clipped from left to sliderPos) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeUrl}
                alt="Baseline Scene"
                style={{
                  width: containerWidth || containerRef.current?.clientWidth || '100%',
                  maxWidth: 'none',
                  height: '100%',
                }}
                className={`absolute top-0 left-0 h-full pointer-events-none ${
                  fitMode === 'fit' ? 'object-fill' : 'object-cover'
                }`}
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="slider-handle"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="slider-handle-button">
                <Columns className="w-4 h-4" />
              </div>
            </div>
          </>
        )}

        {viewMode === 'split_heatmap' && (
          <>
            {/* Heatmap on the right side */}
            <img
              src={differenceHeatmapUrl || overlayUrl || afterUrl}
              alt="Continuous Change Intensity Heatmap"
              onLoad={handleImageLoad}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                fitMode === 'fit' ? 'object-contain' : 'object-cover'
              }`}
            />

            {/* Comparison Optical Scene clipped from left */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={afterUrl}
                alt="Observation Scene"
                style={{
                  width: containerWidth || containerRef.current?.clientWidth || '100%',
                  maxWidth: 'none',
                  height: '100%',
                }}
                className={`absolute top-0 left-0 h-full pointer-events-none ${
                  fitMode === 'fit' ? 'object-contain' : 'object-cover'
                }`}
              />
            </div>

            {/* Draggable Divider Handle */}
            <div
              className="slider-handle"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="slider-handle-button">
                <Columns className="w-4 h-4" />
              </div>
            </div>

            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg pointer-events-none">
              OPTICAL SCENE
            </div>
            <div className="absolute top-3 right-3 bg-red-950/80 border border-red-500/40 text-red-200 text-[11px] font-bold px-2.5 py-1 rounded-lg pointer-events-none">
              CHANGE INTENSITY HEATMAP
            </div>
          </>
        )}

        {viewMode === 'heatmap' && (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
            {differenceHeatmapUrl ? (
              <img
                src={differenceHeatmapUrl}
                alt="Continuous Raster Delta / Intensity Heatmap"
                onLoad={handleImageLoad}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="text-slate-400 text-xs">Computing raster delta heatmap...</div>
            )}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-700/60 pointer-events-none">
              STANDALONE SCIENTIFIC CHANGE HEATMAP
            </div>
          </div>
        )}

        {viewMode === 'overlay' && (
          <div className="relative w-full h-full">
            <img
              src={afterUrl}
              alt="Comparison Scene"
              onLoad={handleImageLoad}
              className={`absolute inset-0 w-full h-full ${
                fitMode === 'fit' ? 'object-fill' : 'object-cover'
              }`}
            />
            {overlayUrl && (
              <img
                src={overlayUrl}
                alt="Change Overlay"
                style={{ opacity: overlayOpacity / 100 }}
                className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
                  fitMode === 'fit' ? 'object-fill' : 'object-cover'
                }`}
              />
            )}
          </div>
        )}

        {viewMode === 'side_by_side' && (
          <div className="grid grid-cols-2 w-full h-full gap-1 p-1 bg-black">
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              <img
                src={beforeUrl}
                alt="Baseline"
                className="w-full h-full object-contain"
              />
              <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                BASELINE
              </span>
            </div>
            <div className="relative w-full h-full overflow-hidden rounded-xl">
              <img
                src={afterUrl}
                alt="Comparison"
                onLoad={handleImageLoad}
                className="w-full h-full object-contain"
              />
              {overlayUrl && (
                <img
                  src={overlayUrl}
                  alt="Overlay"
                  style={{ opacity: overlayOpacity / 100 }}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}
              <span className="absolute top-2 left-2 bg-indigo-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                COMPARISON + OVERLAY
              </span>
            </div>
          </div>
        )}

        {/* Floating Scientific Intensity / Delta Scale Colorbar Legend */}
        <div className="absolute top-3 right-3 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-2xl flex flex-col items-center select-none pointer-events-none transition-all">
          <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase mb-1.5">
            {['ndvi', 'ndwi', 'nbr'].includes(method.toLowerCase()) ? 'Delta Scale' : 'Intensity'}
          </span>

          <div className="flex items-center gap-2">
            {/* Gradient Bar */}
            <div
              className="w-4 h-36 rounded-md border border-white/20 shadow-inner"
              style={{
                background: ['ndvi', 'ndwi', 'nbr'].includes(method.toLowerCase())
                  ? 'linear-gradient(to bottom, #06b6d4 0%, #38bdf8 25%, #f8fafc 50%, #fb923c 75%, #ef4444 100%)'
                  : 'linear-gradient(to bottom, #ffffff 0%, #facc15 30%, #ef4444 65%, #450a0a 90%, #000000 100%)'
              }}
            />

            {/* Scale Ticks and Labels */}
            {['ndvi', 'ndwi', 'nbr'].includes(method.toLowerCase()) ? (
              <div className="flex flex-col justify-between h-36 text-[9px] font-mono font-bold text-slate-300">
                <span className="text-cyan-400">+0.6 Gain</span>
                <span className="text-cyan-300">+0.3</span>
                <span className="text-slate-400"> 0.0</span>
                <span className="text-orange-400">-0.3</span>
                <span className="text-red-400">-0.6 Loss</span>
              </div>
            ) : (
              <div className="flex flex-col justify-between h-36 text-[9px] font-mono font-bold text-slate-300">
                <span className="text-amber-200">1.0 Max</span>
                <span className="text-amber-400">0.75</span>
                <span className="text-orange-400">0.50</span>
                <span className="text-red-500">0.25</span>
                <span className="text-slate-400">0.00 Nil</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Labels Overlaid on Corners */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm pointer-events-none">
          <Calendar className="w-3 h-3 text-cyan-300" />
          <span>Baseline: {beforeDate ? new Date(beforeDate).toLocaleDateString() : 'Historical Target'}</span>
        </div>

        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm pointer-events-none">
          <Calendar className="w-3 h-3 text-amber-300" />
          <span>Comparison: {afterDate ? new Date(afterDate).toLocaleDateString() : 'Recent Pass'}</span>
        </div>
      </div>

      {/* Viewer Footer Toolbar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-200/50">
        {/* Method & Threshold selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {onMethodChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 uppercase">Method:</span>
              <select
                value={method}
                onChange={(e) => onMethodChange(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1 text-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ndvi">NDVI (Vegetation Index)</option>
                <option value="ndwi">NDWI (Water/Floods Index)</option>
                <option value="nbr">NBR (Burn Scar Ratio)</option>
                <option value="otsu">Otsu Automatic Threshold</option>
                <option value="threshold">Configurable Difference</option>
                <option value="cvd">CVD (Change Vector Magnitude)</option>
              </select>
            </div>
          )}

          {onThresholdChange && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Threshold:</span>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={threshold}
                onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs font-bold text-[#102543] font-mono w-9">
                {threshold.toFixed(2)}
              </span>
            </div>
          )}

          {onRecompute && (
            <button
              onClick={onRecompute}
              disabled={loading}
              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Re-run analysis with parameters"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Overlay Opacity Slider */}
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase">Overlay Opacity:</span>
          <input
            type="range"
            min="10"
            max="100"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-xs font-semibold text-slate-600 w-8">
            {overlayOpacity}%
          </span>
        </div>
      </div>
    </div>
  );
};
