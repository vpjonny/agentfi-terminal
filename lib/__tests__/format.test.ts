import { describe, it, expect } from "vitest";
import {
  abbrevAddress,
  formatUsd,
  formatMultiple,
  signedDelta,
  formatRate,
} from "../format";

describe("abbrevAddress", () => {
  it("collapses long hex into head…tail", () => {
    expect(abbrevAddress("0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e")).toBe("0xB3D7e0…6d8e");
  });

  it("respects custom head/tail lengths", () => {
    expect(abbrevAddress("0x1234567890abcdef1234", 4, 4)).toBe("0x1234…1234");
  });

  it("returns short input unchanged", () => {
    expect(abbrevAddress("0x1234")).toBe("0x1234");
  });
});

describe("formatUsd", () => {
  it("scales with magnitude suffix", () => {
    expect(formatUsd(1_234_567)).toBe("$1.2M");
    expect(formatUsd(890_000)).toBe("$890.0K");
    expect(formatUsd(14_300_000)).toBe("$14.3M");
    expect(formatUsd(2_100_000_000)).toBe("$2.1B");
  });

  it("renders small amounts with commas, no suffix", () => {
    expect(formatUsd(6205)).toBe("$6,205");
    expect(formatUsd(0)).toBe("$0");
  });

  it("preserves sign", () => {
    expect(formatUsd(-1_500_000)).toBe("-$1.5M");
  });
});

describe("formatMultiple", () => {
  it("integer above 10, one decimal below", () => {
    expect(formatMultiple(199)).toBe("199×");
    expect(formatMultiple(35)).toBe("35×");
    expect(formatMultiple(1.4)).toBe("1.4×");
    expect(formatMultiple(8.4)).toBe("8.4×");
  });

  it("returns em-dash for invalid values", () => {
    expect(formatMultiple(0)).toBe("—");
    expect(formatMultiple(NaN)).toBe("—");
    expect(formatMultiple(Infinity)).toBe("—");
  });
});

describe("signedDelta", () => {
  it("▲ for positive with up tone", () => {
    const d = signedDelta(12);
    expect(d.text).toBe("▲ 12%");
    expect(d.tone).toBe("up");
  });

  it("▼ for negative with down tone, absolute value in label", () => {
    const d = signedDelta(-4);
    expect(d.text).toBe("▼ 4%");
    expect(d.tone).toBe("down");
  });

  it("neutral for zero", () => {
    const d = signedDelta(0);
    expect(d.tone).toBe("neutral");
  });
});

describe("formatRate", () => {
  it("renders two-decimal rate with unit", () => {
    expect(formatRate(0.15)).toBe("0.15 DIEM·day");
    expect(formatRate(0.5, "DIEM/day")).toBe("0.50 DIEM/day");
  });
});
