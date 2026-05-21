/**
 * Shared operational state gatherer. Used by both the JSON API at
 * `/api/health` (for monitoring) and the human-readable `/status` page.
 */

import { listAgents } from "./agents";
import { getLatest } from "./db/snapshots-store";
import { hasKey } from "./chain/etherscan";

export const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

export interface AgentFreshness {
  slug: string;
  ticker: string;
  hasSnapshot: boolean;
  ageMs: number | null;
  lastTs: number | null;
  stale: boolean;
}

export interface HealthState {
  ok: boolean;
  ts: string;
  checks: {
    snapshotStore: { ok: boolean; error?: string };
    etherscanKey: { ok: boolean };
    snapshotFreshness: AgentFreshness[];
  };
}

export async function getHealthState(): Promise<HealthState> {
  const now = Date.now();
  const agents = listAgents();

  let storeOk = true;
  let storeErr: string | undefined;
  const freshness: AgentFreshness[] = [];

  for (const a of agents) {
    try {
      const latest = await getLatest(a.slug);
      if (!latest) {
        freshness.push({
          slug: a.slug,
          ticker: a.ticker,
          hasSnapshot: false,
          ageMs: null,
          lastTs: null,
          stale: false,
        });
        continue;
      }
      const ageMs = now - latest.ts;
      freshness.push({
        slug: a.slug,
        ticker: a.ticker,
        hasSnapshot: true,
        ageMs,
        lastTs: latest.ts,
        stale: ageMs > STALE_THRESHOLD_MS,
      });
    } catch (err) {
      storeOk = false;
      storeErr = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  const etherscanOk = hasKey();
  const anyFresh = freshness.some((f) => f.hasSnapshot && !f.stale);
  const ok = storeOk && (anyFresh || freshness.every((f) => !f.hasSnapshot));

  return {
    ok,
    ts: new Date(now).toISOString(),
    checks: {
      snapshotStore: storeOk ? { ok: true } : { ok: false, error: storeErr },
      etherscanKey: { ok: etherscanOk },
      snapshotFreshness: freshness,
    },
  };
}
