/**
 * Live DIEM spot price via GeckoTerminal. Cached 5min in-memory.
 *
 * Replaces the hardcoded `$1.00` from `lib/constants.ts` so the compute
 * multiple methodology matches what the /methodology page documents:
 * compute_val = staked_diem × 365 × spot_diem_usd.
 *
 * Falls back to `DIEM_PRICE_USD` (1.0) on fetch failure — but the caller
 * gets a `source: "live" | "fallback"` flag via `getDiemPrice()` so the
 * UI can surface a "[stale price]" badge instead of silently lying.
 */

import { getBaseToken } from "./geckoterminal";
import { DIEM_PRICE_USD } from "../constants";

const DIEM_CONTRACT_BASE = "0xf4d97f2da56e8c3098f3a8d538db630a2606a024";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type PriceSource = "live" | "fallback";

interface DiemPrice {
  price: number;
  source: PriceSource;
}

let cache: { price: number; source: PriceSource; expiresAt: number } | null = null;

export function _resetDiemPriceCache(): void {
  cache = null;
}

/** Internal — returns price + source. */
export async function getDiemPrice(): Promise<DiemPrice> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return { price: cache.price, source: cache.source };
  }

  try {
    const attrs = await getBaseToken(DIEM_CONTRACT_BASE);
    const priceRaw = attrs.price_usd;
    const price = priceRaw != null ? Number(priceRaw) : NaN;
    if (!isFinite(price) || price <= 0) {
      throw new Error(`bad price_usd from GeckoTerminal: ${priceRaw}`);
    }
    cache = { price, source: "live", expiresAt: now + CACHE_TTL_MS };
    return { price, source: "live" };
  } catch (err) {
    console.warn("[diem-price] fetch failed, using fallback:", err);
    // Cache the fallback briefly too so we don't hammer Gecko while it's down
    cache = { price: DIEM_PRICE_USD, source: "fallback", expiresAt: now + 60_000 };
    return { price: DIEM_PRICE_USD, source: "fallback" };
  }
}

/** Back-compat: returns just the number. Prefer `getDiemPrice()` for new callers. */
export async function getDiemPriceUsd(): Promise<number> {
  const r = await getDiemPrice();
  return r.price;
}
