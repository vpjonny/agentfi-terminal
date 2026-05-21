import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getDiemPriceUsd, _resetDiemPriceCache } from "../chain/diem-price";
import { DIEM_PRICE_USD } from "../constants";

function mockFetch(body: unknown, init: Partial<ResponseInit> = {}) {
  return vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, ...init }),
  );
}

const SUCCESS_BODY = {
  data: {
    id: "x",
    type: "token",
    attributes: {
      address: "0xf4d97f2da56e8c3098f3a8d538db630a2606a024",
      name: "Diem",
      symbol: "DIEM",
      decimals: 18,
      price_usd: "1.42",
      fdv_usd: null,
      market_cap_usd: null,
      total_supply: null,
    },
  },
};

describe("getDiemPriceUsd", () => {
  beforeEach(() => {
    _resetDiemPriceCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    _resetDiemPriceCache();
  });

  it("returns the GeckoTerminal price on success", async () => {
    mockFetch(SUCCESS_BODY);
    const price = await getDiemPriceUsd();
    expect(price).toBe(1.42);
  });

  it("caches within 5min window — second call doesn't hit fetch", async () => {
    const spy = mockFetch(SUCCESS_BODY);
    await getDiemPriceUsd();
    await getDiemPriceUsd();
    await getDiemPriceUsd();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to DIEM_PRICE_USD constant when fetch fails (500)", async () => {
    vi.spyOn(global, "fetch")
      .mockResolvedValue(new Response("", { status: 500 }))
      .mockResolvedValue(new Response("", { status: 500 }))
      .mockResolvedValue(new Response("", { status: 500 }));
    const price = await getDiemPriceUsd();
    expect(price).toBe(DIEM_PRICE_USD);
  });

  it("falls back when price_usd is null/missing", async () => {
    mockFetch({
      data: {
        id: "x",
        type: "token",
        attributes: {
          address: "0xf4d97f2da56e8c3098f3a8d538db630a2606a024",
          name: "Diem",
          symbol: "DIEM",
          decimals: 18,
          price_usd: null,
          fdv_usd: null,
          market_cap_usd: null,
          total_supply: null,
        },
      },
    });
    const price = await getDiemPriceUsd();
    expect(price).toBe(DIEM_PRICE_USD);
  });

  it("falls back when price_usd is 0 or negative", async () => {
    mockFetch({
      data: {
        id: "x",
        type: "token",
        attributes: { price_usd: "0", symbol: "DIEM", decimals: 18, name: "x", address: "x", fdv_usd: null, market_cap_usd: null, total_supply: null },
      },
    });
    const price = await getDiemPriceUsd();
    expect(price).toBe(DIEM_PRICE_USD);
  });
});
