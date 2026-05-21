import type { ActionEvent } from "../types";
import { parseDiemAmount } from "./amount-parse";

export interface MaterialityContext {
  /**
   * Actions already posted in the last 24h (used for LOG dedupe).
   * Caller is responsible for filtering to-last-24h.
   */
  recentlyPosted: ActionEvent[];
  /**
   * How many auto-posts have gone out on this surface today (UTC day).
   */
  dayPostCount: number;
  /**
   * Optional override of the daily cap. Defaults to 5 per plan §Day 6.
   */
  dayCap?: number;
}

export interface MaterialityVerdict {
  material: boolean;
  reason: string;
}

const DEFAULT_DAY_CAP = 5;
const CLAIM_MIN_DIEM = 0.1;
const LOG_MIN_LENGTH = 8;

const ALWAYS_MATERIAL = new Set<ActionEvent["type"]>(["LP", "SWAP", "STAKE", "MILESTONE"]);

export function evaluate(action: ActionEvent, ctx: MaterialityContext): MaterialityVerdict {
  // Cap check runs first — even material actions are skipped when the day is full.
  const cap = ctx.dayCap ?? DEFAULT_DAY_CAP;
  if (ctx.dayPostCount >= cap) {
    return { material: false, reason: `daily cap reached (${cap})` };
  }

  if (ALWAYS_MATERIAL.has(action.type)) {
    return { material: true, reason: `${action.type.toLowerCase()} is always material` };
  }

  if (action.type === "CLAIM") {
    const amount = parseDiemAmount(action.detail);
    if (amount == null) {
      return { material: false, reason: "claim without a parseable DIEM amount" };
    }
    if (Math.abs(amount) <= CLAIM_MIN_DIEM) {
      return {
        material: false,
        reason: `claim ${amount} DIEM ≤ threshold ${CLAIM_MIN_DIEM}`,
      };
    }
    return { material: true, reason: `claim ${amount} DIEM > ${CLAIM_MIN_DIEM}` };
  }

  if (action.type === "LOG") {
    if (action.detail.trim().length <= LOG_MIN_LENGTH) {
      return { material: false, reason: `log too short (≤${LOG_MIN_LENGTH} chars)` };
    }
    const dup = ctx.recentlyPosted.find(
      (a) => a.type === "LOG" && a.detail.trim() === action.detail.trim(),
    );
    if (dup) {
      return { material: false, reason: `log duplicates recently-posted ${dup.txHash.slice(0, 10)}…` };
    }
    return { material: true, reason: "log is novel" };
  }

  return { material: false, reason: `unknown action type ${action.type}` };
}
