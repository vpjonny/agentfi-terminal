import { describe, it, expect } from "vitest";
import { evaluate } from "../poster/materiality";
import type { ActionEvent } from "../types";

const mkAction = (overrides: Partial<ActionEvent>): ActionEvent => ({
  type: "CLAIM",
  detail: "+0.18 DIEM",
  txHash: "0x0000000000000000000000000000000000000000000000000000000000000001",
  ts: "2026-05-18T17:28:00Z",
  ...overrides,
});

const emptyCtx = { recentlyPosted: [], dayPostCount: 0 };

describe("materiality.evaluate", () => {
  it("CLAIM > 0.1 DIEM is material", () => {
    const v = evaluate(mkAction({ detail: "+0.18 DIEM" }), emptyCtx);
    expect(v.material).toBe(true);
    expect(v.reason).toContain("0.18");
  });

  it("CLAIM ≤ 0.1 DIEM is NOT material", () => {
    const v = evaluate(mkAction({ detail: "+0.05 DIEM" }), emptyCtx);
    expect(v.material).toBe(false);
    expect(v.reason).toContain("threshold");
  });

  it("CLAIM with no parseable amount is NOT material", () => {
    const v = evaluate(mkAction({ detail: "some weird detail" }), emptyCtx);
    expect(v.material).toBe(false);
    expect(v.reason).toContain("parseable");
  });

  it("LP is always material", () => {
    const v = evaluate(mkAction({ type: "LP", detail: "0.5 ETH paired" }), emptyCtx);
    expect(v.material).toBe(true);
  });

  it("SWAP is always material", () => {
    const v = evaluate(mkAction({ type: "SWAP", detail: "—" }), emptyCtx);
    expect(v.material).toBe(true);
  });

  it("STAKE is always material", () => {
    const v = evaluate(mkAction({ type: "STAKE", detail: "+10 DIEM" }), emptyCtx);
    expect(v.material).toBe(true);
  });

  it("MILESTONE is always material", () => {
    const v = evaluate(mkAction({ type: "MILESTONE", detail: "build_rate ▲ 30%" }), emptyCtx);
    expect(v.material).toBe(true);
  });

  it("LOG below 8 chars is NOT material", () => {
    const v = evaluate(mkAction({ type: "LOG", detail: "short" }), emptyCtx);
    expect(v.material).toBe(false);
    expect(v.reason).toContain("short");
  });

  it("LOG novel + long enough is material", () => {
    const v = evaluate(
      mkAction({ type: "LOG", detail: "compute below threshold; accumulating" }),
      emptyCtx,
    );
    expect(v.material).toBe(true);
  });

  it("LOG duplicating a recently-posted log is NOT material", () => {
    const prev = mkAction({
      type: "LOG",
      detail: "compute below threshold",
      txHash: "0xprev",
    });
    const v = evaluate(
      mkAction({ type: "LOG", detail: "compute below threshold", txHash: "0xnew" }),
      { recentlyPosted: [prev], dayPostCount: 0 },
    );
    expect(v.material).toBe(false);
    expect(v.reason).toContain("duplicates");
  });

  it("daily cap of 5 blocks subsequent material actions", () => {
    const v = evaluate(mkAction({ type: "LP", detail: "x" }), {
      recentlyPosted: [],
      dayPostCount: 5,
    });
    expect(v.material).toBe(false);
    expect(v.reason).toContain("daily cap");
  });

  it("daily cap is configurable", () => {
    const v = evaluate(mkAction({ type: "LP", detail: "x" }), {
      recentlyPosted: [],
      dayPostCount: 2,
      dayCap: 2,
    });
    expect(v.material).toBe(false);
    expect(v.reason).toContain("daily cap");
  });

  it("cap allows just-below-cap actions through", () => {
    const v = evaluate(mkAction({ type: "LP", detail: "x" }), {
      recentlyPosted: [],
      dayPostCount: 4,
    });
    expect(v.material).toBe(true);
  });
});
