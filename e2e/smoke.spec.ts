import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expectMapsReady, readMapPixel, uploadSample } from "./helpers";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
const expectedVersion = new RegExp(`v${escapeRegExp(packageJson.version)}`);

const viewports = [
  { name: "desktop", width: 1440, height: 960 },
  { name: "mobile", width: 390, height: 844 }
];

for (const viewport of viewports) {
  test(`happy path on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/substance-sampler/");

    await expect(page.getByRole("heading", { name: "Substance Sampler" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Star on GitHub/i })).toHaveAttribute(
      "href",
      "https://github.com/baditaflorin/substance-sampler"
    );
    await expect(page.getByRole("link", { name: /PayPal/i })).toHaveAttribute(
      "href",
      "https://www.paypal.com/paypalme/florinbadita"
    );
    await expect(page.getByText(expectedVersion)).toBeVisible();
    await expect(page.getByText(/commit /)).toBeVisible();

    await uploadSample(page);
    await expectMapsReady(page);
    await expect(page.getByRole("button", { name: /Download ZIP/i })).toBeEnabled();

    const albedoPixel = await readMapPixel(page, "Albedo texture map");
    expect(albedoPixel[3]).toBe(255);
    expect(albedoPixel[0] + albedoPixel[1] + albedoPixel[2]).toBeGreaterThan(24);

    const preview = page.getByTestId("three-preview").locator("canvas");
    await expect(preview).toBeVisible({ timeout: 15_000 });
    await expect
      .poll(async () =>
        preview.evaluate((canvas) => {
          if (!(canvas instanceof HTMLCanvasElement)) {
            return 0;
          }

          return canvas.toDataURL("image/png").length;
        })
      )
      .toBeGreaterThan(1200);
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
