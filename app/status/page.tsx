import Link from "next/link";
import { getHealthState } from "@/lib/health";
import { formatAgeLabel } from "@/lib/build-info";
import { Sparkline } from "@/components/Sparkline";
import { hasKey } from "@/lib/chain/etherscan";
import { breadcrumbListJsonLd } from "@/lib/jsonld";

export const metadata = {
  title: "status · agentfi.terminal",
  description: "Operational status — indexer freshness, chain data, build state.",
  alternates: { canonical: "/status" },
  openGraph: {
    type: "website",
    title: "status · agentfi.terminal",
    description: "Operational status — indexer freshness, chain data, build state.",
  },
};

const PILL_TONE = {
  fresh: "bg-up/15 text-up",
  stale: "bg-warn/15 text-warn",
  empty: "bg-ink-disabled/30 text-ink-tertiary",
} as const;

function stateOf(f: { hasSnapshot: boolean; stale: boolean }): keyof typeof PILL_TONE {
  if (!f.hasSnapshot) return "empty";
  return f.stale ? "stale" : "fresh";
}

export default async function StatusPage() {
  const state = await getHealthState();
  const breadcrumb = breadcrumbListJsonLd([
    { name: "terminal", url: "/" },
    { name: "status",   url: "/status" },
  ]);

  const overallTone = state.ok
    ? "border-up bg-up/5 text-up"
    : "border-down bg-down/5 text-down";

  return (
    <div className="flex flex-col gap-10 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <nav className="text-[12px] text-ink-tertiary" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-secondary">terminal</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-ink-secondary" aria-current="page">status</span>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-tight">Operational status</h1>
        <p className="text-[14px] text-ink-tertiary">
          Live state of the on-chain indexer and chain data. Updates hourly via the cron at <code className="font-mono text-ink-secondary">/api/cron/snapshot</code>.
        </p>
      </header>

      <section className={`border ${overallTone} px-4 py-3 text-[14px] tabular-nums`}>
        <div className="flex items-center justify-between">
          <span className="font-mono uppercase tracking-wide">
            overall · {state.ok ? "operational" : "degraded"}
          </span>
          <span className="text-ink-tertiary text-[12px]">
            as of {state.ts.replace("T", " ").slice(0, 19)} UTC
          </span>
        </div>
      </section>

      {/* System-check tiles — 4-cell grid */}
      <section className="flex flex-col gap-3">
        <div className="label-micro">system checks</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "indexer",     ok: state.checks.snapshotStore.ok, hint: "ok",     err: state.checks.snapshotStore.error },
            { label: "etherscan",   ok: hasKey(),                       hint: hasKey() ? "configured" : "absent",   err: undefined },
            { label: "snapshotter", ok: state.checks.snapshotStore.ok, hint: "hourly", err: undefined },
            { label: "satori og",   ok: true,                           hint: "edge",   err: undefined },
          ].map((c) => (
            <div
              key={c.label}
              className="flex flex-col gap-2 border border-ink-disabled bg-bg-raised px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="label-micro">{c.label}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-mono uppercase ${
                    c.ok ? "bg-up/15 text-up" : "bg-down/15 text-down"
                  }`}
                >
                  ● {c.ok ? "live" : "down"}
                </span>
              </div>
              <span className="font-mono text-[20px] font-bold text-ink-primary leading-none">
                {c.ok ? "ok" : c.err ?? "error"}
              </span>
              <span className="text-[11px] text-ink-tertiary">{c.hint}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="label-micro">per-agent indexer freshness</div>
        <ul className="flex flex-col">
          {state.checks.snapshotFreshness.map((f) => {
            const s = stateOf(f);
            return (
              <li
                key={f.slug}
                className="flex items-center justify-between border-b border-ink-disabled py-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/agent/${f.slug}`}
                    className="font-mono text-ink-primary hover:text-signal"
                  >
                    {f.ticker}
                  </Link>
                  <span className={`px-2 py-0.5 text-[11px] font-mono uppercase ${PILL_TONE[s]}`}>
                    {s}
                  </span>
                </div>
                <span className="text-ink-tertiary tabular-nums">
                  {f.hasSnapshot ? `last seen ${formatAgeLabel(f.ageMs)} ago` : "no snapshots yet"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Perf sparklines · last 24h (placeholder data — replace when telemetry lands) */}
      <section className="flex flex-col gap-3">
        <div className="label-micro">performance · last 24h</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "block lag (s)",      values: [1,1,0,1,0,1,1,0,0,1,1,0,1,1,1,0,0,1,1,0,1] },
            { label: "p50 query (ms)",     values: [30,32,28,31,29,30,33,34,30,28,31,29,30,32,31,30,28,29] },
            { label: "snap interval (min)", values: [60,60,61,60,59,60,60,61,60,60,59,60,61,60,60,59,60,60] },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 border border-ink-disabled bg-bg-raised p-4"
            >
              <div className="flex items-baseline justify-between">
                <span className="label-micro">{s.label}</span>
                <span className="text-[10px] text-ink-tertiary">p50</span>
              </div>
              <Sparkline values={s.values} width={300} height={48} stroke="var(--signal)" />
              <span className="text-[10px] text-ink-tertiary">
                placeholder — telemetry lands post-deploy
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="text-[12px] text-ink-tertiary">
        Programmatic access:{" "}
        <Link href="/api/health" className="hover:text-signal">
          /api/health
        </Link>{" "}
        — returns 200 when operational, 503 when degraded.
      </section>
    </div>
  );
}
