export const MAP_KINDS = ["albedo", "normal", "roughness", "height", "ao"] as const;

export type MapKind = (typeof MAP_KINDS)[number];

export type Accelerator = "webgpu" | "cpu";

export interface TextureSettings {
  outputSize: number;
  tileStrength: number;
  normalStrength: number;
  heightContrast: number;
  roughnessBias: number;
  detailStrength: number;
  upscale: 1 | 2;
  preferWebGpu: boolean;
}

export interface TextureMap {
  kind: MapKind;
  label: string;
  fileName: string;
  imageData: ImageData;
}

export interface ProcessingReport {
  sourceWidth: number;
  sourceHeight: number;
  outputWidth: number;
  outputHeight: number;
  elapsedMs: number;
  accelerator: Accelerator;
}

export interface ProcessedTextureSet {
  maps: TextureMap[];
  report: ProcessingReport;
}

export const defaultSettings: TextureSettings = {
  outputSize: 1024,
  tileStrength: 0.35,
  normalStrength: 7,
  heightContrast: 1.25,
  roughnessBias: 0.48,
  detailStrength: 0.4,
  upscale: 1,
  preferWebGpu: true
};
