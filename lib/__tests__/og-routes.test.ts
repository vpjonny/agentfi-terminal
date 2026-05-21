import { describe, it, expect } from "vitest";

/**
 * Smoke tests for OG route handlers. We invoke the GET function directly,
 * verify status + content-type, AND consume the body to force satori to
 * actually render. Skipping body consumption (an earlier version of these
 * tests) gives FALSE POSITIVES — ImageResponse returns lazily, so satori
 * errors only fire when the stream is drained.
 *
 * The Playwright suite at /tests/smoke.spec.ts hits these routes over HTTP
 * and is the canonical end-to-end check; these vitest tests are the fast
 * pre-commit gate.
 */

async function drain(res: Response): Promise<number> {
  const buf = await res.arrayBuffer();
  return buf.byteLength;
}

describe("OG routes", () => {
  it("/og/agent/[slug] renders a real PNG for AUTONO (body consumed)", async () => {
    const { GET } = await import("../../app/og/agent/[slug]/route");
    const res = await GET(
      new Request("http://localhost/og/agent/autono"),
      { params: Promise.resolve({ slug: "autono" }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    const bytes = await drain(res);
    expect(bytes).toBeGreaterThan(5000);
  }, 30000);

  it("/og/agent/[slug] returns 404 for unknown slug", async () => {
    const { GET } = await import("../../app/og/agent/[slug]/route");
    const res = await GET(
      new Request("http://localhost/og/agent/nonexistent"),
      { params: Promise.resolve({ slug: "nonexistent" }) },
    );
    expect(res.status).toBe(404);
  });

  it("/og/comp renders a real PNG (body consumed)", async () => {
    const { GET } = await import("../../app/og/comp/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    const bytes = await drain(res);
    expect(bytes).toBeGreaterThan(5000);
  }, 30000);

  it("/og/action/[txhash] renders a real PNG for a known action (body consumed)", async () => {
    const { GET } = await import("../../app/og/action/[txhash]/route");
    const txhash = "0x4a1f0c3e9bee0c3d7b62d9e6a36a3f7c2b1ffffeebb1c3e2d7c8a90b3a52b1f0";
    const res = await GET(
      new Request(`http://localhost/og/action/${txhash}`),
      { params: Promise.resolve({ txhash }) },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/image\/png/);
    const bytes = await drain(res);
    expect(bytes).toBeGreaterThan(3000);
  }, 30000);

  it("/og/action/[txhash] returns 404 for unknown tx", async () => {
    const { GET } = await import("../../app/og/action/[txhash]/route");
    const res = await GET(
      new Request("http://localhost/og/action/0xdeadbeef"),
      { params: Promise.resolve({ txhash: "0xdeadbeef" }) },
    );
    expect(res.status).toBe(404);
  });
});
