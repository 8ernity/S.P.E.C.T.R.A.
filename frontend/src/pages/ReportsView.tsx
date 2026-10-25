import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  Eye,
  ShieldCheck,
  Calendar,
  ArrowRight,
  Scale,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { AnalysisResult, RegulatoryNotice } from '../types/spectra';
import { fetchRegulatoryNotice } from '../lib/api';

interface ReportsViewProps {
  analysis: AnalysisResult | null;
  onOpenReportModal: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  analysis,
  onOpenReportModal,
}) => {
  const [notice, setNotice] = useState<RegulatoryNotice | null>(null);
  const [loadingNotice, setLoadingNotice] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [jurisdiction, setJurisdiction] = useState<string>('State Environmental Protection Agency & Forest Bureau');

  const handleGenerateNotice = async () => {
    if (!analysis) return;
    setLoadingNotice(true);
    try {
      const res = await fetchRegulatoryNotice(analysis.analysisId, jurisdiction);
      setNotice(res);
    } catch {
      // Handled
    } finally {
      setLoadingNotice(false);
    }
  };

  const handleCopyNotice = () => {
    if (!notice) return;
    const text = `
${notice.noticeTitle}
Case Number: ${notice.caseTrackingNumber}
Jurisdiction: ${notice.jurisdiction}
Date: ${new Date(notice.generatedAt).toLocaleDateString()}

STATUTORY BASIS:
${notice.statutoryBasis.map((b) => `• ${b}`).join('\n')}

EVIDENCE SUMMARY:
${notice.geospatialEvidenceSummary}

MANDATORY DIRECTIVES:
${notice.directives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Compliance Deadline: ${notice.complianceDeadlineDays} days
Sign-Off: ${notice.signOffEntity}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Dossier Banner */}
      <div className="spectra-card p-6 bg-gradient-to-r from-white via-indigo-50/50 to-white dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <span className="spectra-badge mb-1">Audit Trail & Verification</span>
          <h2 className="text-xl font-extrabold text-[#102543] dark:text-white font-['Outfit'] transition-colors">
            Evidence Dossiers & Report Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Export legally auditable change reports with acquisition provenance, spectral methods, and limitation notices.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          disabled={!analysis}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Eye className="w-4 h-4" />
          <span>Open Full Dossier (PDF Export)</span>
        </button>
      </div>

      {/* Adaption AI Statutory Enforcement Citation Generator Card */}
      <div className="spectra-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/40 rounded-xl border border-indigo-500/40">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-['Outfit'] tracking-tight">
                Adaption AI Statutory Enforcement Citation Generator
              </h3>
              <p className="text-xs text-indigo-200/80 font-medium">
                Autonomous generation of legally grounded Cease-and-Desist notices and environmental violation citations
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateNotice}
            disabled={!analysis || loadingNotice}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-lg shadow-indigo-500/20"
          >
            {loadingNotice ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Drafting Statutory Citation...</span>
              </>
            ) : (
              <>
                <Scale className="w-3.5 h-3.5" />
                <span>Draft Enforcement Notice</span>
              </>
            )}
          </button>
        </div>

        {notice ? (
          <div className="bg-slate-950/80 border border-indigo-800/80 rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
                  Official Citation Order
                </span>
                <h4 className="font-bold text-sm text-slate-100 mt-0.5">
                  {notice.noticeTitle}
                </h4>
                <span className="text-[10px] font-mono text-indigo-300">
                  Case Tracking: {notice.caseTrackingNumber} | Issued to: {notice.jurisdiction}
                </span>
              </div>
              <button
                onClick={handleCopyNotice}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold self-start sm:self-auto cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Notice Text'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                Geospatial Evidence Finding:
              </span>
              <p className="text-slate-300 leading-relaxed font-mono text-[11px] bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                {notice.geospatialEvidenceSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400 block">
                  Applicable Statutory Basis:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {notice.statutoryBasis.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-[10px] uppercase tracking-wider text-rose-400 block">
                  Mandatory Directives (14-Day Deadline):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {notice.directives.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-2 text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/80">
              <span>Authority: {notice.signOffEntity}</span>
              <span className="text-emerald-400 font-bold">Cryptographically Grounded via Adaption Labs</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-indigo-200/90 font-medium">
            Click &quot;Draft Enforcement Notice&quot; to synthesize Sentinel-2 pixel-shift metrics, bounding coordinates, and confidence scores into a formal statutory Cease-and-Desist order ready for submission to regulatory environmental tribunals.
          </p>
        )}
      </div>

      {/* Standard Compliance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="spectra-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full uppercase">
              Current Active Scene
            </span>
            <span className="text-xs font-mono text-slate-400">
              {analysis ? analysis.analysisId : 'N/A'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#102543] dark:text-white mb-1 transition-colors">
              {analysis ? analysis.sourceTitle : 'No Active Analysis'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Complete before/after comparison breakdown including {analysis?.measurements.changedPixels.toLocaleString() || 0} changed pixels, {analysis?.measurements.changePercentage || 0}% footprint alteration, and regional clusters.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Full Provenance Attached</span>
            </div>
            <button
              onClick={onOpenReportModal}
              disabled={!analysis}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="spectra-card p-6 space-y-4 border-dashed">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full uppercase">
              Standard Compliance
            </span>
            <span className="text-xs font-mono text-slate-400">CEOS / OGC</span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#102543] dark:text-white mb-1 transition-colors">
              Earth Observation Reporting Guidelines
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              SPECTRA dossier outputs follow the Committee on Earth Observation Satellites (CEOS) recommendations for Analysis Ready Data (ARD) and STAC catalog provenance disclosures.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>JSON & PDF Compatible</span>
            <span className="font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
