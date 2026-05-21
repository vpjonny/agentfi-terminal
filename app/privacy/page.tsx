import Link from "next/link";

export const metadata = {
  title: "privacy · agentfi.terminal",
  description: "Privacy policy for agentfi.terminal.",
  alternates: { canonical: "/privacy" },
  openGraph: { type: "article", title: "privacy · agentfi.terminal" },
};

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-8 py-12 max-w-3xl">
      <nav className="text-[12px] text-ink-tertiary" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-secondary">terminal</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-ink-secondary" aria-current="page">privacy</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="label-micro">privacy · v0.1 · 2026-05-20</div>
        <h1 className="font-serif text-[40px] leading-tight text-ink-primary">Privacy</h1>
      </header>

      <Section title="What we collect">
        <p>
          Nothing identifying. agentfi.terminal does not collect personal data, does not set tracking cookies,
          does not run third-party analytics, and does not require an account.
        </p>
        <p>
          Standard server access logs (IP address, user agent, request path, response status) may be retained
          by our hosting provider for operational and security purposes. We do not use these for analytics or
          marketing.
        </p>
      </Section>

      <Section title="What we display">
        <p>
          Every metric on this site is derived from <strong>public on-chain state</strong> on Base
          (Coinbase L2). Wallet addresses, token contracts, transaction hashes, and balances are public
          information indexed from the blockchain via{" "}
          <a
            href="https://docs.etherscan.io/etherscan-v2"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal hover:underline"
          >
            Etherscan v2
          </a>{" "}
          and{" "}
          <a
            href="https://www.geckoterminal.com/dex-api"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal hover:underline"
          >
            GeckoTerminal
          </a>
          .
        </p>
        <p>
          You can verify any address shown here on{" "}
          <a
            href="https://basescan.org"
            target="_blank"
            rel="noreferrer noopener"
            className="text-signal hover:underline"
          >
            basescan.org
          </a>{" "}
          — the <Link href="/methodology" className="text-signal hover:underline">/methodology</Link> page
          lists every agent&apos;s token and wallet with direct links.
        </p>
      </Section>

      <Section title="Cookies & local storage">
        <p>
          No cookies set by agentfi.terminal. No local storage used. No service worker.
          If your browser shows a cookie, it&apos;s from a third-party embed on a page you reached via a
          link from this site — not from us.
        </p>
      </Section>

      <Section title="Sharing">
        <p>
          We do not sell, rent, or share any data. There is no data to share.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about this policy or about how a specific number on the site is computed can be
          directed to the project repository (see footer).
        </p>
      </Section>

      <footer className="border-t border-ink-disabled pt-6 text-[12px] text-ink-tertiary">
        Last updated 2026-05-20. Changes posted here; check the date above to see when this page changed.
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
