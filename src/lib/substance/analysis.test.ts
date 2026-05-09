import { describe, expect, it } from "vitest";
import { defaultSettings, type SourceContext } from "@/features/sampler/types";
import { fingerprintImageData } from "@/lib/hash/fingerprint";
import { analyzeTextureSource } from "./analysis";

describe("analyzeTextureSource", () => {
  it("uses source cues and metrics to classify material", () => {
    const image = gradientImage(64, 48);
    const analysis = analyzeTextureSource(
      image,
      defaultSettings,
      contextFor(image, "brick_wall.jpg")
    );

    expect(analysis.material).toBe("brick");
    expect(analysis.materialConfidence).toBeGreaterThan(0.5);
    expect(analysis.warnings.map((warning) => warning.id)).toContain("non-square-output");
  });

  it("lowers map confidence when chroma can masquerade as height", () => {
    const image = redPatchImage(64, 64);
    const analysis = analyzeTextureSource(
      image,
      defaultSettings,
      contextFor(image, "red_rust.jpg")
    );

    expect(analysis.material).toBe("rust");
    expect(analysis.warnings.map((warning) => warning.id)).toContain("chroma-height-risk");
    expect(analysis.mapConfidence.height).toBeLessThan(analysis.mapConfidence.albedo);
  });
});

function contextFor(image: ImageData, fileName: string): SourceContext {
  const fingerprint = fingerprintImageData(image);
  return {
    fileName,
    originalWidth: image.width,
    originalHeight: image.height,
    normalizedWidth: image.width,
    normalizedHeight: image.height,
    sourceFingerprint: fingerprint,
    validation: {
      fileName,
      extension: "jpg",
      mimeType: "image/jpeg",
      detectedFormat: "jpeg",
      byteLength: image.data.byteLength,
      sourceFingerprint: fingerprint,
      warnings: []
    },
    userOwnedSettings: []
  };
}

function gradientImage(width: number, height: number): ImageData {
  const image = new ImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      image.data[offset] = 80 + x;
      image.data[offset + 1] = 60 + y;
      image.data[offset + 2] = 48;
      image.data[offset + 3] = 255;
    }
  }
  return image;
}

function redPatchImage(width: number, height: number): ImageData {
  const image = new ImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      image.data[offset] = 180 + ((x + y) % 40);
      image.data[offset + 1] = 42;
      image.data[offset + 2] = 24;
      image.data[offset + 3] = 255;
    }
  }
  return image;
}
