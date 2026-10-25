import React from 'react';
import { KpiRow } from '../components/KpiRow';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { ChangeBreakdownCard } from '../components/ChangeBreakdownCard';
import { AdaptionInsightCard } from '../components/AdaptionInsightCard';
import type { AnalysisResult, IncidentInsight } from '../types/spectra';

interface OverviewProps {
  analysis: AnalysisResult | null;
  insight: IncidentInsight | null;
  loadingAnalysis: boolean;
  loadingInsight: boolean;
  onRequestInsight: () => void;
  method: string;
  onMethodChange: (m: string) => void;
  threshold: number;
  onThresholdChange: (t: number) => void;
  onRecompute: () => void;
  onOpenUpload?: () => void;
}

export const Overview: React.FC<OverviewProps> = ({
  analysis,
  insight,
  loadingAnalysis,
  loadingInsight,
  onRequestInsight,
  method,
  onMethodChange,
  threshold,
  onThresholdChange,
  onRecompute,
  onOpenUpload,
}) => {
  return (
    <div className="space-y-6">
      {/* 3 Top KPI Metric Cards */}
      <KpiRow
        measurements={analysis?.measurements}
        method={method}
        loading={loadingAnalysis}
      />

      {/* Main 2-Column Row (Matches CrimeRakshak reference screenshot layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Draggable Image Comparison Slider */}
        <div className="lg:col-span-7 flex flex-col">
          {analysis ? (
            <ComparisonSlider
              beforeUrl={analysis.visuals.beforeUrl}
              afterUrl={analysis.visuals.afterUrl}
              overlayUrl={analysis.visuals.overlayUrl}
              differenceHeatmapUrl={analysis.visuals.differenceHeatmapUrl}
              beforeDate={analysis.provenance.acquiredBefore}
              afterDate={analysis.provenance.acquiredAfter}
              title={analysis.sourceTitle}
              satellite={analysis.provenance.satellite}
              method={method}
              onMethodChange={onMethodChange}
              threshold={threshold}
              onThresholdChange={onThresholdChange}
              onRecompute={onRecompute}
              loading={loadingAnalysis}
              onOpenUpload={onOpenUpload}
            />
          ) : (
            <div className="spectra-card p-12 text-center text-slate-400">
              Loading observation rasters...
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Change Breakdown Donut & Region Table */}
        <div className="lg:col-span-5 flex flex-col">
          <ChangeBreakdownCard
            measurements={analysis?.measurements}
            regions={analysis?.regions}
            differenceHeatmapUrl={analysis?.visuals?.differenceHeatmapUrl}
            method={method}
            loading={loadingAnalysis}
          />
        </div>
      </div>

      {/* Lower Row: Adaption Incident Intelligence Card */}
      <AdaptionInsightCard
        insight={insight}
        loading={loadingInsight}
        onRequestInsight={onRequestInsight}
        analysisAvailable={!!analysis}
      />
    </div>
  );
};
