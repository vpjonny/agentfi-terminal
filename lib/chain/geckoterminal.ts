/**
 * GeckoTerminal public API client.
 *
 * Free, no key required. Rate-limited at ~30 req/min on the public tier —
 * enough for hourly mcap + price reads but not real-time.
 * Docs: https://www.geckoterminal.com/dex-api
 */

const BASE_URL = "https://api.geckoterminal.com/api/v2";

interface GeckoTokenAttributes {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price_usd: string | null;
  fdv_usd: string | null;
  market_cap_usd: string | null;
  total_supply: string | null;
}

interface GeckoTokenResponse {
  data: {
    id: string;
    type: string;
    attributes: GeckoTokenAttributes;
  };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function geckoGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      if (!res.ok) throw new Error(`GeckoTerminal HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      await sleep(500 * Math.pow(2, attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("GeckoTerminal fetch failed");
}

/**
 * Get token attributes for a Base-chain ERC-20 by contract address.
 * Returns price_usd, total_supply, market_cap_usd if available.
 */
export async function getBaseToken(contractAddress: string): Promise<GeckoTokenAttributes> {
  const res = await geckoGet<GeckoTokenResponse>(
    `/networks/base/tokens/${contractAddress.toLowerCase()}`,
  );
  return res.data.attributes;
}
