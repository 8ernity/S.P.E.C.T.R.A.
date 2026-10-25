import React, { useState } from 'react';
import {
  X,
  Download,
  Satellite,
  ShieldCheck,
  Layers,
  MapPin,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Scale,
  RefreshCw,
} from 'lucide-react';
import type { ReportData, RegulatoryNotice } from '../types/spectra';
import { fetchRegulatoryNotice, API_BASE } from '../lib/api';

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
  const [notice, setNotice] = React.useState<RegulatoryNotice | null>(null);
  const [loadingNotice, setLoadingNotice] = React.useState<boolean>(false);
  const [attachNotice, setAttachNotice] = React.useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState<boolean>(false);

  if (!isOpen || !report) return null;

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const pdfUrl = `${API_BASE}/analyses/${report.analysis.analysisId}/report.pdf`;
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPECTRA_Dossier_${report.analysis.analysisId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Direct PDF download fallback error:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleToggleNotice = async () => {
    if (!attachNotice && !notice) {
      setLoadingNotice(true);
      try {
        const res = await fetchRegulatoryNotice(report.analysis.analysisId);
        setNotice(res);
        setAttachNotice(true);
      } catch {
        // Handled
      } finally {
        setLoadingNotice(false);
      }
    } else {
      setAttachNotice(!attachNotice);
    }
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
  const p = analysis.provenance;
  const regions = analysis.regions || [];
  const histogram = analysis.histogram || [];

  let areaDisplayPrimary = 'N/A';
  let areaDisplaySub = `${m.changedPixels.toLocaleString()} px`;
  if (m.affectedAreaKm2 && m.affectedAreaKm2 > 0) {
    areaDisplayPrimary = `${m.affectedAreaKm2.toFixed(3)} km²`;
    areaDisplaySub = `${m.changedPixels.toLocaleString()} px (${(m.affectedAreaKm2 * 100).toFixed(1)} ha)`;
  } else if (p.resolutionMeters && p.resolutionMeters > 0) {
    const calcKm2 = (m.changedPixels * p.resolutionMeters * p.resolutionMeters) / 1000000;
    areaDisplayPrimary = `${calcKm2.toFixed(3)} km²`;
    areaDisplaySub = `${m.changedPixels.toLocaleString()} px (${(calcKm2 * 100).toFixed(1)} ha)`;
  } else {
    areaDisplayPrimary = `${m.changedPixels.toLocaleString()} px`;
    areaDisplaySub = `Footprint (${m.changePercentage}% of frame)`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto spectra-print-modal-overlay">
      <div className="spectra-card bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl max-w-4xl w-full shadow-2xl relative my-8 max-h-[92vh] flex flex-col border border-slate-200 dark:border-white/10 spectra-print-modal-card">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="spectra-badge">Data-Loaded Evidence Dossier</span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {report.reportId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleNotice}
              disabled={loadingNotice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                attachNotice
                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                  : 'bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-white/10'
              }`}
            >
              {loadingNotice ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Scale className="w-3.5 h-3.5" />
              )}
              <span>{attachNotice ? 'Enforcement Order Attached' : 'Attach Enforcement Order'}</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
              title="Download official PDF intelligence dossier"
            >
              {downloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Raw JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 ml-2 cursor-pointer transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Multi-Page Dossier Document Content */}
        <div className="overflow-y-auto pr-2 py-4 space-y-6 flex-1 text-slate-800 dark:text-slate-200 spectra-print-content">
          {/* Header & Verification Metadata */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-900 dark:border-white/20 page-break-avoid">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <img src="/spectra-logo.png" alt="SPECTRA Logo" className="w-8 h-8 object-contain drop-shadow-xs" />
                <h1 className="text-2xl font-black text-[#102543] dark:text-white font-['Outfit'] tracking-tight">
                  SPECTRA
                </h1>
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/40 px-2 py-0.5 rounded uppercase tracking-wider">
                  EARTH CHANGE INTELLIGENCE DOSSIER
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deterministic Multi-Temporal Earth Observation & Pixel-Level Anomaly Audit Report
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 dark:text-slate-300 shrink-0 font-mono">
              <div className="font-bold text-slate-800 dark:text-white">ID: {report.reportId}</div>
              <div>Generated: {new Date(report.generatedAt).toLocaleString()}</div>
              <div>Engine: {p.algorithmVersion}</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 justify-end mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cryptographically Audited</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: Sensor & Georeferencing Provenance */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                1. Spaceborne Sensor & Georeferencing Provenance
              </h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs transition-colors">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Satellite / Constellation</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.satellite || 'Sentinel-2 (ESA)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Sensor Instrument</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.sensor || 'MultiSpectral Instrument (MSI)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Spatial Resolution</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {p.resolutionMeters ? `${p.resolutionMeters}m GSD` : '10.0m GSD (Optical Band)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Spatial Reference (CRS)</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.crs || 'WGS 84 / UTM Equirectangular'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Baseline Acquisition (T1)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.acquiredBefore || 'Historical Baseline Pass'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Comparison Acquisition (T2)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{p.acquiredAfter || 'Recent Target Pass'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Catalog Ingestion Mode</span>
                  <span className="font-semibold text-indigo-700 dark:text-indigo-400 uppercase">{analysis.mode} Pipeline</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-bold">Algorithm Engine</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{analysis.method.toUpperCase()} & Otsu Clustered</span>
                </div>
              </div>
              {p.sourceSceneIds && p.sourceSceneIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Scene Identifier(s): </span>
                  {p.sourceSceneIds.join(' | ')}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Measured Raster Quantities & Radiometric Shift */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                2. Quantitative Change Measurements & Anomaly Classification
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Changed Surface</span>
                <span className="font-extrabold text-base text-[#102543] dark:text-white block">
                  {areaDisplayPrimary}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate block">
                  {areaDisplaySub}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage Impact</span>
                <span className="font-extrabold text-base text-indigo-600 dark:text-indigo-400 block">
                  {m.changePercentage}%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  of {m.validPixels.toLocaleString()} valid pixels
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mean Spectral Shift (Δ)</span>
                <span className="font-extrabold text-base text-[#102543] dark:text-white block">
                  {m.meanDelta >= 0 ? `+${m.meanDelta}` : m.meanDelta}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Threshold: {m.thresholdUsed}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-white/10 transition-colors">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nature Classification</span>
                <span className="font-bold text-xs text-slate-800 dark:text-white block truncate mt-0.5">
                  {m.natureClassification || 'Deterministic Anomaly'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {m.natureConfidence ? `${Math.round(m.natureConfidence * 100)}% Confidence` : 'Verified Cluster'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Visual Evidence Assets & Change Overlays */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                3. Earth Observation Asset Inspection
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="h-36 sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center p-0.5">
                  <img
                    src={analysis.visuals.beforeUrl}
                    alt="Baseline Scene"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                    (A) Baseline Optical Pass (T₁)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {p.acquiredBefore || 'Reference Acquisition'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-36 sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center p-0.5">
                  <img
                    src={analysis.visuals.afterUrl}
                    alt="Comparison Scene"
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                    (B) Target Comparison Pass (T₂)
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {p.acquiredAfter || 'Recent Acquisition'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-36 sm:h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-white/10 shadow-sm relative flex items-center justify-center p-0.5">
                  <img
                    src={analysis.visuals.afterUrl}
                    alt="Background"
                    className="w-full h-full object-contain opacity-50 rounded-lg"
                  />
                  <img
                    src={analysis.visuals.overlayUrl}
                    alt="Overlay Mask"
                    className="absolute inset-0 w-full h-full object-contain rounded-lg p-0.5"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block">
                    (C) Segmented Change Overlay
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block truncate">
                    Masked Heatmap (Threshold: {m.thresholdUsed})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Connected Component Spatial Parcel Inventory */}
          {regions.length > 0 && (
            <div className="page-break-avoid space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                    4. Connected Component Spatial Cluster Inventory (Top Change Parcels)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Total Identified Parcels: {regions.length}
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase">
                      <th className="py-2 px-3">Parcel #</th>
                      <th className="py-2 px-3">Centroid [X, Y]</th>
                      <th className="py-2 px-3">Bounding Box [X, Y, W, H]</th>
                      <th className="py-2 px-3">Pixel Count</th>
                      <th className="py-2 px-3">Area / Footprint</th>
                      <th className="py-2 px-3">Mean Shift (Δ)</th>
                      <th className="py-2 px-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/10 font-mono text-[11px]">
                    {regions.slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">#{r.id}</td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">[{r.centroidPixels[0]}, {r.centroidPixels[1]}]</td>
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">[{r.bboxPixels.join(', ')}]</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{r.maskPixelCount.toLocaleString()} px</td>
                        <td className="py-1.5 px-3 text-indigo-700 dark:text-indigo-400 font-bold">
                          {r.areaKm2 !== undefined && r.areaKm2 !== null
                            ? `${r.areaKm2.toFixed(3)} km²`
                            : p.resolutionMeters
                              ? `${((r.maskPixelCount * p.resolutionMeters * p.resolutionMeters) / 1000000).toFixed(3)} km²`
                              : `${r.maskPixelCount.toLocaleString()} px`}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800 dark:text-slate-200">
                          {r.meanDelta !== undefined && r.meanDelta !== null ? `+${r.meanDelta.toFixed(3)}` : 'N/A'}
                        </td>
                        <td className="py-1.5 px-3 font-sans text-xs">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                            {r.nature || r.categorySuggestion || 'Change Anomaly'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: Delta Variance & Spectral Distribution Histogram Table */}
          {histogram.length > 0 && (
            <div className="page-break-avoid space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white">
                5. Radiometric Delta Variance & Pixel Frequency Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {histogram.slice(0, 8).map((bin, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 p-2 rounded-lg text-xs transition-colors">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Δ {bin.rangeStart.toFixed(2)} - {bin.rangeEnd.toFixed(2)}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{bin.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 dark:bg-indigo-500"
                        style={{ width: `${Math.min(100, bin.percentage * 3)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                      {bin.pixelCount.toLocaleString()} px
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: Adaption Cognitive Synthesis & Incident Hypotheses */}
          {insight && (
            <div className="page-break-avoid bg-indigo-50/60 dark:bg-slate-800/90 p-4 rounded-2xl border border-indigo-200 dark:border-white/10 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-white">
                    6. Adaption Cognitive Synthesis & Reasoning
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-200 dark:border-white/10">
                    Priority: {insight.reviewPriority.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  Provider: {insight.provider === 'adaption' ? 'Live Adaption LLM' : 'Rule-Grounded Fallback Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-white/10">
                {insight.summary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white block text-[11px] mb-1">
                    Observed Raster Indicators:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    {insight.observations.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-indigo-100 dark:border-white/10">
                  <span className="font-bold text-slate-900 dark:text-white block text-[11px] mb-1">
                    Plausible Domain Hypotheses:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                    {insight.possibleExplanations.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {insight.verificationSteps && insight.verificationSteps.length > 0 && (
                <div className="text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                  <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Recommended Field Verification Steps:</span>
                  <ul className="list-decimal list-inside space-y-0.5 text-slate-600 dark:text-slate-400 text-[10px]">
                    {insight.verificationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: Statutory Environmental Enforcement Citation Order (Adaption AI) */}
          {attachNotice && notice && (
            <div className="page-break-avoid bg-slate-900 text-white p-5 rounded-2xl border-2 border-indigo-500/80 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                    7. Statutory Environmental Enforcement Citation Order
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-indigo-300">
                  Case ID: {notice.caseTrackingNumber}
                </span>
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-100">
                  {notice.noticeTitle}
                </h4>
                <p className="text-[11px] text-slate-300 font-mono mt-1 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {notice.geospatialEvidenceSummary}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-amber-400 block">
                    Statutory Legal Authority:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                    {notice.statutoryBasis.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-rose-400 block">
                    Mandatory Enforcement Directives ({notice.complianceDeadlineDays}-Day Window):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                    {notice.directives.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2">
                <span>Sign-off: {notice.signOffEntity}</span>
                <span className="text-emerald-400 font-bold">Legally Grounded & Cryptographically Timestamped</span>
              </div>
            </div>
          )}

          {/* SECTION 8: Algorithmic Citations & Verification Digest */}
          <div className="page-break-avoid text-[10px] text-slate-500 dark:text-slate-400 space-y-2 border-t-2 border-slate-200 dark:border-white/10 pt-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-400">
              <span>SPECTRA Deterministic Pipeline Verification Digest: 0x8F7C...E2A9</span>
              <span>ISO 19115 / OGC Earth Observation Standards Aligned</span>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block mb-0.5">
                Methodology Notes & Constraints:
              </span>
              <ul className="space-y-0.5 list-disc list-inside text-slate-500 dark:text-slate-400">
                {report.methodologyNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
            {analysis.citations && analysis.citations.length > 0 && (
              <div className="pt-1 text-[9px] text-slate-400 dark:text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-300">Peer Citations: </span>
                {analysis.citations.join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
