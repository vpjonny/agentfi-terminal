import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBuildInfo, formatAgeLabel } from "../build-info";

describe("getBuildInfo", () => {
  const originalSha = process.env.NEXT_PUBLIC_GIT_SHA;
  const originalBuiltAt = process.env.NEXT_PUBLIC_BUILT_AT;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_GIT_SHA;
    delete process.env.NEXT_PUBLIC_BUILT_AT;
  });

  afterEach(() => {
    if (originalSha === undefined) delete process.env.NEXT_PUBLIC_GIT_SHA;
    else process.env.NEXT_PUBLIC_GIT_SHA = originalSha;
    if (originalBuiltAt === undefined) delete process.env.NEXT_PUBLIC_BUILT_AT;
    else process.env.NEXT_PUBLIC_BUILT_AT = originalBuiltAt;
  });

  it("returns 'dev' when no env vars set", () => {
    const info = getBuildInfo();
    expect(info.sha).toBe("dev");
    expect(info.builtAt).toBe("dev");
  });

  it("truncates SHA to 7 chars", () => {
    process.env.NEXT_PUBLIC_GIT_SHA = "abcdef1234567890";
    expect(getBuildInfo().sha).toBe("abcdef1");
  });

  it("reads builtAt verbatim", () => {
    process.env.NEXT_PUBLIC_BUILT_AT = "2026-05-18T17:00:00Z";
    expect(getBuildInfo().builtAt).toBe("2026-05-18T17:00:00Z");
  });
});

describe("formatAgeLabel", () => {
  it("returns '—' for null", () => {
    expect(formatAgeLabel(null)).toBe("—");
  });
  it("returns '<1m' for under a minute", () => {
    expect(formatAgeLabel(30_000)).toBe("<1m");
  });
  it("returns 'Nm' for under an hour", () => {
    expect(formatAgeLabel(5 * 60_000)).toBe("5m");
    expect(formatAgeLabel(59 * 60_000)).toBe("59m");
  });
  it("returns 'Nh' for under a day", () => {
    expect(formatAgeLabel(3 * 3600_000)).toBe("3h");
    expect(formatAgeLabel(23 * 3600_000)).toBe("23h");
  });
  it("returns 'Nd' for days", () => {
    expect(formatAgeLabel(2 * 86400_000)).toBe("2d");
  });
});
