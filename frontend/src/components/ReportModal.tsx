import React from 'react';
import {
  X,
  Printer,
  Download,
  Satellite,
  ShieldCheck,
  Calendar,
  FileCheck2,
} from 'lucide-react';
import type { ReportData } from '../types/spectra';

interface ReportModalProps {
  report: ReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${report.reportId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const { analysis, insight, systemInfo } = report;
  const m = analysis.measurements;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="spectra-card bg-white p-6 sm:p-8 rounded-3xl max-w-3xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        {/* Modal Top Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="spectra-badge">Evidence Dossier</span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {report.reportId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Content */}
        <div className="overflow-y-auto pr-2 py-4 space-y-6 flex-1 text-slate-800">
          {/* Dossier Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-6 h-6 text-indigo-600" />
                <h1 className="text-2xl font-extrabold text-[#102543] font-['Outfit']">
                  SPECTRA
                </h1>
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">
                  Earth Change Intelligence
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acquisition comparison & deterministic raster segmentation analysis
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 shrink-0 font-medium">
              <div>Date: {new Date(report.generatedAt).toLocaleDateString()}</div>
              <div>Engine: {analysis.provenance.algorithmVersion}</div>
              <div className="text-emerald-600 font-bold flex items-center gap-1 justify-end mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audited Result</span>
              </div>
            </div>
          </div>

          {/* Key Findings Metrics Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              1. Measured Quantities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Changed Area</span>
                <span className="font-bold text-base text-[#102543]">
                  {m.affectedAreaKm2 ? `${m.affectedAreaKm2.toFixed(3)} km²` : `${m.changedPixels.toLocaleString()} px`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Change Percentage</span>
                <span className="font-bold text-base text-indigo-600">
                  {m.changePercentage}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Mean Shift</span>
                <span className="font-bold text-base text-[#102543]">
                  {m.meanDelta >= 0 ? `+${m.meanDelta}` : m.meanDelta}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Threshold Applied</span>
                <span className="font-bold text-base text-slate-700">
                  {m.thresholdUsed}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Evidence Thumbnails */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              2. Earth Observation Assets
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={analysis.visuals.beforeUrl}
                    alt="Baseline Scene"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block text-center">
                  Baseline Optical Pass
                </span>
              </div>
              <div className="space-y-1">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={analysis.visuals.afterUrl}
                    alt="Comparison Scene"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block text-center">
                  Recent Comparison Pass
                </span>
              </div>
              <div className="space-y-1">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                  <img
                    src={analysis.visuals.afterUrl}
                    alt="Background"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <img
                    src={analysis.visuals.overlayUrl}
                    alt="Overlay Mask"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <span className="text-[11px] font-semibold text-indigo-600 block text-center">
                  Segmented Heatmap Overlay
                </span>
              </div>
            </div>
          </div>

          {/* Incident Intelligence Block */}
          {insight && (
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  3. Adaption Cognitive Synthesis
                </h3>
                <span className="text-[10px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  {insight.provider === 'adaption' ? 'Live Adaption LLM' : 'Rule-Grounded Baseline'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {insight.summary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] mb-1">
                    Observed Indicators:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    {insight.observations.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-[11px] mb-1">
                    Plausible Hypotheses:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    {insight.possibleExplanations.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Methodology Notes & Disclaimers */}
          <div className="text-[11px] text-slate-500 space-y-2 border-t border-slate-100 pt-4">
            <h4 className="font-bold uppercase tracking-wider text-slate-400">
              4. Methodology & Limitations
            </h4>
            <ul className="space-y-1">
              {report.methodologyNotes.map((note, idx) => (
                <li key={idx}>• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
