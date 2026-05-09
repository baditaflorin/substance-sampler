import {
  type FileValidationReport,
  type ProcessedTextureSet,
  type SourceContext,
  type TextureMap,
  type TextureSettings
} from "@/features/sampler/types";
import { fingerprintImageData } from "@/lib/hash/fingerprint";
import { analyzeTextureSource } from "@/lib/substance/analysis";
import { confidenceLabel } from "@/lib/substance/warnings";
import { computeHeightWithWebGPU } from "@/lib/webgpu/heightCompute";
import {
  boxBlurScalar,
  clamp,
  clampByte,
  luminance,
  normalizeScalarField,
  sampleScalar,
  scalarToImageData
} from "./pixel";

interface PreparedSource {
  imageData: ImageData;
  width: number;
  height: number;
}

function defaultSourceContext(source: ImageData): SourceContext {
  const fingerprint = fingerprintImageData(source);
  const validation: FileValidationReport = {
    fileName: "source-image",
    extension: "",
    mimeType: "image/unknown",
    detectedFormat: "unknown",
    byteLength: source.data.byteLength,
    sourceFingerprint: fingerprint,
    warnings: []
  };

  return {
    fileName: "source-image",
    originalWidth: source.width,
    originalHeight: source.height,
    normalizedWidth: source.width,
    normalizedHeight: source.height,
    sourceFingerprint: fingerprint,
    validation,
    userOwnedSettings: []
  };
}

export async function processTexture(
  source: ImageData,
  settings: TextureSettings,
  context = defaultSourceContext(source)
): Promise<ProcessedTextureSet> {
  const started = performance.now();
  const prepared = resizeImageData(source, settings.outputSize);
  const analysisStarted = performance.now();
  const analysis = analyzeTextureSource(prepared.imageData, settings, context);
  const settingsUsed = analysis.recommendedSettings;
  const analysisMs = Math.round(performance.now() - analysisStarted);
  const processingStarted = performance.now();
  const tileable = makeTileable(prepared.imageData, settingsUsed.tileStrength);
  const albedo = adjustAlbedo(tileable);
  const heightResult = await deriveHeight(tileable, settingsUsed);
  const height = scalarToImageData(heightResult.values, prepared.width, prepared.height);
  const normal = normalFromHeight(
    heightResult.values,
    prepared.width,
    prepared.height,
    settingsUsed.normalStrength
  );
  const roughness = roughnessFromHeight(
    heightResult.values,
    prepared.width,
    prepared.height,
    settingsUsed.roughnessBias,
    settingsUsed.detailStrength
  );
  const ao = ambientOcclusionFromHeight(heightResult.values, prepared.width, prepared.height);
  const maps = [
    makeMap(
      "albedo",
      "Albedo",
      "substance-sampler-albedo.png",
      albedo,
      analysis.mapConfidence.albedo
    ),
    makeMap(
      "normal",
      "Normal",
      "substance-sampler-normal.png",
      normal,
      analysis.mapConfidence.normal
    ),
    makeMap(
      "roughness",
      "Roughness",
      "substance-sampler-roughness.png",
      roughness,
      analysis.mapConfidence.roughness
    ),
    makeMap(
      "height",
      "Height",
      "substance-sampler-height.png",
      height,
      analysis.mapConfidence.height
    ),
    makeMap("ao", "Ambient Occlusion", "substance-sampler-ao.png", ao, analysis.mapConfidence.ao)
  ];
  const finalMaps =
    settingsUsed.upscale === 2
      ? maps.map((map) => {
          const imageData = upscale(map.imageData);
          return { ...map, imageData, fingerprint: fingerprintImageData(imageData) };
        })
      : maps;
  const first = finalMaps[0]?.imageData ?? prepared.imageData;
  const processingMs = Math.round(performance.now() - processingStarted);
  const metadata = {
    schemaVersion: "substance-sampler-export-v2" as const,
    appVersion: __APP_VERSION__,
    commit: __GIT_COMMIT__,
    source: {
      fileName: context.fileName,
      fingerprint: context.sourceFingerprint,
      originalWidth: context.originalWidth,
      originalHeight: context.originalHeight,
      normalizedWidth: context.normalizedWidth,
      normalizedHeight: context.normalizedHeight,
      byteLength: context.validation.byteLength,
      detectedFormat: context.validation.detectedFormat,
      mimeType: context.validation.mimeType
    },
    settings: settingsUsed,
    analysis: {
      schemaVersion: analysis.schemaVersion,
      material: analysis.material,
      materialConfidence: analysis.materialConfidence,
      materialConfidenceLabel: analysis.materialConfidenceLabel,
      sourceConfidence: analysis.sourceConfidence,
      sourceConfidenceLabel: analysis.sourceConfidenceLabel,
      reasoning: analysis.reasoning,
      warnings: analysis.warnings,
      metrics: analysis.metrics,
      mapConfidence: analysis.mapConfidence
    },
    maps: finalMaps.map((map) => ({
      kind: map.kind,
      fileName: map.fileName,
      fingerprint: map.fingerprint,
      confidence: map.confidence
    })),
    generatedAt: new Date().toISOString()
  };

  return {
    maps: finalMaps,
    report: {
      sourceWidth: source.width,
      sourceHeight: source.height,
      originalWidth: context.originalWidth,
      originalHeight: context.originalHeight,
      outputWidth: first.width,
      outputHeight: first.height,
      elapsedMs: Math.round(performance.now() - started),
      accelerator: heightResult.accelerator,
      analysisMs,
      processingMs,
      state: "ready"
    },
    settingsUsed,
    analysis,
    metadata
  };
}

function makeMap(
  kind: TextureMap["kind"],
  label: string,
  fileName: string,
  imageData: ImageData,
  confidence: number
): TextureMap {
  return {
    kind,
    label,
    fileName,
    imageData,
    fingerprint: fingerprintImageData(imageData),
    confidence,
    confidenceLabel: confidenceLabel(confidence)
  };
}

export function resizeImageData(source: ImageData, maxSize: number): PreparedSource {
  const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  if (width === source.width && height === source.height) {
    return { imageData: source, width, height };
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Could not create resize canvas context.");
  }

  const bitmapCanvas = new OffscreenCanvas(source.width, source.height);
  const bitmapCtx = bitmapCanvas.getContext("2d", { willReadFrequently: true });
  if (!bitmapCtx) {
    throw new Error("Could not create source canvas context.");
  }

  bitmapCtx.putImageData(source, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmapCanvas, 0, 0, width, height);
  return { imageData: ctx.getImageData(0, 0, width, height), width, height };
}

export function makeTileable(source: ImageData, strength: number): ImageData {
  if (strength <= 0) {
    return new ImageData(new Uint8ClampedArray(source.data), source.width, source.height);
  }

  const output = new ImageData(source.width, source.height);
  const width = source.width;
  const height = source.height;
  const safeStrength = clamp(strength, 0, 1);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const oppositeX = ((x + Math.floor(width / 2)) % width) * 4 + y * width * 4;
      const oppositeY = (((y + Math.floor(height / 2)) % height) * width + x) * 4;
      const edgeX = 1 - Math.min(x, width - 1 - x) / Math.max(1, width / 2);
      const edgeY = 1 - Math.min(y, height - 1 - y) / Math.max(1, height / 2);
      const blendX = edgeX * edgeX * safeStrength;
      const blendY = edgeY * edgeY * safeStrength;

      for (let channel = 0; channel < 3; channel += 1) {
        const own = source.data[index + channel] ?? 0;
        const xBlend = own * (1 - blendX) + (source.data[oppositeX + channel] ?? own) * blendX;
        const yBlend =
          xBlend * (1 - blendY) + (source.data[oppositeY + channel] ?? xBlend) * blendY;
        output.data[index + channel] = clampByte(yBlend);
      }

      output.data[index + 3] = 255;
    }
  }

  return output;
}

export function adjustAlbedo(source: ImageData): ImageData {
  const output = new ImageData(source.width, source.height);

  for (let i = 0; i < source.data.length; i += 4) {
    const r = source.data[i] ?? 0;
    const g = source.data[i + 1] ?? 0;
    const b = source.data[i + 2] ?? 0;
    const luma = luminance(r, g, b);
    const shadowLift = 16;
    const saturation = 1.06;

    output.data[i] = clampByte((r - luma) * saturation + luma + shadowLift);
    output.data[i + 1] = clampByte((g - luma) * saturation + luma + shadowLift);
    output.data[i + 2] = clampByte((b - luma) * saturation + luma + shadowLift);
    output.data[i + 3] = 255;
  }

  return output;
}

async function deriveHeight(source: ImageData, settings: TextureSettings) {
  let values: Uint8ClampedArray | null = null;
  let accelerator: "webgpu" | "cpu" = "cpu";

  if (settings.preferWebGpu) {
    try {
      values = await computeHeightWithWebGPU(source);
      accelerator = values ? "webgpu" : "cpu";
    } catch {
      values = null;
      accelerator = "cpu";
    }
  }

  if (!values) {
    values = new Uint8ClampedArray(source.width * source.height);
    for (let i = 0; i < values.length; i += 1) {
      const offset = i * 4;
      values[i] = clampByte(
        luminance(
          source.data[offset] ?? 0,
          source.data[offset + 1] ?? 0,
          source.data[offset + 2] ?? 0
        )
      );
    }
  }

  const blurred = boxBlurScalar(values, source.width, source.height, 1);
  const normalized = normalizeScalarField(blurred, settings.heightContrast);
  return { values: normalized, accelerator };
}

export function normalFromHeight(
  heightValues: Uint8ClampedArray,
  width: number,
  height: number,
  strength: number
): ImageData {
  const output = new ImageData(width, height);
  const normalStrength = strength / 255;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const left = sampleScalar(heightValues, width, height, x - 1, y);
      const right = sampleScalar(heightValues, width, height, x + 1, y);
      const up = sampleScalar(heightValues, width, height, x, y - 1);
      const down = sampleScalar(heightValues, width, height, x, y + 1);
      const dx = (left - right) * normalStrength;
      const dy = (up - down) * normalStrength;
      const dz = 1;
      const length = Math.hypot(dx, dy, dz) || 1;
      const index = (y * width + x) * 4;

      output.data[index] = clampByte((dx / length) * 127.5 + 127.5);
      output.data[index + 1] = clampByte((dy / length) * 127.5 + 127.5);
      output.data[index + 2] = clampByte((dz / length) * 127.5 + 127.5);
      output.data[index + 3] = 255;
    }
  }

  return output;
}

export function roughnessFromHeight(
  heightValues: Uint8ClampedArray,
  width: number,
  height: number,
  bias: number,
  detailStrength: number
): ImageData {
  const outputValues = new Uint8ClampedArray(heightValues.length);
  const blurred = boxBlurScalar(heightValues, width, height, 2);

  for (let i = 0; i < heightValues.length; i += 1) {
    const detail = Math.abs((heightValues[i] ?? 0) - (blurred[i] ?? 0)) * detailStrength;
    const roughness = bias * 255 + detail - ((heightValues[i] ?? 0) - 128) * 0.18;
    outputValues[i] = clampByte(roughness);
  }

  return scalarToImageData(outputValues, width, height);
}

export function ambientOcclusionFromHeight(
  heightValues: Uint8ClampedArray,
  width: number,
  height: number
): ImageData {
  const outputValues = new Uint8ClampedArray(heightValues.length);
  const broad = boxBlurScalar(heightValues, width, height, 4);

  for (let i = 0; i < heightValues.length; i += 1) {
    const cavity = Math.max(0, (broad[i] ?? 0) - (heightValues[i] ?? 0));
    outputValues[i] = clampByte(255 - cavity * 1.8);
  }

  return scalarToImageData(outputValues, width, height);
}

export function upscale(source: ImageData): ImageData {
  const width = source.width * 2;
  const height = source.height * 2;
  const output = new ImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    const sourceY = (y + 0.5) / 2 - 0.5;
    const y0 = Math.floor(sourceY);
    const y1 = y0 + 1;
    const fy = sourceY - y0;

    for (let x = 0; x < width; x += 1) {
      const sourceX = (x + 0.5) / 2 - 0.5;
      const x0 = Math.floor(sourceX);
      const x1 = x0 + 1;
      const fx = sourceX - x0;
      const outIndex = (y * width + x) * 4;

      for (let channel = 0; channel < 4; channel += 1) {
        const c00 = sampleChannel(source, x0, y0, channel);
        const c10 = sampleChannel(source, x1, y0, channel);
        const c01 = sampleChannel(source, x0, y1, channel);
        const c11 = sampleChannel(source, x1, y1, channel);
        const top = c00 * (1 - fx) + c10 * fx;
        const bottom = c01 * (1 - fx) + c11 * fx;
        output.data[outIndex + channel] = clampByte(top * (1 - fy) + bottom * fy);
      }
    }
  }

  return output;
}

function sampleChannel(source: ImageData, x: number, y: number, channel: number): number {
  const wrappedX = (x + source.width) % source.width;
  const wrappedY = (y + source.height) % source.height;
  return source.data[(wrappedY * source.width + wrappedX) * 4 + channel] ?? 0;
}
