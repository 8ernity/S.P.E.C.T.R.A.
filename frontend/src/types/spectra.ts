export interface SampleSummary {
  id: string;
  title: string;
  category: string;
  type: 'scientific' | 'visual';
  folder: string;
  beforeThumb: string;
  afterThumb: string;
  satellite: string;
  supportedMethods: string[];
  recommendedMethod: string;
  isOfflineReady: boolean;
}

export interface SampleManifestResponse {
  system: string;
  version: string;
  cases: SampleSummary[];
}

export interface SampleMetadata {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  acquiredBefore?: string;
  acquiredAfter?: string;
  satellite: string;
  sensor?: string;
  crs?: string;
  resolutionMeters?: number;
  pixelSize: [number, number];
  geoTransform?: number[];
  availableBands: string[];
  supportedMethods: string[];
  recommendedMethod: string;
  recommendedThreshold: number;
  isMultispectral: boolean;
  isGeoreferenced: boolean;
  cloudCoverFraction: number;
  credit: string;
}

export interface ConnectedRegion {
  id: number;
  maskPixelCount: number;
  bboxPixels: [number, number, number, number];
  centroidPixels: [number, number];
  areaKm2?: number | null;
  meanDelta?: number | null;
  categorySuggestion?: string | null;
  nature?: string | null;
}

export interface HistogramBin {
  rangeStart: number;
  rangeEnd: number;
  pixelCount: number;
  percentage: number;
}

export interface Measurements {
  changedPixels: number;
  validPixels: number;
  changePercentage: number;
  affectedAreaKm2?: number | null;
  meanDelta: number;
  coverageFraction: number;
  meanIndexBefore?: number | null;
  meanIndexAfter?: number | null;
  thresholdUsed: number;
  detectedAnomaly?: string | null;
  natureClassification?: string | null;
  natureConfidence?: number | null;
  numRegions?: number | null;
  meanRegionSize?: number | null;
}

export interface Visuals {
  beforeUrl: string;
  afterUrl: string;
  overlayUrl: string;
  differenceHeatmapUrl?: string | null;
}

export interface Provenance {
  origin: string;
  crs?: string | null;
  resolutionMeters?: number | null;
  geoTransform?: number[] | null;
  sourceSceneIds: string[];
  acquiredBefore?: string | null;
  acquiredAfter?: string | null;
  sensor?: string | null;
  satellite?: string | null;
  algorithmVersion: string;
  computedAt: string;
}

export interface AnalysisResult {
  analysisId: string;
  status: 'completed' | 'processing' | 'failed';
  mode: 'scientific' | 'visual';
  method: string;
  sourceTitle: string;
  measurements: Measurements;
  regions: ConnectedRegion[];
  histogram: HistogramBin[];
  visuals: Visuals;
  provenance: Provenance;
  warnings: string[];
  citations: string[];
}

export interface IncidentInsight {
  provider: 'adaption' | 'local_fallback';
  model?: string | null;
  analysisId: string;
  generatedAt: string;
  summary: string;
  observations: string[];
  possibleExplanations: string[];
  caveats: string[];
  verificationSteps: string[];
  reviewPriority: 'low' | 'medium' | 'high' | 'insufficient_evidence';
  evidenceUsed: string[];
  groundedDatasetId?: string | null;
  providerStatus: 'success' | 'fallback' | 'error';
  providerMessage?: string | null;
}

export interface ReportData {
  reportId: string;
  generatedAt: string;
  title: string;
  analysis: AnalysisResult;
  insight?: IncidentInsight | null;
  systemInfo: Record<string, any>;
  methodologyNotes: string[];
  citations: string[];
}
