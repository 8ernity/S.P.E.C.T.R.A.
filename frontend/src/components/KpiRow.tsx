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
  } = measurements;

  const methodUpper = method.toUpperCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      {/* KPI Card 1: Changed Surface Area */}
      <div className="spectra-card spectra-card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
        <div className="w-13 h-13 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 shadow-sm transition-transform group-hover:scale-105">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Changed Surface Area
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {affectedAreaKm2 !== null && affectedAreaKm2 !== undefined
              ? `${affectedAreaKm2.toFixed(3)} km²`
              : `${changedPixels.toLocaleString()} px`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            <span className="font-bold text-emerald-600">
              {changePercentage}%
            </span>{' '}
            of valid observation footprint
          </div>
        </div>
      </div>

      {/* KPI Card 2: Mean Spectral Delta */}
      <div className="spectra-card spectra-card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
        <div className="w-13 h-13 rounded-2xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200/60 shadow-sm transition-transform group-hover:scale-105">
          <Activity className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {methodUpper} Index Shift
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {meanDelta >= 0 ? `+${meanDelta.toFixed(3)}` : meanDelta.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Mean magnitude across threshold ({measurements.thresholdUsed})
          </div>
        </div>
      </div>

      {/* KPI Card 3: Observation Clarity */}
      <div className="spectra-card spectra-card-hover p-5 flex items-center gap-4 relative overflow-hidden group">
        <div className="w-13 h-13 rounded-2xl bg-cyan-100/70 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-200/60 shadow-sm transition-transform group-hover:scale-105">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Valid Observation Clarity
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-[#102543] font-['Outfit'] tracking-tight">
            {(coverageFraction * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {validPixels.toLocaleString()} unclouded pixels analyzed
          </div>
        </div>
      </div>
    </div>
  );
};
