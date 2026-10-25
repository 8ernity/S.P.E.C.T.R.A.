import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, ArrowUpRight } from 'lucide-react';
import type { ConnectedRegion, Measurements } from '../types/spectra';

interface ChangeBreakdownProps {
  measurements?: Measurements | null;
  regions?: ConnectedRegion[];
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
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-base text-[#102543] font-['Outfit']">
              Change Breakdown
            </h3>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
            Detected Parcels
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
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
          <span className="text-xl font-extrabold text-[#102543] font-['Outfit'] -mt-0.5">
            {measurements.changePercentage}%
          </span>
          <span className="text-[10px] font-semibold text-slate-500">
            {measurements.changedPixels.toLocaleString()} px
          </span>
        </div>
      </div>

      {/* Subcategories Breakdown List */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-slate-100">
          <span>Cluster Category</span>
          <span>Area / Vol</span>
        </div>
        <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-hide pr-1">
          {chartData.slice(0, 5).map((item, index) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/80 px-1.5 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                />
                <span className="font-semibold text-slate-700 truncate">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-600 shrink-0 text-right">
                <span className="font-bold text-[#102543]">
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
    </div>
  );
};
