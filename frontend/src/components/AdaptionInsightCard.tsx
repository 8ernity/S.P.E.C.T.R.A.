import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  SearchCheck,
  Compass,
} from 'lucide-react';
import type { IncidentInsight } from '../types/spectra';

interface AdaptionInsightProps {
  insight?: IncidentInsight | null;
  loading?: boolean;
  onRequestInsight: () => void;
  analysisAvailable: boolean;
}

export const AdaptionInsightCard: React.FC<AdaptionInsightProps> = ({
  insight,
  loading = false,
  onRequestInsight,
  analysisAvailable,
}) => {
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            High Priority Triage
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Medium Priority Review
          </span>
        );
      case 'low':
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Low Priority Routine
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Pending Triage
          </span>
        );
    }
  };

  return (
    <div className="spectra-card p-6 mb-6 relative overflow-hidden border-indigo-100/80">
      {/* Decorative gradient glow top right */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-indigo-200/30 via-cyan-100/20 to-transparent pointer-events-none rounded-bl-full" />

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-[#102543] dark:text-white font-['Outfit'] transition-colors">
                Adaption Incident Intelligence
              </h3>
              {getPriorityBadge(insight?.reviewPriority)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Cognitive synthesis distinguishing verified facts from analytical hypotheses
            </p>
          </div>
        </div>

        {/* Generate / Refresh Button */}
        <button
          onClick={onRequestInsight}
          disabled={loading || !analysisAvailable}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{insight ? 'Regenerate Insight' : 'Explain with Adaption'}</span>
        </button>
      </div>

      {/* Provider Status Banner */}
      {insight && (
        <div
          className={`px-3.5 py-2 rounded-xl text-xs font-medium mb-4 flex items-center justify-between border ${
            insight.providerStatus === 'success'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300'
              : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-600/40 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className={`w-4 h-4 shrink-0 ${insight.providerStatus === 'success' ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <span className="font-bold">
              {insight.provider === 'adaption'
                ? `Provider: Adaption Labs (${insight.model || 'qwen3.5-397b'})`
                : 'Scientific Rule-Grounded Synthesis'}
            </span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-slate-600 dark:text-slate-300 truncate">
              {insight.providerMessage}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
            {new Date(insight.generatedAt).toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Main Content Body */}
      {insight ? (
        <div className="space-y-4 text-xs relative z-10">
          {/* Executive Summary */}
          <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-xl border border-white/80 dark:border-white/10 shadow-sm transition-colors">
            <div className="font-bold text-[#102543] dark:text-white mb-1 text-sm flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Analyst Synopsis</span>
            </div>
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {insight.summary}
            </p>
          </div>

          {/* Two-Column Grid: Facts vs Hypotheses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Measured Facts */}
            <div className="bg-white/70 dark:bg-slate-800/80 p-4 rounded-xl border border-white/80 dark:border-white/10 space-y-2 transition-colors">
              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Observed Raster Measurements</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {insight.observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Hypotheses */}
            <div className="bg-white/70 dark:bg-slate-800/80 p-4 rounded-xl border border-white/80 dark:border-white/10 space-y-2 transition-colors">
              <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Plausible Interpretations (Hypotheses)</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {insight.possibleExplanations.map((exp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{exp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Verification Checklist & Caveats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/10 space-y-1 transition-colors">
              <div className="font-bold text-slate-700 dark:text-amber-400 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Potential Confounders & Caveats</span>
              </div>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                {insight.caveats.map((c, idx) => (
                  <li key={idx}>• {c}</li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-slate-200/50 dark:border-white/10 space-y-1 transition-colors">
              <div className="font-bold text-slate-700 dark:text-cyan-400 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <SearchCheck className="w-3.5 h-3.5 text-cyan-600" />
                <span>Recommended Ground Verification</span>
              </div>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
                {insight.verificationSteps.map((v, idx) => (
                  <li key={idx}>• {v}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center bg-white/50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            No incident intelligence synthesized yet.
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Click &quot;Explain with Adaption&quot; to submit computed raster metrics to Adaption Labs for structured hypotheses and verification actions.
          </p>
          <button
            onClick={onRequestInsight}
            disabled={loading || !analysisAvailable}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Synthesizing Insight...' : 'Generate Incident Intelligence'}
          </button>
        </div>
      )}
    </div>
  );
};
