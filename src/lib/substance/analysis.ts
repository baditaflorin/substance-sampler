import {
  defaultSettings,
  type FileValidationReport,
  type MapKind,
  type MaterialKind,
  type SettingKey,
  type SourceContext,
  type SubstanceWarning,
  type TextureAnalysis,
  type TextureMetrics,
  type TextureSettings
} from "@/features/sampler/types";
import { clamp, luminance } from "@/lib/image/pixel";
import { confidenceLabel, warning } from "./warnings";

export function analyzeTextureSource(
  source: ImageData,
  settings: TextureSettings,
  context: SourceContext
): TextureAnalysis {
  const metrics = computeMetrics(source, context);
  const classification = classifyMaterial(context.fileName, metrics);
  const warnings = dedupeWarnings([
    ...context.validation.warnings,
    ...warningsForMetrics(metrics, classification.material, context.validation)
  ]);
  const recommendedSettings = recommendSettings(
    settings,
    context.userOwnedSettings,
    classification.material,
    metrics
  );
  const sourceConfidence = clamp(
    0.9 - warnings.reduce((total, item) => total + item.confidenceImpact, 0),
    0.05,
    0.98
  );
  const mapConfidence = mapConfidenceFor(warnings, sourceConfidence);

  return {
    schemaVersion: "phase2-analysis-v1",
    material: classification.material,
    materialConfidence: classification.confidence,
    materialConfidenceLabel: confidenceLabel(classification.confidence),
    sourceConfidence,
    sourceConfidenceLabel: confidenceLabel(sourceConfidence),
    reasoning: classification.reasoning,
    warnings,
    metrics,
    recommendedSettings,
    mapConfidence
  };
}

function computeMetrics(source: ImageData, context: SourceContext): TextureMetrics {
  const stride = Math.max(1, Math.floor(Math.sqrt((source.width * source.height) / 90000)));
  let count = 0;
  let lumaSum = 0;
  let lumaSqSum = 0;
  let satSum = 0;
  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let detailSum = 0;
  let detailCount = 0;
  const thirds = [0, 0, 0];
  const thirdCounts = [0, 0, 0];

  for (let y = 0; y < source.height; y += stride) {
    const third = Math.min(2, Math.floor((y / source.height) * 3));

    for (let x = 0; x < source.width; x += stride) {
      const offset = (y * source.width + x) * 4;
      const r = source.data[offset] ?? 0;
      const g = source.data[offset + 1] ?? 0;
      const b = source.data[offset + 2] ?? 0;
      const luma = luminance(r, g, b);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      lumaSum += luma;
      lumaSqSum += luma * luma;
      satSum += saturation;
      redSum += r;
      greenSum += g;
      blueSum += b;
      thirds[third] += luma;
      thirdCounts[third] += 1;
      count += 1;

      if (x + stride < source.width && y + stride < source.height) {
        const right = lumaAt(source, x + stride, y);
        const down = lumaAt(source, x, y + stride);
        detailSum += Math.abs(luma - right) + Math.abs(luma - down);
        detailCount += 2;
      }
    }
  }

  const mean = lumaSum / Math.max(1, count);
  const variance = lumaSqSum / Math.max(1, count) - mean * mean;
  const thirdMeans = thirds.map((value, index) => value / Math.max(1, thirdCounts[index] ?? 1));
  const lightingGradient = Math.max(...thirdMeans) - Math.min(...thirdMeans);
  const redMean = redSum / Math.max(1, count);
  const greenMean = greenSum / Math.max(1, count);
  const blueMean = blueSum / Math.max(1, count);
  const redDominance = redMean / Math.max(1, (greenMean + blueMean) / 2);
  const seamMismatch = computeSeamMismatch(source);
  const aspectRatio = source.width / Math.max(1, source.height);
  const megapixels = (context.originalWidth * context.originalHeight) / 1_000_000;
  const downsampleRatio = Math.max(
    context.originalWidth / Math.max(1, context.normalizedWidth),
    context.originalHeight / Math.max(1, context.normalizedHeight)
  );
  const gridLikelihood = gridLikelihoodFor(source, seamMismatch);

  return {
    luminanceMean: round(mean),
    luminanceStdDev: round(Math.sqrt(Math.max(0, variance))),
    saturationMean: round(satSum / Math.max(1, count)),
    redDominance: round(redDominance),
    detailEnergy: round(detailSum / Math.max(1, detailCount)),
    seamMismatch: round(seamMismatch),
    lightingGradient: round(lightingGradient),
    aspectRatio: round(aspectRatio),
    megapixels: round(megapixels),
    downsampleRatio: round(downsampleRatio),
    gridLikelihood: round(gridLikelihood)
  };
}

function classifyMaterial(
  fileName: string,
  metrics: TextureMetrics
): {
  material: MaterialKind;
  confidence: number;
  reasoning: string[];
} {
  const name = fileName.toLowerCase();
  const keywordMap: Array<[MaterialKind, string[]]> = [
    ["brick", ["brick", "masonry"]],
    ["wood", ["wood", "plank", "timber"]],
    ["concrete", ["concrete", "cement"]],
    ["fabric", ["fabric", "textile", "cloth", "weave"]],
    ["rust", ["rust", "corrosion"]],
    ["tile", ["tile", "floor", "paving"]],
    ["rock", ["rock", "stone"]]
  ];

  for (const [material, keywords] of keywordMap) {
    const hit = keywords.find((keyword) => name.includes(keyword));
    if (hit) {
      return {
        material,
        confidence: material === "concrete" || material === "rock" ? 0.68 : 0.76,
        reasoning: [`File name contains "${hit}".`, reasonFromMetrics(material, metrics)]
      };
    }
  }

  if (metrics.gridLikelihood > 0.65) {
    return {
      material: "tile",
      confidence: 0.58,
      reasoning: ["Square source with grid-like contrast suggests tile or paving."]
    };
  }

  if (metrics.redDominance > 1.35 && metrics.saturationMean > 0.28) {
    return {
      material: "rust",
      confidence: 0.52,
      reasoning: ["Strong red/orange dominance suggests rust or oxidized metal."]
    };
  }

  if (metrics.detailEnergy > 18 && metrics.saturationMean > 0.18) {
    return {
      material: "fabric",
      confidence: 0.48,
      reasoning: ["High fine detail and saturation suggest fabric or textile."]
    };
  }

  return {
    material: "unknown",
    confidence: 0.34,
    reasoning: ["No strong material cue was detected from the file name or image statistics."]
  };
}

function warningsForMetrics(
  metrics: TextureMetrics,
  material: MaterialKind,
  validation: FileValidationReport
): SubstanceWarning[] {
  const output: SubstanceWarning[] = [];

  if (
    metrics.megapixels > 8 ||
    validation.byteLength > 8 * 1024 * 1024 ||
    metrics.downsampleRatio > 1.5
  ) {
    output.push(
      warning(
        "huge-source",
        "Large source downsampled",
        "The source is larger than the working texture budget.",
        "Downsampling keeps the browser responsive but may remove fine surface information.",
        "Use a tighter crop or increase output size if the preview looks too soft.",
        0.06
      )
    );
  }

  if (Math.abs(metrics.aspectRatio - 1) > 0.05) {
    output.push(
      warning(
        "non-square-output",
        "Non-square texture",
        "The generated maps keep the source aspect ratio instead of forcing a square.",
        "Many game material workflows prefer square or power-of-two textures.",
        "Crop to a square source or export as-is if your target engine accepts this aspect ratio.",
        0.03,
        "info"
      )
    );
  }

  if (metrics.lightingGradient > 38) {
    output.push(
      warning(
        "lighting-gradient",
        "Lighting baked into source",
        "The photo has a broad brightness ramp.",
        "Luminance-based height can turn lighting into fake geometry.",
        "Treat height and normal maps as low confidence unless you remove the lighting gradient first.",
        0.18,
        "danger"
      )
    );
  }

  if (metrics.seamMismatch > 34) {
    output.push(
      warning(
        "seam-risk",
        "Visible seam risk",
        "Opposite edges differ enough that tiling may show a seam.",
        "The source edges do not match naturally.",
        "Use tile blending carefully and inspect the material preview before export.",
        0.1
      )
    );
  }

  if (material === "rock") {
    output.push(
      warning(
        "scene-scale-risk",
        "Large forms detected",
        "This looks like a photographed rocky surface with large scene geometry.",
        "A local normal map can confuse object shape with material relief.",
        "Use this as an albedo source or crop a flatter, more uniform patch.",
        0.16,
        "danger"
      )
    );
  }

  if (material === "fabric" || metrics.detailEnergy > 22) {
    output.push(
      warning(
        "fine-detail-risk",
        "Fine detail may soften",
        "This source contains fine texture information.",
        "Downsampling and blur can reduce weave or micro-surface detail.",
        "Inspect the normal map and raise detail only if the preview still looks too flat.",
        0.08
      )
    );
  }

  if ((material === "rust" || metrics.saturationMean > 0.32) && metrics.redDominance > 1.15) {
    output.push(
      warning(
        "chroma-height-risk",
        "Color may become fake height",
        "Strong color variation is present.",
        "Rust, paint, and pigment changes are not always physical height changes.",
        "Trust albedo more than height/normal unless the preview confirms real relief.",
        0.15,
        "danger"
      )
    );
  }

  if (material === "tile" || metrics.gridLikelihood > 0.65) {
    output.push(
      warning(
        "grid-detected",
        "Tile grid detected",
        "The source appears to contain a repeated tile or grout structure.",
        "Grid lines may need different treatment than surface speckle.",
        "Inspect height and normal maps around grout lines before exporting.",
        0.08,
        "info"
      )
    );
  }

  if (metrics.luminanceStdDev < 7) {
    output.push(
      warning(
        "low-detail-flat",
        "Very flat source",
        "The source has little measurable brightness variation.",
        "There may not be enough surface signal for reliable height or normal maps.",
        "Use the albedo map or choose a source photo with more visible surface relief.",
        0.18
      )
    );
  }

  return output;
}

function recommendSettings(
  current: TextureSettings,
  userOwnedSettings: SettingKey[],
  material: MaterialKind,
  metrics: TextureMetrics
): TextureSettings {
  const recommended: TextureSettings = { ...current };
  const set = <K extends keyof TextureSettings>(key: K, value: TextureSettings[K]) => {
    if (!userOwnedSettings.includes(key)) {
      recommended[key] = value;
    }
  };

  set("tileStrength", metrics.seamMismatch > 34 ? 0.55 : defaultSettings.tileStrength);
  set("heightContrast", metrics.lightingGradient > 38 ? 0.9 : material === "fabric" ? 1.45 : 1.2);
  set("detailStrength", material === "fabric" ? 0.85 : material === "rust" ? 0.35 : 0.5);
  set("normalStrength", material === "fabric" ? 10 : material === "rock" ? 4.5 : 7);

  return recommended;
}

function mapConfidenceFor(
  warnings: SubstanceWarning[],
  sourceConfidence: number
): Record<MapKind, number> {
  const confidence: Record<MapKind, number> = {
    albedo: sourceConfidence,
    height: sourceConfidence - 0.04,
    normal: sourceConfidence - 0.04,
    roughness: sourceConfidence - 0.03,
    ao: sourceConfidence - 0.08
  };

  for (const item of warnings) {
    if (
      ["lighting-gradient", "chroma-height-risk", "scene-scale-risk", "low-detail-flat"].includes(
        item.id
      )
    ) {
      confidence.height -= item.confidenceImpact;
      confidence.normal -= item.confidenceImpact;
      confidence.ao -= item.confidenceImpact / 2;
    }

    if (item.id === "fine-detail-risk") {
      confidence.normal -= item.confidenceImpact / 2;
      confidence.roughness -= item.confidenceImpact / 2;
    }
  }

  return {
    albedo: round(clamp(confidence.albedo, 0.05, 0.98)),
    height: round(clamp(confidence.height, 0.05, 0.98)),
    normal: round(clamp(confidence.normal, 0.05, 0.98)),
    roughness: round(clamp(confidence.roughness, 0.05, 0.98)),
    ao: round(clamp(confidence.ao, 0.05, 0.98))
  };
}

function computeSeamMismatch(source: ImageData): number {
  let total = 0;
  let count = 0;
  const stepY = Math.max(1, Math.floor(source.height / 128));
  const stepX = Math.max(1, Math.floor(source.width / 128));

  for (let y = 0; y < source.height; y += stepY) {
    total += Math.abs(lumaAt(source, 0, y) - lumaAt(source, source.width - 1, y));
    count += 1;
  }

  for (let x = 0; x < source.width; x += stepX) {
    total += Math.abs(lumaAt(source, x, 0) - lumaAt(source, x, source.height - 1));
    count += 1;
  }

  return total / Math.max(1, count);
}

function gridLikelihoodFor(source: ImageData, seamMismatch: number): number {
  const squareScore = 1 - Math.min(1, Math.abs(source.width / Math.max(1, source.height) - 1));
  const centerVertical = lineContrast(source, Math.floor(source.width / 2), "vertical");
  const centerHorizontal = lineContrast(source, Math.floor(source.height / 2), "horizontal");
  const lineScore = clamp((centerVertical + centerHorizontal) / 90, 0, 1);
  const seamScore = seamMismatch < 22 ? 0.3 : 0;
  return clamp(squareScore * 0.45 + lineScore * 0.45 + seamScore, 0, 1);
}

function lineContrast(
  source: ImageData,
  position: number,
  axis: "vertical" | "horizontal"
): number {
  const samples = axis === "vertical" ? source.height : source.width;
  const limit = axis === "vertical" ? source.width : source.height;
  const before = clamp(position - 2, 0, limit - 1);
  const after = clamp(position + 2, 0, limit - 1);
  let total = 0;

  for (let i = 0; i < samples; i += Math.max(1, Math.floor(samples / 128))) {
    const a = axis === "vertical" ? lumaAt(source, before, i) : lumaAt(source, i, before);
    const b = axis === "vertical" ? lumaAt(source, after, i) : lumaAt(source, i, after);
    total += Math.abs(a - b);
  }

  return total / Math.max(1, samples / Math.max(1, Math.floor(samples / 128)));
}

function lumaAt(source: ImageData, x: number, y: number): number {
  const safeX = clamp(Math.round(x), 0, source.width - 1);
  const safeY = clamp(Math.round(y), 0, source.height - 1);
  const offset = (safeY * source.width + safeX) * 4;
  return luminance(
    source.data[offset] ?? 0,
    source.data[offset + 1] ?? 0,
    source.data[offset + 2] ?? 0
  );
}

function dedupeWarnings(warnings: SubstanceWarning[]): SubstanceWarning[] {
  return Array.from(new Map(warnings.map((item) => [item.id, item])).values());
}

function reasonFromMetrics(material: MaterialKind, metrics: TextureMetrics): string {
  if (material === "tile" && metrics.gridLikelihood > 0.5) {
    return "Grid-like contrast supports the tile classification.";
  }

  if (material === "rust" && metrics.redDominance > 1.15) {
    return "Red/orange channel dominance supports the rust classification.";
  }

  if (material === "fabric" && metrics.detailEnergy > 10) {
    return "Fine local detail supports the fabric classification.";
  }

  return "Image statistics were recorded for confidence and warnings.";
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
