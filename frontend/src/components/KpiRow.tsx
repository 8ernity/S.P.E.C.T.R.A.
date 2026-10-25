import React from 'react';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  TrendingDown,
  Layers,
  MapPin,
} from 'lucide-react';
import type { Measurements } from '../types/spectra';

interface KpiRowProps {
  measurements?: Measurements | null;
  method?: string;
  loading?: boolean;
}

export const KpiRow: React.FC<KpiRowProps> = ({
  measurements,
  method = 'ndvi',
  loading = false,
}) => {
  if (loading || !measurements) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="spectra-card p-5 flex items-center gap-4 animate-pulse"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-200/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-200/60 rounded w-24" />
              <div className="h-7 bg-slate-200/60 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const {
    changedPixels,
    validPixels,
    changePercentage,
    affectedAreaKm2,
    meanDelta,
    coverageFraction,
    detectedAnomaly,
    natureClassification = 'Undetermined',
    natureConfidence = 0.85,
    numRegions = 0,
    meanRegionSize = 0,
  } = measurements;

  const methodUpper = method.toUpperCase();
  const isHumanMade = natureClassification?.includes('Human-Made');
  const isNatural = natureClassification?.includes('Natural');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI Card 1: PS-05 Anomaly Nature Classification */}
      <div className="spectra-card spectra-card-hover p-4.5 flex items-center gap-3.5 relative overflow-hidden group">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${
            isHumanMade
              ? 'bg-rose-100/70 text-rose-600 border-rose-200/70'
              : isNatural
              ? 'bg-sky-100/70 text-sky-600 border-sky-200/70'
              : 'bg-amber-100/70 text-amber-600 border-amber-200/70'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Anomaly Nature
          </div>
          <div
            className={`text-base font-extrabold font-['Outfit'] tracking-tight truncate ${
              isHumanMade ? 'text-rose-700' : isNatural ? 'text-sky-700' : 'text-[#102543]'
            }`}
            title={natureClassification || undefined}
          >
            {natureClassification}
          </div>
          <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            <span className="font-semibold text-slate-700">{detectedAnomaly || 'Surface change'}</span>
            {natureConfidence ? ` • ${(natureConfidence * 100).toFixed(0)}% conf` : ''}
          </div>
        </div>
      </div>

      {/* KPI Card 2: Changed Surface Area */}
      <div className="spectra-card spectra-card-hover p-4.5 flex items-center gap-3.5 relative overflow-hidden group">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-sm transition-transform group-hover:scale-105">
          <TrendingDown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Changed Surface Area
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {affectedAreaKm2 !== null && affectedAreaKm2 !== undefined
              ? `${affectedAreaKm2.toFixed(3)} km²`
              : `${changedPixels.toLocaleString()} px`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            <span className="font-bold text-emerald-600">{changePercentage}%</span> of valid footprint
          </div>
        </div>
      </div>

      {/* KPI Card 3: Highlighted Change Regions */}
      <div className="spectra-card spectra-card-hover p-4.5 flex items-center gap-3.5 relative overflow-hidden group">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-sm transition-transform group-hover:scale-105">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Connected Clusters
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {numRegions || 0} <span className="text-xs font-semibold text-slate-500">regions</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Avg size: <span className="font-semibold text-slate-700">{Math.round(meanRegionSize || 0)} px</span>
          </div>
        </div>
      </div>

      {/* KPI Card 4: Mean Spectral Delta */}
      <div className="spectra-card spectra-card-hover p-4.5 flex items-center gap-3.5 relative overflow-hidden group">
        <div className="w-12 h-12 rounded-2xl bg-cyan-100/70 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-200/60 shadow-sm transition-transform group-hover:scale-105">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {methodUpper} Delta Shift
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {meanDelta >= 0 ? `+${meanDelta.toFixed(3)}` : meanDelta.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Clarity: <span className="font-semibold text-cyan-700">{(coverageFraction * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
