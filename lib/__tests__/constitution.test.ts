import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  extractSnippet,
  getConstitutionSnippet,
  _resetCacheForTests,
} from "../chain/constitution";

describe("extractSnippet", () => {
  it("prefers paragraph immediately after `## Constitution` heading", () => {
    const md = `
# Project Title

Some intro text.

## Constitution

Accumulate compute until 0.5 DIEM per day, then build.

## Other Section

Other body.
`;
    const out = extractSnippet(md);
    expect(out).toBe("Accumulate compute until 0.5 DIEM per day, then build.");
  });

  it("strips bold/italic/links/inline-code markdown", () => {
    const md = `
## Constitution

**Stake** _your_ \`compute\` and [build](https://example.com) the future of agents now.
`;
    const out = extractSnippet(md);
    expect(out).toBe(
      "Stake your compute and build the future of agents now.",
    );
  });

  it("falls back to first long paragraph when no Constitution heading", () => {
    const md = `
# Title

This is a sufficiently long paragraph that should be picked as the snippet when no heading is found.

## Other

short`;
    const out = extractSnippet(md);
    expect(out).toContain("sufficiently long paragraph");
  });

  it("returns null when nothing usable", () => {
    expect(extractSnippet("# Just a heading\n\n## Another\n")).toBeNull();
  });

  it("joins multi-line paragraphs into one", () => {
    const md = `
## Constitution

Line one of the constitution
flowing into line two
and then line three.
`;
    const out = extractSnippet(md);
    expect(out).toBe(
      "Line one of the constitution flowing into line two and then line three.",
    );
  });
});

describe("getConstitutionSnippet", () => {
  beforeEach(() => {
    _resetCacheForTests();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns DEFAULT_FALLBACK for unknown slug", async () => {
    const out = await getConstitutionSnippet("nonexistent");
    expect(out).toBe("—");
  });

  it("fetches and parses on first call", async () => {
    const md = `
## Constitution

Compute is moat. DIEM is fuel. Accumulate then build.
`;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(md, { status: 200 }),
    );
    const out = await getConstitutionSnippet("autono");
    expect(out).toContain("Compute is moat");
  });

  it("falls back when fetch returns 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not found", { status: 404 }),
    );
    const out = await getConstitutionSnippet("autono");
    expect(out).toBe("Accumulate compute until 0.5 DIEM/day; then build.");
  });

  it("falls back when fetch throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const out = await getConstitutionSnippet("autono");
    expect(out).toBe("Accumulate compute until 0.5 DIEM/day; then build.");
  });

  it("uses cached value on subsequent calls within TTL", async () => {
    const md = `## Constitution\n\nFirst version of the constitution snippet here.`;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(md, { status: 200 }));
    const a = await getConstitutionSnippet("autono");
    const b = await getConstitutionSnippet("autono");
    expect(a).toBe(b);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
