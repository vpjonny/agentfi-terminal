/**
 * RSS 2.0 builder for the recent-actions feed.
 *
 * Gathers `recentActions` from every agent's snapshot, sorts by timestamp desc,
 * caps to MAX_ITEMS, and serializes to a minimal RSS 2.0 XML string.
 */

import { listAgents } from "./agents";
import { listSnapshots } from "./mock-data";
import type { ActionEvent, Agent } from "./types";

const MAX_ITEMS = 50;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

interface FeedItem {
  agent: Agent;
  action: ActionEvent;
  pubDate: Date;
}

export async function buildFeed(): Promise<string> {
  const base = siteUrl();
  const agents = listAgents();
  const snapshots = await listSnapshots();

  const items: FeedItem[] = [];
  for (const a of agents) {
    const snap = snapshots.find((s) => s.slug === a.slug);
    if (!snap) continue;
    for (const action of snap.recentActions) {
      const pubDate = new Date(action.ts);
      // Skip invalid dates rather than emitting NaN into the feed
      if (isNaN(pubDate.getTime())) continue;
      items.push({ agent: a, action, pubDate });
    }
  }

  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const top = items.slice(0, MAX_ITEMS);

  const lastBuildDate =
    top.length > 0 ? top[0].pubDate.toUTCString() : new Date().toUTCString();

  const itemXml = top.map((it) => renderItem(it, base)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>agentfi.terminal · recent actions</title>
    <link>${escapeXml(base)}</link>
    <description>Live on-chain action feed for autonomous agents on Base.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemXml}
  </channel>
</rss>`;
}

function renderItem(it: FeedItem, base: string): string {
  const { agent, action, pubDate } = it;
  const title = `[${action.type}] ${agent.ticker} · ${action.detail}`;
  const link = `${base}/agent/${agent.slug}`;
  const guid = `${base}/action/${action.txHash}`;
  const description = `${action.type} on ${agent.ticker}: ${action.detail}. Tx: ${action.txHash}`;
  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(action.type)}</category>
    </item>`;
}
