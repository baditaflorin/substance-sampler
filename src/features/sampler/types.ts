export const MAP_KINDS = ["albedo", "normal", "roughness", "metallic", "height", "ao"] as const;

export type MapKind = (typeof MAP_KINDS)[number];

export type Accelerator = "webgpu" | "cpu";

export type GeometryMode = "sphere" | "box" | "plane";

export type MaterialKind =
  | "wood"
  | "brick"
  | "concrete"
  | "fabric"
  | "metal"
  | "rust"
  | "tile"
  | "rock"
  | "unknown"
  | "unsuitable";

export type ConfidenceLabel = "low" | "medium" | "high";

export type WarningSeverity = "info" | "warning" | "danger";

export interface SubstanceWarning {
  id: string;
  severity: WarningSeverity;
  title: string;
  what: string;
  why: string;
  nextStep: string;
  confidenceImpact: number;
}

export interface UserFacingError {
  code: string;
  title: string;
  what: string;
  why: string;
  nextStep: string;
  recoverable: boolean;
}

export interface FileValidationReport {
  fileName: string;
  extension: string;
  mimeType: string;
  detectedFormat: "jpeg" | "png" | "webp" | "unknown";
  byteLength: number;
  sourceFingerprint: string;
  warnings: SubstanceWarning[];
}

export type SettingKey = keyof TextureSettings;

export interface TextureSettings {
  outputSize: number;
  tileStrength: number;
  normalStrength: number;
  heightContrast: number;
  roughnessBias: number;
  detailStrength: number;
  metallicBias: number;
  upscale: 1 | 2;
  preferWebGpu: boolean;
}

export interface TextureMap {
  kind: MapKind;
  label: string;
  fileName: string;
  imageData: ImageData;
  fingerprint: string;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
}

export interface ProcessingReport {
  sourceWidth: number;
  sourceHeight: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  elapsedMs: number;
  accelerator: Accelerator;
  analysisMs: number;
  processingMs: number;
  state: "ready" | "cancelled" | "recoverable-error" | "fatal-error";
}

export interface ProcessedTextureSet {
  maps: TextureMap[];
  report: ProcessingReport;
  settingsUsed: TextureSettings;
  analysis: TextureAnalysis;
  metadata: ExportMetadata;
}

export interface SourceContext {
  fileName: string;
  originalWidth: number;
  originalHeight: number;
  normalizedWidth: number;
  normalizedHeight: number;
  sourceFingerprint: string;
  validation: FileValidationReport;
  userOwnedSettings: SettingKey[];
}

export interface TextureAnalysis {
  schemaVersion: "phase2-analysis-v1";
  material: MaterialKind;
  materialConfidence: number;
  materialConfidenceLabel: ConfidenceLabel;
  sourceConfidence: number;
  sourceConfidenceLabel: ConfidenceLabel;
  reasoning: string[];
  warnings: SubstanceWarning[];
  metrics: TextureMetrics;
  recommendedSettings: TextureSettings;
  mapConfidence: Record<MapKind, number>;
}

export interface TextureMetrics {
  luminanceMean: number;
  luminanceStdDev: number;
  saturationMean: number;
  redDominance: number;
  detailEnergy: number;
  seamMismatch: number;
  lightingGradient: number;
  aspectRatio: number;
  megapixels: number;
  downsampleRatio: number;
  gridLikelihood: number;
}

export interface ExportMetadata {
  schemaVersion: "substance-sampler-export-v2";
  appVersion: string;
  commit: string;
  source: {
    fileName: string;
    fingerprint: string;
    originalWidth: number;
    originalHeight: number;
    normalizedWidth: number;
    normalizedHeight: number;
    byteLength: number;
    detectedFormat: FileValidationReport["detectedFormat"];
    mimeType: string;
  };
  settings: TextureSettings;
  analysis: Omit<TextureAnalysis, "recommendedSettings">;
  maps: Array<{
    kind: MapKind;
    fileName: string;
    fingerprint: string;
    confidence: number;
  }>;
  generationFingerprint: string;
  generatedAt: string;
}

export const defaultSettings: TextureSettings = {
  outputSize: 1024,
  tileStrength: 0.35,
  normalStrength: 7,
  heightContrast: 1.25,
  roughnessBias: 0.48,
  detailStrength: 0.4,
  metallicBias: 0,
  upscale: 1,
  preferWebGpu: true
};
