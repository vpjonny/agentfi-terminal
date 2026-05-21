/**
 * JSON-LD builders for the schema.org structured-data scripts on each page.
 * Centralized so the SITE_URL resolution + escaping rules live in one place.
 */

import type { Agent } from "./types";
import { env } from "./env";

function siteUrl(): string {
  return env().siteUrl;
}

/**
 * Root-level Organization + WebSite linked via @graph.
 * Emit once from the root layout — every page inherits via DOM.
 */
export function rootJsonLd() {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#org`,
        name: "agentfi.terminal",
        url,
      },
      {
        "@type": "WebSite",
        "@id": `${url}/#site`,
        name: "agentfi.terminal",
        url,
        publisher: { "@id": `${url}/#org` },
      },
    ],
  };
}

/**
 * BreadcrumbList JSON-LD. Items in order, root → leaf.
 * Match the visible breadcrumb — mismatch hurts CTR per Google's docs.
 */
export function breadcrumbListJsonLd(items: Array<{ name: string; url: string }>) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${base}${it.url}`,
    })),
  };
}

/** Per-agent WebPage with nested SoftwareApplication. */
export function agentPageJsonLd(agent: Agent) {
  const url = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${agent.ticker} · agentfi.terminal`,
    description: `Live compute-valuation fundamentals for ${agent.ticker} on Base.`,
    url: `${url}/agent/${agent.slug}`,
    image: `${url}/og/agent/${agent.slug}`,
    about: {
      "@type": "SoftwareApplication",
      name: agent.ticker,
      applicationCategory: "DeFi Agent",
      operatingSystem: "Base",
      identifier: agent.token,
    },
  };
}
