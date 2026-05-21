/**
 * Live AUTONO snapshot from Base chain reads.
 *
 * Composes Etherscan v2 (supply / balance / tx history) and GeckoTerminal
 * (price / mcap). Returns the same `AgentSnapshot` shape as mock-data so
 * it's a drop-in replacement.
 *
 * Gate: returns null if ETHERSCAN_API_KEY is absent. Caller should fall
 * back to mock.
 */

import { requireAgent } from "../agents";
import { computeValuation } from "../metrics/compute-valuation";
import { buildMode } from "../build-mode";
import { fromBigIntString } from "../format";
import { getDiemPrice } from "./diem-price";
import type { ActionEvent, AgentSnapshot } from "../mock-data";
import {
  hasKey,
  getTokenSupply,
  getTokenBalance,
  getTokenTransfers,
  getTxList,
  type EtherscanTokenTx,
  type EtherscanTx,
} from "./etherscan";
import { getBaseToken } from "./geckoterminal";
import { buildActionEvents } from "../actions-feed";
import {
  recordSnapshot,
  getHistory,
  getLatest,
  type HistoryEntry,
} from "../db/snapshots-store";
import {
  derive7dDelta,
  deriveRecentRate,
  derive12ptTrail,
} from "../db/history";

const RECORD_THROTTLE_MS = 50 * 60 * 1000; // record if no entry in last 50min

const AUTONO_DECIMALS = 18;
const DIEM_DECIMALS = 18;
// DIEM token on Base — from plan doc
const DIEM_CONTRACT = "0xf4d97f2da56e8c3098f3a8d538db630a2606a024";

/**
 * Compose the AUTONO snapshot from live chain reads.
 *
 * Returns null when no API key is set — caller falls back to mock.
 * Throws only on hard fetch failures (caller should also fall back).
 */
export async function getAutonoSnapshotLive(): Promise<AgentSnapshot | null> {
  if (!hasKey()) return null;

  const agent = requireAgent("autono");

  // Parallel fetches — none depend on each other
  const [tokenAttrs, supplyRaw, dieRaw, transfers, txs, diemPrice] = await Promise.all([
    getBaseToken(agent.token),
    getTokenSupply(agent.token),
    getTokenBalance(agent.wallet, DIEM_CONTRACT),
    getTokenTransfers(agent.wallet, { offset: 20 }).catch(() => [] as EtherscanTokenTx[]),
    getTxList(agent.wallet, { offset: 20 }).catch(() => [] as EtherscanTx[]),
    getDiemPrice(),
  ]);
  const diemPriceUsd = diemPrice.price;

  const priceUsd = tokenAttrs.price_usd ? Number(tokenAttrs.price_usd) : 0;
  const totalSupply = fromBigIntString(supplyRaw, AUTONO_DECIMALS);
  const stakedDiem = fromBigIntString(dieRaw, DIEM_DECIMALS);

  // Prefer Gecko's mcap if circulating-supply-aware; fall back to FDV via supply*price.
  const mcapUsd = tokenAttrs.market_cap_usd
    ? Number(tokenAttrs.market_cap_usd)
    : totalSupply * priceUsd;

  const metric = computeValuation({
    stakedDiem,
    mcapUsd,
    diemPriceUsd,
  });

  // Record this snapshot to history if last one is >50min old (hourly cadence).
  const now = Date.now();
  const latest = await getLatest("autono").catch(() => null);
  if (!latest || now - latest.ts > RECORD_THROTTLE_MS) {
    const entry: HistoryEntry = {
      ts: now,
      slug: "autono",
      multiple: metric.multiple,
      mcapUsd,
      stakedDiem,
    };
    await recordSnapshot(entry).catch(() => {
      // Don't fail the snapshot render if disk write fails
    });
  }

  // Read history once and derive all three metrics from it
  const history = await getHistory("autono").catch(() => [] as HistoryEntry[]);
  const recentRate = deriveRecentRate(history, stakedDiem, now);
  const recentDailyDelta = recentRate; // for ETA projection
  const bm = buildMode({ rate: recentRate, threshold: 0.5, recentDailyDelta });
  const delta7dPct = derive7dDelta(history, metric.multiple, now);
  const multiple7d = derive12ptTrail(history, metric.multiple, now);

  const recentActions: ActionEvent[] = buildActionEvents(txs, transfers, {
    agentWallet: agent.wallet,
  });

  return {
    slug: "autono",
    metric,
    buildMode: bm,
    delta7dPct,
    multiple7d,
    recentActions,
    priceSource: diemPrice.source,
  };
}
