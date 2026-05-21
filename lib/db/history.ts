/**
 * Derived metrics from snapshot history. All functions are cold-start safe:
 * they return sensible fallback values when history is sparse or empty.
 */

import type { HistoryEntry } from "./snapshots-store";

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Find the history entry closest to `targetMs` within `windowMs` tolerance.
 * Returns null if no entry falls in the window.
 */
function findNearest(
  history: HistoryEntry[],
  targetMs: number,
  windowMs: number,
): HistoryEntry | null {
  let best: HistoryEntry | null = null;
  let bestDelta = Infinity;
  for (const e of history) {
    const d = Math.abs(e.ts - targetMs);
    if (d <= windowMs && d < bestDelta) {
      best = e;
      bestDelta = d;
    }
  }
  return best;
}

/**
 * 7-day % delta of multiple. Returns 0 if no comparable historical entry
 * (within ±12h of 168h ago).
 */
export function derive7dDelta(
  history: HistoryEntry[],
  currentMultiple: number,
  nowMs = Date.now(),
): number {
  const targetMs = nowMs - 7 * MS_PER_DAY;
  const past = findNearest(history, targetMs, 12 * MS_PER_HOUR);
  if (!past || past.multiple === 0) return 0;
  return ((currentMultiple - past.multiple) / past.multiple) * 100;
}

/**
 * Recent DIEM/day accumulation rate. Compares current stakedDiem against
 * an entry from ~24h ago (±6h window). Returns 0 when no comparable entry.
 */
export function deriveRecentRate(
  history: HistoryEntry[],
  currentStakedDiem: number,
  nowMs = Date.now(),
): number {
  const targetMs = nowMs - MS_PER_DAY;
  const past = findNearest(history, targetMs, 6 * MS_PER_HOUR);
  if (!past) return 0;
  const hoursSince = (nowMs - past.ts) / MS_PER_HOUR;
  if (hoursSince <= 0) return 0;
  // Convert hourly accumulation back to DIEM/day
  return ((currentStakedDiem - past.stakedDiem) / hoursSince) * 24;
}

/**
 * 12-point trail of multiple values over the last 7 days, evenly sampled.
 * Cold-start: returns a flat 12-array of `currentMultiple` when history is
 * too sparse (< 2 entries in window).
 */
export function derive12ptTrail(
  history: HistoryEntry[],
  currentMultiple: number,
  nowMs = Date.now(),
): number[] {
  const sevenDaysAgo = nowMs - 7 * MS_PER_DAY;
  const recent = history
    .filter((e) => e.ts >= sevenDaysAgo)
    .sort((a, b) => a.ts - b.ts);

  if (recent.length < 2) return new Array(12).fill(currentMultiple);

  // Evenly sample 12 indices from the recent array
  const N = recent.length;
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    const frac = i / 11;
    const idx = Math.min(N - 1, Math.round(frac * (N - 1)));
    out.push(recent[idx].multiple);
  }
  return out;
}
