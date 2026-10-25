import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  BookOpen,
} from 'lucide-react';
import { runTimeTravelAnalysis, fetchTimeTravelNarrative } from '../lib/api';
import { InteractiveLeafletMap } from '../components/InteractiveLeafletMap';
import { reverseGeocode, computeBboxDimensions } from '../lib/geo';
import type { AnalysisResult, TimeTravelNarrative } from '../types/spectra';

interface TimeTravelViewProps {
  onAnalysisGenerated: (result: AnalysisResult) => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

interface TargetPreset {
  id: string;
  name: string;
  category: string;
  country: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  defaultBaselineYear: number;
  defaultComparisonYear: number;
  month: number;
  method: string;
  description: string;
}

const PRESET_TARGETS: TargetPreset[] = [
  {
    id: 'amazon-rondonia',
    name: 'Amazon Rainforest (Rondônia Deforestation Arc)',
    category: 'Canopy Loss & Logging',
    country: 'Brazil',
    bbox: [-63.15, -9.95, -62.85, -9.65],
    defaultBaselineYear: 2017,
    defaultComparisonYear: 2024,
    month: 7,
    method: 'ndvi',
    description: 'Track systematic fishbone deforestation and agriculture expansion across 7+ years.',
  },
  {
    id: 'aral-sea',
    name: 'South Aral Sea Desiccation',
    category: 'Water Basin Shrinkage',
    country: 'Uzbekistan / Kazakhstan',
    bbox: [58.80, 44.50, 59.30, 45.00],
    defaultBaselineYear: 2017,
    defaultComparisonYear: 2024,
    month: 8,
    method: 'ndwi',
    description: 'Dramatic evaporation and desertification of interior lake surface water.',
  },
  {
    id: 'kolkata-rajarhat',
    name: 'East Kolkata & Rajarhat New Town Urban Growth',
    category: 'Urban Excavation & Expansion',
    country: 'India',
    bbox: [88.42, 22.56, 88.52, 22.64],
    defaultBaselineYear: 2018,
    defaultComparisonYear: 2024,
    month: 4,
    method: 'cvd',
    description: 'Rapid infrastructural conversion of peri-urban wetlands and agricultural zones.',
  },
  {
    id: 'las-vegas-mead',
    name: 'Lake Mead Water Depletion',
    category: 'Reservoir Decline',
    country: 'USA (Nevada/Arizona)',
    bbox: [-114.65, 36.00, -114.35, 36.25],
    defaultBaselineYear: 2016,
    defaultComparisonYear: 2024,
    month: 6,
    method: 'ndwi',
    description: 'Severe water level shifts and shoreline bathtub ring retreat.',
  },
];

export const TimeTravelView: React.FC<TimeTravelViewProps> = ({
  onAnalysisGenerated,
  showToast,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customBbox, setCustomBbox] = useState<string>('');
  const [resolvedLocation, setResolvedLocation] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [baselineYear, setBaselineYear] = useState<number>(2017);
  const [comparisonYear, setComparisonYear] = useState<number>(2024);
  const [month, setMonth] = useState<number>(7);
  const [method, setMethod] = useState<string>('ndvi');
  const [loading, setLoading] = useState<boolean>(false);
  const [narrative, setNarrative] = useState<TimeTravelNarrative | null>(null);
  const [loadingNarrative, setLoadingNarrative] = useState<boolean>(false);

  // Parse bounding box string into [min_lon, min_lat, max_lon, max_lat]
  const parsedBbox: [number, number, number, number] | null = useMemo(() => {
    try {
      if (!customBbox.trim()) return null;
      const parts = customBbox.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && !parts.some(isNaN)) {
        return [parts[0], parts[1], parts[2], parts[3]];
      }
    } catch {}
    return null;
  }, [customBbox]);

  // Reverse geocode whenever coordinates change
  useEffect(() => {
    if (!parsedBbox) {
      setResolvedLocation('');
      return;
    }
    const centerLat = (parsedBbox[1] + parsedBbox[3]) / 2;
    const centerLng = (parsedBbox[0] + parsedBbox[2]) / 2;
    setLocationLoading(true);
    reverseGeocode(centerLat, centerLng)
      .then((loc) => {
        setResolvedLocation(loc);
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, [parsedBbox]);

  const handleSelectPreset = (preset: TargetPreset) => {
    setSelectedPreset(preset.id);
    setCustomBbox(preset.bbox.join(', '));
    setResolvedLocation(`${preset.name}, ${preset.country}`);
    setBaselineYear(preset.defaultBaselineYear);
    setComparisonYear(preset.defaultComparisonYear);
    setMonth(preset.month);
    setMethod(preset.method);
    setNarrative(null);
  };

  const handleRunSearch = async () => {
    if (!parsedBbox) {
      showToast('Please draw a study area on the map or select a region before running analysis.', 'error');
      return;
    }

    setLoading(true);
    setNarrative(null);
    try {
      const locLabel = resolvedLocation || `Sector [${parsedBbox[1].toFixed(2)}°, ${parsedBbox[0].toFixed(2)}°]`;
      showToast(`Querying Planetary STAC Sentinel-2 for ${locLabel} (${baselineYear} vs ${comparisonYear})...`, 'success');

      const result = await runTimeTravelAnalysis({
        bbox: parsedBbox,
        baselineYear,
        comparisonYear,
        month,
        method,
      });

      if (resolvedLocation) {
        result.sourceTitle = `${resolvedLocation} Sentinel-2 (${baselineYear} vs ${comparisonYear})`;
      }

      onAnalysisGenerated(result);
      showToast(`Historical scene for ${locLabel} processed successfully!`, 'success');

      // Fetch Adaption Chronological Storyline in background
      setLoadingNarrative(true);
      fetchTimeTravelNarrative(result.analysisId, baselineYear, comparisonYear, parsedBbox[0], parsedBbox[1])
        .then((n) => setNarrative(n))
        .catch(() => {})
        .finally(() => setLoadingNarrative(false));
    } catch (err: any) {
      showToast(err.message || 'Failed to search Planetary STAC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentPresetData = PRESET_TARGETS.find((p) => p.id === selectedPreset);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="spectra-card p-6 bg-gradient-to-r from-white via-indigo-50/40 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="spectra-badge flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-600" />
              <span>Planetary STAC Engine</span>
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-600/40">
              Free & Open Data (AWS Element84)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#102543] dark:text-white font-['Outfit'] transition-colors">
            Global Multi-Year Time-Travel Anomaly Detection
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Select any global coordinate footprint to retrieve years-ago Sentinel-2 satellite imagery and compare it against current passes.
          </p>
        </div>

        <button
          onClick={handleRunSearch}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0 self-start md:self-auto cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
          ) : (
            <Search className="w-4 h-4 text-cyan-300" />
          )}
          <span>{loading ? 'Streaming STAC Rasters...' : 'Find Historical & Compare'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive World Map & Presets (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Interactive World Map */}
          <div className="spectra-card p-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-[#102543] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Interactive Earth Observation Map</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-white/10">
                Draw custom area of ANY size worldwide
              </span>
            </div>
            
            <div className="h-[430px] w-full">
              <InteractiveLeafletMap
                bbox={parsedBbox}
                locationName={resolvedLocation}
                onBboxChange={(newBbox) => {
                  if (newBbox) {
                    setCustomBbox(`${newBbox[0]}, ${newBbox[1]}, ${newBbox[2]}, ${newBbox[3]}`);
                    setSelectedPreset('custom');
                  } else {
                    setCustomBbox('');
                    setResolvedLocation('');
                    setSelectedPreset('');
                  }
                }}
              />
            </div>
          </div>

          <div className="spectra-card p-5">
            <h3 className="text-sm font-bold text-[#102543] dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Or Select High-Impact Historical Observation Target</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_TARGETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {preset.country}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {preset.defaultBaselineYear} vs {preset.defaultComparisonYear}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[#102543] dark:text-white mb-1 leading-snug">
                      {preset.name}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STAC Metadata Transparency Card */}
          <div className="spectra-card p-5 bg-slate-900 text-white border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold tracking-wider uppercase text-cyan-300">
                  Planetary Catalog Specification
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">AWS S3 earth-search-v1</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Constellation</span>
                <span className="text-xs font-bold text-white">Sentinel-2 L2A</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Archive Depth</span>
                <span className="text-xs font-bold text-emerald-400">2015 – Present</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Resolution</span>
                <span className="text-xs font-bold text-amber-300">10m Ground Pixel</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-medium">Cloud Threshold</span>
                <span className="text-xs font-bold text-cyan-300">&lt; 20% Automated</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Coordinates & Time Horizons (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="spectra-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#102543] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Time Horizons & Spatial Extent</span>
            </h3>

            {/* Target Location & Bounding Box Display */}
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/80 via-sky-50/50 to-indigo-50/80 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Targeted Study Area
                    </span>
                    <h4 className="text-xs font-extrabold text-[#102543] dark:text-white font-['Outfit'] truncate">
                      {locationLoading ? (
                        <span className="text-indigo-600 dark:text-indigo-400 animate-pulse">Resolving geographic location...</span>
                      ) : (
                        resolvedLocation || (parsedBbox ? 'Custom Study Sector' : 'No Area Selected')
                      )}
                    </h4>
                    {parsedBbox ? (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between mt-1 pt-1.5 border-t border-indigo-100/80 dark:border-white/10">
                        <span>
                          [{parsedBbox.map((n) => n.toFixed(2)).join(', ')}]
                        </span>
                        <span className="text-indigo-700 dark:text-indigo-300 font-bold bg-indigo-100/70 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-[10px]">
                          ~{computeBboxDimensions(parsedBbox).areaKm2.toLocaleString()} km²
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Draw a box on the map or select a region below.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Bounding Box [min_lon, min_lat, max_lon, max_lat]</span>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">WGS84 EPSG:4326</span>
                </label>
                <input
                  type="text"
                  value={customBbox}
                  onChange={(e) => {
                    setCustomBbox(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  placeholder="e.g. -71.09, -16.59, -70.65, -16.29"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-mono rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Time Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Baseline (Years Ago): <span className="font-mono text-indigo-600 dark:text-indigo-400">{baselineYear}</span>
                </label>
                <input
                  type="range"
                  min="2016"
                  max="2022"
                  value={baselineYear}
                  onChange={(e) => setBaselineYear(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Historical Target</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recent Year: <span className="font-mono text-indigo-600 dark:text-indigo-400">{comparisonYear}</span>
                </label>
                <input
                  type="range"
                  min="2023"
                  max="2025"
                  value={comparisonYear}
                  onChange={(e) => setComparisonYear(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Current Comparison</span>
              </div>
            </div>

            {/* Season Matching Month Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Seasonal Month (Normalizes Weather & Seasons):
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>January (Winter/Dry season)</option>
                <option value={4}>April (Spring / Pre-monsoon)</option>
                <option value={7}>July (Summer Peak / High sun)</option>
                <option value={10}>October (Autumn / Post-monsoon)</option>
              </select>
            </div>

            {/* Detection Method */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Analysis Algorithm:
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-bold rounded-lg px-3 py-2 text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ndvi">NDVI (Vegetation Index / Deforestation)</option>
                <option value="ndwi">NDWI (Water Extent / Lake Desiccation)</option>
                <option value="cvd">CVD (Euclidean Color Vector Displacement)</option>
                <option value="otsu">Otsu Statistical Threshold</option>
              </select>
            </div>

            <button
              onClick={handleRunSearch}
              disabled={loading}
              className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Fetching STAC Multi-Temporal Rasters...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Execute Multi-Year STAC Comparison</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Adaption Decadal Chronological Narrative Card */}
      {(narrative || loadingNarrative) && (
        <div className="spectra-card p-6 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/70 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-white/10 space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-extrabold text-base text-[#102543] dark:text-white font-['Outfit'] transition-colors">
                Adaption AI Multi-Year Chronological Synthesis
              </h3>
            </div>
            {narrative && (
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-indigo-950/70 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/40 uppercase tracking-wider self-start sm:self-auto">
                {narrative.periodSpan}
              </span>
            )}
          </div>

          {loadingNarrative ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating multi-year environmental trajectory with Adaption AI...</span>
            </div>
          ) : narrative ? (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {narrative.headline}
                </h4>
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-white/10 shadow-sm transition-colors">
                  {narrative.chronologicalStory}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-white/10 space-y-2 transition-colors">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800 dark:text-white block">
                    Key Morphological Drivers ({narrative.periodSpan}):
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    {narrative.driversOfChange.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 p-3.5 rounded-xl border border-indigo-100/60 dark:border-white/10 space-y-2 transition-colors">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-indigo-900 dark:text-indigo-300 block">
                    Decadal Ecological Projection:
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {narrative.longTermOutlook}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
