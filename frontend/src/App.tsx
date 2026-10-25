import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Overview } from './pages/Overview';
import { AnalysisView } from './pages/AnalysisView';
import { ReportsView } from './pages/ReportsView';
import { TimeTravelView } from './pages/TimeTravelView';
import { UploadModal } from './components/UploadModal';
import { ReportModal } from './components/ReportModal';
import { AdaptionChatWidget } from './components/AdaptionChatWidget';
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

  // App-wide Dark/Light Theme state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('spectra_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('spectra_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
        let source;
        const activeStacId = analysis?.provenance?.sourceSceneIds?.[0];
        if (pairId) {
          source = { pairId };
        } else if (customPairId) {
          source = { pairId: customPairId };
        } else if (activeStacId && (activeStacId.startsWith('stac_') || activeStacId.startsWith('pair_'))) {
          source = { pairId: activeStacId };
        } else {
          source = { sampleId: sampleId || activeSampleId };
        }

        const res = await runAnalysis(source, method, threshold);
        if (analysis?.sourceTitle && source.pairId && source.pairId.startsWith('stac_')) {
          res.sourceTitle = analysis.sourceTitle;
        }
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
    [activeSampleId, customPairId, currentMethod, currentThreshold, analysis]
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
      case 'timetravel':
        return {
          title: 'Global Multi-Year Satellite Time-Travel',
          subtitle: 'Search historical Earth Search STAC Sentinel-2 catalogs for any global coordinates years in the past',
        };
      case 'analysis':
        return {
          title: 'Anomaly Regions & Spatial Clusters',
          subtitle: 'Connected component clustering, bounding boxes, centroid coordinates, and delta distribution',
        };
      case 'reports':
        return {
          title: 'Automated Incident Report Dossier',
          subtitle: 'Audit-ready change intelligence summaries with provenance, nature classification, and export',
        };
      case 'overview':
      default:
        return {
          title: 'Change Intelligence Studio',
          subtitle:
            "PS-05 AI-powered satellite anomaly detection distinguishing natural events from potential human-made damage",
        };
    }
  };

  const pageMeta = getPageTitleAndSubtitle();

  return (
    <div className="flex h-screen overflow-hidden text-[#102543] dark:text-slate-100 bg-[#f0f5fc] dark:bg-[#060913] transition-colors duration-300 print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar - Matches CrimeRakshak reference */}
      <div className="print:hidden h-full flex shrink-0">
        <Sidebar
          currentPath={activeTab}
          onNavigate={(tab) => setActiveTab(tab)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onResetCase={() => handleSelectSample(activeSampleId)}
          onOpenUpload={() => setUploadModalOpen(true)}
        />
      </div>

      {/* Main Content Area with Mesh Gradient & Rounded Top Left */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 print:hidden">
        <div className="flex-1 flex flex-col min-h-0 main-mesh rounded-tl-3xl overflow-hidden relative shadow-2xl border-l border-t border-white/60 dark:border-white/10">
          <main className="flex-1 overflow-y-auto p-5 sm:p-7 scrollbar-hide relative z-10">
            {/* Header */}
            <Header
              title={pageMeta.title}
              subtitle={pageMeta.subtitle}
              onOpenUpload={() => setUploadModalOpen(true)}
              adaptionOnline={adaptionOnline}
              isCustomUpload={!!customPairId}
              theme={theme}
              onToggleTheme={toggleTheme}
            />

            {/* Page Router - Streamlined to Essential Views + Global Time-Travel */}
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
                  executeAnalysis(customPairId ? undefined : activeSampleId, customPairId || undefined, m);
                }}
                threshold={currentThreshold}
                onThresholdChange={(t) => setCurrentThreshold(t)}
                onRecompute={() =>
                  executeAnalysis(
                    customPairId ? undefined : activeSampleId,
                    customPairId || undefined,
                    currentMethod,
                    currentThreshold
                  )
                }
                onOpenUpload={() => setUploadModalOpen(true)}
              />
            )}

            {activeTab === 'timetravel' && (
              <TimeTravelView
                onAnalysisGenerated={(res) => {
                  setAnalysis(res);
                  setInsight(null);
                  setReportData(null);
                  const stacPairId = res.provenance?.sourceSceneIds?.[0];
                  if (stacPairId && (stacPairId.startsWith('stac_') || stacPairId.startsWith('pair_'))) {
                    setCustomPairId(stacPairId);
                  }
                  if (res.method) {
                    setCurrentMethod(res.method);
                  }
                  if (res.measurements?.thresholdUsed !== undefined) {
                    setCurrentThreshold(res.measurements.thresholdUsed);
                  }
                  setActiveTab('overview');
                  showToast('Historical Earth observation loaded into studio!', 'success');
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'analysis' && <AnalysisView analysis={analysis} />}

            {activeTab === 'reports' && (
              <ReportsView
                analysis={analysis}
                onOpenReportModal={handleOpenReport}
              />
            )}
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

      {/* Floating Glassmorphic Adaption AI Copilot */}
      <div className="print:hidden">
        <AdaptionChatWidget analysis={analysis} />
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold border transition-all animate-in slide-in-from-bottom-5 print:hidden ${
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
