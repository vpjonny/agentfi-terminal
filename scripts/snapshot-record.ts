/**
 * CLI: fetch live AUTONO + record one snapshot entry to data/snapshots.json.
 *
 * Run on demand:    pnpm snapshot
 * Or via cron:      "0 * * * *" cd /path/to/agentfi-terminal && pnpm snapshot
 * (cron expression — once per hour at minute 0; "*-slash-60" was avoided here
 *  because the slash-asterisk sequence closes a JSDoc comment.)
 *
 * Idempotent within a 50-minute window — calling twice rapidly only writes once
 * (the chain-reads path itself throttles).
 */

import { getAutonoSnapshotLive } from "@/lib/chain/autono";
import { _countEntries, _storePath, getLatest } from "@/lib/db/snapshots-store";
import { hasKey } from "@/lib/chain/etherscan";

async function main() {
  if (!hasKey()) {
    console.error("ETHERSCAN_API_KEY not set in .env.local — cannot record live snapshot.");
    process.exit(2);
  }

  const before = await _countEntries();
  const snap = await getAutonoSnapshotLive();

  if (!snap) {
    console.error("Live snapshot returned null (unexpected — key present but fetch failed).");
    process.exit(3);
  }

  const after = await _countEntries();
  const latest = await getLatest("autono");

  console.log("agentfi · snapshot-record");
  console.log(`  store:           ${_storePath()}`);
  console.log(`  agent:           autono`);
  console.log(`  multiple:        ${snap.metric.multiple.toFixed(2)}×`);
  console.log(`  mcap:            $${snap.metric.primary.valueUsd.toLocaleString("en-US")}`);
  console.log(`  compute_val:     $${snap.metric.secondary.valueUsd.toLocaleString("en-US")}`);
  console.log(`  build_mode:      ${snap.buildMode?.state} · rate=${snap.buildMode?.rate.toFixed(3)} DIEM/day`);
  console.log(`  7d delta:        ${snap.delta7dPct.toFixed(2)}%`);
  console.log(`  entries before:  ${before}`);
  console.log(`  entries after:   ${after}  ${after === before ? "(no new write — throttled)" : "(+1)"}`);
  if (latest) {
    console.log(`  latest entry ts: ${new Date(latest.ts).toISOString()}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
