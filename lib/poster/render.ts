import type {
  CaptionRenderInput,
  CaptionTemplate,
  RenderedCaption,
} from "./types";
import { SURFACE_CAP } from "./types";
import { formatMultiple, formatUsd } from "../format";
import { parseDiemAmount } from "./amount-parse";

const PLACEHOLDER_RE = /\{(\w+)\}/g;

/**
 * Build the substitution context for a single template render. Returns a
 * partial map — render will throw on unknown placeholders that aren't here.
 */
function buildContext(template: CaptionTemplate, input: CaptionRenderInput): Record<string, string> {
  const ctx: Record<string, string> = {
    slug:  input.agent.slug,
    agent: input.agent.ticker,
    link:  `https://agentfi.dev/agent/${input.agent.slug}`,
  };

  if (input.action) {
    ctx.detail = input.action.detail;
    const amount = parseDiemAmount(input.action.detail);
    if (amount != null) {
      // Preserve sign for "+0.18 DIEM" style claims
      ctx.amount = amount > 0 ? amount.toFixed(2) : amount.toString();
    }
  }

  if (input.metric) {
    ctx.compute_multiple = formatMultiple(input.metric.multiple);
    ctx.compute_val = formatUsd(input.metric.secondary.valueUsd);
  }

  if (input.buildMode) {
    ctx.percent = Math.round(input.buildMode.percent * 100).toString();
  }

  if (input.timestamp) {
    ctx.timestamp = input.timestamp;
  }

  if (input.topRows) {
    ctx.top_3_rows = input.topRows
      .slice(0, 3)
      .map((r) => `${r.ticker} ${formatMultiple(r.multiple)}`)
      .join(" · ");
  }

  return ctx;
}

export function renderCaption(template: CaptionTemplate, input: CaptionRenderInput): RenderedCaption {
  const ctx = buildContext(template, input);
  const warnings: string[] = [];

  const text = template.body.replace(PLACEHOLDER_RE, (_match, key: string) => {
    if (!(key in ctx)) {
      throw new Error(
        `Template ${template.id} requires placeholder {${key}} but it was not supplied`,
      );
    }
    return ctx[key];
  });

  const cap = SURFACE_CAP[input.surface];
  if (text.length > cap) {
    warnings.push(
      `Caption length ${text.length} exceeds ${input.surface} cap of ${cap}`,
    );
  }

  return {
    templateId: template.id,
    version: template.version,
    surface: input.surface,
    text,
    warnings,
  };
}
