import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 2),
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  reporter: [["list"]]
});
