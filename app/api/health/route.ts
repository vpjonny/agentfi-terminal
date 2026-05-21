/**
 * Health endpoint. Returns operational state of the indexer + chain data
 * as JSON for external uptime monitoring (UptimeRobot, BetterUptime).
 * The same state is consumed by the public /status page.
 */

import { NextResponse } from "next/server";
import { getHealthState } from "@/lib/health";

export async function GET() {
  const state = await getHealthState();
  return NextResponse.json(state, { status: state.ok ? 200 : 503 });
}
