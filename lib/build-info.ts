/**
 * Build metadata exposed to the UI. Both fields are populated at build time
 * via env vars; falls back to safe defaults for local `next dev`.
 */

export interface BuildInfo {
  sha: string;       // 7-char git SHA or "dev"
  builtAt: string;   // ISO timestamp or "dev"
}

export function getBuildInfo(): BuildInfo {
  const rawSha = process.env.NEXT_PUBLIC_GIT_SHA ?? "dev";
  const sha = rawSha === "dev" ? "dev" : rawSha.slice(0, 7);
  const builtAt = process.env.NEXT_PUBLIC_BUILT_AT ?? "dev";
  return { sha, builtAt };
}

/**
 * Format a snapshot age (ms) into a compact label. Returns "—" for null.
 * Used in the footer next to the indexer state.
 */
export function formatAgeLabel(ageMs: number | null): string {
  if (ageMs == null) return "—";
  if (ageMs < 60_000) return "<1m";
  const min = Math.floor(ageMs / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}
