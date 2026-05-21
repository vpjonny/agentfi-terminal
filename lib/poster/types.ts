import type { ActionEvent, Agent, BuildMode, MetricResult } from "../types";

export type CaptionSurface = "x" | "farcaster";

export type TemplateActionType =
  | "CLAIM"
  | "LP"
  | "SWAP"
  | "STAKE"
  | "LOG"
  | "MILESTONE"
  | "DAILY_COMP";

export interface CaptionTemplate {
  id: string;
  actionType: TemplateActionType;
  version: number;
  body: string;
}

export interface CompRowSnippet {
  ticker: string;
  multiple: number;
}

export interface CaptionRenderInput {
  agent: Agent;
  surface: CaptionSurface;
  action?: ActionEvent;
  metric?: MetricResult;
  buildMode?: BuildMode;
  /** For DAILY_COMP only. */
  topRows?: CompRowSnippet[];
  /** For DAILY_COMP only — ISO or pre-formatted. */
  timestamp?: string;
}

export interface RenderedCaption {
  templateId: string;
  version: number;
  surface: CaptionSurface;
  text: string;
  warnings: string[];
}

export const SURFACE_CAP: Record<CaptionSurface, number> = {
  x: 280,
  farcaster: 320,
};
