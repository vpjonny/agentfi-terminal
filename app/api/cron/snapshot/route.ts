/**
 * GET /api/cron/snapshot
 *
 * Cron-callable endpoint that records one live AUTONO snapshot to the history
 * store. Vercel cron uses GET. Bearer-gated via CRON_SECRET.
 *
 * Returns JSON:
 *   { ok: true, recorded: true,  multiple, mcapUsd, computeValUsd, durationMs }
 *   { ok: true, recorded: false, reason: "no etherscan key" }     // 200
 *   { ok: false, error: "unauthorized" }                          // 401
 */

import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/bearer";
import { hasKey } from "@/lib/chain/etherscan";
import { getAutonoSnapshotLive } from "@/lib/chain/autono";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!hasKey()) {
    return NextResponse.json({
      ok: true,
      recorded: false,
      reason: "no etherscan key — set ETHERSCAN_API_KEY in env to enable live snapshots",
    });
  }

  const t0 = Date.now();
  try {
    const snap = await getAutonoSnapshotLive();
    if (!snap) {
      return NextResponse.json({
        ok: true,
        recorded: false,
        reason: "live fetch returned null",
      });
    }
    return NextResponse.json({
      ok: true,
      recorded: true,
      slug: snap.slug,
      multiple: Number(snap.metric.multiple.toFixed(4)),
      mcapUsd: snap.metric.primary.valueUsd,
      computeValUsd: snap.metric.secondary.valueUsd,
      buildModeRate: snap.buildMode?.rate ?? 0,
      delta7dPct: Number(snap.delta7dPct.toFixed(2)),
      durationMs: Date.now() - t0,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "snapshot failed",
        message: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t0,
      },
      { status: 500 },
    );
  }
}

// Allow POST too for manual testing with curl -X POST
export const POST = GET;
