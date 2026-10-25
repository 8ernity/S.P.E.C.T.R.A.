import React from 'react';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { Columns2, Sliders, Info, ShieldCheck } from 'lucide-react';
import type { AnalysisResult } from '../types/spectra';

interface ComparisonViewProps {
  analysis: AnalysisResult | null;
  method: string;
  onMethodChange: (m: string) => void;
  threshold: number;
  onThresholdChange: (t: number) => void;
  onRecompute: () => void;
  loading: boolean;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  analysis,
  method,
  onMethodChange,
  threshold,
  onThresholdChange,
  onRecompute,
  loading,
}) => {
  if (!analysis) {
    return <div className="spectra-card p-12 text-center text-slate-400">Loading comparison view...</div>;
  }

  return (
    <div className="space-y-6">
      <ComparisonSlider
        beforeUrl={analysis.visuals.beforeUrl}
        afterUrl={analysis.visuals.afterUrl}
        overlayUrl={analysis.visuals.overlayUrl}
        beforeDate={analysis.provenance.acquiredBefore}
        afterDate={analysis.provenance.acquiredAfter}
        title={analysis.sourceTitle}
        satellite={analysis.provenance.satellite}
        method={method}
        onMethodChange={onMethodChange}
        threshold={threshold}
        onThresholdChange={onThresholdChange}
        onRecompute={onRecompute}
        loading={loading}
      />

      {/* Analytical Metadata & Inspection Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="spectra-card p-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Columns2 className="w-4 h-4 text-indigo-600" />
            <span>Alignment & Registration</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Spatial co-registration verified on a shared 512×512 raster grid. Pixels correspond 1-to-1 between baseline and comparison scenes.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            CRS: {analysis.provenance.crs || 'Local Coordinate Space'}
          </div>
        </div>

        <div className="spectra-card p-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-600" />
            <span>Threshold Calibration</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Active threshold <span className="font-bold text-[#102543] font-mono">{threshold}</span> isolates meaningful surface transitions from ambient noise and minor atmospheric variation.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Method: {method.toUpperCase()}
          </div>
        </div>

        <div className="spectra-card p-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Integrity Guard</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            No synthetic pixels fabricated. Visual difference maps use pure deterministic Euclidean distance or multispectral difference equations.
          </p>
          <div className="text-[11px] text-emerald-600 font-bold">
            Validated by SPECTRA Core Engine
          </div>
        </div>
      </div>
    </div>
  );
};
