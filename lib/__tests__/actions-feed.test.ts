import { describe, it, expect } from "vitest";
import { classifyTx, buildActionEvents } from "../actions-feed";
import type { EtherscanTx, EtherscanTokenTx } from "../chain/etherscan";

const WALLET = "0xAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaaAAAAaaaa";
const AGENT_LOWER = WALLET.toLowerCase();

const tx = (over: Partial<EtherscanTx>): EtherscanTx => ({
  blockNumber: "1",
  timeStamp: "1700000000",
  hash: "0xhash",
  from: WALLET,
  to: "0xrouter",
  value: "0",
  input: "0x",
  methodId: "0x",
  functionName: "",
  isError: "0",
  ...over,
});

const transfer = (over: Partial<EtherscanTokenTx>): EtherscanTokenTx => ({
  blockNumber: "1",
  timeStamp: "1700000000",
  hash: "0xhash",
  from: WALLET,
  to: "0xrouter",
  value: "1000000000000000000",
  tokenSymbol: "DIEM",
  tokenDecimal: "18",
  contractAddress: "0xdiem",
  ...over,
});

describe("classifyTx", () => {
  it("classifies CLAIM from functionName + inbound DIEM transfer", () => {
    const t = tx({ functionName: "claim(uint256)", to: WALLET });
    const transfers = [
      transfer({ to: WALLET, from: "0xrewards", value: "5000000000000000000" }),
    ];
    const result = classifyTx(t, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("CLAIM");
    expect(result.detail).toContain("DIEM");
    expect(result.detail).toContain("+5");
  });

  it("classifies STAKE from outbound DIEM transfer only", () => {
    const transfers = [
      transfer({
        from: WALLET,
        to: "0xstake",
        tokenSymbol: "DIEM",
        value: "2000000000000000000",
      }),
    ];
    const result = classifyTx(undefined, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("STAKE");
    expect(result.detail).toContain("DIEM");
  });

  it("classifies LP from multi-token transfer in same tx", () => {
    const transfers = [
      transfer({ tokenSymbol: "AUTONO", value: "1000000000000000000" }),
      transfer({ tokenSymbol: "WETH", value: "500000000000000000" }),
    ];
    const result = classifyTx(undefined, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("LP");
    expect(result.detail).toMatch(/paired/i);
  });

  it("classifies LP from single WETH transfer", () => {
    const transfers = [
      transfer({
        tokenSymbol: "WETH",
        value: "1500000000000000000",
        to: WALLET,
      }),
    ];
    const result = classifyTx(undefined, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("LP");
    expect(result.detail).toContain("WETH");
  });

  it("classifies SWAP from non-DIEM/WETH single transfer", () => {
    const transfers = [
      transfer({
        tokenSymbol: "USDC",
        tokenDecimal: "6",
        value: "5000000",
        to: WALLET,
      }),
    ];
    const result = classifyTx(undefined, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("SWAP");
    expect(result.detail).toContain("USDC");
  });

  it("falls back to LOG when no transfers and no functionName (don't misclassify as a trade)", () => {
    const result = classifyTx(tx({}), [], { agentWallet: WALLET });
    expect(result.type).toBe("LOG");
  });

  it("uses functionName hint over transfer shape when both present", () => {
    const t = tx({ functionName: "addLiquidity(...)" });
    const transfers = [
      transfer({ tokenSymbol: "USDC", value: "1000000", tokenDecimal: "6" }),
    ];
    const result = classifyTx(t, transfers, { agentWallet: WALLET });
    expect(result.type).toBe("LP");
  });

  it("agentLower comparison is case-insensitive", () => {
    const transfers = [
      transfer({
        to: WALLET.toUpperCase(),
        from: "0xrewards",
        tokenSymbol: "DIEM",
        value: "1000000000000000000",
      }),
    ];
    const result = classifyTx(undefined, transfers, { agentWallet: AGENT_LOWER });
    // to (uppercase) === agent (lowercase) → isInbound = true → CLAIM
    expect(result.type).toBe("CLAIM");
  });
});

describe("buildActionEvents", () => {
  it("groups transfers by txHash and orders by timestamp desc", () => {
    const txs: EtherscanTx[] = [
      tx({ hash: "0xa", timeStamp: "1700000100", functionName: "swap" }),
      tx({ hash: "0xb", timeStamp: "1700000200", functionName: "claim" }),
    ];
    const transfers: EtherscanTokenTx[] = [
      transfer({ hash: "0xa", tokenSymbol: "USDC", tokenDecimal: "6", value: "1000000" }),
      transfer({ hash: "0xb", tokenSymbol: "DIEM", to: WALLET, value: "3000000000000000000" }),
    ];
    const events = buildActionEvents(txs, transfers, { agentWallet: WALLET });
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("CLAIM");
    expect(events[1].type).toBe("SWAP");
  });

  it("skips errored txs", () => {
    const txs: EtherscanTx[] = [
      tx({ hash: "0xa", isError: "1", functionName: "swap" }),
      tx({ hash: "0xb", isError: "0", functionName: "claim", timeStamp: "1700000200" }),
    ];
    const transfers: EtherscanTokenTx[] = [
      transfer({ hash: "0xb", to: WALLET, value: "1000000000000000000" }),
    ];
    const events = buildActionEvents(txs, transfers, { agentWallet: WALLET });
    expect(events).toHaveLength(1);
    expect(events[0].txHash).toBe("0xb");
  });

  it("includes transfer-only entries (no matching tx in list)", () => {
    const transfers: EtherscanTokenTx[] = [
      transfer({
        hash: "0xc",
        timeStamp: "1700000300",
        to: WALLET,
        value: "2000000000000000000",
      }),
    ];
    const events = buildActionEvents([], transfers, { agentWallet: WALLET });
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("CLAIM");
  });

  it("caps to max events", () => {
    const txs: EtherscanTx[] = Array.from({ length: 8 }, (_, i) =>
      tx({ hash: `0x${i}`, timeStamp: String(1700000000 + i), functionName: "swap" }),
    );
    const events = buildActionEvents(txs, [], { agentWallet: WALLET }, 4);
    expect(events).toHaveLength(4);
  });

  it("returns empty array when no txs and no transfers", () => {
    const events = buildActionEvents([], [], { agentWallet: WALLET });
    expect(events).toEqual([]);
  });
});
