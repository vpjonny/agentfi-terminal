import { describe, it, expect } from "vitest";
import { TEMPLATES, getTemplate } from "../poster/templates";
import { renderCaption } from "../poster/render";
import { parseDiemAmount } from "../poster/amount-parse";
import { requireAgent } from "../agents";
import { getMetric } from "../metrics";
import { buildMode } from "../build-mode";

const agent = requireAgent("autono");
const metric = getMetric({
  strategy: "compute-valuation",
  stakedDiem: 17,
  mcapUsd: 1_234_795,
  diemPriceUsd: 1.0,
});
const bm = buildMode({ rate: 0.15, threshold: 0.5 });

describe("parseDiemAmount", () => {
  it("parses signed forward-form '+0.18 DIEM'", () => {
    expect(parseDiemAmount("+0.18 DIEM")).toBe(0.18);
  });
  it("parses negative", () => {
    expect(parseDiemAmount("-0.05 DIEM claimed")).toBe(-0.05);
  });
  it("parses reverse-form 'DIEM 0.5'", () => {
    expect(parseDiemAmount("DIEM 0.5 added")).toBe(0.5);
  });
  it("returns null for ambiguous", () => {
    expect(parseDiemAmount("0.5 ETH paired")).toBeNull();
    expect(parseDiemAmount("hello world")).toBeNull();
  });
});

describe("templates registry", () => {
  it("has one entry per action type", () => {
    expect(Object.keys(TEMPLATES).sort()).toEqual(
      ["CLAIM", "DAILY_COMP", "LOG", "LP", "MILESTONE", "STAKE", "SWAP"],
    );
  });
  it("getTemplate(CLAIM) returns claim_v1", () => {
    expect(getTemplate("CLAIM").id).toBe("claim_v1");
  });
});

describe("renderCaption — per-template", () => {
  it("CLAIM substitutes amount, multiple, link", () => {
    const r = renderCaption(getTemplate("CLAIM"), {
      agent,
      surface: "x",
      action: {
        type: "CLAIM",
        detail: "+0.18 DIEM",
        txHash: "0x0",
        ts: "2026-05-18T17:28:00Z",
      },
      metric,
    });
    expect(r.text).toBe("AUTONO claimed +0.18 DIEM · 199× · https://agentfi.dev/agent/autono");
    expect(r.templateId).toBe("claim_v1");
    expect(r.warnings).toEqual([]);
  });

  it("LP includes build_mode percent", () => {
    const r = renderCaption(getTemplate("LP"), {
      agent,
      surface: "x",
      action: {
        type: "LP",
        detail: "0.5 ETH paired",
        txHash: "0x0",
        ts: "2026-05-18T16:42:00Z",
      },
      buildMode: bm,
    });
    expect(r.text).toContain("0.5 ETH paired");
    expect(r.text).toContain("build_mode 30%");
  });

  it("LOG wraps detail in quotes", () => {
    const r = renderCaption(getTemplate("LOG"), {
      agent,
      surface: "x",
      action: {
        type: "LOG",
        detail: "compute below threshold",
        txHash: "0x0",
        ts: "2026-05-18T14:42:00Z",
      },
    });
    expect(r.text).toContain(`logged: "compute below threshold"`);
  });

  it("MILESTONE prefixes with ⚡ (the only template with an emoji)", () => {
    const r = renderCaption(getTemplate("MILESTONE"), {
      agent,
      surface: "x",
      action: {
        type: "MILESTONE",
        detail: "build_rate ▲ 30%",
        txHash: "0x0",
        ts: "2026-05-18T09:55:00Z",
      },
      metric,
    });
    expect(r.text.startsWith("⚡ AUTONO")).toBe(true);
  });

  it("STAKE substitutes compute_val", () => {
    const r = renderCaption(getTemplate("STAKE"), {
      agent,
      surface: "x",
      action: {
        type: "STAKE",
        detail: "+5 DIEM",
        txHash: "0x0",
        ts: "2026-05-18T10:00:00Z",
      },
      metric,
    });
    expect(r.text).toContain("staked 5.00 DIEM");
    expect(r.text).toContain("compute_val now $6,205");
  });

  it("DAILY_COMP renders 3 rows", () => {
    const r = renderCaption(getTemplate("DAILY_COMP"), {
      agent,
      surface: "x",
      timestamp: "2026-05-18 12:00",
      topRows: [
        { ticker: "AUTONO", multiple: 199 },
        { ticker: "ETHY",   multiple: 35 },
        { ticker: "BANKR",  multiple: 20 },
      ],
    });
    expect(r.text).toContain("AgentFi comp · 2026-05-18 12:00 UTC");
    expect(r.text).toContain("AUTONO 199×");
    expect(r.text).toContain("ETHY 35×");
    expect(r.text).toContain("BANKR 20×");
  });
});

describe("renderCaption — length warnings", () => {
  it("warns when X caption exceeds 280 chars", () => {
    const longBody = "{detail}";
    const template = { id: "long_v1", actionType: "LOG" as const, version: 1, body: longBody };
    const r = renderCaption(template, {
      agent,
      surface: "x",
      action: {
        type: "LOG",
        detail: "x".repeat(300),
        txHash: "0x0",
        ts: "2026-05-18T10:00:00Z",
      },
    });
    expect(r.warnings.length).toBe(1);
    expect(r.warnings[0]).toContain("280");
  });

  it("no warning when Farcaster cap (320) not exceeded", () => {
    const template = { id: "long_v1", actionType: "LOG" as const, version: 1, body: "{detail}" };
    const r = renderCaption(template, {
      agent,
      surface: "farcaster",
      action: {
        type: "LOG",
        detail: "x".repeat(300),
        txHash: "0x0",
        ts: "2026-05-18T10:00:00Z",
      },
    });
    expect(r.warnings).toEqual([]);
  });
});

describe("renderCaption — unknown placeholder", () => {
  it("throws on unknown placeholder so template typos surface in tests", () => {
    const template = {
      id: "bogus_v1",
      actionType: "LOG" as const,
      version: 1,
      body: "{agent} did {something_that_does_not_exist}",
    };
    expect(() =>
      renderCaption(template, { agent, surface: "x" }),
    ).toThrow(/something_that_does_not_exist/);
  });
});
