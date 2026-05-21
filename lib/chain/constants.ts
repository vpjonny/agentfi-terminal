/**
 * Common Base-chain token addresses used across multiple agent strategies.
 * Kept in one place so a future "Base addressbook" update is one diff.
 */

export const BASE_TOKENS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
  WETH: "0x4200000000000000000000000000000000000006" as const,
  DIEM: "0xf4d97f2da56e8c3098f3a8d538db630a2606a024" as const,
} as const;

export const BASE_TOKEN_DECIMALS = {
  USDC: 6,
  WETH: 18,
  DIEM: 18,
} as const;
