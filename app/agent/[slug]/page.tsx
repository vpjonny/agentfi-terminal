import { notFound } from "next/navigation";
import Link from "next/link";
import { AgentCard } from "@/components/AgentCard";
import { MetricsStrip } from "@/components/MetricsStrip";
import { BuildModeCountdown } from "@/components/BuildModeCountdown";
import { ActionsFeed } from "@/components/ActionsFeed";
import { HistoryChart } from "@/components/HistoryChart";
import { getAgent, listAgents } from "@/lib/agents";
import { getSnapshot } from "@/lib/mock-data";
import { buildMode } from "@/lib/build-mode";
import { getHistory } from "@/lib/db/snapshots-store";
import { getConstitutionSnippet } from "@/lib/chain/constitution";
import { agentPageJsonLd, breadcrumbListJsonLd } from "@/lib/jsonld";
import { formatMultiple, formatUsd } from "@/lib/format";

export async function generateStaticParams() {
  return listAgents().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: "agent not found · agentfi.terminal" };
  return {
    title: `${agent.ticker} · agentfi.terminal`,
    description: `Live compute-valuation fundamentals for ${agent.ticker} on Base.`,
    alternates: { canonical: `/agent/${agent.slug}` },
    openGraph: {
      type: "website",
      title: `${agent.ticker} · agentfi.terminal`,
      description: `Live compute-valuation fundamentals for ${agent.ticker} on Base.`,
      images: [`/og/agent/${agent.slug}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${agent.ticker} · agentfi.terminal`,
      images: [`/og/agent/${agent.slug}`],
    },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();
  const snap = await getSnapshot(slug);
  if (!snap) notFound();

  const bm = snap.buildMode ?? buildMode({ rate: 0, threshold: 0.5 });
  const [history, constitutionSnippet] = await Promise.all([
    getHistory(slug).catch(() => []),
    getConstitutionSnippet(slug).catch(() => "—"),
  ]);

  const stripEntries = [
    { label: snap.metric.primary.label,   valueUsd: snap.metric.primary.valueUsd,   delta7dPct: snap.delta7dPct },
    { label: snap.metric.secondary.label, valueUsd: snap.metric.secondary.valueUsd },
    { label: "treasury",                  valueText: "—", hint: "indexer pending" },
    { label: "staked DIEM",               valueText: history.length > 0 ? `${history[history.length - 1].stakedDiem.toFixed(2)}` : "—", hint: "DIEM" },
    { label: "holders",                   valueText: "—", hint: "indexer pending" },
    { label: "actions/24h",               valueText: String(snap.recentActions.length), hint: "live" },
  ];

  const jsonLd = agentPageJsonLd(agent);
  const breadcrumb = breadcrumbListJsonLd([
    { name: "terminal", url: "/" },
    { name: "comp",     url: "/comp" },
    { name: agent.ticker, url: `/agent/${agent.slug}` },
  ]);

  return (
    <div className="flex flex-col gap-10 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <nav className="text-[12px] text-ink-tertiary" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-secondary">terminal</Link>
        <span className="mx-2" aria-hidden>/</span>
        <Link href="/comp" className="hover:text-ink-secondary">comp</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-ink-secondary" aria-current="page">{agent.ticker}</span>
        {snap.priceSource === "fallback" && (
          <span
            className="ml-3 px-2 py-0.5 border border-warn text-warn text-[10px] font-mono uppercase"
            title="DIEM spot price unavailable — using $1.00 redemption-peg approximation"
          >
            stale price
          </span>
        )}
      </nav>

      <AgentCard
        agent={agent}
        metric={snap.metric}
        buildMode={bm}
        recentActions={snap.recentActions.slice(0, 3)}
        utcClock="17:42:08 UTC"
        mode="live"
      />

      <MetricsStrip entries={stripEntries} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ActionsFeed actions={snap.recentActions} nowIso={new Date().toISOString()} />
        </div>
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <BuildModeCountdown buildMode={bm} />
          {agent.constitutionUrl && (
            <section className="flex flex-col gap-2 border border-ink-disabled bg-bg-raised p-4">
              <div className="label-micro">constitution</div>
              <p className="font-serif text-[14px] leading-relaxed text-ink-secondary">
                “{constitutionSnippet}”
              </p>
              <a
                href={agent.constitutionUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[12px] text-ink-tertiary hover:text-signal"
              >
                read full → {agent.constitutionUrl}
              </a>
            </section>
          )}
        </aside>
      </div>

      <section className="flex flex-col gap-4">
        <div className="label-micro">trends · last 7d</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HistoryChart
            history={history}
            selectValue={(e) => e.multiple}
            title="compute multiple"
            format={(n) => formatMultiple(n)}
            tone="signal"
          />
          <HistoryChart
            history={history}
            selectValue={(e) => e.mcapUsd}
            title="mcap"
            format={(n) => formatUsd(n)}
            tone="secondary"
          />
          <HistoryChart
            history={history}
            selectValue={(e) => e.stakedDiem}
            title="staked DIEM"
            format={(n) => `${n.toFixed(2)}`}
            tone="up"
          />
        </div>
      </section>
    </div>
  );
}
