import { describe, it, expect } from "vitest";
import { processActions } from "../poster/orchestrator";
import { requireAgent } from "../agents";
import { getMetric } from "../metrics";
import { buildMode } from "../build-mode";
import type { ActionEvent } from "../types";

const agent = requireAgent("autono");
const metric = getMetric({
  strategy: "compute-valuation",
  stakedDiem: 17,
  mcapUsd: 1_234_795,
  diemPriceUsd: 1.0,
});
const bm = buildMode({ rate: 0.15, threshold: 0.5 });

const mkAction = (type: ActionEvent["type"], detail: string, hashTail: string): ActionEvent => ({
  type,
  detail,
  txHash: ("0x" + hashTail.padEnd(64, "0")) as `0x${string}`,
  ts: "2026-05-18T17:28:00Z",
});

describe("processActions orchestrator", () => {
  it("renders one IntendedPost per (action × surface)", () => {
    const result = processActions({
      actions: [{ agent, action: mkAction("LP", "0.5 ETH paired", "lp1") }],
      metricBySlug: { autono: metric },
      buildModeBySlug: { autono: bm },
    });
    // 1 action × 2 surfaces (default farcaster + x)
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.surface).sort()).toEqual(["farcaster", "x"]);
  });

  it("attaches caption only when material", () => {
    const result = processActions({
      actions: [{ agent, action: mkAction("CLAIM", "+0.05 DIEM", "tiny") }],
      metricBySlug: { autono: metric },
      surfaces: ["x"],
    });
    expect(result[0].decision.material).toBe(false);
    expect(result[0].caption).toBeUndefined();
  });

  it("propagates materiality reason verbatim", () => {
    const result = processActions({
      actions: [{ agent, action: mkAction("CLAIM", "+0.05 DIEM", "tiny") }],
      metricBySlug: { autono: metric },
      surfaces: ["x"],
    });
    expect(result[0].decision.reason).toContain("threshold");
  });

  it("respects per-surface daily cap", () => {
    const actions = Array.from({ length: 8 }, (_, i) =>
      ({ agent, action: mkAction("LP", `liq #${i}`, `lp${i}`) }),
    );
    const result = processActions({
      actions,
      metricBySlug: { autono: metric },
      buildModeBySlug: { autono: bm },
      surfaces: ["x"],
    });
    const material = result.filter((r) => r.decision.material);
    const skipped = result.filter((r) => !r.decision.material);
    expect(material).toHaveLength(5);  // default cap = 5
    expect(skipped).toHaveLength(3);
    expect(skipped[0].decision.reason).toContain("daily cap");
  });

  it("uses ogBaseUrl override for OG URL", () => {
    const result = processActions({
      actions: [{ agent, action: mkAction("LP", "x", "lpu") }],
      metricBySlug: { autono: metric },
      buildModeBySlug: { autono: bm },
      surfaces: ["x"],
      ogBaseUrl: "https://example.com",
    });
    expect(result[0].ogUrl).toBe(`https://example.com/og/action/0xlpu${"0".repeat(61)}`);
  });

  it("returns empty array for empty actions input", () => {
    const result = processActions({
      actions: [],
      metricBySlug: { autono: metric },
    });
    expect(result).toEqual([]);
  });
});
