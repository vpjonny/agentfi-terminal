/**
 * TX classifier for agent wallet activity → ActionEvent[].
 *
 * Replaces the heuristic in chain/autono.ts. Cross-references the regular
 * tx list with token transfers (grouped by txHash), using:
 *   1. tx.functionName / methodId hints
 *   2. token-transfer counterparty + symbol
 *   3. fallback to SWAP
 *
 * Errored txs (`isError === "1"`) are skipped.
 *
 * Known limitations (v1):
 *   - MILESTONE detection requires threshold-cross context — out of scope here.
 *     Callers can append milestones post-classification.
 *   - LP detection requires multi-token transfer in same tx (we see WETH + AUTONO
 *     coming out together → LP add).
 */

import type { ActionEvent } from "./types";
import type { EtherscanTx, EtherscanTokenTx } from "./chain/etherscan";
import { fromBigIntString } from "./format";

const FN_HINTS: Array<{ match: RegExp; type: ActionEvent["type"] }> = [
  { match: /\bclaim\b/i, type: "CLAIM" },
  { match: /\bstake|deposit|bond\b/i, type: "STAKE" },
  { match: /\baddLiquidity|mint|modifyPosition|increaseLiquidity\b/i, type: "LP" },
  { match: /\bswap|exactInput|exactOutput\b/i, type: "SWAP" },
  { match: /\blog|emit|recordLog\b/i, type: "LOG" },
];

function formatAmount(n: number, symbol: string): string {
  const sign = n >= 0 ? "+" : "−";
  const abs = Math.abs(n);
  const fmt = abs >= 1 ? abs.toFixed(2) : abs.toFixed(4);
  return `${sign}${fmt} ${symbol}`;
}

function classifyByTransfers(
  transfers: EtherscanTokenTx[],
  agentLower: string,
): { type: ActionEvent["type"]; detail: string } | null {
  if (transfers.length === 0) return null;

  const distinctSymbols = new Set(transfers.map((t) => t.tokenSymbol));

  // Multi-token = LP add/remove
  if (distinctSymbols.size >= 2) {
    const symbols = Array.from(distinctSymbols).join(" + ");
    return { type: "LP", detail: `${symbols} paired` };
  }

  // Single-token: direction + symbol decides
  const t = transfers[0];
  const isInbound = t.to.toLowerCase() === agentLower;
  const symbol = t.tokenSymbol;
  const amount = fromBigIntString(t.value, Number(t.tokenDecimal || 18));

  if (symbol === "DIEM") {
    return isInbound
      ? { type: "CLAIM", detail: formatAmount(amount, "DIEM") }
      : { type: "STAKE", detail: formatAmount(-amount, "DIEM") };
  }
  if (symbol === "WETH" || symbol === "ETH") {
    return { type: "LP", detail: `${amount.toFixed(2)} ${symbol} paired` };
  }
  return {
    type: "SWAP",
    detail: formatAmount(isInbound ? amount : -amount, symbol),
  };
}

export interface ClassifyContext {
  agentWallet: string;
}

export function classifyTx(
  tx: EtherscanTx | undefined,
  transfers: EtherscanTokenTx[],
  ctx: ClassifyContext,
): { type: ActionEvent["type"]; detail: string } {
  const agentLower = ctx.agentWallet.toLowerCase();

  // Function-name hints from the regular tx (if available)
  if (tx?.functionName) {
    for (const { match, type } of FN_HINTS) {
      if (match.test(tx.functionName)) {
        const t = classifyByTransfers(transfers, agentLower);
        return t ? { type, detail: t.detail } : { type, detail: tx.functionName.slice(0, 40) };
      }
    }
  }

  // No method match — fall through to transfer-shape classification
  const byTransfers = classifyByTransfers(transfers, agentLower);
  if (byTransfers) return byTransfers;

  // No transfers + no method hint — log it rather than misclassify as a trade
  return { type: "LOG", detail: tx?.functionName?.slice(0, 40) ?? "—" };
}

/**
 * Build the recent-actions feed by cross-referencing a tx list with token
 * transfers, both sorted desc by timestamp. Returns up to `max` events.
 */
export function buildActionEvents(
  txs: EtherscanTx[],
  transfers: EtherscanTokenTx[],
  ctx: ClassifyContext,
  max = 4,
): ActionEvent[] {
  // Group transfers by tx hash
  const byHash = new Map<string, EtherscanTokenTx[]>();
  for (const t of transfers) {
    const k = t.hash;
    const arr = byHash.get(k) ?? [];
    arr.push(t);
    byHash.set(k, arr);
  }

  // Union of tx hashes from both lists, ordered by timestamp desc
  const seen = new Set<string>();
  const combined: { hash: string; ts: number; tx?: EtherscanTx; transfers: EtherscanTokenTx[] }[] = [];

  for (const tx of txs) {
    if (tx.isError === "1") continue;
    if (seen.has(tx.hash)) continue;
    seen.add(tx.hash);
    combined.push({
      hash: tx.hash,
      ts: Number(tx.timeStamp) * 1000,
      tx,
      transfers: byHash.get(tx.hash) ?? [],
    });
  }
  // Also include token-transfer txs that didn't appear in the regular tx list
  // (can happen if `from` was a contract, not the wallet)
  for (const [hash, trs] of byHash) {
    if (seen.has(hash)) continue;
    seen.add(hash);
    combined.push({
      hash,
      ts: Number(trs[0].timeStamp) * 1000,
      tx: undefined,
      transfers: trs,
    });
  }

  combined.sort((a, b) => b.ts - a.ts);

  const events: ActionEvent[] = [];
  for (const c of combined) {
    if (events.length >= max) break;
    const cls = classifyTx(c.tx, c.transfers, ctx);
    events.push({
      type: cls.type,
      detail: cls.detail,
      txHash: c.hash as `0x${string}`,
      ts: new Date(c.ts).toISOString(),
    });
  }
  return events;
}
