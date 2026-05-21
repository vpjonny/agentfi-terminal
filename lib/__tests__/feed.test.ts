import { describe, it, expect } from "vitest";
import { buildFeed } from "../feed";

describe("buildFeed", () => {
  it("returns RSS 2.0 XML with channel + items", async () => {
    const xml = await buildFeed();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("<title>agentfi.terminal · recent actions</title>");
    expect(xml).toContain("<item>");
  });

  it("includes per-agent items with category + guid + link", async () => {
    const xml = await buildFeed();
    expect(xml).toMatch(/<category>(CLAIM|STAKE|LP|SWAP|LOG|MILESTONE)<\/category>/);
    expect(xml).toMatch(/<link>.*\/agent\/(autono|ethy|bankr|aether)<\/link>/);
    expect(xml).toMatch(/<guid isPermaLink="false">.*\/action\/0x/);
  });

  it("escapes special XML characters in detail strings", async () => {
    const xml = await buildFeed();
    // Should never contain unescaped < or > inside an item title
    const itemTitles = xml.match(/<title>([^<]+)<\/title>/g) ?? [];
    for (const t of itemTitles) {
      const inner = t.replace(/<\/?title>/g, "");
      expect(inner).not.toMatch(/[<>&](?!amp;|lt;|gt;|quot;|apos;)/);
    }
  });

  it("uses RFC-822 pubDate format", async () => {
    const xml = await buildFeed();
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/);
  });
});
