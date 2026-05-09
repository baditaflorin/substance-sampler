import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

interface FixtureExpectation {
  id: string;
  shouldLoad: boolean;
  expectedMaterial?: string;
  minMaterialConfidence?: number;
  expectedError?: string;
  requiredWarnings: string[];
}

const fixtureDir = "test/fixtures/realdata";
const expectations = readdirSync(fixtureDir)
  .filter((file) => file.endsWith(".expected.json"))
  .map((file) => {
    const expected = JSON.parse(readFileSync(join(fixtureDir, file), "utf8")) as FixtureExpectation;
    const imageFile = file.replace(".expected.json", imageExtensionFor(file));
    return {
      expected,
      imagePath: join(fixtureDir, imageFile),
      imageFile
    };
  });

for (const { expected, imagePath, imageFile } of expectations) {
  test(`real fixture ${expected.id} ${imageFile}`, async ({ page }) => {
    await page.goto("/substance-sampler/");
    await upload(page, imagePath);

    if (!expected.shouldLoad) {
      await expect(page.getByTestId("error-code")).toHaveAttribute(
        "data-error-code",
        expected.expectedError ?? ""
      );
      return;
    }

    await expect(page.getByText(/Maps ready:/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("material-kind")).toHaveText(expected.expectedMaterial ?? "");

    for (const warningId of expected.requiredWarnings) {
      await expect(page.locator(`[data-warning-id="${warningId}"]`)).toBeVisible();
    }
  });
}

async function upload(page: Page, imagePath: string) {
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: basename(imagePath),
      mimeType: mimeFor(imagePath),
      buffer: readFileSync(imagePath)
    });
}

function imageExtensionFor(expectationFile: string): string {
  if (expectationFile.includes("mislabeled")) {
    return ".png";
  }

  return ".jpg";
}

function mimeFor(path: string): string {
  if (path.endsWith(".png")) {
    return "image/png";
  }

  return "image/jpeg";
}
