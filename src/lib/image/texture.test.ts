import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/features/sampler/types";
import {
  ambientOcclusionFromHeight,
  makeTileable,
  metallicFromAnalysis,
  normalFromHeight,
  processTexture,
  roughnessFromHeight
} from "./texture";

function sampleImage(width = 4, height = 4): ImageData {
  const image = new ImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      image.data[offset] = x * 48;
      image.data[offset + 1] = y * 48;
      image.data[offset + 2] = 128;
      image.data[offset + 3] = 255;
    }
  }

  return image;
}

describe("texture generation", () => {
  it("keeps tileable output dimensions and alpha", () => {
    const result = makeTileable(sampleImage(), 0.5);

    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
    expect(result.data[3]).toBe(255);
  });

  it("creates neutral normals from a flat height field", () => {
    const normal = normalFromHeight(new Uint8ClampedArray(16).fill(128), 4, 4, 8);

    expect(normal.data[0]).toBe(128);
    expect(normal.data[1]).toBe(128);
    expect(normal.data[2]).toBe(255);
  });

  it("creates grayscale roughness and ambient occlusion maps", () => {
    const values = new Uint8ClampedArray(Array.from({ length: 16 }, (_, index) => index * 12));
    const roughness = roughnessFromHeight(values, 4, 4, 0.5, 0.4);
    const ao = ambientOcclusionFromHeight(values, 4, 4);

    expect(roughness.width).toBe(4);
    expect(ao.height).toBe(4);
    expect(roughness.data[0]).toBe(roughness.data[1]);
    expect(ao.data[0]).toBe(ao.data[2]);
  });

  it("processes a source image into the expected map set", async () => {
    const result = await processTexture(sampleImage(8, 8), {
      ...defaultSettings,
      preferWebGpu: false,
      outputSize: 8
    });

    expect(result.maps.map((map) => map.kind)).toEqual([
      "albedo",
      "normal",
      "roughness",
      "metallic",
      "height",
      "ao"
    ]);
    expect(result.report.accelerator).toBe("cpu");
    expect(result.report.outputWidth).toBe(8);
  });

  it("emits a zero metallic map for dielectric materials regardless of bias", () => {
    const grayscale = new ImageData(4, 4);
    for (let i = 0; i < grayscale.data.length; i += 4) {
      grayscale.data[i] = 200;
      grayscale.data[i + 1] = 200;
      grayscale.data[i + 2] = 200;
      grayscale.data[i + 3] = 255;
    }
    const metallic = metallicFromAnalysis(grayscale, "wood", 0.9);
    for (let i = 0; i < metallic.data.length; i += 4) {
      expect(metallic.data[i]).toBe(0);
      expect(metallic.data[i + 1]).toBe(0);
      expect(metallic.data[i + 2]).toBe(0);
      expect(metallic.data[i + 3]).toBe(255);
    }
  });

  it("emits a non-zero metallic map for metal materials and modulates by saturation", () => {
    const image = new ImageData(2, 1);
    // Pixel A: pure gray (saturation 0) — should map to a high metallic value.
    image.data.set([200, 200, 200, 255], 0);
    // Pixel B: bright red (high saturation) — should map to a lower metallic value.
    image.data.set([220, 30, 30, 255], 4);
    const metallic = metallicFromAnalysis(image, "metal", 0.85);
    expect(metallic.data[0]).toBeGreaterThan(metallic.data[4]);
    expect(metallic.data[0]).toBeGreaterThan(120);
  });

  it("emits a partial metallic map for rust to reflect its mixed conductor / oxide nature", () => {
    const image = new ImageData(1, 1);
    image.data.set([180, 80, 30, 255], 0);
    const metallic = metallicFromAnalysis(image, "rust", 0.4);
    expect(metallic.data[0]).toBeGreaterThan(0);
    expect(metallic.data[0]).toBeLessThan(180);
  });

  it("keeps map outputs deterministic for identical input and settings", async () => {
    const input = sampleImage(16, 16);
    const settings = {
      ...defaultSettings,
      preferWebGpu: false,
      outputSize: 16
    };

    const first = await processTexture(input, settings);
    const second = await processTexture(input, settings);

    expect(first.maps.map((map) => [map.kind, map.fingerprint])).toEqual(
      second.maps.map((map) => [map.kind, map.fingerprint])
    );
    expect(first.metadata.maps).toEqual(second.metadata.maps);
    expect(first.metadata.generationFingerprint).toEqual(second.metadata.generationFingerprint);
    expect(first.analysis.material).toEqual(second.analysis.material);
    expect(first.analysis.warnings.map((item) => item.id)).toEqual(
      second.analysis.warnings.map((item) => item.id)
    );
  });
});
