import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAetherSnapshotLive } from "../chain/aether";

function mockFetchSequence(responses: Array<{ status?: number; body: unknown }>) {
  let i = 0;
  return vi.spyOn(global, "fetch").mockImplementation(async () => {
    const r = responses[i++];
    if (!r) throw new Error(`unexpected extra fetch call (#${i})`);
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  });
}

describe("getAetherSnapshotLive", () => {
  const originalKey = process.env.ETHERSCAN_API_KEY;

  beforeEach(() => {
    process.env.ETHERSCAN_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ETHERSCAN_API_KEY;
    else process.env.ETHERSCAN_API_KEY = originalKey;
    vi.restoreAllMocks();
  });

  it("returns null with no key", async () => {
    delete process.env.ETHERSCAN_API_KEY;
    const snap = await getAetherSnapshotLive();
    expect(snap).toBeNull();
  });

  it("returns null when placeholder address has zero balance + no price (gracefully falls back)", async () => {
    mockFetchSequence([
      // AETHER token (price=null for placeholder)
      { body: { data: { id: "x", type: "token", attributes: { price_usd: null, symbol: "AETHER", decimals: 18, name: "x", address: "x", fdv_usd: null, market_cap_usd: null, total_supply: null } } } },
      // WETH token
      { body: { data: { id: "x", type: "token", attributes: { price_usd: "3000", symbol: "WETH", decimals: 18, name: "x", address: "x", fdv_usd: null, market_cap_usd: null, total_supply: null } } } },
      // AETHER supply
      { body: { status: "1", message: "OK", result: "0" } },
      // USDC balance
      { body: { status: "1", message: "OK", result: "0" } },
      // WETH balance
      { body: { status: "1", message: "OK", result: "0" } },
      // ETH balance
      { body: { status: "1", message: "OK", result: "0" } },
    ]);

    const snap = await getAetherSnapshotLive();
    expect(snap).toBeNull();
  });

  it("composes a snapshot with treasury when balances + price are non-zero", async () => {
    mockFetchSequence([
      // AETHER token
      { body: { data: { id: "x", type: "token", attributes: { price_usd: "0.5", symbol: "AETHER", decimals: 18, name: "x", address: "x", fdv_usd: "890000", market_cap_usd: "890000", total_supply: null } } } },
      // WETH token
      { body: { data: { id: "x", type: "token", attributes: { price_usd: "3000", symbol: "WETH", decimals: 18, name: "x", address: "x", fdv_usd: null, market_cap_usd: null, total_supply: null } } } },
      // AETHER supply (1,780,000 AETHER × $0.5 = $890K)
      { body: { status: "1", message: "OK", result: "1780000000000000000000000" } },
      // USDC balance: 500,000 USDC (6 decimals)
      { body: { status: "1", message: "OK", result: "500000000000" } },
      // WETH balance: 40 WETH × $3000 = $120K
      { body: { status: "1", message: "OK", result: "40000000000000000000" } },
      // ETH balance: 0
      { body: { status: "1", message: "OK", result: "0" } },
    ]);

    const snap = await getAetherSnapshotLive();
    expect(snap).not.toBeNull();
    expect(snap!.slug).toBe("aether");
    // treasury = 500K USDC + 40 × 3000 WETH = 620K
    expect(snap!.metric.secondary.valueUsd).toBeCloseTo(620_000, -2);
    // mcap = $890K (from Gecko)
    expect(snap!.metric.primary.valueUsd).toBe(890_000);
    // multiple = 890K / 620K ≈ 1.44×
    expect(snap!.metric.multiple).toBeCloseTo(890_000 / 620_000, 2);
    expect(snap!.metric.label).toBe("RUNWAY MULTIPLE");
  });
});
