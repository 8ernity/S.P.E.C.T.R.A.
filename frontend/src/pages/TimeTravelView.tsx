import React, { useState } from 'react';
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
} from 'lucide-react';
import { runTimeTravelAnalysis } from '../lib/api';
import { InteractiveLeafletMap } from '../components/InteractiveLeafletMap';
import type { AnalysisResult } from '../types/spectra';

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
  const [selectedPreset, setSelectedPreset] = useState<string>('amazon-rondonia');
  const [customBbox, setCustomBbox] = useState<string>('-63.15, -9.95, -62.85, -9.65');
  const [baselineYear, setBaselineYear] = useState<number>(2017);
  const [comparisonYear, setComparisonYear] = useState<number>(2024);
  const [month, setMonth] = useState<number>(7);
  const [method, setMethod] = useState<string>('ndvi');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSelectPreset = (preset: TargetPreset) => {
    setSelectedPreset(preset.id);
    setCustomBbox(preset.bbox.join(', '));
    setBaselineYear(preset.defaultBaselineYear);
    setComparisonYear(preset.defaultComparisonYear);
    setMonth(preset.month);
    setMethod(preset.method);
  };

  const handleRunSearch = async () => {
    setLoading(true);
    try {
      const parts = customBbox.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length !== 4 || parts.some(isNaN)) {
        throw new Error('Bounding box must contain 4 valid numbers: min_lon, min_lat, max_lon, max_lat');
      }

      const bbox: [number, number, number, number] = [parts[0], parts[1], parts[2], parts[3]];
      showToast(`Querying Earth Search STAC for Sentinel-2 (${baselineYear} vs ${comparisonYear})...`, 'success');

      const result = await runTimeTravelAnalysis({
        bbox,
        baselineYear,
        comparisonYear,
        month,
        method,
      });

      onAnalysisGenerated(result);
      showToast('Historical Earth observation scene fetched and processed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to search Earth Search STAC', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentPresetData = PRESET_TARGETS.find((p) => p.id === selectedPreset);

  const parsedBbox: [number, number, number, number] = (() => {
    try {
      const parts = customBbox.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length === 4 && !parts.some(isNaN)) {
        return [parts[0], parts[1], parts[2], parts[3]];
      }
    } catch {}
    return [-63.15, -9.95, -62.85, -9.65];
  })();

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
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Free & Open Data (AWS Element84)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
            Global Multi-Year Time-Travel Anomaly Detection
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
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
              <span className="text-xs font-bold text-[#102543] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                <span>Interactive Earth Observation Map</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Click map to move bounding footprint
              </span>
            </div>
            
            <div className="h-[380px] w-full">
              <InteractiveLeafletMap
                bbox={parsedBbox}
                onBboxChange={(newBbox) => {
                  setCustomBbox(`${newBbox[0]}, ${newBbox[1]}, ${newBbox[2]}, ${newBbox[3]}`);
                  setSelectedPreset('custom');
                }}
              />
            </div>
          </div>

          <div className="spectra-card p-5">
            <h3 className="text-sm font-bold text-[#102543] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
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
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        {preset.country}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {preset.defaultBaselineYear} vs {preset.defaultComparisonYear}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[#102543] mb-1 leading-snug">
                      {preset.name}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STAC Metadata Transparency Card */}
          <div className="spectra-card p-5 bg-slate-900 text-white">
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
            <h3 className="text-sm font-bold text-[#102543] uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Time Horizons & Spatial Extent</span>
            </h3>

            {/* Bounding Box Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Bounding Box [min_lon, min_lat, max_lon, max_lat]</span>
                <span className="text-[10px] font-mono text-indigo-600">WGS84 EPSG:4326</span>
              </label>
              <input
                type="text"
                value={customBbox}
                onChange={(e) => setCustomBbox(e.target.value)}
                placeholder="-63.15, -9.95, -62.85, -9.65"
                className="w-full bg-slate-50 border border-slate-200 text-xs font-mono rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Targeting: {currentPresetData ? currentPresetData.name : 'Custom Geographic BBox'}
              </span>
            </div>

            {/* Time Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Baseline (Years Ago): <span className="font-mono text-indigo-600">{baselineYear}</span>
                </label>
                <input
                  type="range"
                  min="2016"
                  max="2022"
                  value={baselineYear}
                  onChange={(e) => setBaselineYear(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Historical Target</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recent Year: <span className="font-mono text-indigo-600">{comparisonYear}</span>
                </label>
                <input
                  type="range"
                  min="2023"
                  max="2025"
                  value={comparisonYear}
                  onChange={(e) => setComparisonYear(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] text-slate-400">Current Comparison</span>
              </div>
            </div>

            {/* Season Matching Month Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seasonal Month (Normalizes Weather & Seasons):
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>January (Winter/Dry season)</option>
                <option value={4}>April (Spring / Pre-monsoon)</option>
                <option value={7}>July (Summer Peak / High sun)</option>
                <option value={10}>October (Autumn / Post-monsoon)</option>
              </select>
            </div>

            {/* Detection Method */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Analysis Algorithm:
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
};
