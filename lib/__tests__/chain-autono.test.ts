import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAutonoSnapshotLive } from "../chain/autono";

const STAKED_DIEM_RAW = "17000000000000000000"; // 17 DIEM at 18 decimals
const TOTAL_SUPPLY_RAW = "1000000000000000000000000"; // 1M AUTONO

function mockFetchSequence(responses: Array<{ status?: number; body: unknown }>) {
  let i = 0;
  return vi.spyOn(global, "fetch").mockImplementation(async () => {
    const r = responses[i++];
    if (!r) throw new Error("unexpected extra fetch call");
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 });
  });
}

describe("getAutonoSnapshotLive", () => {
  const originalKey = process.env.ETHERSCAN_API_KEY;

  beforeEach(() => {
    process.env.ETHERSCAN_API_KEY = "test-key";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ETHERSCAN_API_KEY;
    } else {
      process.env.ETHERSCAN_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("returns null when key missing (no chain calls made)", async () => {
    delete process.env.ETHERSCAN_API_KEY;
    const fetchSpy = vi.spyOn(global, "fetch");
    const snap = await getAutonoSnapshotLive();
    expect(snap).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("composes a real snapshot from chain reads", async () => {
    mockFetchSequence([
      // GeckoTerminal token attrs (price)
      {
        body: {
          data: {
            id: "x",
            type: "token",
            attributes: {
              address: "0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e",
              name: "AUTONO",
              symbol: "AUTONO",
              decimals: 18,
              price_usd: "1.235",
              fdv_usd: "1234795",
              market_cap_usd: "1234795",
              total_supply: TOTAL_SUPPLY_RAW,
            },
          },
        },
      },
      // Etherscan tokensupply
      { body: { status: "1", message: "OK", result: TOTAL_SUPPLY_RAW } },
      // Etherscan tokenbalance (DIEM balance)
      { body: { status: "1", message: "OK", result: STAKED_DIEM_RAW } },
      // Etherscan tokentx
      {
        body: {
          status: "1",
          message: "OK",
          result: [
            {
              blockNumber: "100",
              timeStamp: "1747588080",
              hash: "0xaaa",
              from: "0xpool",
              to: "0x8767Df39eCeeaeB11554642237aC4E08660aB6A3",
              value: "180000000000000000",
              tokenSymbol: "DIEM",
              tokenDecimal: "18",
              contractAddress: "0xf4d97f2da56e8c3098f3a8d538db630a2606a024",
            },
          ],
        },
      },
    ]);

    const snap = await getAutonoSnapshotLive();
    expect(snap).not.toBeNull();
    expect(snap!.slug).toBe("autono");
    expect(snap!.metric.label).toBe("COMPUTE MULTIPLE");
    // Mcap $1,234,795 / (17 × 365 × $1) ≈ 199×
    expect(Math.round(snap!.metric.multiple)).toBe(199);
    expect(snap!.recentActions).toHaveLength(1);
    expect(snap!.recentActions[0].type).toBe("CLAIM");
    expect(snap!.recentActions[0].detail).toContain("DIEM");
  });

  it("returns a snapshot even when tokentx fetch fails (uses [])", async () => {
    mockFetchSequence([
      {
        body: {
          data: {
            id: "x",
            type: "token",
            attributes: {
              address: "0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e",
              name: "AUTONO",
              symbol: "AUTONO",
              decimals: 18,
              price_usd: "1.0",
              fdv_usd: "1000000",
              market_cap_usd: "1000000",
              total_supply: TOTAL_SUPPLY_RAW,
            },
          },
        },
      },
      { body: { status: "1", message: "OK", result: TOTAL_SUPPLY_RAW } },
      { body: { status: "1", message: "OK", result: STAKED_DIEM_RAW } },
      // tokentx fails — but autono.ts catches and uses []
      { status: 500, body: { error: "boom" } },
      { status: 500, body: { error: "boom" } },
      { status: 500, body: { error: "boom" } },
    ]);

    const snap = await getAutonoSnapshotLive();
    expect(snap).not.toBeNull();
    expect(snap!.recentActions).toEqual([]);
  });
});
