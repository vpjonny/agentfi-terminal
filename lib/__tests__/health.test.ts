import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { recordSnapshot } from "../db/snapshots-store";
import { getHealthState } from "../health";

let TMP_DIR: string;

describe("/api/health", () => {
  const originalDataDir = process.env.SNAPSHOT_DATA_DIR;
  const originalEth = process.env.ETHERSCAN_API_KEY;

  beforeEach(async () => {
    TMP_DIR = await mkdtemp(path.join(tmpdir(), "agentfi-health-"));
    process.env.SNAPSHOT_DATA_DIR = TMP_DIR;
    delete process.env.ETHERSCAN_API_KEY;
  });

  afterEach(async () => {
    if (originalDataDir === undefined) delete process.env.SNAPSHOT_DATA_DIR;
    else process.env.SNAPSHOT_DATA_DIR = originalDataDir;
    if (originalEth === undefined) delete process.env.ETHERSCAN_API_KEY;
    else process.env.ETHERSCAN_API_KEY = originalEth;
    await rm(TMP_DIR, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("returns 200 + ok=true on a clean (empty) store with no etherscan key", async () => {
    const { GET } = await import("../../app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.checks.snapshotStore.ok).toBe(true);
    expect(body.checks.etherscanKey.ok).toBe(false);
    expect(Array.isArray(body.checks.snapshotFreshness)).toBe(true);
  });

  it("returns 200 + ok=true when at least one agent has a fresh snapshot", async () => {
    const now = Date.now();
    await recordSnapshot({
      ts: now - 60_000,
      slug: "autono",
      multiple: 199,
      mcapUsd: 1_234_000,
      stakedDiem: 17,
    });
    const { GET } = await import("../../app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const autono = body.checks.snapshotFreshness.find(
      (f: { slug: string }) => f.slug === "autono",
    );
    expect(autono.hasSnapshot).toBe(true);
    expect(autono.stale).toBe(false);
  });

  it("returns 503 when all snapshots are stale (>2h)", async () => {
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    await recordSnapshot({
      ts: now - THREE_HOURS,
      slug: "autono",
      multiple: 199,
      mcapUsd: 1_234_000,
      stakedDiem: 17,
    });
    const { GET } = await import("../../app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.ok).toBe(false);
    const autono = body.checks.snapshotFreshness.find(
      (f: { slug: string }) => f.slug === "autono",
    );
    expect(autono.stale).toBe(true);
  });

  it("reports etherscanKey.ok=true when key is set", async () => {
    process.env.ETHERSCAN_API_KEY = "test-key";
    const { GET } = await import("../../app/api/health/route");
    const res = await GET();
    const body = await res.json();
    expect(body.checks.etherscanKey.ok).toBe(true);
  });

  it("getHealthState() includes ticker on each freshness entry", async () => {
    const state = await getHealthState();
    expect(state.checks.snapshotFreshness.length).toBeGreaterThan(0);
    for (const f of state.checks.snapshotFreshness) {
      expect(f.ticker).toBeTruthy();
      expect(f.slug).toBeTruthy();
    }
  });
});
