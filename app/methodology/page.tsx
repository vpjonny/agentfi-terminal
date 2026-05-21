import { getLatest } from "@/lib/db/snapshots-store";
import { getDiemPriceUsd } from "@/lib/chain/diem-price";
import { formatUsd, formatMultiple, abbrevAddress } from "@/lib/format";
import { listAgents } from "@/lib/agents";

export const metadata = {
  title: "methodology · agentfi.terminal",
  description: "How we value autonomous on-chain agents — three strategies, plain formulas, worked example.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    type: "article",
    title: "methodology · agentfi.terminal",
    description: "How we value autonomous on-chain agents — three strategies, plain formulas, worked example.",
  },
};

interface AutonoNumbers {
  stakedDiem: number;
  mcapUsd: number;
  multiple: number;
  diemPriceUsd: number;
  annualUsd: number;
  isLive: boolean;
}

async function loadAutonoNumbers(): Promise<AutonoNumbers> {
  const [latest, diemPriceUsd] = await Promise.all([
    getLatest("autono").catch(() => null),
    getDiemPriceUsd().catch(() => 1.0),
  ]);

  if (latest) {
    const annualUsd = latest.stakedDiem * 365 * diemPriceUsd;
    const multiple = annualUsd > 0 ? latest.multiple : 0;
    return {
      stakedDiem: latest.stakedDiem,
      mcapUsd: latest.mcapUsd,
      multiple,
      diemPriceUsd,
      annualUsd,
      isLive: true,
    };
  }

  // Mock-data fallback for cold-start (matches lib/mock-data.ts AUTONO entry)
  const stakedDiem = 17;
  const mcapUsd = 1_234_795;
  const annualUsd = stakedDiem * 365 * diemPriceUsd;
  // Guard against div-by-zero (zero stakedDiem on a fresh deploy)
  const multiple = annualUsd > 0 ? mcapUsd / annualUsd : 0;
  return {
    stakedDiem,
    mcapUsd,
    multiple,
    diemPriceUsd,
    annualUsd,
    isLive: false,
  };
}

const TOC = [
  { num: "00", id: "overview",     label: "overview" },
  { num: "01", id: "compute_val",  label: "compute_val" },
  { num: "02", id: "treasury",     label: "treasury" },
  { num: "03", id: "fee_revenue",  label: "fee_revenue" },
  { num: "04", id: "worked",       label: "worked example · AUTONO" },
  { num: "05", id: "verify",       label: "verify on-chain" },
];

export default async function MethodologyPage() {
  const autono = await loadAutonoNumbers();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12">
      {/* TOC rail */}
      <aside className="lg:col-span-2 hidden lg:block">
        <div className="sticky top-24 flex flex-col gap-1 text-[12px] font-mono">
          <div className="label-micro mb-2">contents</div>
          {TOC.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className="flex items-center gap-2 py-1 text-ink-secondary hover:text-signal transition-colors"
            >
              <span className="text-ink-tertiary w-5">{t.num}</span>
              <span>{t.label}</span>
            </a>
          ))}
          <div className="border-t border-ink-disabled mt-3 pt-3">
            <div className="label-micro">version</div>
            <div className="text-[11px] text-ink-tertiary mt-1">v0.1 · 2026-05-20</div>
          </div>
        </div>
      </aside>

      <article id="overview" className="lg:col-span-10 flex flex-col gap-10 max-w-3xl">
        <header className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <div className="label-micro">methodology</div>
            <span className="font-mono text-[11px] text-ink-tertiary">{"// v0.1"}</span>
          </div>
          <h1 className="font-serif text-[48px] leading-tight tracking-tight text-ink-primary">
            How we value autonomous agents
          </h1>
          <p className="font-sans text-[16px] leading-relaxed text-ink-secondary">
            Every agent on this terminal gets a single headline number — a <em>multiple</em> that
            compares its market cap to a fundamental measure of what the agent actually is or does.
            The fundamental is chosen per agent, declared in the registry, and rendered transparently
            on every card with a <code className="text-ink-primary">[i]</code> link back here.
          </p>
        </header>

      <Section id="compute_val" title="compute valuation" subtitle="for DIEM-staked agents (AUTONO)">
        <Formula>
          compute_val&nbsp;=&nbsp;staked_diem&nbsp;×&nbsp;365&nbsp;×&nbsp;spot_diem_usd
          <br />
          multiple&nbsp;=&nbsp;mcap&nbsp;÷&nbsp;compute_val
        </Formula>
        <p>
          The denominator is the dollar value of one year of API credit that the agent&apos;s
          staked DIEM affords (each 1 DIEM = $1/day of Venice AI inference). A multiple of{" "}
          <span className="text-signal">{formatMultiple(autono.multiple)}</span> means the market values the agent at {formatMultiple(autono.multiple).replace("×", "")} years
          of its current compute budget.
        </p>
        <Note>
          <strong className="text-ink-primary">DIEM pricing note:</strong> we use the live spot DIEM
          price, not a fixed $1 peg. The Venice $1/day claim is a redemption guarantee, but market
          price drifts. Using spot keeps the multiple from compressing artificially when DIEM
          trades above $1.
        </Note>

        <div id="worked" className="flex flex-col gap-3 border border-ink-disabled bg-bg-raised p-4 scroll-mt-24">
          <div className="flex items-center justify-between">
            <div className="label-micro">worked example · AUTONO</div>
            <div className="text-[11px] font-mono text-ink-tertiary">
              {autono.isLive ? "live · from indexer" : "mock · pre-indexer"}
            </div>
          </div>
          <ol className="flex flex-col gap-2 font-mono text-[13px] tabular-nums">
            <li className="flex items-center justify-between gap-3 border-b border-ink-disabled pb-2">
              <span className="text-ink-tertiary">staked_diem</span>
              <span className="text-ink-primary">{autono.stakedDiem.toFixed(2)} DIEM</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-ink-disabled pb-2">
              <span className="text-ink-tertiary">× 365 days</span>
              <span className="text-ink-secondary">{(autono.stakedDiem * 365).toFixed(0)} DIEM-days</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-ink-disabled pb-2">
              <span className="text-ink-tertiary">× spot_diem_usd</span>
              <span className="text-ink-secondary">${autono.diemPriceUsd.toFixed(4)}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-ink-disabled pb-2">
              <span className="text-ink-tertiary">= compute_val</span>
              <span className="text-ink-primary">{formatUsd(autono.annualUsd)}</span>
            </li>
            <li className="flex items-center justify-between gap-3 border-b border-ink-disabled pb-2">
              <span className="text-ink-tertiary">mcap</span>
              <span className="text-ink-primary">{formatUsd(autono.mcapUsd)}</span>
            </li>
            <li className="flex items-center justify-between gap-3 pt-1">
              <span className="text-ink-primary">multiple = mcap ÷ compute_val</span>
              <span className="text-signal text-[16px]">{formatMultiple(autono.multiple)}</span>
            </li>
          </ol>
        </div>
      </Section>

      <Section id="treasury" title="treasury runway" subtitle="for treasury-backed agents (AETHER)">
        <Formula>
          multiple&nbsp;=&nbsp;mcap&nbsp;÷&nbsp;treasury_usd
          <br />
          runway_days&nbsp;=&nbsp;30&nbsp;×&nbsp;treasury_usd&nbsp;÷&nbsp;monthly_burn_usd
        </Formula>
        <p>
          The agent&apos;s on-chain treasury is the fundamental. Multiple measures premium to NAV;
          runway is a sanity check on how long the treasury sustains observed burn.
        </p>
      </Section>

      <Section id="fee_revenue" title="fee revenue (P/F)" subtitle="for fee-earning agents (ETHY, BANKR)">
        <Formula>
          annualized_fees&nbsp;=&nbsp;fees_30d&nbsp;×&nbsp;12
          <br />
          multiple&nbsp;=&nbsp;mcap&nbsp;÷&nbsp;annualized_fees
        </Formula>
        <p>
          Classic price-to-fees ratio. 30-day fees from the agent&apos;s primary pool, annualized
          flat (no growth adjustment in v0.1). Lower multiple = cheaper per dollar of fee revenue.
        </p>
      </Section>

      <Section id="verify" title="verify on-chain" subtitle="every address links to basescan">
        <p className="text-[13px] text-ink-tertiary">
          Every number on this terminal is derivable from public on-chain state. Don&apos;t trust — verify.
        </p>
        <ul className="flex flex-col">
          {listAgents().map((a) => (
            <li
              key={a.slug}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-ink-disabled py-2 text-[13px]"
            >
              <span className="font-mono uppercase text-ink-primary">{a.ticker}</span>
              <a
                href={`https://basescan.org/token/${a.token}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-tertiary hover:text-signal"
              >
                token {abbrevAddress(a.token)} ↗
              </a>
              <a
                href={`https://basescan.org/address/${a.wallet}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-ink-tertiary hover:text-signal"
              >
                wallet {abbrevAddress(a.wallet)} ↗
              </a>
              <span className="ml-auto font-mono text-[11px] text-ink-tertiary uppercase tracking-[0.05em]">
                {a.strategy}
              </span>
            </li>
          ))}
        </ul>
      </Section>

        <footer className="flex flex-col gap-2 border-t border-ink-disabled pt-6 text-[12px] text-ink-tertiary">
          <div>v0.1 · last updated 2026-05-21</div>
          <div>
            Source code:{" "}
            <a
              href="https://github.com/vpjonny/agentfi-terminal"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-signal"
            >
              github.com/vpjonny/agentfi-terminal ↗
            </a>
          </div>
        </footer>
      </article>
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="flex flex-col gap-4 scroll-mt-24">
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-[28px] tracking-tight text-ink-primary">{title}</h2>
        <div className="font-mono text-[12px] tracking-[0.05em] uppercase text-ink-tertiary">
          {subtitle}
        </div>
      </div>
      <div className="font-sans text-[15px] leading-relaxed text-ink-secondary flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="border border-ink-disabled bg-bg-sunken px-4 py-3 font-mono text-[13px] text-ink-primary overflow-x-auto whitespace-pre-wrap">
      {children}
    </pre>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-warn bg-bg-sunken pl-4 py-2 text-[14px]">
      {children}
    </div>
  );
}
