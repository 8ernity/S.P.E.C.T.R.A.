import type {
  SampleManifestResponse,
  SampleMetadata,
  AnalysisResult,
  IncidentInsight,
  ReportData,
} from '../types/spectra';

const API_BASE = '/api/v1';

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
  return res.json();
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
  return res.json();
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
