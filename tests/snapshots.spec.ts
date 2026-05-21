import { test, expect } from "@playwright/test";

/**
 * Visual regression baselines.
 *
 * Two complementary checks:
 *   1. OG PNG byte-comparison — snapshots the actual bytes returned by
 *      /og/agent/autono. Catches any change in the rendered satori output.
 *      Deterministic because humanizeAgo() in the OG route is pinned to
 *      MOCK_NOW_ISO (not Date.now()).
 *
 *   2. Live-page screenshot — captures the rendered AgentCard inside the
 *      main column. Animations disabled so the typewriter status-bar and
 *      LIVE-dot pulse don't churn the baseline.
 *
 * Update baselines with:
 *   pnpm exec playwright test snapshots.spec.ts --update-snapshots
 */
test.describe("visual snapshots", () => {
  test("og/agent/autono — PNG byte-comparison", async ({ request }) => {
    const res = await request.get("/og/agent/autono");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
    const body = await res.body();
    expect(body).toMatchSnapshot("og-agent-autono.png");
  });

  test("agent/autono — live page screenshot of the AgentCard region", async ({ page }) => {
    await page.goto("/agent/autono");
    // Wait for typewriter + any client-side hydration to settle.
    await page.waitForTimeout(600);
    // Screenshot the main column (skips the sticky status bar + footer)
    const main = page.locator("main");
    await expect(main).toHaveScreenshot("agent-autono-live.png", {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });
});
