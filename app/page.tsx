import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { CompTable } from "@/components/CompTable";
import { Ticker } from "@/components/Ticker";
import { Sparkline } from "@/components/Sparkline";
import { listAgents, requireAgent } from "@/lib/agents";
import { getSnapshot, listSnapshots } from "@/lib/mock-data";
import { formatUsd, formatMultiple, signedDelta } from "@/lib/format";

export default async function Home() {
  const featured = requireAgent("autono");
  const snap = (await getSnapshot("autono"))!;
  const agents = listAgents();
  const snaps = await listSnapshots();

  const compRows = agents
    .map((a) => {
      const s = snaps.find((x) => x.slug === a.slug);
      if (!s) return null;
      return { agent: a, snap: s };
    })
    .filter((x): x is { agent: typeof agents[number]; snap: typeof snaps[number] } => x !== null);

  return (
    <div className="flex flex-col gap-12 pb-10 -mt-8">
      <Ticker />

      <header className="flex flex-col gap-5 pt-6">
        <Wordmark variant="full" cursor />
        <p className="font-sans text-ink-secondary max-w-xl text-[15px] leading-relaxed">
          Compute-valuation fundamentals for autonomous on-chain agents.
          Live terminal for AgentFi on Base — comp tables, action feeds,
          build-mode countdowns.
        </p>
      </header>

      {/* Brutalist hero: oversized number + agent rail */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-ink-disabled">
        <div className="lg:col-span-8 flex flex-col justify-between p-10 lg:border-r border-ink-disabled lg:border-b-0 border-b">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: `var(${featured.tagColorVar})` }}
              />
              <span className="font-mono text-[18px] font-bold tracking-[0.05em]">
                {featured.ticker}
              </span>
              <span className="text-[12px] text-ink-tertiary">
                liquid protocol · base
              </span>
            </div>
            <div className="label-micro">compute multiple · live</div>
          </div>

          <div
            className="font-mono font-bold text-signal leading-[0.85] tracking-[-0.04em] tabular-nums"
            style={{ fontSize: "clamp(120px, 22vw, 280px)" }}
          >
            {Math.round(snap.metric.multiple)}
            <span className="text-ink-primary">×</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="font-sans text-[13px] text-ink-secondary max-w-md">
              mcap {formatUsd(snap.metric.primary.valueUsd)} ÷ compute_val{" "}
              {formatUsd(snap.metric.secondary.valueUsd)}/yr. Read{" "}
              <Link href="/methodology" className="text-signal hover:underline">
                /methodology
              </Link>{" "}
              for what counts as compute.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href={`/agent/${featured.slug}`}
                className="border border-signal text-signal px-3 py-1.5 text-[12px] font-mono hover:bg-signal/10 transition-colors"
              >
                open {featured.ticker} ↗
              </Link>
              <Link
                href="/comp"
                className="border border-ink-tertiary text-ink-primary px-3 py-1.5 text-[12px] font-mono hover:border-signal hover:text-signal transition-colors"
              >
                all agents
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col">
          {compRows.map((r, i) => {
            const delta = signedDelta(r.snap.delta7dPct);
            const stroke =
              delta.tone === "up"
                ? "var(--up)"
                : delta.tone === "down"
                  ? "var(--down)"
                  : "var(--ink-secondary)";
            return (
              <Link
                key={r.agent.slug}
                href={`/agent/${r.agent.slug}`}
                className={`flex flex-col gap-1.5 px-5 py-4 hover:bg-bg-sunken transition-colors ${
                  i < compRows.length - 1 ? "border-b border-ink-disabled" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: `var(${r.agent.tagColorVar})` }}
                    />
                    <span className="font-mono font-bold tracking-[0.05em] text-[13px]">
                      {r.agent.ticker}
                    </span>
                  </div>
                  <span
                    className="font-mono font-bold text-[20px] tabular-nums"
                    style={{ color: `var(${r.agent.tagColorVar})` }}
                  >
                    {formatMultiple(r.snap.metric.multiple)}
                  </span>
                </div>
                <Sparkline
                  values={r.snap.multiple7d}
                  width={280}
                  height={28}
                  stroke={stroke}
                />
                <div className="flex items-center justify-between text-[11px] text-ink-tertiary tabular-nums">
                  <span
                    className={
                      delta.tone === "up"
                        ? "text-up"
                        : delta.tone === "down"
                          ? "text-down"
                          : ""
                    }
                  >
                    {delta.text}
                  </span>
                  <span>mcap {formatUsd(r.snap.metric.primary.valueUsd)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* What's a compute multiple + comp table teaser */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 border border-ink-disabled bg-bg-sunken p-5">
          <div className="label-micro mb-2">what is a compute multiple?</div>
          <p className="font-sans text-[13px] leading-relaxed text-ink-secondary">
            Treat mcap like a P/E ratio: divide it by a strategy-specific
            fundamental (compute_val, treasury, fee_revenue). Read{" "}
            <Link href="/methodology" className="text-signal hover:underline">
              /methodology
            </Link>{" "}
            for the formulas.
          </p>
          <div className="flex gap-2 mt-4">
            <Link
              href="/methodology"
              className="border border-signal text-signal px-3 py-1.5 text-[11px] font-mono hover:bg-signal/10 transition-colors"
            >
              methodology ↗
            </Link>
            <Link
              href="/api/agents"
              className="border border-ink-tertiary text-ink-primary px-3 py-1.5 text-[11px] font-mono hover:border-signal hover:text-signal transition-colors"
            >
              api docs
            </Link>
          </div>
        </div>
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <div className="label-micro">comp table · teaser</div>
            <Link href="/comp" className="text-[12px] text-ink-tertiary hover:text-signal">
              full comp →
            </Link>
          </div>
          <div className="border border-ink-disabled bg-bg-raised">
            <CompTable teaserRows={3} />
          </div>
        </div>
      </section>
    </div>
  );
}
