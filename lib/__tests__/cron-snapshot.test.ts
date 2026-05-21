import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const SECRET = "test-cron-secret-32chars-fixed-ok";

describe("/api/cron/snapshot", () => {
  const originalCron = process.env.CRON_SECRET;
  const originalEth = process.env.ETHERSCAN_API_KEY;

  beforeEach(() => {
    process.env.CRON_SECRET = SECRET;
    delete process.env.ETHERSCAN_API_KEY;
  });

  afterEach(() => {
    if (originalCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalCron;
    if (originalEth === undefined) delete process.env.ETHERSCAN_API_KEY;
    else process.env.ETHERSCAN_API_KEY = originalEth;
    vi.restoreAllMocks();
  });

  it("returns 401 with no token", async () => {
    const { GET } = await import("../../app/api/cron/snapshot/route");
    const res = await GET(new Request("http://localhost/api/cron/snapshot"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns 401 with wrong token", async () => {
    const { GET } = await import("../../app/api/cron/snapshot/route");
    const res = await GET(
      new Request("http://localhost/api/cron/snapshot?token=wrong"),
    );
    expect(res.status).toBe(401);
  });

  it("accepts Authorization: Bearer header", async () => {
    const { GET } = await import("../../app/api/cron/snapshot/route");
    const res = await GET(
      new Request("http://localhost/api/cron/snapshot", {
        headers: { Authorization: `Bearer ${SECRET}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // No ETHERSCAN_API_KEY in env → recorded:false, reason:"no etherscan key"
    expect(body.recorded).toBe(false);
    expect(body.reason).toContain("no etherscan key");
  });

  it("accepts ?token= query param", async () => {
    const { GET } = await import("../../app/api/cron/snapshot/route");
    const res = await GET(
      new Request(`http://localhost/api/cron/snapshot?token=${SECRET}`),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 401 if CRON_SECRET env not set, regardless of provided token", async () => {
    delete process.env.CRON_SECRET;
    const { GET } = await import("../../app/api/cron/snapshot/route");
    const res = await GET(
      new Request(`http://localhost/api/cron/snapshot?token=${SECRET}`),
    );
    expect(res.status).toBe(401);
  });
});
