import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { StatusBar } from "@/components/StatusBar";
import { Footer, type IndexerState } from "@/components/Footer";
import { getBuildInfo, formatAgeLabel } from "@/lib/build-info";
import { getLatest } from "@/lib/db/snapshots-store";
import { listAgents } from "@/lib/agents";

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

import { rootJsonLd } from "@/lib/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "agentfi.terminal",
  description:
    "Compute-valuation terminal for autonomous on-chain agents. Live fundamentals for AgentFi on Base.",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    siteName: "agentfi.terminal",
    locale: "en_US",
    images: ["/og/comp"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/comp"],
  },
};

const ROOT_JSON_LD = rootJsonLd();

async function resolveIndexer(): Promise<{
  state: IndexerState;
  ageLabel: string;
  lastIso: string;
}> {
  const now = Date.now();
  let newestTs: number | null = null;
  for (const a of listAgents()) {
    try {
      const latest = await getLatest(a.slug);
      if (latest && (newestTs === null || latest.ts > newestTs)) {
        newestTs = latest.ts;
      }
    } catch {
      // ignore — treat as no snapshot
    }
  }
  if (newestTs === null) {
    return { state: "empty", ageLabel: "—", lastIso: "—" };
  }
  const ageMs = now - newestTs;
  const state: IndexerState = ageMs > STALE_THRESHOLD_MS ? "stale" : "fresh";
  return {
    state,
    ageLabel: formatAgeLabel(ageMs),
    lastIso: new Date(newestTs).toISOString().replace("T", " ").slice(0, 16) + " UTC",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { sha } = getBuildInfo();
  const indexer = await resolveIndexer().catch(() => ({
    state: "empty" as IndexerState,
    ageLabel: "—",
    lastIso: "—",
  }));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-bg-base text-ink-primary">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ROOT_JSON_LD) }}
        />
        <a href="#main-content" className="skip-link">skip to content</a>
        <StatusBar
          baseBlock={21481302}
          live={indexer.state === "fresh" ? "fresh" : indexer.state === "stale" ? "stale" : "fresh"}
        />
        <main id="main-content" className="flex-1 mx-auto w-full max-w-[1280px] px-6 py-8 bg-noise-overlay">
          {children}
        </main>
        <Footer
          lastSnapshotIso={indexer.lastIso}
          sha={sha}
          indexerState={indexer.state}
          indexerAgeLabel={indexer.ageLabel}
        />
      </body>
    </html>
  );
}
