import { describe, expect, it } from "vitest";
import { validateImageFile } from "./fileValidation";

const jpegStart = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]);
const jpegEnd = new Uint8Array([0xff, 0xd9]);

describe("validateImageFile", () => {
  it("rejects empty files before decode", async () => {
    const result = await validateImageFile(new File([], "empty.jpg", { type: "image/jpeg" }));

    expect(result.error?.code).toBe("empty-file");
    expect(result.report?.byteLength).toBe(0);
  });

  it("detects truncated JPEGs", async () => {
    const result = await validateImageFile(
      new File([jpegStart], "partial.jpg", { type: "image/jpeg" })
    );

    expect(result.error?.code).toBe("truncated-jpeg");
    expect(result.report?.detectedFormat).toBe("jpeg");
  });

  it("warns when extension or MIME disagree with the byte signature", async () => {
    const bytes = new Uint8Array([...jpegStart, 1, 2, 3, ...jpegEnd]);
    const result = await validateImageFile(new File([bytes], "wood.png", { type: "image/png" }));

    expect(result.error).toBeNull();
    expect(result.report?.detectedFormat).toBe("jpeg");
    expect(result.report?.warnings.map((warning) => warning.id)).toContain("format-mismatch");
  });
});
