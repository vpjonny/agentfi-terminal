import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  clientKeyFromRequest,
  _resetRateLimitBuckets,
  _bucketCount,
} from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    _resetRateLimitBuckets();
  });

  it("ok on first call, fills bucket", () => {
    const r = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    expect(r.ok).toBe(true);
    expect(r.limit).toBe(3);
    expect(r.remaining).toBe(2);
    expect(r.retryAfterMs).toBe(0);
  });

  it("counts down with each request", () => {
    const a = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    const b = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    const c = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    expect(a.remaining).toBe(2);
    expect(b.remaining).toBe(1);
    expect(c.remaining).toBe(0);
  });

  it("rejects with 429-style payload when exhausted", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    }
    const r = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 3, windowMs: 1000 });
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("separates buckets by (name, key)", () => {
    checkRateLimit({ name: "feed", key: "1.1.1.1", limit: 1, windowMs: 1000 });
    const sameIpDifferentName = checkRateLimit({
      name: "api-agents",
      key: "1.1.1.1",
      limit: 1,
      windowMs: 1000,
    });
    expect(sameIpDifferentName.ok).toBe(true);
    const differentIp = checkRateLimit({
      name: "feed",
      key: "2.2.2.2",
      limit: 1,
      windowMs: 1000,
    });
    expect(differentIp.ok).toBe(true);
  });

  it("resets after window elapses", async () => {
    checkRateLimit({ name: "t", key: "1.1.1.1", limit: 1, windowMs: 30 });
    const r1 = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 1, windowMs: 30 });
    expect(r1.ok).toBe(false);
    await new Promise((res) => setTimeout(res, 50));
    const r2 = checkRateLimit({ name: "t", key: "1.1.1.1", limit: 1, windowMs: 30 });
    expect(r2.ok).toBe(true);
  });
});

describe("clientKeyFromRequest", () => {
  it("reads first x-forwarded-for entry (original client)", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-forwarded-for": "1.1.1.1, 10.0.0.1, 10.0.0.2" },
    });
    expect(clientKeyFromRequest(req)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip when xff missing", () => {
    const req = new Request("http://localhost/", {
      headers: { "x-real-ip": "5.5.5.5" },
    });
    expect(clientKeyFromRequest(req)).toBe("5.5.5.5");
  });

  it("falls back to 'unknown' with no headers", () => {
    const req = new Request("http://localhost/");
    expect(clientKeyFromRequest(req)).toBe("unknown");
  });
});

describe("bucket pruning state", () => {
  beforeEach(() => _resetRateLimitBuckets());

  it("tracks bucket count", () => {
    expect(_bucketCount()).toBe(0);
    checkRateLimit({ name: "t", key: "a", limit: 1, windowMs: 1000 });
    checkRateLimit({ name: "t", key: "b", limit: 1, windowMs: 1000 });
    expect(_bucketCount()).toBe(2);
  });
});
