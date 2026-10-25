import React from 'react';
import { Trees, Droplets, Flame, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';
import type { AnalysisResult } from '../types/spectra';

interface EnvironmentViewProps {
  analysis: AnalysisResult | null;
  activeMethod: string;
  onSelectMethod: (method: string) => void;
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({
  analysis,
  activeMethod,
  onSelectMethod,
}) => {
  const isMultispectral = analysis?.mode === 'scientific';

  const indices = [
    {
      id: 'ndvi',
      name: 'NDVI — Normalized Difference Vegetation Index',
      formula: '(B08 - B04) / (B08 + B04)',
      bands: 'Near-Infrared (B08, 10m) & Red (B04, 10m)',
      description:
        'Monitors vegetative canopy density, photosynthetic chlorophyll absorption, and deforestation clear-cutting.',
      color: 'emerald',
      icon: Trees,
    },
    {
      id: 'ndwi',
      name: 'NDWI — McFeeters Open Water Index',
      formula: '(B03 - B08) / (B03 + B08)',
      bands: 'Green (B03, 10m) & Near-Infrared (B08, 10m)',
      description:
        'Maximizes reflectance of water bodies while suppressing soil and vegetation noise for flood extent mapping.',
      color: 'cyan',
      icon: Droplets,
    },
    {
      id: 'nbr',
      name: 'NBR — Normalized Burn Ratio',
      formula: '(B08 - B12) / (B08 + B12)',
      bands: 'Near-Infrared (B08, 10m) & Shortwave-Infrared (B12, 20m)',
      description:
        'Detects active fire scars, wildfire severity, and charred soil moisture deficiency across terrestrial ecosystems.',
      color: 'amber',
      icon: Flame,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Informational Hero Card */}
      <div className="spectra-card p-6 bg-gradient-to-r from-indigo-50/80 via-white/80 to-emerald-50/80 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
            <Trees className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <span className="spectra-badge mb-1">Spectral Photometry</span>
            <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
              Multi-Spectral Environmental Indices
            </h2>
            <p className="text-xs text-slate-600 font-medium max-w-2xl mt-1 leading-relaxed">
              Unlike generic RGB optical differences, environmental indices utilize calibrated physical reflectance bands from Sentinel-2 (Copernicus) to isolate biophysical characteristics without atmospheric bias.
            </p>
          </div>
        </div>
      </div>

      {/* Index Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {indices.map((item) => {
          const Icon = item.icon;
          const isActive = activeMethod === item.id;
          return (
            <div
              key={item.id}
              className={`spectra-card p-5 flex flex-col justify-between transition-all duration-200 border-2 ${
                isActive
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'border-transparent hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      Active Mode
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-[#102543] mb-1">
                  {item.name}
                </h3>
                <div className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/60 px-2.5 py-1 rounded-lg inline-block mb-2">
                  {item.formula}
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3">
                  {item.description}
                </p>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-medium mb-3">
                  <span className="font-bold text-slate-600">Channels:</span> {item.bands}
                </div>
                <button
                  onClick={() => onSelectMethod(item.id)}
                  className={`w-full py-2 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                  }`}
                >
                  <span>{isActive ? 'Applied' : 'Select Index'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sensor Band Mapping Reference */}
      <div className="spectra-card p-6">
        <h3 className="font-bold text-base text-[#102543] mb-3 font-['Outfit']">
          Sentinel-2 MSI Band Allocations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-indigo-600 block text-sm">B02 Blue</span>
            <span className="text-slate-500 text-[11px]">490 nm • 10m res</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-emerald-600 block text-sm">B03 Green</span>
            <span className="text-slate-500 text-[11px]">560 nm • 10m res</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-rose-600 block text-sm">B04 Red</span>
            <span className="text-slate-500 text-[11px]">665 nm • 10m res</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-purple-600 block text-sm">B08 NIR</span>
            <span className="text-slate-500 text-[11px]">842 nm • 10m res</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-amber-600 block text-sm">B11 SWIR-1</span>
            <span className="text-slate-500 text-[11px]">1610 nm • 20m res</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
            <span className="font-mono font-bold text-amber-700 block text-sm">B12 SWIR-2</span>
            <span className="text-slate-500 text-[11px]">2190 nm • 20m res</span>
          </div>
        </div>
      </div>
    </div>
  );
};
