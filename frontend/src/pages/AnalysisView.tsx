import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, Download, Filter, Search, Table, BarChart3, Sparkles, ShieldAlert, CheckCircle2, X, RefreshCw } from 'lucide-react';
import type { AnalysisResult, ParcelDiagnostic } from '../types/spectra';
import { fetchParcelDiagnostic } from '../lib/api';

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minPixels, setMinPixels] = useState(0);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [diagnostic, setDiagnostic] = useState<ParcelDiagnostic | null>(null);
  const [loadingDiag, setLoadingDiag] = useState<boolean>(false);

  const handleInspectParcel = async (parcelId: number) => {
    if (!analysis) return;
    setSelectedParcelId(parcelId);
    setLoadingDiag(true);
    try {
      const diag = await fetchParcelDiagnostic(analysis.analysisId, parcelId);
      setDiagnostic(diag);
    } catch {
      // Diagnostic fallback handled
    } finally {
      setLoadingDiag(false);
    }
  };

  if (!analysis) {
    return <div className="spectra-card p-12 text-center text-slate-400">Loading analysis data...</div>;
  }

  const { regions, histogram, measurements } = analysis;

  const filteredRegions = regions.filter((r) => {
    const matchesSearch =
      (r.categorySuggestion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `#${r.id}`.includes(searchTerm);
    const matchesPixels = r.maskPixelCount >= minPixels;
    return matchesSearch && matchesPixels;
  });

  const handleExportCsv = () => {
    const headers = ['Region ID', 'Pixel Count', 'Area km²', 'Mean Delta', 'BBox (X Y W H)', 'Category'];
    const rows = filteredRegions.map((r) => [
      r.id,
      r.maskPixelCount,
      r.areaKm2 ?? 'N/A',
      r.meanDelta ?? 'N/A',
      `"${r.bboxPixels.join(' ')}"`,
      `"${r.categorySuggestion || 'Uncategorized'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SPECTRA_regions_${analysis.analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Chart Row: Change Delta Value Histogram */}
      <div className="spectra-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-[#102543] dark:text-white font-['Outfit'] transition-colors">
              Change Magnitude Histogram
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200/60 dark:border-white/10">
            20 Discrete Bins
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
          Statistical distribution of pixel difference values across the unmasked scene
        </p>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="rangeStart" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${Number(val).toLocaleString()} pixels (${item.payload.percentage}%)`,
                  `Range: [${item.payload.rangeStart} to ${item.payload.rangeEnd}]`,
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="pixelCount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Connected Regions Segmentation Table */}
      <div className="spectra-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-[#102543] dark:text-white font-['Outfit'] transition-colors">
                Connected Component Segments
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ranked spatial clusters meeting the {measurements.thresholdUsed} threshold criteria
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold transition-colors cursor-pointer border border-indigo-200/60 dark:border-indigo-600/40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Adaption Micro-Parcel Diagnostics Panel */}
        {(selectedParcelId !== null) && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/80 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 transition-all shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-extrabold text-sm text-[#102543] dark:text-white font-['Outfit']">
                  Adaption AI Diagnostics: Parcel #{selectedParcelId}
                </h4>
                {diagnostic && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      diagnostic.severity === 'Critical'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : diagnostic.severity === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {diagnostic.severity} Priority
                  </span>
                )}
                {diagnostic && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                    {diagnostic.morphologyType}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedParcelId(null);
                  setDiagnostic(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDiag ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating morphology interpretation with Adaption AI...</span>
              </div>
            ) : diagnostic ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-indigo-100 dark:border-white/10">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                    Morphological Interpretation
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {diagnostic.interpretation}
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-indigo-100 dark:border-white/10">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-1">
                    Ecological & Structural Risk
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {diagnostic.environmentalRisk}
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl border border-indigo-100 dark:border-white/10">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block mb-1">
                    Recommended Ground-Truth Action
                  </span>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {diagnostic.recommendedFieldCheck}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Cluster</th>
                <th className="py-2.5 px-3">Category Suggestion</th>
                <th className="py-2.5 px-3">Anomaly Nature</th>
                <th className="py-2.5 px-3 text-right">Pixel Count</th>
                <th className="py-2.5 px-3 text-right">Ground Area</th>
                <th className="py-2.5 px-3 text-right">Mean Shift</th>
                <th className="py-2.5 px-3 text-right">Centroid (X, Y)</th>
                <th className="py-2.5 px-3 text-center">AI Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
              {filteredRegions.length > 0 ? (
                filteredRegions.map((r) => {
                  const isHuman = r.nature?.includes('Human-Made');
                  const isNatural = r.nature?.includes('Natural');
                  const isSelected = selectedParcelId === r.id;
                  return (
                    <tr
                      key={r.id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/70 font-medium'
                          : 'hover:bg-indigo-50/40 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-400">#{r.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">
                        {r.categorySuggestion || 'Unattributed Shift'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHuman
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : isNatural
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {r.nature || 'Variance'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {r.maskPixelCount.toLocaleString()} px
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {r.areaKm2 ? `${r.areaKm2.toFixed(4)} km²` : '—'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          (r.meanDelta || 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {r.meanDelta ? (r.meanDelta >= 0 ? `+${r.meanDelta}` : r.meanDelta) : '0.00'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        [{r.centroidPixels[0]}, {r.centroidPixels[1]}]
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleInspectParcel(r.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors mx-auto cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No regions matched the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
