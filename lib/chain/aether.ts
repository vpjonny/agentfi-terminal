/**
 * Live AETHER snapshot — treasury-runway strategy.
 *
 * Treasury = USDC balance + WETH balance (× WETH spot) + native ETH (× WETH spot).
 * mcap = AETHER total supply × spot price.
 * multiple = mcap ÷ treasury.
 *
 * Caveat: AETHER's registry entry uses PLACEHOLDER addresses (lib/agents.ts).
 * When the placeholder is fetched Etherscan returns 0 balances and Gecko
 * returns price_usd=null; this function returns null so the caller falls
 * back to mock data. Once the real AETHER address ships, no code changes
 * needed — values just become non-zero.
 */

import { requireAgent } from "../agents";
import { treasuryRunway } from "../metrics/treasury-runway";
import type { ActionEvent, AgentSnapshot } from "../mock-data";
import {
  hasKey,
  getTokenSupply,
  getTokenBalance,
  getEthBalance,
} from "./etherscan";
import { getBaseToken } from "./geckoterminal";
import { BASE_TOKENS, BASE_TOKEN_DECIMALS } from "./constants";

const AETHER_DECIMALS = 18;

function fromBigIntString(raw: string, decimals: number): number {
  if (!raw || raw === "0") return 0;
  const bi = BigInt(raw);
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = bi / divisor;
  const frac = bi % divisor;
  return Number(whole) + Number(frac) / Number(divisor);
}

export async function getAetherSnapshotLive(): Promise<AgentSnapshot | null> {
  if (!hasKey()) return null;

  const agent = requireAgent("aether");

  // Parallel fetches
  const [aetherToken, wethToken, supplyRaw, usdcRaw, wethRaw, ethRaw] = await Promise.all([
    getBaseToken(agent.token).catch(() => null),
    getBaseToken(BASE_TOKENS.WETH).catch(() => null),
    getTokenSupply(agent.token).catch(() => "0"),
    getTokenBalance(agent.wallet, BASE_TOKENS.USDC).catch(() => "0"),
    getTokenBalance(agent.wallet, BASE_TOKENS.WETH).catch(() => "0"),
    getEthBalance(agent.wallet).catch(() => "0"),
  ]);

  const aetherPriceUsd = aetherToken?.price_usd ? Number(aetherToken.price_usd) : 0;
  const wethPriceUsd = wethToken?.price_usd ? Number(wethToken.price_usd) : 0;

  // If we have NEITHER an AETHER price NOR any treasury balance, fall back.
  // The placeholder address returns these all as 0 / null.
  const usdcUsd = fromBigIntString(usdcRaw, BASE_TOKEN_DECIMALS.USDC);
  const wethUsd = fromBigIntString(wethRaw, BASE_TOKEN_DECIMALS.WETH) * wethPriceUsd;
  const ethUsd = fromBigIntString(ethRaw, 18) * wethPriceUsd;

  const treasuryUsd = usdcUsd + wethUsd + ethUsd;

  if (aetherPriceUsd === 0 && treasuryUsd === 0) {
    return null;
  }

  const totalSupply = fromBigIntString(supplyRaw, AETHER_DECIMALS);
  const mcapUsd = aetherToken?.market_cap_usd
    ? Number(aetherToken.market_cap_usd)
    : totalSupply * aetherPriceUsd;

  // Monthly burn unknown without history — use 0 (runwayDays will be null).
  const metric = treasuryRunway({
    treasuryUsd,
    monthlyBurnUsd: 0,
    mcapUsd,
  });

  const recentActions: ActionEvent[] = [];
  const delta7dPct = 0;
  const multiple7d = new Array(12).fill(metric.multiple);

  return {
    slug: "aether",
    metric,
    delta7dPct,
    multiple7d,
    recentActions,
  };
}
