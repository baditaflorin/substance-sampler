import { expect, test, type Page } from "@playwright/test";
import { expectMapsReady, samplePng } from "./helpers";

test("loads sample, copies metadata, exports state, imports state, and starts fresh", async ({
  context,
  page
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/substance-sampler/");

  await page.getByRole("button", { name: /Load sample/i }).click();
  await expectMapsReady(page);

  await page.getByRole("button", { name: /Copy metadata/i }).click();
  await expect(page.getByText("Metadata copied")).toBeVisible();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Save project/i }).click();
  const projectDownload = await download;
  const projectPath = await projectDownload.path();
  expect(projectPath).toBeTruthy();

  await page.getByRole("button", { name: /Start fresh/i }).click();
  await expect(page.getByText(/No photo loaded/)).toBeVisible();

  await page.getByTestId("project-import-input").setInputFiles(projectPath ?? "");
  await expectMapsReady(page);
  await expect(page.getByText(/Imported sample-tile.png/)).toBeVisible();
});

test("loads pasted image and CORS-readable URL image", async ({ page }) => {
  await page.route("https://texture.test/source.png", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      headers: { "access-control-allow-origin": "*" },
      body: samplePng
    })
  );
  await page.goto("/substance-sampler/");

  await page.evaluate(async (bytes) => {
    const file = new File([new Uint8Array(bytes)], "pasted.png", { type: "image/png" });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    window.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dataTransfer }));
  }, Array.from(samplePng));
  await expectMapsReady(page);
  await expect(page.locator(".topbar p")).toContainText("pasted.png");

  await page.getByLabel("Image URL").fill("https://texture.test/source.png");
  await page.getByRole("button", { name: /Load URL/i }).click();
  await expectMapsReady(page);
  await expect(page.locator(".topbar p")).toContainText("source.png");
});

test("handles multi-file partial success and persists settings before regenerate", async ({
  page
}) => {
  await page.goto("/substance-sampler/");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles([
      { name: "valid.png", mimeType: "image/png", buffer: samplePng },
      { name: "empty.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(0) }
    ]);

  await expect(page.locator('[data-batch-status="ready"]')).toContainText("valid.png");
  await expect(page.locator('[data-batch-status="error"]')).toContainText("empty.jpg");

  await setRangeValue(page, "Size", "512");
  await expect(page.getByLabel("Size")).toHaveValue("512");
  await page.reload();
  await expect(page.getByLabel("Size")).toHaveValue("512");
});

test("applies settings share links", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/substance-sampler/");
  await setRangeValue(page, "Size", "512");
  await page.getByRole("button", { name: /^plane$/i }).click();
  await page.getByRole("button", { name: /Copy settings link/i }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());

  const other = await context.newPage();
  await other.goto(url);
  await expect(other.getByLabel("Size")).toHaveValue("512");
  await expect(other.getByRole("button", { name: /^plane$/i })).toHaveClass(/active/);
});

test("shows honest URL errors", async ({ page }) => {
  await page.goto("/substance-sampler/");
  await page.getByLabel("Image URL").fill("notaurl");
  await page.getByRole("button", { name: /Load URL/i }).click();
  await expect(page.getByTestId("error-code")).toHaveAttribute("data-error-code", "url-invalid");
});

async function setRangeValue(page: Page, label: string, value: string) {
  await page.getByLabel(label).evaluate((input, nextValue) => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}
