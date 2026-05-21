/**
 * JSON listing of all registered agents with their current snapshot.
 * Used by LLMs and dashboards that don't want to scrape HTML or parse RSS.
 *
 * Returned shape is stable — additions go at the end of each object;
 * existing fields don't get renamed without a version bump.
 *
 * Rate-limited: 60 req/min per IP. Exceed → 429 with Retry-After.
 */

import { NextResponse } from "next/server";
import { listAgents } from "@/lib/agents";
import { listSnapshots } from "@/lib/mock-data";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const rl = checkRateLimit({
    name: "api-agents",
    key: clientKeyFromRequest(req),
    limit: 60,
    windowMs: 60_000,
  });

  const rlHeaders = {
    "x-ratelimit-limit": String(rl.limit),
    "x-ratelimit-remaining": String(rl.remaining),
    "x-ratelimit-reset": String(Math.floor(rl.resetAt / 1000)),
  };

  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfterMs: rl.retryAfterMs },
      {
        status: 429,
        headers: {
          ...rlHeaders,
          "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      },
    );
  }

  const ts = new Date().toISOString();
  const agents = listAgents();
  const snapshots = await listSnapshots();

  const items = agents.map((a) => {
    const snap = snapshots.find((s) => s.slug === a.slug);
    return {
      slug: a.slug,
      ticker: a.ticker,
      strategy: a.strategy,
      token: a.token,
      wallet: a.wallet,
      constitutionUrl: a.constitutionUrl ?? null,
      hasSnapshot: !!snap,
      metric: snap?.metric ?? null,
      multiple: snap?.metric.multiple ?? null,
      delta7dPct: snap?.delta7dPct ?? null,
      multiple7d: snap?.multiple7d ?? [],
      recentActions: snap?.recentActions ?? [],
    };
  });

  return NextResponse.json(
    { ts, count: items.length, agents: items },
    {
      headers: {
        ...rlHeaders,
        "cache-control": "public, max-age=300, s-maxage=300",
      },
    },
  );
}
