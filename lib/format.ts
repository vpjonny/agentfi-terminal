import type { HexAddress } from "./types";

/** Abbreviate a 0x address: 0xB3D7e0c…6d8e */
export function abbrevAddress(hex: HexAddress | string, head = 6, tail = 4): string {
  if (!hex || hex.length < head + tail + 2) return hex;
  return `${hex.slice(0, head + 2)}…${hex.slice(-tail)}`;
}

/** $1.2M / $410K / $6,205 — magnitude suffix above 10k, otherwise raw with commas. */
export function formatUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)        return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

/** 199× / 1.4× / 8.4× — one decimal under 10, integer above. */
export function formatMultiple(n: number): string {
  if (!isFinite(n) || n <= 0) return "—";
  if (n >= 10) return `${Math.round(n)}×`;
  return `${n.toFixed(1)}×`;
}

/** Build a signed-percent string with leading ▲/▼. Returns { text, tone }. */
export function signedDelta(pct: number): { text: string; tone: "up" | "down" | "neutral" } {
  if (pct > 0)  return { text: `▲ ${pct.toFixed(0)}%`, tone: "up" };
  if (pct < 0)  return { text: `▼ ${Math.abs(pct).toFixed(0)}%`, tone: "down" };
  return { text: `${pct.toFixed(0)}%`, tone: "neutral" };
}

/** "0.15 DIEM·day" rate readout. */
export function formatRate(rate: number, unit = "DIEM·day"): string {
  return `${rate.toFixed(2)} ${unit}`;
}

/**
 * Convert a stringified bigint (e.g. "1234500000000000000000") to a Number
 * by dividing by 10^decimals. Preserves precision through the bigint divide,
 * then loses some at the final Number conversion (acceptable for display).
 */
export function fromBigIntString(raw: string, decimals: number): number {
  if (!raw || raw === "0") return 0;
  const bi = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = bi / divisor;
  const frac = bi % divisor;
  return Number(whole) + Number(frac) / Number(divisor);
}
