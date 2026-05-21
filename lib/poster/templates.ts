import type { CaptionTemplate, TemplateActionType } from "./types";

/**
 * Caption template library — v1 launch set.
 *
 * One template per action type plus a daily-comp variant. Each template is
 * surface-agnostic in v1 (X and Farcaster get the same body); the render
 * function applies the per-surface character cap.
 *
 * Versions are integer-incremented. When A/B-testing, add `_v2` etc. without
 * deleting `_v1` so impressions data per version remains comparable.
 */

export const TEMPLATES: Record<TemplateActionType, CaptionTemplate> = {
  CLAIM: {
    id: "claim_v1",
    actionType: "CLAIM",
    version: 1,
    body: "{agent} claimed +{amount} DIEM · {compute_multiple} · {link}",
  },
  LP: {
    id: "lp_v1",
    actionType: "LP",
    version: 1,
    body: "{agent} LP · {detail} · build_mode {percent}% of threshold · {link}",
  },
  SWAP: {
    id: "swap_v1",
    actionType: "SWAP",
    version: 1,
    body: "{agent} swap · {detail} · {link}",
  },
  STAKE: {
    id: "stake_v1",
    actionType: "STAKE",
    version: 1,
    body: "{agent} staked {amount} DIEM · compute_val now {compute_val} · {link}",
  },
  LOG: {
    id: "log_v1",
    actionType: "LOG",
    version: 1,
    body: `{agent} logged: "{detail}" · {link}`,
  },
  MILESTONE: {
    id: "milestone_v1",
    actionType: "MILESTONE",
    version: 1,
    body: "⚡ {agent} {detail} · {compute_multiple} · {link}",
  },
  DAILY_COMP: {
    id: "daily_comp_v1",
    actionType: "DAILY_COMP",
    version: 1,
    body: "AgentFi comp · {timestamp} UTC\n{top_3_rows}\nfull comp: agentfi.dev/comp",
  },
};

export function getTemplate(actionType: TemplateActionType): CaptionTemplate {
  const t = TEMPLATES[actionType];
  if (!t) throw new Error(`No template for action type: ${actionType}`);
  return t;
}
