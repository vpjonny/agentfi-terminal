import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Static-weight JetBrains Mono TTFs.
 *
 * We use static-weight files (not the variable axis file) because satori's
 * font parser crashes on the variable font at render time with:
 *   "TypeError: Cannot read properties of undefined (reading '256')"
 * The HEAD/status check returns 200 happily — the crash only surfaces when
 * the body is actually consumed (which vitest's status-only tests skip).
 *
 * Lives outside `public/` so files are bundled with the server function
 * rather than served as static assets (no HTTP round-trip at render time).
 *
 * Cached at module level — first hit reads, subsequent hits reuse.
 */
const cache: Record<string, Buffer> = {};

async function loadFontFile(filename: string): Promise<Buffer> {
  if (cache[filename]) return cache[filename];
  const fontPath = path.join(process.cwd(), "assets", "fonts", filename);
  cache[filename] = await readFile(fontPath);
  return cache[filename];
}

export function loadJetBrainsMonoRegular(): Promise<Buffer> {
  return loadFontFile("JetBrainsMono-Regular.ttf");
}

export function loadJetBrainsMonoBold(): Promise<Buffer> {
  return loadFontFile("JetBrainsMono-Bold.ttf");
}

/**
 * @deprecated Variable-weight TTF crashes satori at render time. Kept for
 * any caller that historically imported this name; routes to Regular.
 * Will be removed once all call sites migrate.
 */
export const loadJetBrainsMono = loadJetBrainsMonoRegular;
