import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Single worker: the OG / ImageResponse routes each take ~1-2s of single-
  // threaded satori work; multiple workers racing the same Next process cause
  // "socket hang up" on the slower OG renders. Whole suite runs in ~10-15s
  // sequentially which is plenty fast for a smoke run.
  fullyParallel: false,
  workers: 1,
  reporter: [["line"]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: "off",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "pnpm start",
    url: BASE_URL,
    timeout: 60_000,
    reuseExistingServer: true,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      // Pin the constitution snippet so OG byte-snapshots don't drift if the
      // upstream README changes. Live page still hits the real URL outside tests.
      PIN_CONSTITUTION_SNIPPET: "Accumulate compute until 0.5 DIEM/day; then build.",
    },
  },
});
