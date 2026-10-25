import React, { useState } from 'react';
import { Globe, Search, Calendar, Sliders, MapPin, Satellite, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { SampleSummary } from '../types/spectra';

interface ExplorerViewProps {
  sampleCases: SampleSummary[];
  onSelectCase: (id: string) => void;
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  sampleCases,
  onSelectCase,
}) => {
  const [bboxInput, setBboxInput] = useState('-63.55, -10.25, -63.45, -10.15');
  const [maxCloud, setMaxCloud] = useState(15);
  const [selectedPass, setSelectedPass] = useState('2025-07-20');

  return (
    <div className="space-y-6">
      {/* Search Header Bar */}
      <div className="spectra-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
                Earth Observation Orbit Explorer
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Geospatial bounding box coordinate search across Sentinel-2 (Copernicus) and SPOT optical archives
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interval: 2021 – 2026</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Sliders className="w-3.5 h-3.5 text-cyan-600" />
              <span>Max Cloud: {maxCloud}%</span>
            </div>
          </div>
        </div>

        {/* BBox Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={bboxInput}
              onChange={(e) => setBboxInput(e.target.value)}
              placeholder="MinLon, MinLat, MaxLon, MaxLat (EPSG:4326)"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              onClick={() => onSelectCase('vegetation-demo')}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Query Scenes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Available Geospatial Scenes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sampleCases.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className="spectra-card p-5 cursor-pointer hover:border-indigo-400 hover:shadow-lg transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-slate-900 relative">
                <img
                  src={c.afterThumb}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {c.satellite}
                </span>
                <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Offline Ready</span>
                </span>
              </div>

              <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide mb-1">
                {c.category}
              </div>
              <h3 className="font-bold text-sm text-[#102543] mb-1.5 group-hover:text-indigo-600 transition-colors">
                {c.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {c.id === 'vegetation-demo'
                  ? 'Multi-spectral Sentinel-2 pass over Amazon Basin clear-cut logging corridors.'
                  : c.id === 'coastal-demo'
                  ? 'Sundarbans delta estuarine tidal waterline displacement & shoreline recession.'
                  : 'High-resolution optical observation of peri-urban expansion and excavation earthworks.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 font-mono">
                Method: {c.recommendedMethod.toUpperCase()}
              </span>
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Load Scene</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
