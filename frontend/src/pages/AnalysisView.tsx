import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, Download, Filter, Search, Table, BarChart3 } from 'lucide-react';
import type { AnalysisResult } from '../types/spectra';

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minPixels, setMinPixels] = useState(0);

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
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-[#102543] font-['Outfit']">
              Change Magnitude Histogram
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            20 Discrete Bins
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium mb-4">
          Statistical distribution of pixel difference values across the unmasked scene
        </p>

        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="rangeStart" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any, item: any) => [
                  `${Number(val).toLocaleString()} pixels (${item.payload.percentage}%)`,
                  `Range: [${item.payload.rangeStart} to ${item.payload.rangeEnd}]`,
                ]}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.9)',
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
              <Table className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base text-[#102543] font-['Outfit']">
                Connected Component Segments
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
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
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Cluster</th>
                <th className="py-2.5 px-3">Category Suggestion</th>
                <th className="py-2.5 px-3">Anomaly Nature</th>
                <th className="py-2.5 px-3 text-right">Pixel Count</th>
                <th className="py-2.5 px-3 text-right">Ground Area</th>
                <th className="py-2.5 px-3 text-right">Mean Shift</th>
                <th className="py-2.5 px-3 text-right">Centroid (X, Y)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRegions.length > 0 ? (
                filteredRegions.map((r) => {
                  const isHuman = r.nature?.includes('Human-Made');
                  const isNatural = r.nature?.includes('Natural');
                  return (
                    <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-indigo-700">#{r.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {r.categorySuggestion || 'Unattributed Shift'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isHuman
                              ? 'bg-rose-100 text-rose-700'
                              : isNatural
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.nature || 'Variance'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        {r.maskPixelCount.toLocaleString()} px
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {r.areaKm2 ? `${r.areaKm2.toFixed(4)} km²` : '—'}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-bold ${
                          (r.meanDelta || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {r.meanDelta ? (r.meanDelta >= 0 ? `+${r.meanDelta}` : r.meanDelta) : '0.00'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        [{r.centroidPixels[0]}, {r.centroidPixels[1]}]
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
