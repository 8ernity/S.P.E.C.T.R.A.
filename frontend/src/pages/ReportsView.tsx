import React from 'react';
import { FileText, Printer, Download, Eye, ShieldCheck, Calendar, ArrowRight } from 'lucide-react';
import type { AnalysisResult } from '../types/spectra';

interface ReportsViewProps {
  analysis: AnalysisResult | null;
  onOpenReportModal: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  analysis,
  onOpenReportModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Dossier Banner */}
      <div className="spectra-card p-6 bg-gradient-to-r from-white via-indigo-50/50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="spectra-badge mb-1">Audit Trail & Verification</span>
          <h2 className="text-xl font-extrabold text-[#102543] font-['Outfit']">
            Evidence Dossiers & Report Center
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Export legally auditable change reports with acquisition provenance, spectral methods, and limitation notices.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          disabled={!analysis}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
        >
          <Eye className="w-4 h-4" />
          <span>Open Full Dossier</span>
        </button>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="spectra-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase">
              Current Active Scene
            </span>
            <span className="text-xs font-mono text-slate-400">
              {analysis ? analysis.analysisId : 'N/A'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#102543] mb-1">
              {analysis ? analysis.sourceTitle : 'No Active Analysis'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Complete before/after comparison breakdown including {analysis?.measurements.changedPixels.toLocaleString() || 0} changed pixels, {analysis?.measurements.changePercentage || 0}% footprint alteration, and regional clusters.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Provenance Attached</span>
            </div>
            <button
              onClick={onOpenReportModal}
              disabled={!analysis}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="spectra-card p-6 space-y-4 border-dashed">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
              Standard Compliance
            </span>
            <span className="text-xs font-mono text-slate-400">CEOS / OGC</span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#102543] mb-1">
              Earth Observation Reporting Guidelines
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              SPECTRA dossier outputs follow the Committee on Earth Observation Satellites (CEOS) recommendations for Analysis Ready Data (ARD) and STAC catalog provenance disclosures.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>JSON & PDF Compatible</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
