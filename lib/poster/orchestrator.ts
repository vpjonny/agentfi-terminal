import type {
  ActionEvent,
  Agent,
  BuildMode,
  MetricResult,
} from "../types";
import { getTemplate } from "./templates";
import { renderCaption } from "./render";
import { evaluate } from "./materiality";
import type { CaptionSurface, RenderedCaption } from "./types";

export interface OrchestratorInput {
  /** Actions to evaluate, in time order (oldest → newest). */
  actions: { agent: Agent; action: ActionEvent }[];
  /** Per-agent context. */
  metricBySlug: Record<string, MetricResult>;
  buildModeBySlug?: Record<string, BuildMode>;
  /** Actions posted in the last 24h, for log dedupe. */
  recentlyPosted?: ActionEvent[];
  /** Post counts already on the books today, per surface. */
  dayPostCountBySurface?: Partial<Record<CaptionSurface, number>>;
  /** Surfaces to render for; defaults to both. */
  surfaces?: CaptionSurface[];
  /** Override the OG base URL. Defaults to NEXT_PUBLIC_SITE_URL or localhost. */
  ogBaseUrl?: string;
  /** Override the daily cap (default 5). */
  dayCap?: number;
}

export interface IntendedPost {
  surface: CaptionSurface;
  agent: Agent;
  action: ActionEvent;
  decision: { material: boolean; reason: string };
  /** Present only when material. */
  caption?: RenderedCaption;
  ogUrl: string;
}

const DEFAULT_SURFACES: CaptionSurface[] = ["farcaster", "x"];

function resolveOgBase(input: OrchestratorInput): string {
  if (input.ogBaseUrl) return input.ogBaseUrl;
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  return "http://localhost:3000";
}

/**
 * Run the publishing engine in dry-run shape: scan actions, evaluate
 * materiality, render captions for the material ones, return one
 * IntendedPost per (action × surface). Skipped entries are included so the
 * admin view can show *why* nothing posted.
 *
 * Side-effect-free. The caller decides whether to send anything.
 */
export function processActions(input: OrchestratorInput): IntendedPost[] {
  const surfaces = input.surfaces ?? DEFAULT_SURFACES;
  const ogBase = resolveOgBase(input);
  const recentlyPosted = input.recentlyPosted ?? [];
  const counts: Record<CaptionSurface, number> = {
    farcaster: input.dayPostCountBySurface?.farcaster ?? 0,
    x: input.dayPostCountBySurface?.x ?? 0,
  };

  const out: IntendedPost[] = [];

  for (const { agent, action } of input.actions) {
    const ogUrl = `${ogBase}/og/action/${action.txHash}`;
    const metric = input.metricBySlug[agent.slug];
    const buildMode = input.buildModeBySlug?.[agent.slug];

    for (const surface of surfaces) {
      const verdict = evaluate(action, {
        recentlyPosted,
        dayPostCount: counts[surface],
        dayCap: input.dayCap,
      });

      if (!verdict.material) {
        out.push({ surface, agent, action, decision: verdict, ogUrl });
        continue;
      }

      // Map action type to template (DAILY_COMP is not an action-driven template).
      const template = getTemplate(action.type);
      const caption = renderCaption(template, {
        agent,
        surface,
        action,
        metric,
        buildMode,
      });

      out.push({
        surface,
        agent,
        action,
        decision: verdict,
        caption,
        ogUrl,
      });

      counts[surface] += 1;
    }
  }

  return out;
}
