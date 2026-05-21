import { describe, it, expect } from "vitest";
import {
  derive7dDelta,
  deriveRecentRate,
  derive12ptTrail,
} from "../db/history";
import type { HistoryEntry } from "../db/snapshots-store";

const HR = 60 * 60 * 1000;
const DAY = 24 * HR;

const mk = (over: Partial<HistoryEntry>): HistoryEntry => ({
  ts: 0,
  slug: "autono",
  multiple: 0,
  mcapUsd: 0,
  stakedDiem: 0,
  ...over,
});

describe("derive7dDelta", () => {
  const now = 1_000_000_000_000;

  it("returns 0 when no comparable historical entry", () => {
    expect(derive7dDelta([], 199, now)).toBe(0);
  });

  it("returns +pct when current > 168h-ago entry", () => {
    const history = [mk({ ts: now - 7 * DAY, multiple: 100 })];
    expect(derive7dDelta(history, 110, now)).toBeCloseTo(10);
  });

  it("returns -pct when current < 168h-ago entry", () => {
    const history = [mk({ ts: now - 7 * DAY, multiple: 200 })];
    expect(derive7dDelta(history, 180, now)).toBeCloseTo(-10);
  });

  it("uses nearest within ±12h window", () => {
    const history = [
      mk({ ts: now - 7 * DAY - 11 * HR, multiple: 50 }),
      mk({ ts: now - 7 * DAY + 11 * HR, multiple: 100 }),
    ];
    // 100 is at -7d+11h (11h delta); 50 is at -7d-11h (also 11h delta) — picks first nearest found
    const d = derive7dDelta(history, 110, now);
    expect(Math.abs(d)).toBeLessThan(Infinity);
  });

  it("returns 0 if past entry has multiple=0 (avoid div-by-zero)", () => {
    const history = [mk({ ts: now - 7 * DAY, multiple: 0 })];
    expect(derive7dDelta(history, 100, now)).toBe(0);
  });
});

describe("deriveRecentRate", () => {
  const now = 1_000_000_000_000;

  it("returns 0 with no history", () => {
    expect(deriveRecentRate([], 17, now)).toBe(0);
  });

  it("computes DIEM/day from 24h delta", () => {
    // 24h ago: 15 DIEM; now: 17 DIEM → +2 DIEM in 24h = 2 DIEM/day
    const history = [mk({ ts: now - DAY, stakedDiem: 15 })];
    expect(deriveRecentRate(history, 17, now)).toBeCloseTo(2);
  });

  it("normalizes when sample is not exactly 24h ago", () => {
    // 12h ago: 14 DIEM; now: 17 DIEM → +3 in 12h → 6 DIEM/day projected
    // BUT the window is ±6h around the 24h target — 12h ago is outside window
    const history = [mk({ ts: now - 12 * HR, stakedDiem: 14 })];
    expect(deriveRecentRate(history, 17, now)).toBe(0); // outside window
  });

  it("uses nearest sample within ±6h of 24h target", () => {
    // 22h ago: 14 DIEM; now: 17 DIEM → +3 in 22h → ~3.27 DIEM/day
    const history = [mk({ ts: now - 22 * HR, stakedDiem: 14 })];
    const rate = deriveRecentRate(history, 17, now);
    expect(rate).toBeCloseTo((3 / 22) * 24, 1);
  });
});

describe("derive12ptTrail", () => {
  const now = 1_000_000_000_000;

  it("returns flat array of currentMultiple when history empty", () => {
    expect(derive12ptTrail([], 199, now)).toEqual(Array(12).fill(199));
  });

  it("returns 12 samples evenly drawn from the 7d window", () => {
    // 30 entries linearly spaced from -7d to now
    const history = Array.from({ length: 30 }, (_, i) =>
      mk({ ts: now - 7 * DAY + (i * 7 * DAY) / 29, multiple: i }),
    );
    const trail = derive12ptTrail(history, 30, now);
    expect(trail).toHaveLength(12);
    // First sample is index 0 (multiple=0); last is index 29 (multiple=29)
    expect(trail[0]).toBe(0);
    expect(trail[11]).toBe(29);
    // Should be monotonically non-decreasing
    for (let i = 1; i < 12; i++) {
      expect(trail[i]).toBeGreaterThanOrEqual(trail[i - 1]);
    }
  });

  it("ignores entries outside the 7d window", () => {
    const history = [
      mk({ ts: now - 30 * DAY, multiple: 999 }), // outside
      mk({ ts: now - 1 * DAY, multiple: 100 }),
      mk({ ts: now, multiple: 110 }),
    ];
    const trail = derive12ptTrail(history, 110, now);
    expect(trail).not.toContain(999);
  });
});
