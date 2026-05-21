import { describe, it, expect, beforeEach } from "vitest";
import { _resetRateLimitBuckets } from "../rate-limit";

function freshReq() {
  // Each test gets a unique IP so rate-limit buckets don't bleed across tests
  return new Request("http://localhost/api/agents", {
    headers: { "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250 + 1)}` },
  });
}

describe("/api/agents", () => {
  beforeEach(() => _resetRateLimitBuckets());

  it("returns ts + count + agents array", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const res = await GET(freshReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.ts).toBe("string");
    expect(body.count).toBeGreaterThan(0);
    expect(Array.isArray(body.agents)).toBe(true);
  });

  it("each agent entry carries the stable surface", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const res = await GET(freshReq());
    const body = await res.json();
    for (const a of body.agents) {
      expect(a).toHaveProperty("slug");
      expect(a).toHaveProperty("ticker");
      expect(a).toHaveProperty("strategy");
      expect(a).toHaveProperty("token");
      expect(a).toHaveProperty("wallet");
      expect(a).toHaveProperty("hasSnapshot");
      expect(a).toHaveProperty("metric");
      expect(a).toHaveProperty("multiple");
      expect(a).toHaveProperty("delta7dPct");
      expect(a).toHaveProperty("multiple7d");
      expect(a).toHaveProperty("recentActions");
    }
  });

  it("AUTONO has a populated snapshot in mock mode", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const res = await GET(freshReq());
    const body = await res.json();
    const autono = body.agents.find((a: { slug: string }) => a.slug === "autono");
    expect(autono).toBeTruthy();
    expect(autono.hasSnapshot).toBe(true);
    expect(autono.multiple).toBeGreaterThan(0);
  });

  it("sets 5-min cache-control header", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const res = await GET(freshReq());
    expect(res.headers.get("cache-control")).toMatch(/max-age=300/);
  });

  it("returns 429 with retry-after when rate limit is exceeded", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const ip = "9.9.9.9";
    const req = () =>
      new Request("http://localhost/api/agents", {
        headers: { "x-forwarded-for": ip },
      });
    // Burn through the 60 req/min limit
    for (let i = 0; i < 60; i++) {
      await GET(req());
    }
    const res = await GET(req());
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("rate_limited");
  });

  it("exposes x-ratelimit-* headers on every response", async () => {
    const { GET } = await import("../../app/api/agents/route");
    const res = await GET(freshReq());
    expect(res.headers.get("x-ratelimit-limit")).toBe("60");
    expect(res.headers.get("x-ratelimit-remaining")).toMatch(/^\d+$/);
    expect(res.headers.get("x-ratelimit-reset")).toMatch(/^\d+$/);
  });
});
