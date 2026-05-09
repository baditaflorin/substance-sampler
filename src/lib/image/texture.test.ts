import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/features/sampler/types";
import {
  ambientOcclusionFromHeight,
  makeTileable,
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
      "height",
      "ao"
    ]);
    expect(result.report.accelerator).toBe("cpu");
    expect(result.report.outputWidth).toBe(8);
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
