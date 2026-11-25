// practices/qa-e2e.md — role selectors, no sleeps, own data, traces on failure.
import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? "50%" : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: isCI ? [["blob"], ["github"], ["json", { outputFile: "e2e-results.json" }]] : [["html"], ["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    testIdAttribute: "data-testid",
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ }, // logs in per role and stores auth state
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, dependencies: ["setup"] },
    { name: "mobile", use: { ...devices["Pixel 7"] }, dependencies: ["setup"], grep: /@critical/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "pnpm start", url: "http://localhost:3000", reuseExistingServer: !isCI, timeout: 120_000 },
});
