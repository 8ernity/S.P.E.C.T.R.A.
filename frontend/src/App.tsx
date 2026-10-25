import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { ComparisonView } from './pages/ComparisonView';
import { AnalysisView } from './pages/AnalysisView';
import { EnvironmentView } from './pages/EnvironmentView';
import { ExplorerView } from './pages/ExplorerView';
import { IntelligenceView } from './pages/IntelligenceView';
import { ReportsView } from './pages/ReportsView';
import { MethodologyView } from './pages/MethodologyView';
import { UploadModal } from './components/UploadModal';
import { ReportModal } from './components/ReportModal';
import {
  fetchHealth,
  fetchSamples,
  runAnalysis,
  fetchInsight,
  fetchReport,
} from './lib/api';
import type {
  SampleSummary,
  AnalysisResult,
  IncidentInsight,
  ReportData,
} from './types/spectra';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [sampleCases, setSampleCases] = useState<SampleSummary[]>([]);
  const [activeSampleId, setActiveSampleId] = useState<string>('vegetation-demo');
  const [customPairId, setCustomPairId] = useState<string | null>(null);

  const [currentMethod, setCurrentMethod] = useState<string>('ndvi');
  const [currentThreshold, setCurrentThreshold] = useState<number>(0.15);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [insight, setInsight] = useState<IncidentInsight | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(true);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [adaptionOnline, setAdaptionOnline] = useState<boolean>(false);

  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // 1. Initial health & sample list load
  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setAdaptionOnline(h.adaptionConfigured);
      })
      .catch(() => setAdaptionOnline(false));

    fetchSamples()
      .then((res) => {
        if (res.cases && res.cases.length > 0) {
          setSampleCases(res.cases);
        }
      })
      .catch((err) => {
        showToast('Could not reach backend samples API', 'error');
      });
  }, []);

  // 2. Run analysis function
  const executeAnalysis = useCallback(
    async (
      sampleId?: string,
      pairId?: string,
      methodOverride?: string,
      threshOverride?: number
    ) => {
      setLoadingAnalysis(true);
      setInsight(null); // Reset insight for new analysis
      const method = methodOverride || currentMethod;
      const threshold = threshOverride !== undefined ? threshOverride : currentThreshold;

      try {
        const source = pairId ? { pairId } : { sampleId: sampleId || activeSampleId };
        const res = await runAnalysis(source, method, threshold);
        setAnalysis(res);
        setCurrentMethod(res.method);
        setCurrentThreshold(res.measurements.thresholdUsed);

        // Fetch deterministic/Adaption insight in background
        fetchInsight(res.analysisId)
          .then((ins) => setInsight(ins))
          .catch(() => {});
      } catch (err: any) {
        showToast(err.message || 'Analysis error occurred', 'error');
      } finally {
        setLoadingAnalysis(false);
      }
    },
    [activeSampleId, currentMethod, currentThreshold]
  );

  // Trigger initial analysis when ready
  useEffect(() => {
    executeAnalysis(activeSampleId, undefined, 'ndvi', 0.15);
  }, []);

  // Handler when user selects a different sample case
  const handleSelectSample = (id: string) => {
    setActiveSampleId(id);
    setCustomPairId(null);
    let defaultMethod = 'ndvi';
    let defaultThresh = 0.15;
    if (id === 'coastal-demo') {
      defaultMethod = 'ndwi';
      defaultThresh = 0.20;
    } else if (id === 'urban-excavation-demo') {
      defaultMethod = 'otsu';
      defaultThresh = 0.22;
    }
    setCurrentMethod(defaultMethod);
    setCurrentThreshold(defaultThresh);
    executeAnalysis(id, undefined, defaultMethod, defaultThresh);
  };

  // Handler when user uploads a custom pair
  const handleUploadComplete = (pairId: string, meta: any) => {
    setCustomPairId(pairId);
    setCurrentMethod('otsu');
    setCurrentThreshold(0.22);
    showToast('Pair uploaded and aligned successfully!', 'success');
    executeAnalysis(undefined, pairId, 'otsu', 0.22);
  };

  // Explicit user request for Adaption explanation
  const handleRequestInsight = async () => {
    if (!analysis) return;
    setLoadingInsight(true);
    try {
      const ins = await fetchInsight(analysis.analysisId);
      setInsight(ins);
      showToast('Incident intelligence updated by Adaption service', 'success');
    } catch (err: any) {
      showToast(err.message || 'AI request failed', 'error');
    } finally {
      setLoadingInsight(false);
    }
  };

  // Open Report Modal
  const handleOpenReport = async () => {
    if (!analysis) return;
    try {
      const rep = await fetchReport(analysis.analysisId);
      setReportData(rep);
      setReportModalOpen(true);
    } catch (err: any) {
      showToast('Could not compile evidence dossier', 'error');
    }
  };

  const getPageTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'compare':
        return {
          title: 'Image Comparison Studio',
          subtitle: 'Dual-scene optical slider with adjustable difference overlays and layer clipping',
        };
      case 'analysis':
        return {
          title: 'Change Segmentation Analytics',
          subtitle: 'Statistical distribution, delta histogram, and connected parcel clustering',
        };
      case 'environment':
      case 'water':
        return {
          title: 'Multi-Spectral Environmental Indices',
          subtitle: 'Physical reflectance calculations (NDVI, NDWI, NBR) across Sentinel-2 bands',
        };
      case 'explorer':
        return {
          title: 'Satellite Orbit Explorer',
          subtitle: 'Bounding box query, cloud cover thresholding, and historical pass catalog',
        };
      case 'intelligence':
        return {
          title: 'Adaption AI Incident Hub',
          subtitle: 'Sponsor-grade LLM synthesis transforming raw raster metrics into actionable hypotheses',
        };
      case 'reports':
        return {
          title: 'Evidence Dossiers & Audit Export',
          subtitle: 'Complete analytical records formatted for official environmental verification',
        };
      case 'methodology':
        return {
          title: 'Scientific Methodology & Formulas',
          subtitle: 'Peer-reviewed remote sensing equations, CRS reprojection rules, and band maps',
        };
      case 'overview':
      default:
        return {
          title: 'Satellite Intelligence',
          subtitle:
            'Autonomous earth observation change intelligence for environmental monitoring & land cover change',
        };
    }
  };

  const pageMeta = getPageTitleAndSubtitle();

  return (
    <div className="flex h-screen overflow-hidden text-[#102543] bg-[#f0f5fc]">
      {/* Sidebar - Matches CrimeRakshak reference */}
      <Sidebar
        currentPath={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab === 'water') {
            setCurrentMethod('ndwi');
            executeAnalysis(activeSampleId, customPairId || undefined, 'ndwi');
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onResetCase={() => handleSelectSample(activeSampleId)}
      />

      {/* Main Content Area with Mesh Gradient & Rounded Top Left */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <div className="flex-1 flex flex-col min-h-0 main-mesh rounded-tl-3xl overflow-hidden relative shadow-2xl border-l border-t border-white/60">
          <main className="flex-1 overflow-y-auto p-5 sm:p-7 scrollbar-hide relative z-10">
            {/* Header */}
            <Header
              title={pageMeta.title}
              subtitle={pageMeta.subtitle}
              sampleCases={sampleCases}
              activeSampleId={activeSampleId}
              onSelectSample={handleSelectSample}
              onOpenUpload={() => setUploadModalOpen(true)}
              adaptionOnline={adaptionOnline}
              isCustomUpload={!!customPairId}
            />

            {/* Page Router */}
            {activeTab === 'overview' && (
              <Overview
                analysis={analysis}
                insight={insight}
                loadingAnalysis={loadingAnalysis}
                loadingInsight={loadingInsight}
                onRequestInsight={handleRequestInsight}
                method={currentMethod}
                onMethodChange={(m) => {
                  setCurrentMethod(m);
                  executeAnalysis(activeSampleId, customPairId || undefined, m);
                }}
                threshold={currentThreshold}
                onThresholdChange={(t) => setCurrentThreshold(t)}
                onRecompute={() =>
                  executeAnalysis(
                    activeSampleId,
                    customPairId || undefined,
                    currentMethod,
                    currentThreshold
                  )
                }
              />
            )}

            {activeTab === 'compare' && (
              <ComparisonView
                analysis={analysis}
                method={currentMethod}
                onMethodChange={(m) => {
                  setCurrentMethod(m);
                  executeAnalysis(activeSampleId, customPairId || undefined, m);
                }}
                threshold={currentThreshold}
                onThresholdChange={(t) => setCurrentThreshold(t)}
                onRecompute={() =>
                  executeAnalysis(
                    activeSampleId,
                    customPairId || undefined,
                    currentMethod,
                    currentThreshold
                  )
                }
                loading={loadingAnalysis}
              />
            )}

            {activeTab === 'analysis' && <AnalysisView analysis={analysis} />}

            {(activeTab === 'environment' || activeTab === 'water') && (
              <EnvironmentView
                analysis={analysis}
                activeMethod={currentMethod}
                onSelectMethod={(m) => {
                  setCurrentMethod(m);
                  executeAnalysis(activeSampleId, customPairId || undefined, m);
                }}
              />
            )}

            {activeTab === 'explorer' && (
              <ExplorerView
                sampleCases={sampleCases}
                onSelectCase={handleSelectSample}
              />
            )}

            {activeTab === 'intelligence' && (
              <IntelligenceView
                analysis={analysis}
                insight={insight}
                loading={loadingInsight}
                onRequestInsight={handleRequestInsight}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                analysis={analysis}
                onOpenReportModal={handleOpenReport}
              />
            )}

            {activeTab === 'methodology' && <MethodologyView />}
          </main>
        </div>
      </div>

      {/* Upload Pair Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Printable Report Dossier Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        report={reportData}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-bottom-5 ${
            toastMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;
