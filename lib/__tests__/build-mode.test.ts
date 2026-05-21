import { describe, it, expect } from "vitest";
import { buildMode } from "../build-mode";

describe("buildMode", () => {
  it("ACCUMULATE state below threshold, percent matches rate/threshold", () => {
    const b = buildMode({ rate: 0.15, threshold: 0.5 });
    expect(b.state).toBe("ACCUMULATE");
    expect(b.percent).toBeCloseTo(0.3);
  });

  it("ACTIVE state at or above threshold, etaDays is null", () => {
    const b = buildMode({ rate: 0.55, threshold: 0.5 });
    expect(b.state).toBe("ACTIVE");
    expect(b.etaDays).toBeNull();
    expect(b.percent).toBe(1);
  });

  it("computes ETA from recentDailyDelta when accumulating", () => {
    // rate 0.15, threshold 0.5, delta 0.02/day → (0.5 - 0.15) / 0.02 = 17.5 → ceil 18
    const b = buildMode({ rate: 0.15, threshold: 0.5, recentDailyDelta: 0.02 });
    expect(b.etaDays).toBe(18);
  });

  it("etaDays null when no delta provided", () => {
    const b = buildMode({ rate: 0.15, threshold: 0.5 });
    expect(b.etaDays).toBeNull();
  });

  it("clamps negative rate to 0", () => {
    const b = buildMode({ rate: -0.1, threshold: 0.5 });
    expect(b.rate).toBe(0);
    expect(b.percent).toBe(0);
  });

  it("handles zero threshold without divide-by-zero", () => {
    const b = buildMode({ rate: 0.1, threshold: 0 });
    expect(b.percent).toBe(0);
  });

  it("uses default threshold 0.5 when omitted", () => {
    const b = buildMode({ rate: 0.25 });
    expect(b.threshold).toBe(0.5);
    expect(b.percent).toBeCloseTo(0.5);
  });
});
