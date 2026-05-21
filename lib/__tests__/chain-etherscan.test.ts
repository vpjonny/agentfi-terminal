import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as etherscan from "../chain/etherscan";

const ENVELOPE_OK = { status: "1", message: "OK", result: "12345" };

function mockFetch(body: unknown, init: Partial<ResponseInit> = {}) {
  return vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), { status: 200, ...init }),
  );
}

describe("etherscan v2 client", () => {
  const originalKey = process.env.ETHERSCAN_API_KEY;

  beforeEach(() => {
    process.env.ETHERSCAN_API_KEY = "test-key-123";
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ETHERSCAN_API_KEY;
    } else {
      process.env.ETHERSCAN_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("hasKey() returns false when env unset", () => {
    delete process.env.ETHERSCAN_API_KEY;
    expect(etherscan.hasKey()).toBe(false);
  });

  it("hasKey() returns true when env set", () => {
    expect(etherscan.hasKey()).toBe(true);
  });

  it("getTokenSupply hits the right URL with chainid=8453 + apikey", async () => {
    const spy = mockFetch(ENVELOPE_OK);
    await etherscan.getTokenSupply("0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e");
    expect(spy).toHaveBeenCalledOnce();
    const called = spy.mock.calls[0][0] as string;
    expect(called).toContain("chainid=8453");
    expect(called).toContain("module=stats");
    expect(called).toContain("action=tokensupply");
    expect(called).toContain("contractaddress=0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e");
    expect(called).toContain("apikey=test-key-123");
  });

  it("getTokenBalance includes tag=latest and address+contract params", async () => {
    const spy = mockFetch({ status: "1", message: "OK", result: "1000000000000000000" });
    await etherscan.getTokenBalance(
      "0x8767Df39eCeeaeB11554642237aC4E08660aB6A3",
      "0xf4d97f2da56e8c3098f3a8d538db630a2606a024",
    );
    const called = spy.mock.calls[0][0] as string;
    expect(called).toContain("module=account");
    expect(called).toContain("action=tokenbalance");
    expect(called).toContain("tag=latest");
    expect(called).toContain("address=0x8767Df39eCeeaeB11554642237aC4E08660aB6A3");
    expect(called).toContain("contractaddress=0xf4d97f2da56e8c3098f3a8d538db630a2606a024");
  });

  it("getTokenTransfers defaults to sort=desc, page=1, offset=20", async () => {
    const spy = mockFetch({ status: "1", message: "OK", result: [] });
    await etherscan.getTokenTransfers("0x8767Df39eCeeaeB11554642237aC4E08660aB6A3");
    const called = spy.mock.calls[0][0] as string;
    expect(called).toContain("sort=desc");
    expect(called).toContain("page=1");
    expect(called).toContain("offset=20");
  });

  it("throws when key missing", async () => {
    delete process.env.ETHERSCAN_API_KEY;
    await expect(
      etherscan.getTokenSupply("0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e"),
    ).rejects.toThrow(/ETHERSCAN_API_KEY/);
  });

  it("backs off and retries on 429", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ENVELOPE_OK), { status: 200 }));
    const result = await etherscan.getTokenSupply("0xabc");
    expect(result).toBe("12345");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("throws after 3 consecutive 429s (retries exhausted)", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValue(new Response("", { status: 429 }));
    await expect(etherscan.getTokenSupply("0xabc")).rejects.toThrow();
    // 3 attempts per the client's retry loop
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  it("retries on 5xx server errors then succeeds", async () => {
    const fetchSpy = vi.spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ENVELOPE_OK), { status: 200 }));
    const result = await etherscan.getTokenSupply("0xabc");
    expect(result).toBe("12345");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
