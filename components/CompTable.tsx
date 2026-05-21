import { listAgents } from "@/lib/agents";
import { listSnapshots } from "@/lib/mock-data";
import { CompTableClient, type CompRow } from "./CompTableClient";

const STRATEGY_LABEL: Record<string, string> = {
  "compute-valuation": "compute_val",
  "treasury-runway":   "treasury",
  "fee-revenue":       "fee_revenue",
};

export async function CompTable({ teaserRows }: { teaserRows?: number }) {
  const agents = listAgents();
  const snapshots = await listSnapshots();

  const rows = agents
    .map((a): CompRow | null => {
      const snap = snapshots.find((s) => s.slug === a.slug);
      if (!snap) return null;
      return {
        slug: a.slug,
        ticker: a.ticker,
        strategy: a.strategy,
        strategyLabel: STRATEGY_LABEL[a.strategy] ?? a.strategy,
        tagColorVar: a.tagColorVar,
        mcapUsd: snap.metric.primary.valueUsd,
        fundValUsd: snap.metric.secondary.valueUsd,
        multiple: snap.metric.multiple,
        delta7dPct: snap.delta7dPct,
        multiple7d: snap.multiple7d,
      };
    })
    .filter((r): r is CompRow => r !== null)
    .sort((a, b) => b.multiple - a.multiple)
    .slice(0, teaserRows ?? agents.length);

  return <CompTableClient rows={rows} />;
}
