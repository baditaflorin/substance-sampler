import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/features/sampler/types";
import {
  createProjectState,
  decodeShareState,
  encodeShareState,
  parseProjectStateText,
  parseTextureSettings,
  projectStateToFile
} from "./state";

describe("project state", () => {
  it("validates partial stored settings with defaults", () => {
    const parsed = parseTextureSettings({ outputSize: 512, preferWebGpu: false });

    expect(parsed).toEqual({ ...defaultSettings, outputSize: 512, preferWebGpu: false });
  });

  it("round-trips a project state file", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "sample.png", { type: "image/png" });
    const state = await createProjectState(file, defaultSettings, "box", ["outputSize"]);
    const parsed = parseProjectStateText(JSON.stringify(state));
    const restored = await projectStateToFile(parsed);

    expect(parsed.schemaVersion).toBe("substance-sampler-project-v1");
    expect(restored.name).toBe("sample.png");
    expect(restored.type).toBe("image/png");
  });

  it("round-trips settings share links", () => {
    const hash = encodeShareState({ ...defaultSettings, outputSize: 512 }, "plane");
    const parsed = decodeShareState(`#${hash}`);

    expect(parsed?.settings.outputSize).toBe(512);
    expect(parsed?.geometry).toBe("plane");
  });
});
