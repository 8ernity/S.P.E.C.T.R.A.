import type {
  SampleManifestResponse,
  SampleMetadata,
  AnalysisResult,
  IncidentInsight,
  ReportData,
  RegulatoryNotice,
  ParcelDiagnostic,
  TimeTravelNarrative,
  ChatMessage,
  ChatResponse,
} from '../types/spectra';

const RAW_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE = RAW_BASE ? `${RAW_BASE}/api/v1` : '/api/v1';

export function resolveAssetUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (!RAW_BASE) return url;
  const cleaned = url.startsWith('/') ? url : `/${url}`;
  return `${RAW_BASE}${cleaned}`;
}

export async function fetchHealth(): Promise<{
  status: string;
  system: string;
  version: string;
  adaptionConfigured: boolean;
  adaptionModel: string;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchSamples(): Promise<SampleManifestResponse> {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error('Failed to load sample cases');
  const data: SampleManifestResponse = await res.json();
  if (data.cases && RAW_BASE) {
    data.cases = data.cases.map(s => ({
      ...s,
      beforeThumb: resolveAssetUrl(s.beforeThumb),
      afterThumb: resolveAssetUrl(s.afterThumb),
    }));
  }
  return data;
}

export async function fetchSampleMetadata(sampleId: string): Promise<SampleMetadata> {
  const res = await fetch(`${API_BASE}/samples/${sampleId}`);
  if (!res.ok) throw new Error(`Failed to load metadata for ${sampleId}`);
  return res.json();
}

export async function runAnalysis(
  source: { sampleId?: string; pairId?: string },
  method: string,
  threshold?: number,
  parameters?: Record<string, any>
): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source,
      method,
      threshold,
      parameters: parameters || {},
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.detail?.error?.message || `Analysis failed (${res.status})`;
    throw new Error(message);
  }
  const result: AnalysisResult = await res.json();
  if (RAW_BASE && result.visuals) {
    result.visuals.beforeUrl = resolveAssetUrl(result.visuals.beforeUrl);
    result.visuals.afterUrl = resolveAssetUrl(result.visuals.afterUrl);
    result.visuals.overlayUrl = resolveAssetUrl(result.visuals.overlayUrl);
    if (result.visuals.differenceHeatmapUrl) {
      result.visuals.differenceHeatmapUrl = resolveAssetUrl(result.visuals.differenceHeatmapUrl);
    }
  }
  return result;
}

export async function fetchInsight(analysisId: string): Promise<IncidentInsight> {
  const res = await fetch(`${API_BASE}/analyses/${analysisId}/insights`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.detail?.error?.message || 'Failed to generate AI insight';
    throw new Error(message);
  }
  return res.json();
}

export async function fetchReport(analysisId: string): Promise<ReportData> {
  const res = await fetch(`${API_BASE}/analyses/${analysisId}/report.json`);
  if (!res.ok) throw new Error('Failed to fetch analysis dossier');
  return res.json();
}

export async function uploadPair(beforeFile: File, afterFile: File): Promise<{
  pairId: string;
  beforeFilename: string;
  afterFilename: string;
  beforeDimensions: [number, number];
  afterDimensions: [number, number];
  isMultispectral: boolean;
  supportedMethods: string[];
  recommendedMethod: string;
  warnings: string[];
}> {
  const formData = new FormData();
  formData.append('before', beforeFile);
  formData.append('after', afterFile);

  const res = await fetch(`${API_BASE}/uploads/pair`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.detail?.error?.message || 'Upload failed';
    throw new Error(message);
  }
  return res.json();
}

export async function runTimeTravelAnalysis(params: {
  bbox: [number, number, number, number];
  baselineYear: number;
  comparisonYear: number;
  month: number;
  maxCloudCover?: number;
  method?: string;
  threshold?: number;
}): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/stac/time-travel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bbox: params.bbox,
      baselineYear: params.baselineYear,
      comparisonYear: params.comparisonYear,
      month: params.month,
      maxCloudCover: params.maxCloudCover || 25,
      method: params.method || 'ndvi',
      threshold: params.threshold || 0.20,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const message = errData?.detail?.error?.message || `Earth Search STAC search failed (${res.status})`;
    throw new Error(message);
  }
  const result: AnalysisResult = await res.json();
  if (RAW_BASE && result.visuals) {
    result.visuals.beforeUrl = resolveAssetUrl(result.visuals.beforeUrl);
    result.visuals.afterUrl = resolveAssetUrl(result.visuals.afterUrl);
    result.visuals.overlayUrl = resolveAssetUrl(result.visuals.overlayUrl);
    if (result.visuals.differenceHeatmapUrl) {
      result.visuals.differenceHeatmapUrl = resolveAssetUrl(result.visuals.differenceHeatmapUrl);
    }
  }
  return result;
}

export async function fetchRegulatoryNotice(
  analysisId: string,
  jurisdiction?: string
): Promise<RegulatoryNotice> {
  const url = jurisdiction
    ? `${API_BASE}/analyses/${analysisId}/regulatory-notice?jurisdiction=${encodeURIComponent(jurisdiction)}`
    : `${API_BASE}/analyses/${analysisId}/regulatory-notice`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail?.error?.message || 'Failed to generate regulatory notice');
  }
  return res.json();
}

export async function fetchParcelDiagnostic(
  analysisId: string,
  parcelId: number
): Promise<ParcelDiagnostic> {
  const res = await fetch(`${API_BASE}/analyses/${analysisId}/parcels/${parcelId}/diagnostics`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail?.error?.message || 'Failed to generate parcel diagnostics');
  }
  return res.json();
}

export async function fetchTimeTravelNarrative(
  analysisId: string,
  baselineYear: number,
  comparisonYear: number,
  minLon?: number,
  minLat?: number
): Promise<TimeTravelNarrative> {
  const params = new URLSearchParams({
    baselineYear: baselineYear.toString(),
    comparisonYear: comparisonYear.toString(),
  });
  if (minLon !== undefined && minLat !== undefined) {
    params.set('minLon', minLon.toString());
    params.set('minLat', minLat.toString());
  }
  const res = await fetch(`${API_BASE}/analyses/${analysisId}/timetravel-narrative?${params.toString()}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail?.error?.message || 'Failed to generate time travel narrative');
  }
  return res.json();
}

export async function sendChatMessage(params: {
  message: string;
  history?: { role: string; content: string }[];
  analysisId?: string;
  uiContext?: Record<string, any>;
}): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: params.message,
      history: params.history,
      analysisId: params.analysisId,
      uiContext: params.uiContext,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.detail?.error?.message || 'Failed to communicate with Adaption AI');
  }
  return res.json();
}
