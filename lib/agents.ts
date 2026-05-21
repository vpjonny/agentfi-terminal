import type { Agent } from "./types";

const AGENTS: Record<string, Agent> = {
  autono: {
    slug: "autono",
    ticker: "AUTONO",
    token: "0xB3D7e0c3C39A1D3F1B304663065A2F83Ddf56d8e",
    wallet: "0x8767Df39eCeeaeB11554642237aC4E08660aB6A3",
    poolId: "0x84771828f44fcfbaae08e271ff74e272cc2934a3348ec724a475941185ce4eb9",
    strategy: "compute-valuation",
    tagColorVar: "--tag-autono",
    constitutionUrl: "https://autonomopoly.live/",
  },
  // ─── placeholders below — addresses are PLACEHOLDER, replace before launch ───
  ethy: {
    slug: "ethy",
    ticker: "ETHY",
    token: "0xEEEE000000000000000000000000000000000001",
    wallet: "0xEEEE000000000000000000000000000000000002",
    strategy: "fee-revenue",
    tagColorVar: "--tag-ethy",
  },
  bankr: {
    slug: "bankr",
    ticker: "BANKR",
    token: "0xBBBB000000000000000000000000000000000001",
    wallet: "0xBBBB000000000000000000000000000000000002",
    strategy: "fee-revenue",
    tagColorVar: "--tag-bankr",
  },
  aether: {
    slug: "aether",
    ticker: "AETHER",
    token: "0xAAAA000000000000000000000000000000000001",
    wallet: "0xAAAA000000000000000000000000000000000002",
    strategy: "treasury-runway",
    tagColorVar: "--tag-aether",
  },
};

export function getAgent(slug: string): Agent | undefined {
  return AGENTS[slug];
}

export function listAgents(): Agent[] {
  return Object.values(AGENTS);
}

export function requireAgent(slug: string): Agent {
  const agent = AGENTS[slug];
  if (!agent) throw new Error(`Agent not found: ${slug}`);
  return agent;
}
