/**
 * CLI: run the orchestrator against current mock snapshots and print
 * intended posts to stdout. Useful for verifying templates + materiality
 * during local dev without booting `next dev`.
 *
 * Run:   pnpm dry-run-poster
 */

import { processActions } from "@/lib/poster/orchestrator";
import { listAgents, getAgent } from "@/lib/agents";
import { listSnapshots } from "@/lib/mock-data";

function bar(width = 88) {
  return "─".repeat(width);
}

function pad(s: string, n: number) {
  if (s.length >= n) return s.slice(0, n);
  return s + " ".repeat(n - s.length);
}

async function main() {
  const snapshots = await listSnapshots();
  const actions = snapshots.flatMap((s) => {
    const agent = getAgent(s.slug);
    if (!agent) return [];
    return s.recentActions.map((a) => ({ agent, action: a }));
  });

  const metricBySlug = Object.fromEntries(snapshots.map((s) => [s.slug, s.metric]));
  const buildModeBySlug = Object.fromEntries(
    snapshots.filter((s) => s.buildMode).map((s) => [s.slug, s.buildMode!]),
  );

  const intended = processActions({
    actions,
    metricBySlug,
    buildModeBySlug,
  });

  const material = intended.filter((p) => p.decision.material);
  const skipped = intended.filter((p) => !p.decision.material);

  console.log(bar());
  console.log(
    `agentfi · dry-run-poster · ${new Date().toISOString()}\n` +
    `agents=${listAgents().length}  actions=${actions.length}  ` +
    `material=${material.length}  skipped=${skipped.length}`,
  );
  console.log(bar());

  if (material.length > 0) {
    console.log("\nINTENDED POSTS\n");
    for (const p of material) {
      console.log(
        `[${pad(p.surface, 9)}] ${p.agent.ticker} · ${p.action.type} · ${p.caption?.templateId}`,
      );
      console.log(`    ${p.caption?.text}`);
      console.log(`    og: ${p.ogUrl}`);
      if (p.caption && p.caption.warnings.length > 0) {
        console.log(`    ⚠ ${p.caption.warnings.join("; ")}`);
      }
      console.log("");
    }
  }

  if (skipped.length > 0) {
    console.log("SKIPPED\n");
    for (const p of skipped) {
      console.log(
        `[${pad(p.surface, 9)}] ${p.agent.ticker} · ${p.action.type} — ${p.decision.reason}`,
      );
    }
    console.log("");
  }

  console.log(bar());
  console.log(`dry-run complete. ${material.length} would post if live.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
