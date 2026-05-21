import type { MetadataRoute } from "next";
import { listAgents } from "@/lib/agents";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`,             lastModified: now, changeFrequency: "hourly",  priority: 1.0 },
    { url: `${base}/comp`,         lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${base}/methodology`,  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/status`,       lastModified: now, changeFrequency: "hourly",  priority: 0.4 },
    { url: `${base}/feed.xml`,     lastModified: now, changeFrequency: "hourly",  priority: 0.3 },
    { url: `${base}/privacy`,      lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${base}/terms`,        lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  const agentEntries: MetadataRoute.Sitemap = listAgents().map((a) => ({
    url: `${base}/agent/${a.slug}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...agentEntries];
}
