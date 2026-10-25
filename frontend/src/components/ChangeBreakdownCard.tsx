import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, ArrowUpRight } from 'lucide-react';
import type { ConnectedRegion, Measurements } from '../types/spectra';

interface ChangeBreakdownProps {
  measurements?: Measurements | null;
  regions?: ConnectedRegion[];
  differenceHeatmapUrl?: string | null;
  method?: string;
  loading?: boolean;
}

const PALETTE = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const ChangeBreakdownCard: React.FC<ChangeBreakdownProps> = ({
  measurements,
  regions = [],
  differenceHeatmapUrl,
  method = 'ndvi',
  loading = false,
}) => {
  if (loading || !measurements) {
    return (
      <div className="spectra-card p-6 h-[460px] animate-pulse flex flex-col justify-between">
        <div className="h-5 bg-slate-200/60 rounded w-36 mb-4" />
        <div className="w-40 h-40 rounded-full bg-slate-200/60 self-center" />
        <div className="space-y-2 mt-4">
          <div className="h-3.5 bg-slate-200/60 rounded w-full" />
          <div className="h-3.5 bg-slate-200/60 rounded w-4/5" />
        </div>
      </div>
    );
  }

  // Aggregate regions by category suggestion
  const categoryMap: Record<string, { count: number; pixels: number; areaKm2: number }> = {};
  
  regions.forEach((r) => {
    const cat = r.categorySuggestion || 'Unattributed Variance';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, pixels: 0, areaKm2: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].pixels += r.maskPixelCount;
    categoryMap[cat].areaKm2 += r.areaKm2 || 0;
  });

  const chartData = Object.entries(categoryMap).map(([name, data]) => ({
    name,
    value: data.pixels,
    areaKm2: data.areaKm2,
    count: data.count,
    percentage: ((data.pixels / Math.max(1, measurements.changedPixels)) * 100).toFixed(1),
  }));

  // Sort descending by value
  chartData.sort((a, b) => b.value - a.value);

  return (
    <div className="spectra-card p-5 lg:p-6 flex flex-col justify-between h-full">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-base text-[#102543] dark:text-white font-['Outfit'] transition-colors">
              Change Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-600/40">
            Detected Parcels
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Cluster segmentation by spectral signature and spatial scale
        </p>
      </div>

      {/* Donut Chart with Center KPI */}
      <div className="relative w-full h-48 my-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData.length > 0 ? chartData : [{ name: 'Unchanged', value: 100 }]}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PALETTE[index % PALETTE.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any, item: any) => [
                `${Number(value).toLocaleString()} px (${item.payload.percentage}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            TOTAL
          </span>
          <span className="text-xl font-extrabold text-[#102543] dark:text-white font-['Outfit'] -mt-0.5">
            {measurements.changePercentage}%
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {measurements.changedPixels.toLocaleString()} px
          </span>
        </div>
      </div>

      {/* Subcategories Breakdown List */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100 dark:border-white/10">
          <span>Cluster Category</span>
          <span>Area / Vol</span>
        </div>
        <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
          {chartData.slice(0, 5).map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 px-1.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-300 shrink-0 text-right">
                <span className="font-bold text-[#102543] dark:text-white">
                  {item.areaKm2 > 0 ? `${item.areaKm2.toFixed(3)} km²` : `${item.value.toLocaleString()} px`}
                </span>
                <span className="text-[11px] text-slate-400 w-11 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scientific Delta Heatmap with Intensity Scale Marker */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Delta Heatmap & Radiometric Scale
          </span>
          <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {['ndvi', 'ndwi', 'nbr'].includes((method || '').toLowerCase()) ? 'Radiometric Delta (Δ)' : 'Spectral Magnitude'}
          </span>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-white/10 flex items-center justify-center min-h-[170px] max-h-[220px] shadow-sm group">
          {differenceHeatmapUrl ? (
            <img
              src={differenceHeatmapUrl}
              alt="Delta Heatmap"
              className="w-full h-full object-cover max-h-[220px]"
            />
          ) : (
            <div className="text-slate-500 text-xs py-8 font-medium">Computing raster delta heatmap...</div>
          )}

          {/* Intensity Marker (Delta Scale Legend) */}
          <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 shadow-2xl flex items-center gap-2 pointer-events-none text-white">
            <div
              className="w-2.5 h-24 rounded-full border border-white/20 shadow-inner shrink-0"
              style={{
                background: ['ndvi', 'ndwi', 'nbr'].includes((method || '').toLowerCase())
                  ? 'linear-gradient(to bottom, #06b6d4 0%, #38bdf8 25%, #f8fafc 50%, #fb923c 75%, #ef4444 100%)'
                  : 'linear-gradient(to bottom, #ffffff 0%, #facc15 30%, #ef4444 65%, #450a0a 90%, #000000 100%)',
              }}
            />
            <div className="flex flex-col justify-between h-24 text-[8px] font-mono text-slate-300 leading-none py-0.5">
              <span className="text-cyan-300 font-bold">+0.6 Gain</span>
              <span className="text-cyan-400">+0.3</span>
              <span className="text-white font-bold">0.0</span>
              <span className="text-orange-400">-0.3</span>
              <span className="text-rose-400 font-bold">-0.6 Loss</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
