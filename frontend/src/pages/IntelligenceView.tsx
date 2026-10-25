import React from 'react';
import { AdaptionInsightCard } from '../components/AdaptionInsightCard';
import { Sparkles, Terminal, ShieldCheck, Database, FileCode } from 'lucide-react';
import type { AnalysisResult, IncidentInsight } from '../types/spectra';

interface IntelligenceViewProps {
  analysis: AnalysisResult | null;
  insight: IncidentInsight | null;
  loading: boolean;
  onRequestInsight: () => void;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  analysis,
  insight,
  loading,
  onRequestInsight,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Main Adaption Card */}
      <AdaptionInsightCard
        insight={insight}
        loading={loading}
        onRequestInsight={onRequestInsight}
        analysisAvailable={!!analysis}
      />

      {/* Contract & Transparency Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canonical Measurement Payload Sent to Adaption */}
        <div className="spectra-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-[#102543] font-['Outfit']">
                Canonical Measurement Payload
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Only auditable numeric facts computed by SPECTRA raster pipelines are transmitted to the LLM.
            </p>
          </div>

          <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-64 scrollbar-hide">
            {JSON.stringify(
              analysis
                ? {
                    analysis_id: analysis.analysisId,
                    method: analysis.method,
                    changed_pixels: analysis.measurements.changedPixels,
                    valid_pixels: analysis.measurements.validPixels,
                    change_percentage: analysis.measurements.changePercentage,
                    mean_delta: analysis.measurements.meanDelta,
                    affected_area_km2: analysis.measurements.affectedAreaKm2,
                    threshold: analysis.measurements.thresholdUsed,
                    provenance: analysis.provenance,
                  }
                : { status: 'Run an analysis to inspect payload' },
              null,
              2
            )}
          </pre>
        </div>

        {/* System Prompt & Grounding Spec */}
        <div className="spectra-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-5 h-5 text-cyan-600" />
              <h3 className="font-bold text-base text-[#102543] font-['Outfit']">
                System Instructions & Guardrails
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-3">
              Enforced requirements prohibiting hallucinated model accuracy, illegal attributions, or fabricated emergency declarations.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
            <div className="font-bold text-indigo-700">Operational Directives:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>Never assert illegal excavation or disaster casualty numbers without ground truth.</li>
              <li>State measured spectral delta values first, then present 1–3 cautious causal hypotheses.</li>
              <li>Always cite at least two physical confounders (cloud shadows, solar elevation, seasonal drying).</li>
              <li>Generate prioritized practical verification actions for environmental field monitors.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
