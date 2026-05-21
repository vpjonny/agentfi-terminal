/**
 * Etherscan v2 multichain client.
 *
 * One key works across all EVM chains via ?chainid=<n>. Base = 8453.
 * Docs: https://docs.etherscan.io/etherscan-v2
 *
 * Free tier: 5 req/sec, 100k req/day. The hourly snapshot indexer uses ~5 calls
 * per agent per hour → well under the cap.
 *
 * Falls back gracefully when ETHERSCAN_API_KEY is absent — `hasKey()` returns
 * false and callers should skip the chain read and use mock data.
 */

const BASE_URL = "https://api.etherscan.io/v2/api";
const CHAIN_ID_BASE = 8453;

export function hasKey(): boolean {
  return !!process.env.ETHERSCAN_API_KEY;
}

export interface EtherscanGetParams {
  module: string;
  action: string;
  [k: string]: string | number | undefined;
}

interface EtherscanEnvelope<T> {
  status: "0" | "1";
  message: string;
  result: T;
}

async function etherscanGet<T>(params: EtherscanGetParams): Promise<T> {
  const key = process.env.ETHERSCAN_API_KEY;
  if (!key) throw new Error("ETHERSCAN_API_KEY not set");

  const search = new URLSearchParams();
  search.set("chainid", String(CHAIN_ID_BASE));
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, String(v));
  }
  search.set("apikey", key);

  const url = `${BASE_URL}?${search.toString()}`;

  // Simple exponential backoff on 429 / 5xx
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.status === 429 || res.status >= 500) {
        await sleep(250 * Math.pow(2, attempt));
        continue;
      }
      if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);
      const body = (await res.json()) as EtherscanEnvelope<T>;
      if (body.status === "0") {
        // Etherscan returns status:0 for "no records" too — only throw on real errors
        if (typeof body.result === "string" && body.result.startsWith("Error")) {
          throw new Error(`Etherscan: ${body.message} (${body.result})`);
        }
      }
      return body.result;
    } catch (err) {
      lastErr = err;
      await sleep(250 * Math.pow(2, attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Etherscan fetch failed");
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Token total supply, raw integer string (no decimals applied). */
export async function getTokenSupply(contractAddress: string): Promise<string> {
  return etherscanGet<string>({
    module: "stats",
    action: "tokensupply",
    contractaddress: contractAddress,
  });
}

/** Token balance of an address, raw integer string. */
export async function getTokenBalance(
  walletAddress: string,
  contractAddress: string,
): Promise<string> {
  return etherscanGet<string>({
    module: "account",
    action: "tokenbalance",
    address: walletAddress,
    contractaddress: contractAddress,
    tag: "latest",
  });
}

/** Native ETH balance of an address, raw wei string. */
export async function getEthBalance(walletAddress: string): Promise<string> {
  return etherscanGet<string>({
    module: "account",
    action: "balance",
    address: walletAddress,
    tag: "latest",
  });
}

export interface EtherscanTokenTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
}

/** ERC-20 token transfers in/out of a wallet (most-recent first). */
export async function getTokenTransfers(
  walletAddress: string,
  opts: { page?: number; offset?: number } = {},
): Promise<EtherscanTokenTx[]> {
  return etherscanGet<EtherscanTokenTx[]>({
    module: "account",
    action: "tokentx",
    address: walletAddress,
    sort: "desc",
    page: opts.page ?? 1,
    offset: opts.offset ?? 20,
  });
}

export interface EtherscanTx {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  input: string;
  methodId: string;
  functionName: string;
  isError: string;
}

/** All txs sent from or to a wallet (most-recent first). */
export async function getTxList(
  walletAddress: string,
  opts: { page?: number; offset?: number } = {},
): Promise<EtherscanTx[]> {
  return etherscanGet<EtherscanTx[]>({
    module: "account",
    action: "txlist",
    address: walletAddress,
    sort: "desc",
    page: opts.page ?? 1,
    offset: opts.offset ?? 20,
  });
}
