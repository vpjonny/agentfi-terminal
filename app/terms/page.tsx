import Link from "next/link";

export const metadata = {
  title: "terms · agentfi.terminal",
  description: "Terms of use for agentfi.terminal.",
  alternates: { canonical: "/terms" },
  openGraph: { type: "article", title: "terms · agentfi.terminal" },
};

export default function TermsPage() {
  return (
    <article className="flex flex-col gap-8 py-12 max-w-3xl">
      <nav className="text-[12px] text-ink-tertiary" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-secondary">terminal</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-ink-secondary" aria-current="page">terms</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="label-micro">terms · v0.1 · 2026-05-20</div>
        <h1 className="font-serif text-[40px] leading-tight text-ink-primary">Terms of use</h1>
      </header>

      <Section title="What this site is">
        <p>
          agentfi.terminal is a public dashboard that displays compute multiples and on-chain
          activity for autonomous agents on Base. Every number is derived from public on-chain state
          and clearly attributed via <Link href="/methodology" className="text-signal hover:underline">/methodology</Link>.
        </p>
      </Section>

      <Section title="Not investment advice">
        <p>
          Nothing on this site is investment advice, financial advice, tax advice, or any other kind of
          professional recommendation. The compute multiples, market caps, deltas, and projections
          shown are <strong>analytical metrics</strong> — they describe what is, not what you should do.
        </p>
        <p>
          Tokens listed here are public assets traded on permissionless markets. We do not endorse,
          recommend, or have any commercial relationship with the agents whose data we index. Holdings
          in any token can lose all of their value.
        </p>
      </Section>

      <Section title="Accuracy">
        <p>
          Data is fetched from third-party sources (Etherscan v2, GeckoTerminal, agent README files) and
          cached on a snapshot cadence (hourly when in production). Numbers shown may be stale by up to
          2 hours; see <Link href="/status" className="text-signal hover:underline">/status</Link> for
          current indexer freshness.
        </p>
        <p>
          The site degrades gracefully when external sources fail: a &ldquo;stale price&rdquo; badge is
          shown when the DIEM spot price can&apos;t be fetched. We do not guarantee accuracy beyond
          best-effort indexing.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The site is provided &ldquo;as is&rdquo; with no warranty of fitness, availability, accuracy, or
          non-infringement. We may take it offline or change methodology at any time. We are not
          liable for any decision made on the basis of information shown here.
        </p>
      </Section>

      <Section title="Verify on-chain">
        <p>
          The most important sentence on this site: <strong>don&apos;t trust — verify</strong>. Every
          token and wallet address on the methodology page links to{" "}
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal hover:underline"
          >
            basescan.org
          </a>
          . If a number here doesn&apos;t match what you see on-chain, the on-chain truth wins —
          please report the discrepancy.
        </p>
      </Section>

      <footer className="border-t border-ink-disabled pt-6 text-[12px] text-ink-tertiary">
        Last updated 2026-05-20. By using this site you accept these terms.
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-[22px] text-ink-primary">{title}</h2>
      <div className="font-sans text-[14px] leading-relaxed text-ink-secondary flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}
