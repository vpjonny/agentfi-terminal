import { describe, it, expect } from "vitest";
import {
  computeValuation,
  treasuryRunway,
  feeRevenue,
  runwayDays,
  getMetric,
} from "../metrics";

describe("computeValuation", () => {
  it("matches the AUTONO design-doc fixture (199×, $1.2M mcap, $6,205 compute_val)", () => {
    // staked = 17 DIEM → 17 × 365 × $1 = $6,205 compute_val
    // mcap $1,234,795 → multiple ~199.0×
    const r = computeValuation({ stakedDiem: 17, mcapUsd: 1_234_795, diemPriceUsd: 1.0 });
    expect(r.label).toBe("COMPUTE MULTIPLE");
    expect(r.secondary.valueUsd).toBe(6205);
    expect(Math.round(r.multiple)).toBe(199);
  });

  it("scales with DIEM spot price (the locked methodology)", () => {
    const base = computeValuation({ stakedDiem: 10, mcapUsd: 100_000, diemPriceUsd: 1.0 });
    const pumped = computeValuation({ stakedDiem: 10, mcapUsd: 100_000, diemPriceUsd: 1.5 });
    // Higher DIEM price → bigger compute_val → smaller multiple
    expect(pumped.multiple).toBeLessThan(base.multiple);
    expect(pumped.secondary.valueUsd).toBeCloseTo(base.secondary.valueUsd * 1.5);
  });

  it("returns 0 multiple when stakedDiem is 0 (no divide-by-zero)", () => {
    const r = computeValuation({ stakedDiem: 0, mcapUsd: 100_000, diemPriceUsd: 1.0 });
    expect(r.multiple).toBe(0);
  });
});

describe("treasuryRunway", () => {
  it("computes mcap / treasury multiple", () => {
    const r = treasuryRunway({ treasuryUsd: 620_000, monthlyBurnUsd: 50_000, mcapUsd: 890_000 });
    expect(r.label).toBe("RUNWAY MULTIPLE");
    expect(r.multiple).toBeCloseTo(890_000 / 620_000);
  });

  it("runwayDays converts treasury / burn into days", () => {
    expect(runwayDays(60_000, 10_000)).toBe(180); // 6 months
    expect(runwayDays(60_000, 0)).toBeNull();
  });
});

describe("feeRevenue", () => {
  it("annualizes 30d fees and reports P/F multiple", () => {
    const r = feeRevenue({ feesUsd30d: 410_000, mcapUsd: 14_300_000 });
    expect(r.label).toBe("REVENUE MULTIPLE");
    expect(r.unit).toBe("pe");
    expect(r.multiple).toBeCloseTo(14_300_000 / (410_000 * 12), 1);
  });

  it("handles zero fees without NaN", () => {
    const r = feeRevenue({ feesUsd30d: 0, mcapUsd: 1_000_000 });
    expect(r.multiple).toBe(0);
  });
});

describe("getMetric dispatch", () => {
  it("routes compute-valuation", () => {
    const r = getMetric({
      strategy: "compute-valuation",
      stakedDiem: 17,
      mcapUsd: 1_234_795,
      diemPriceUsd: 1.0,
    });
    expect(r.label).toBe("COMPUTE MULTIPLE");
  });

  it("routes treasury-runway", () => {
    const r = getMetric({
      strategy: "treasury-runway",
      treasuryUsd: 620_000,
      monthlyBurnUsd: 50_000,
      mcapUsd: 890_000,
    });
    expect(r.label).toBe("RUNWAY MULTIPLE");
  });

  it("routes fee-revenue", () => {
    const r = getMetric({
      strategy: "fee-revenue",
      feesUsd30d: 410_000,
      mcapUsd: 14_300_000,
    });
    expect(r.label).toBe("REVENUE MULTIPLE");
  });
});
