/**
 * Constitution snippet fetcher.
 *
 * Pulls the first meaningful paragraph from an agent's published README,
 * caches it for 1h, and falls back to a sensible default when the fetch
 * fails or no agent has a configured source.
 *
 * Only AUTONO has a real source today; other agents return their fallback
 * verbatim. Designed to degrade gracefully — never throws, never blocks
 * the page render.
 */

const TTL_MS = 60 * 60 * 1000; // 1h

interface Sources {
  readmeUrl: string;
  fallback: string;
}

const SOURCES: Record<string, Sources> = {
  autono: {
    readmeUrl:
      "https://raw.githubusercontent.com/Liquid-Protocol-Ops/agent-autonomopoly/main/README.md",
    fallback:
      "Accumulate compute until 0.5 DIEM/day; then build.",
  },
};

const DEFAULT_FALLBACK = "—";

interface CacheEntry {
  text: string;
  ts: number;
}
const cache = new Map<string, CacheEntry>();

/**
 * Extract the first meaningful paragraph from a README:
 *   1. First paragraph after a `## Constitution` heading
 *   2. Else the first non-heading paragraph >40 chars
 *   3. Else null
 */
export function extractSnippet(markdown: string): string | null {
  const lines = markdown.split(/\r?\n/);

  // First pass: look for a Constitution-ish heading
  const headingIdx = lines.findIndex((l) =>
    /^#{1,6}\s+constitution\b/i.test(l.trim()),
  );
  if (headingIdx >= 0) {
    const para = collectParagraph(lines, headingIdx + 1);
    if (para) return stripMarkdown(para);
  }

  // Second pass: first non-heading paragraph >40 chars
  for (let i = 0; i < lines.length; i++) {
    if (/^#{1,6}\s/.test(lines[i].trim())) continue;
    const para = collectParagraph(lines, i);
    if (para && stripMarkdown(para).length > 40) {
      return stripMarkdown(para);
    }
    if (para) i = skipParagraph(lines, i);
  }

  return null;
}

function collectParagraph(lines: string[], start: number): string | null {
  // Skip blank lines + headings to find paragraph start
  let i = start;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === "" || /^#{1,6}\s/.test(t)) {
      i++;
      continue;
    }
    break;
  }
  if (i >= lines.length) return null;

  const buf: string[] = [];
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === "") break;
    if (/^#{1,6}\s/.test(t)) break;
    buf.push(t);
    i++;
  }
  return buf.length ? buf.join(" ") : null;
}

function skipParagraph(lines: string[], start: number): number {
  let i = start;
  while (i < lines.length && lines[i].trim() !== "") i++;
  return i;
}

function stripMarkdown(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

/**
 * Fetch + cache constitution snippet for an agent. Always resolves to a
 * string — falls back on any error.
 */
export async function getConstitutionSnippet(slug: string): Promise<string> {
  const src = SOURCES[slug];
  if (!src) return DEFAULT_FALLBACK;

  // Test/CI determinism: pinning short-circuits the network call so visual
  // snapshots stay byte-stable regardless of upstream README changes.
  if (process.env.PIN_CONSTITUTION_SNIPPET) {
    return process.env.PIN_CONSTITUTION_SNIPPET;
  }

  const now = Date.now();
  const cached = cache.get(slug);
  if (cached && now - cached.ts < TTL_MS) return cached.text;

  try {
    const res = await fetch(src.readmeUrl, { cache: "no-store" });
    if (!res.ok) return src.fallback;
    const md = await res.text();
    const snippet = extractSnippet(md);
    const text = snippet ?? src.fallback;
    cache.set(slug, { text, ts: now });
    return text;
  } catch {
    return src.fallback;
  }
}

/** Test-only: clear in-memory cache between cases. */
export function _resetCacheForTests(): void {
  cache.clear();
}
