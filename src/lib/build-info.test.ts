import { describe, expect, it } from "vitest";
import { fallbackBuildInfo } from "./build-info";

describe("build info", () => {
  it("contains public project links", () => {
    expect(fallbackBuildInfo.repoUrl).toBe("https://github.com/baditaflorin/substance-sampler");
    expect(fallbackBuildInfo.paypalUrl).toBe("https://www.paypal.com/paypalme/florinbadita");
    expect(fallbackBuildInfo.version).toMatch(/^\d+\.\d+\.\d+/);
  });
});
