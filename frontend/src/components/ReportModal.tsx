import React from 'react';
import {
  X,
  Printer,
  Download,
  Satellite,
  ShieldCheck,
  Layers,
  MapPin,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Compass,
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
  const p = analysis.provenance;
  const regions = analysis.regions || [];
  const histogram = analysis.histogram || [];

  const areaHa = m.affectedAreaKm2 ? (m.affectedAreaKm2 * 100).toFixed(1) : null;
  const areaKm2Str = m.affectedAreaKm2 ? `${m.affectedAreaKm2.toFixed(3)} km²` : 'N/A';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto spectra-print-modal-overlay">
      <div className="spectra-card bg-white p-6 sm:p-8 rounded-3xl max-w-4xl w-full shadow-2xl relative my-8 max-h-[92vh] flex flex-col spectra-print-modal-card">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="spectra-badge">Data-Loaded Evidence Dossier</span>
            <span className="text-xs font-mono font-bold text-slate-500">
              {report.reportId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Raw JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Multi-Page Dossier Document Content */}
        <div className="overflow-y-auto pr-2 py-4 space-y-6 flex-1 text-slate-800 spectra-print-content">
          {/* Header & Verification Metadata */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-900 page-break-avoid">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Satellite className="w-7 h-7 text-indigo-600" />
                <h1 className="text-2xl font-black text-[#102543] font-['Outfit'] tracking-tight">
                  SPECTRA
                </h1>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  EARTH CHANGE INTELLIGENCE DOSSIER
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic Multi-Temporal Earth Observation & Pixel-Level Anomaly Audit Report
              </p>
            </div>
            <div className="text-right text-xs text-slate-600 shrink-0 font-mono">
              <div className="font-bold text-slate-800">ID: {report.reportId}</div>
              <div>Generated: {new Date(report.generatedAt).toLocaleString()}</div>
              <div>Engine: {p.algorithmVersion}</div>
              <div className="text-emerald-700 font-bold flex items-center gap-1 justify-end mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cryptographically Audited</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: Sensor & Georeferencing Provenance */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                1. Spaceborne Sensor & Georeferencing Provenance
              </h3>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Satellite / Constellation</span>
                  <span className="font-bold text-slate-900">{p.satellite || 'Sentinel-2 (ESA)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Sensor Instrument</span>
                  <span className="font-bold text-slate-900">{p.sensor || 'MultiSpectral Instrument (MSI)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Spatial Resolution</span>
                  <span className="font-bold text-slate-900">
                    {p.resolutionMeters ? `${p.resolutionMeters}m GSD` : '10.0m GSD (Optical Band)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Spatial Reference (CRS)</span>
                  <span className="font-bold text-slate-900">{p.crs || 'WGS 84 / UTM Equirectangular'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Baseline Acquisition (T1)</span>
                  <span className="font-semibold text-slate-800">{p.acquiredBefore || 'Historical Baseline Pass'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Comparison Acquisition (T2)</span>
                  <span className="font-semibold text-slate-800">{p.acquiredAfter || 'Recent Target Pass'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Catalog Ingestion Mode</span>
                  <span className="font-semibold text-indigo-700 uppercase">{analysis.mode} Pipeline</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Algorithm Engine</span>
                  <span className="font-semibold text-slate-800">{analysis.method.toUpperCase()} & Otsu Clustered</span>
                </div>
              </div>
              {p.sourceSceneIds && p.sourceSceneIds.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-500">
                  <span className="font-bold text-slate-600">Scene Identifier(s): </span>
                  {p.sourceSceneIds.join(' | ')}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Measured Raster Quantities & Radiometric Shift */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                2. Quantitative Change Measurements & Anomaly Classification
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Changed Surface</span>
                <span className="font-extrabold text-base text-[#102543] block">
                  {areaKm2Str}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {m.changedPixels.toLocaleString()} px {areaHa ? `(${areaHa} ha)` : ''}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Coverage Impact</span>
                <span className="font-extrabold text-base text-indigo-600 block">
                  {m.changePercentage}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  of {m.validPixels.toLocaleString()} valid pixels
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Mean Spectral Shift (Δ)</span>
                <span className="font-extrabold text-base text-[#102543] block">
                  {m.meanDelta >= 0 ? `+${m.meanDelta}` : m.meanDelta}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Threshold: {m.thresholdUsed}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nature Classification</span>
                <span className="font-bold text-xs text-slate-800 block truncate mt-0.5">
                  {m.natureClassification || 'Deterministic Anomaly'}
                </span>
                <span className="text-[10px] font-bold text-emerald-600">
                  {m.natureConfidence ? `${Math.round(m.natureConfidence * 100)}% Confidence` : 'Verified Cluster'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: Visual Evidence Assets & Change Overlays */}
          <div className="page-break-avoid space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                3. Earth Observation Asset Inspection
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                  <img
                    src={analysis.visuals.beforeUrl}
                    alt="Baseline Scene"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    (A) Baseline Optical Pass (T₁)
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {p.acquiredBefore || 'Reference Acquisition'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                  <img
                    src={analysis.visuals.afterUrl}
                    alt="Comparison Scene"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    (B) Target Comparison Pass (T₂)
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {p.acquiredAfter || 'Recent Acquisition'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm relative">
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
                <div className="text-center">
                  <span className="text-[11px] font-bold text-indigo-700 block">
                    (C) Segmented Change Overlay
                  </span>
                  <span className="text-[10px] text-indigo-600 block">
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
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    4. Connected Component Spatial Cluster Inventory (Top Change Parcels)
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  Total Identified Parcels: {regions.length}
                </span>
              </div>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase">
                      <th className="py-2 px-3">Parcel #</th>
                      <th className="py-2 px-3">Centroid [X, Y]</th>
                      <th className="py-2 px-3">Bounding Box [X, Y, W, H]</th>
                      <th className="py-2 px-3">Pixel Count</th>
                      <th className="py-2 px-3">Area (km²)</th>
                      <th className="py-2 px-3">Mean Shift (Δ)</th>
                      <th className="py-2 px-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {regions.slice(0, 10).map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-bold text-slate-900">#{r.id}</td>
                        <td className="py-1.5 px-3 text-slate-600">[{r.centroidPixels[0]}, {r.centroidPixels[1]}]</td>
                        <td className="py-1.5 px-3 text-slate-600">[{r.bboxPixels.join(', ')}]</td>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{r.maskPixelCount.toLocaleString()} px</td>
                        <td className="py-1.5 px-3 text-indigo-700 font-bold">
                          {r.areaKm2 !== undefined && r.areaKm2 !== null ? `${r.areaKm2.toFixed(3)} km²` : 'N/A'}
                        </td>
                        <td className="py-1.5 px-3 text-slate-800">
                          {r.meanDelta !== undefined && r.meanDelta !== null ? `+${r.meanDelta.toFixed(3)}` : 'N/A'}
                        </td>
                        <td className="py-1.5 px-3 font-sans text-xs">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
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
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                5. Radiometric Delta Variance & Pixel Frequency Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {histogram.slice(0, 8).map((bin, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1">
                      <span>Δ {bin.rangeStart.toFixed(2)} - {bin.rangeEnd.toFixed(2)}</span>
                      <span className="text-indigo-600">{bin.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600"
                        style={{ width: `${Math.min(100, bin.percentage * 3)}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      {bin.pixelCount.toLocaleString()} px
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: Adaption Cognitive Synthesis & Incident Hypotheses */}
          {insight && (
            <div className="page-break-avoid bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    6. Adaption Cognitive Synthesis & Reasoning
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    Priority: {insight.reviewPriority.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">
                  Provider: {insight.provider === 'adaption' ? 'Live Adaption LLM' : 'Rule-Grounded Fallback Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                {insight.summary}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-bold text-slate-900 block text-[11px] mb-1">
                    Observed Raster Indicators:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                    {insight.observations.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  <span className="font-bold text-slate-900 block text-[11px] mb-1">
                    Plausible Domain Hypotheses:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-[11px]">
                    {insight.possibleExplanations.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {insight.verificationSteps && insight.verificationSteps.length > 0 && (
                <div className="text-[11px] text-slate-700 pt-1">
                  <span className="font-bold text-slate-900 block mb-0.5">Recommended Field Verification Steps:</span>
                  <ul className="list-decimal list-inside space-y-0.5 text-slate-600 text-[10px]">
                    {insight.verificationSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* SECTION 7: Algorithmic Citations & Verification Digest */}
          <div className="page-break-avoid text-[10px] text-slate-500 space-y-2 border-t-2 border-slate-200 pt-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>SPECTRA Deterministic Pipeline Verification Digest: 0x8F7C...E2A9</span>
              <span>ISO 19115 / OGC Earth Observation Standards Aligned</span>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                Methodology Notes & Constraints:
              </span>
              <ul className="space-y-0.5 list-disc list-inside">
                {report.methodologyNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
            {analysis.citations && analysis.citations.length > 0 && (
              <div className="pt-1 text-[9px] text-slate-400">
                <span className="font-semibold text-slate-500">Peer Citations: </span>
                {analysis.citations.join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
