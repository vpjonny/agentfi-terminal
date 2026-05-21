import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  recordSnapshot,
  getHistory,
  getLatest,
  _countEntries,
  _wipe,
  type HistoryEntry,
} from "../db/snapshots-store";

let tmpDir: string;
let originalEnv: string | undefined;
const NOW = Date.now();

const mk = (over: Partial<HistoryEntry>): HistoryEntry => ({
  ts: NOW,
  slug: "autono",
  multiple: 199,
  mcapUsd: 1_234_795,
  stakedDiem: 17,
  ...over,
});

beforeEach(async () => {
  originalEnv = process.env.SNAPSHOT_DATA_DIR;
  tmpDir = await mkdtemp(path.join(tmpdir(), "agentfi-snap-test-"));
  process.env.SNAPSHOT_DATA_DIR = tmpDir;
});

afterEach(async () => {
  if (originalEnv === undefined) delete process.env.SNAPSHOT_DATA_DIR;
  else process.env.SNAPSHOT_DATA_DIR = originalEnv;
  await rm(tmpDir, { recursive: true, force: true });
});

describe("snapshots-store", () => {
  it("starts empty", async () => {
    expect(await _countEntries()).toBe(0);
    expect(await getLatest("autono")).toBeNull();
    expect(await getHistory("autono")).toEqual([]);
  });

  it("round-trips one entry", async () => {
    await recordSnapshot(mk({ ts: NOW - 1000 }));
    expect(await _countEntries()).toBe(1);
    const got = await getLatest("autono");
    expect(got).toMatchObject({ slug: "autono", multiple: 199 });
  });

  it("is idempotent on duplicate (slug, ts)", async () => {
    await recordSnapshot(mk({ ts: NOW - 5000, multiple: 199 }));
    await recordSnapshot(mk({ ts: NOW - 5000, multiple: 199 }));
    expect(await _countEntries()).toBe(1);
  });

  it("getHistory filters by slug", async () => {
    await recordSnapshot(mk({ ts: NOW - 1000, slug: "autono" }));
    await recordSnapshot(mk({ ts: NOW - 1001, slug: "ethy" }));
    const hist = await getHistory("autono");
    expect(hist).toHaveLength(1);
    expect(hist[0].slug).toBe("autono");
  });

  it("getHistory filters by sinceMs", async () => {
    await recordSnapshot(mk({ ts: NOW - 3000 }));
    await recordSnapshot(mk({ ts: NOW - 2000 }));
    await recordSnapshot(mk({ ts: NOW - 1000 }));
    const hist = await getHistory("autono", NOW - 2500);
    expect(hist.map((e) => e.ts)).toEqual([NOW - 2000, NOW - 1000]);
  });

  it("sorts entries ascending by ts after write", async () => {
    await recordSnapshot(mk({ ts: NOW - 1000 }));
    await recordSnapshot(mk({ ts: NOW - 3000 }));
    await recordSnapshot(mk({ ts: NOW - 2000 }));
    const hist = await getHistory("autono");
    expect(hist.map((e) => e.ts)).toEqual([NOW - 3000, NOW - 2000, NOW - 1000]);
  });

  it("drops entries older than 30 days", async () => {
    const old = NOW - 31 * 24 * 60 * 60 * 1000;
    await recordSnapshot(mk({ ts: old }));
    await recordSnapshot(mk({ ts: NOW })); // triggers prune
    const hist = await getHistory("autono");
    expect(hist).toHaveLength(1);
    expect(hist[0].ts).toBe(NOW);
  });

  it("_wipe clears everything", async () => {
    await recordSnapshot(mk({ ts: NOW - 1000 }));
    await _wipe();
    expect(await _countEntries()).toBe(0);
  });
});
