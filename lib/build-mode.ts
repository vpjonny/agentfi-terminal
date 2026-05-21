import { BUILD_MODE_THRESHOLD_DIEM_PER_DAY } from "./constants";
import type { BuildMode } from "./types";

export interface BuildModeInput {
  /** current DIEM/day accumulation rate */
  rate: number;
  /** threshold DIEM/day to flip into ACTIVE mode; defaults to 0.5 */
  threshold?: number;
  /** trailing 7d delta in DIEM/day — used to project ETA. 0 → unknown ETA. */
  recentDailyDelta?: number;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function buildMode(input: BuildModeInput): BuildMode {
  const threshold = input.threshold ?? BUILD_MODE_THRESHOLD_DIEM_PER_DAY;
  const rate = Math.max(input.rate, 0);

  const percent = threshold > 0 ? clamp(rate / threshold, 0, 1) : 0;
  const state = rate >= threshold ? "ACTIVE" : "ACCUMULATE";

  let etaDays: number | null = null;
  if (state === "ACCUMULATE") {
    const delta = input.recentDailyDelta ?? 0;
    if (delta > 0) {
      etaDays = Math.ceil((threshold - rate) / delta);
    }
  }

  return { rate, threshold, percent, etaDays, state };
}
