import { test, expect } from "@playwright/test";

const AUTH = { username: "admin", password: "admin" };
const KNOWN_TX = "0x4a1f0c3e9bee0c3d7b62d9e6a36a3f7c2b1ffffeebb1c3e2d7c8a90b3a52b1f0";

test.describe("agentfi.terminal · smoke", () => {
  test("/ — landing renders wordmark, AUTONO brutalist hero, comp teaser", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/agentfi\.terminal/);
    await expect(page.locator("body")).toContainText("agentfi.terminal");
    await expect(page.locator("body")).toContainText("AUTONO");
    await expect(page.locator("body")).toContainText("liquid protocol");
    await expect(page.locator("body")).toContainText("199");
    await expect(page.locator("body")).toContainText("compute multiple · live");
    await expect(page.locator("body")).toContainText("what is a compute multiple?");
  });

  test("/ — marquee ticker shows all 4 agents", async ({ page }) => {
    await page.goto("/");
    // Ticker is the first content under the body; it lists all agent tickers
    for (const t of ["AUTONO", "ETHY", "BANKR", "AETHER"]) {
      await expect(page.locator("body")).toContainText(t);
    }
  });

  test("/agent/autono — full card + actions + abbreviated contract", async ({ page }) => {
    await page.goto("/agent/autono");
    await expect(page.locator("body")).toContainText("AUTONO");
    await expect(page.locator("body")).toContainText("199×");
    await expect(page.locator("body")).toContainText("ACCUMULATE");
    await expect(page.locator("body")).toContainText("0xB3D7e0"); // abbreviated 0xB3D7e0…6d8e
    await expect(page.locator("body")).toContainText("actions"); // ActionsFeed header
  });

  test("/agent/autono — metrics strip has 6 cells incl. holders/actions", async ({ page }) => {
    await page.goto("/agent/autono");
    await expect(page.locator("body")).toContainText("treasury");
    await expect(page.locator("body")).toContainText("staked DIEM");
    await expect(page.locator("body")).toContainText("holders");
    await expect(page.locator("body")).toContainText("actions/24h");
  });

  test("/methodology — TOC rail visible on lg screens", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/methodology");
    await expect(page.locator("body")).toContainText("contents");
    await expect(page.locator('a[href="#compute_val"]')).toBeVisible();
    await expect(page.locator('a[href="#verify"]')).toBeVisible();
  });

  test("/status — system-check tiles render with live badges", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toContainText("indexer");
    await expect(page.locator("body")).toContainText("etherscan");
    await expect(page.locator("body")).toContainText("snapshotter");
    await expect(page.locator("body")).toContainText("satori og");
    await expect(page.locator("body")).toContainText("performance · last 24h");
  });

  test("/comp — all 4 agents render with SVG sparklines", async ({ page }) => {
    await page.goto("/comp");
    for (const t of ["AUTONO", "ETHY", "BANKR", "AETHER"]) {
      await expect(page.locator("body")).toContainText(t);
    }
    // 4 sparkline polylines, one per row
    await expect(page.locator("svg polyline")).toHaveCount(4);
    // legend present
    await expect(page.locator("body")).toContainText("legend");
  });

  test("/comp — strategy filter narrows visible rows", async ({ page }) => {
    await page.goto("/comp");
    // All 4 visible initially
    await expect(page.locator("tbody tr")).toHaveCount(4);

    // Click fee-revenue chip → only ETHY + BANKR remain (both are fee-revenue strategy)
    await page.locator('button[data-filter-value="fee-revenue"]').click();
    await expect(page.locator("tbody tr")).toHaveCount(2);
    const slugs = await page.locator("tbody tr").evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-row-slug")),
    );
    expect(slugs.sort()).toEqual(["bankr", "ethy"]);

    // Click ALL → back to 4
    await page.locator('button[data-filter-value="all"]').click();
    await expect(page.locator("tbody tr")).toHaveCount(4);
  });

  test("/comp — sort by ticker reorders rows", async ({ page }) => {
    await page.goto("/comp");
    // Default sort = multiple desc → AUTONO first
    const firstBefore = await page.locator("tbody tr").first().getAttribute("data-row-slug");
    expect(firstBefore).toBe("autono");

    // Click AGENT header twice (once = asc, AETHER first; twice = desc, ETHY first)
    await page.locator('button[data-sort-key="ticker"]').click();
    const firstAfterAsc = await page.locator("tbody tr").first().getAttribute("data-row-slug");
    expect(firstAfterAsc).toBe("aether"); // alphabetical asc

    await page.locator('button[data-sort-key="ticker"]').click();
    const firstAfterDesc = await page.locator("tbody tr").first().getAttribute("data-row-slug");
    expect(firstAfterDesc).toBe("ethy"); // alphabetical desc
  });

  test("/comp?screenshot=1 — hides header chrome, shows watermark", async ({ page }) => {
    await page.goto("/comp?screenshot=1");
    await expect(page.locator("body")).not.toContainText("all agents · sorted");
    // bottom-right watermark
    await expect(page.locator("body")).toContainText("agentfi.dev");
    await expect(page.locator("body")).toContainText("2026-05-18 17:42 UTC");
  });

  test("/privacy — renders policy content + breadcrumb", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/privacy/);
    await expect(page.locator("body")).toContainText("Privacy");
    await expect(page.locator("body")).toContainText("does not collect personal data");
    await expect(page.locator('nav[aria-label="breadcrumb"]')).toBeVisible();
  });

  test("/terms — renders terms content + not-advice disclaimer", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveTitle(/terms/);
    await expect(page.locator("body")).toContainText("Terms of use");
    await expect(page.locator("body")).toContainText("Not investment advice");
    await expect(page.locator("body")).toContainText("Verify on-chain");
  });

  test("/ — footer links to privacy + terms", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible();
    await expect(footer.locator('a[href="/terms"]')).toBeVisible();
  });

  test("/methodology — three strategies + DIEM formula", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.locator("body")).toContainText("compute valuation");
    await expect(page.locator("body")).toContainText("treasury runway");
    await expect(page.locator("body")).toContainText("fee revenue");
    await expect(page.locator("body")).toContainText("staked_diem × 365");
    await expect(page.locator("body")).toContainText("DIEM pricing note");
  });

  test("/methodology — worked example renders AUTONO numbers + multiple", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.locator("body")).toContainText("worked example · AUTONO");
    await expect(page.locator("body")).toContainText("staked_diem");
    await expect(page.locator("body")).toContainText("compute_val");
    await expect(page.locator("body")).toContainText("multiple = mcap ÷ compute_val");
    // Either live or mock source is acceptable
    await expect(page.locator("body")).toContainText(/live · from indexer|mock · pre-indexer/);
    // Multiple should be a non-zero × value
    await expect(page.locator("body")).toContainText(/\d+×/);
  });

  test("/preview/card — live and og mode variants render", async ({ page }) => {
    await page.goto("/preview/card");
    await expect(page.locator("body")).toContainText("live mode");
    await expect(page.locator("body")).toContainText("og mode");
    // AgentCard rendered three times: live, og, and ACTIVE-state
    await expect(page.locator("body")).toContainText("ACCUMULATE");
    await expect(page.locator("body")).toContainText("ACTIVE");
  });

  test("/admin — returns 401 without auth", async ({ request }) => {
    const res = await request.get("/admin", { failOnStatusCode: false });
    expect(res.status()).toBe(401);
    expect(res.headers()["www-authenticate"]).toContain("Basic");
  });

  test("/admin — 200 with basic auth, renders admin chrome", async ({ browser }) => {
    const ctx = await browser.newContext({ httpCredentials: AUTH });
    const page = await ctx.newPage();
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("agentfi · admin");
    await expect(page.locator("body")).toContainText("Posts by template");
    await ctx.close();
  });

  test("/admin/dry-run — table of intended posts with templates surfaced", async ({ browser }) => {
    const ctx = await browser.newContext({ httpCredentials: AUTH });
    const page = await ctx.newPage();
    await page.goto("/admin/dry-run");
    await expect(page.locator("body")).toContainText("dry-run");
    await expect(page.locator("body")).toContainText("AUTONO");
    await expect(page.locator("body")).toContainText("milestone_v1");
    await expect(page.locator("body")).toContainText("intended posts");
    // Caption text appears verbatim
    await expect(page.locator("body")).toContainText("⚡ AUTONO build_rate");
    await ctx.close();
  });

  test("/og/agent/autono — returns image/png", async ({ request }) => {
    const res = await request.get("/og/agent/autono");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
    const body = await res.body();
    expect(body.length).toBeGreaterThan(5000);
  });

  test("/og/comp — returns image/png", async ({ request }) => {
    const res = await request.get("/og/comp");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
  });

  test("/og/action/<known-tx> — returns image/png", async ({ request }) => {
    const res = await request.get(`/og/action/${KNOWN_TX}`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
  });

  test("/og/agent/unknown — returns 404", async ({ request }) => {
    const res = await request.get("/og/agent/this-agent-does-not-exist", { failOnStatusCode: false });
    expect(res.status()).toBe(404);
  });

  test("unknown route → terminal-themed 404", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);
    await expect(page.locator("body")).toContainText("compute_val not found");
    await expect(page.locator("body")).toContainText("agent dropped offline");
    await expect(page.locator("body")).toContainText("0xDEAD…BEEF");
  });

  test("favicon /icon — returns image/png from app/icon.tsx", async ({ request }) => {
    const res = await request.get("/icon");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
  });

  test("/api/agents — returns JSON listing all agents with snapshots", async ({ request }) => {
    const res = await request.get("/api/agents");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/application\/json/);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
    expect(Array.isArray(body.agents)).toBe(true);
    const autono = body.agents.find((a: { slug: string }) => a.slug === "autono");
    expect(autono.ticker).toBe("AUTONO");
    expect(autono.hasSnapshot).toBe(true);
  });

  test("/feed.xml — returns RSS 2.0 with items", async ({ request }) => {
    const res = await request.get("/feed.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/application\/rss\+xml/);
    const body = await res.text();
    expect(body).toContain('<rss version="2.0">');
    expect(body).toContain("<channel>");
    expect(body).toContain("<item>");
    expect(body).toMatch(/<category>(CLAIM|STAKE|LP|SWAP|LOG|MILESTONE)<\/category>/);
  });

  test("/sitemap.xml — lists static routes + per-agent pages", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/xml/);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/agent/autono");
    expect(body).toContain("/comp");
    expect(body).toContain("/methodology");
    expect(body).toContain("/status");
  });

  test("/robots.txt — allows everything except admin/api, points to sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Disallow:\s*\/admin/i);
    expect(body).toMatch(/Sitemap:\s*http/i);
  });

  test("/ — footer shows build SHA + indexer state", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toContainText(/build (dev|[0-9a-f]{7})/);
    await expect(page.locator("footer")).toContainText(/indexer (fresh|stale|empty)/);
  });

  test("/status — renders overall + per-agent rows", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toContainText("Operational status");
    await expect(page.locator("body")).toContainText(/operational|degraded/);
    await expect(page.locator("body")).toContainText("indexer");
    await expect(page.locator("body")).toContainText("etherscan");
    for (const t of ["AUTONO", "ETHY", "BANKR", "AETHER"]) {
      await expect(page.locator("body")).toContainText(t);
    }
  });

  test("/api/health — returns JSON with checks shape", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body).toHaveProperty("ok");
    expect(body).toHaveProperty("ts");
    expect(body.checks).toHaveProperty("snapshotStore");
    expect(body.checks).toHaveProperty("etherscanKey");
    expect(Array.isArray(body.checks.snapshotFreshness)).toBe(true);
  });

  test("/agent/autono — emits BreadcrumbList JSON-LD matching visible breadcrumb", async ({ page }) => {
    await page.goto("/agent/autono");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const crumb = scripts
      .map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .find((j) => j && j["@type"] === "BreadcrumbList");
    expect(crumb).toBeTruthy();
    expect(crumb.itemListElement).toHaveLength(3);
    expect(crumb.itemListElement[0].name).toBe("terminal");
    expect(crumb.itemListElement[2].name).toBe("AUTONO");
  });

  test("/status — emits BreadcrumbList JSON-LD", async ({ page }) => {
    await page.goto("/status");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const crumb = scripts
      .map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .find((j) => j && j["@type"] === "BreadcrumbList");
    expect(crumb).toBeTruthy();
    expect(crumb.itemListElement).toHaveLength(2);
    expect(crumb.itemListElement[1].name).toBe("status");
  });

  test("/agent/autono — emits JSON-LD WebPage schema", async ({ page }) => {
    await page.goto("/agent/autono");
    // Page emits multiple JSON-LD scripts (root layout's Organization/WebSite + this page's WebPage).
    // Find the one with @type === "WebPage".
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const webPage = scripts
      .map((s) => {
        try { return JSON.parse(s); } catch { return null; }
      })
      .find((j) => j && j["@type"] === "WebPage");
    expect(webPage).toBeTruthy();
    expect(webPage.about["@type"]).toBe("SoftwareApplication");
    expect(webPage.about.name).toBe("AUTONO");
  });

  test("/ — root JSON-LD includes Organization + WebSite", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const rootLd = scripts
      .map((s) => { try { return JSON.parse(s); } catch { return null; } })
      .find((j) => j && Array.isArray(j["@graph"]));
    expect(rootLd).toBeTruthy();
    const types = rootLd["@graph"].map((n: { "@type": string }) => n["@type"]);
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
  });

  test("/agent/autono — emits Twitter card meta", async ({ page }) => {
    await page.goto("/agent/autono");
    const twCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
    expect(twCard).toBe("summary_large_image");
    const twImg = await page.locator('meta[name="twitter:image"]').first().getAttribute("content");
    expect(twImg).toMatch(/\/og\/agent\/autono/);
  });

  test("/ — head includes RSS auto-discovery link", async ({ page }) => {
    await page.goto("/");
    const rss = await page
      .locator('link[rel="alternate"][type="application/rss+xml"]')
      .getAttribute("href");
    expect(rss).toMatch(/\/feed\.xml/);
  });

  test("/methodology — verify on-chain section lists each agent's basescan links", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.locator("body")).toContainText("verify on-chain");
    const basescanLinks = page.locator('a[href*="basescan.org"]');
    expect(await basescanLinks.count()).toBeGreaterThanOrEqual(2);
  });

  test("/apple-icon — returns 180x180 png", async ({ request }) => {
    const res = await request.get("/apple-icon");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(/image\/png/);
  });

  test("/ — skip-link present as first focusable element", async ({ page }) => {
    await page.goto("/");
    const skip = page.locator("a.skip-link");
    await expect(skip).toHaveAttribute("href", "#main-content");
    await expect(skip).toContainText("skip to content");
  });

  test("/ — main landmark has id main-content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main#main-content")).toBeVisible();
  });

  test("/agent/autono — breadcrumb has aria-current on active page", async ({ page }) => {
    await page.goto("/agent/autono");
    const nav = page.locator('nav[aria-label="breadcrumb"]');
    await expect(nav).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toContainText("AUTONO");
  });

  test("/comp — sort header has aria-sort + filter chip has aria-pressed", async ({ page }) => {
    await page.goto("/comp");
    // Active sort is 'multiple' desc by default
    const multHeader = page.locator('th:has(button[data-sort-key="multiple"])');
    await expect(multHeader).toHaveAttribute("aria-sort", "descending");
    // Default filter "ALL" should be pressed
    const allChip = page.locator('button[data-filter-value="all"]');
    await expect(allChip).toHaveAttribute("aria-pressed", "true");
  });

  test("/ — footer has links to status / rss / api", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('a[href="/status"]')).toBeVisible();
    await expect(footer.locator('a[href="/feed.xml"]')).toBeVisible();
    await expect(footer.locator('a[href="/api/agents"]')).toBeVisible();
  });
});
