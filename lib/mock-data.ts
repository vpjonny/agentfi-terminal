/**
 * AUTONO snapshot tries live Base chain data first (when ETHERSCAN_API_KEY is
 * set in .env.local); falls back to mock fixtures otherwise. ETHY / BANKR /
 * AETHER stay pure mock until a multi-agent indexer task lands.
 *
 * 5-min in-memory cache on the live AUTONO snapshot so multiple page renders
 * don't hammer Etherscan.
 */

import type { ActionEvent, BuildMode, MetricResult } from "./types";
import { getMetric } from "./metrics";
import { buildMode } from "./build-mode";
import { DIEM_PRICE_USD } from "./constants";
import { hasKey as etherscanHasKey } from "./chain/etherscan";
import { getAutonoSnapshotLive } from "./chain/autono";
import { getAetherSnapshotLive } from "./chain/aether";

export const MOCK_NOW_ISO = "2026-05-18T17:42:08Z";

export interface AgentSnapshot {
  slug: string;
  metric: MetricResult;
  buildMode?: BuildMode;
  delta7dPct: number;
  multiple7d: number[];
  recentActions: ActionEvent[];
  /** "live" when DIEM price came from GeckoTerminal; "fallback" when network failed
   *  and we used the $1.00 redemption-peg approximation. Surface this in the UI. */
  priceSource?: "live" | "fallback";
}

export type { ActionEvent };

const AUTONO_ACTIONS: ActionEvent[] = [
  {
    type: "CLAIM",
    detail: "+0.18 DIEM",
    txHash: "0x4a1f0c3e9bee0c3d7b62d9e6a36a3f7c2b1ffffeebb1c3e2d7c8a90b3a52b1f0",
    ts: "2026-05-18T17:28:00Z",
  },
  {
    type: "LP",
    detail: "0.5 ETH paired",
    txHash: "0x9100a6c47b3acdee08aaf4413ee08c9bdee10c3e7ff408bccaa30a73ee08ee08",
    ts: "2026-05-18T16:42:00Z",
  },
  {
    type: "LOG",
    detail: "“compute below threshold; accumulating”",
    txHash: "0x77a420aa3000ee30a7baa3000aa30bbcc9deef000aa30a7baa3000aa30ddaa30",
    ts: "2026-05-18T14:42:00Z",
  },
  {
    type: "MILESTONE",
    detail: "build_rate ▲ 30%",
    txHash: "0x12be4300aa00aa00bbcc1100aa00aa00bbcc1100aa00aa00bbcc1100aa00aa00",
    ts: "2026-05-18T09:55:00Z",
  },
];

const PLACEHOLDER_ACTIONS: ActionEvent[] = [
  {
    type: "SWAP",
    detail: "—",
    txHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    ts: "2026-05-18T12:00:00Z",
  },
];

export const SNAPSHOTS: Record<string, AgentSnapshot> = {
  autono: {
    slug: "autono",
    metric: getMetric({
      strategy: "compute-valuation",
      stakedDiem: 17,
      mcapUsd: 1_234_795,
      diemPriceUsd: DIEM_PRICE_USD,
    }),
    buildMode: buildMode({ rate: 0.15, threshold: 0.5, recentDailyDelta: 0.02 }),
    delta7dPct: 12,
    multiple7d: [178, 181, 175, 183, 188, 184, 191, 187, 193, 196, 198, 199],
    recentActions: AUTONO_ACTIONS,
  },
  ethy: {
    slug: "ethy",
    metric: getMetric({
      strategy: "fee-revenue",
      feesUsd30d: 410_000,
      mcapUsd: 14_300_000,
    }),
    delta7dPct: 3,
    multiple7d: [34, 34.5, 33.8, 35.1, 34.2, 35.4, 34.6, 35.2, 34.9, 35.3, 35.0, 35.1],
    recentActions: PLACEHOLDER_ACTIONS,
  },
  bankr: {
    slug: "bankr",
    metric: getMetric({
      strategy: "fee-revenue",
      feesUsd30d: 2_100_000,
      mcapUsd: 42_100_000,
    }),
    delta7dPct: -4,
    multiple7d: [21.2, 21.5, 21.8, 21.4, 21.0, 20.7, 20.5, 20.2, 20.4, 20.1, 19.9, 20.0],
    recentActions: PLACEHOLDER_ACTIONS,
  },
  aether: {
    slug: "aether",
    metric: getMetric({
      strategy: "treasury-runway",
      treasuryUsd: 620_000,
      monthlyBurnUsd: 50_000,
      mcapUsd: 890_000,
    }),
    delta7dPct: 22,
    multiple7d: [1.15, 1.18, 1.20, 1.22, 1.25, 1.28, 1.30, 1.32, 1.35, 1.37, 1.39, 1.43],
    recentActions: PLACEHOLDER_ACTIONS,
  },
};

/* ─── Live-or-mock plumbing ────────────────────────────────────────────── */

const CACHE_TTL_MS = 5 * 60 * 1000;
type SlugCache = { snap: AgentSnapshot; expiresAt: number };
const liveCache: Partial<Record<string, SlugCache>> = {};

/** Reset for tests. */
export function _resetAutonoCache() {
  delete liveCache.autono;
  delete liveCache.aether;
}

type LiveFetcher = () => Promise<AgentSnapshot | null>;

const LIVE_FETCHERS: Partial<Record<string, LiveFetcher>> = {
  autono: getAutonoSnapshotLive,
  aether: getAetherSnapshotLive,
  // ethy + bankr need V4 subgraph access — pure mock for now
};

async function resolveSlug(slug: string): Promise<AgentSnapshot | undefined> {
  const mock = SNAPSHOTS[slug];
  const fetcher = LIVE_FETCHERS[slug];
  if (!fetcher) return mock;

  const now = Date.now();
  const cached = liveCache[slug];
  if (cached && cached.expiresAt > now) return cached.snap;

  if (etherscanHasKey()) {
    try {
      const live = await fetcher();
      if (live) {
        liveCache[slug] = { snap: live, expiresAt: now + CACHE_TTL_MS };
        return live;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[${slug}] live fetch failed, falling back to mock:`, err);
    }
  }
  return mock;
}

export async function getSnapshot(slug: string): Promise<AgentSnapshot | undefined> {
  return resolveSlug(slug);
}

export async function listSnapshots(): Promise<AgentSnapshot[]> {
  const slugs = Object.keys(SNAPSHOTS);
  const resolved = await Promise.all(slugs.map((s) => resolveSlug(s)));
  return resolved.filter((s): s is AgentSnapshot => !!s);
}

/* Sync mock-only getters for tests + tools that can't await. */
export function getSnapshotMock(slug: string): AgentSnapshot | undefined {
  return SNAPSHOTS[slug];
}

export function listSnapshotsMock(): AgentSnapshot[] {
  return Object.values(SNAPSHOTS);
}
