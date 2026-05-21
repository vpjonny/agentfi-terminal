/**
 * AgentCard — the load-bearing component. Renders both on-page and as a
 * 1200×630 OG image via satori. Built to satori's CSS subset from day 1:
 *
 *   ALLOWED:  display:flex, flex-direction, gap, padding, margin, fixed w/h,
 *             position:absolute/relative, background-color, color, border,
 *             border-radius, font-*, line-height, letter-spacing
 *
 *   AVOIDED:  display:grid, flex-grow, transform, clip-path, filter,
 *             box-shadow with spread, backdrop-blur, gradients with angles
 *
 * If a future PR drifts from this contract the OG render will silently
 * diverge from the on-page render — design doc §06 calls that a P0.
 */

import type {
  Agent,
  MetricResult,
  BuildMode,
  ActionEvent,
} from "@/lib/types";
import {
  abbrevAddress,
  formatUsd,
  formatMultiple,
  formatRate,
} from "@/lib/format";

const CARD_WIDTH_OG = 1200;
const CARD_HEIGHT_OG = 630;

const THRESHOLD_TICK_PCT = 0.6;

type AgentCardMode = "live" | "og";

export interface AgentCardProps {
  agent: Agent;
  metric: MetricResult;
  buildMode: BuildMode;
  recentActions: ActionEvent[];
  utcClock: string;
  baseBlock?: number;
  mode?: AgentCardMode;
  /** Pinned "now" — pass a fixed timestamp from OG routes so byte-snapshots are stable. Defaults to Date.now(). */
  nowMs?: number;
  /** Optional constitution snippet, rendered only in og mode beneath the metric row. */
  constitutionSnippet?: string;
}

export function AgentCard({
  agent,
  metric,
  buildMode,
  recentActions,
  utcClock,
  mode = "live",
  nowMs,
  constitutionSnippet,
}: AgentCardProps) {
  const isOg = mode === "og";
  const snippet = constitutionSnippet && constitutionSnippet !== "—"
    ? truncateSnippet(constitutionSnippet, 110)
    : null;

  // Conditionally spread height vs minHeight — never include keys with
  // `undefined` values, because satori iterates style keys and crashes with
  // `undefined.trim()` on any present-but-undefined value. (TypeScript
  // accepts `undefined`; JS runtime keeps the key in the object.)
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: isOg ? CARD_WIDTH_OG : "100%",
    background: "var(--bg-raised)",
    color: "var(--ink-primary)",
    fontFamily: "var(--font-mono), ui-monospace, monospace",
    padding: isOg ? 48 : 32,
    border: "1px solid var(--ink-disabled)",
    boxSizing: "border-box",
    ...(isOg ? { height: CARD_HEIGHT_OG } : { minHeight: 340 }),
  };

  return (
    <div style={containerStyle}>
      <CardHeader agent={agent} mode={mode} />

      <CardSubheader
        contract={agent.token}
        utcClock={utcClock}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 48,
          marginTop: isOg ? 36 : 28,
          marginBottom: isOg ? 28 : 20,
        }}
      >
        <MetricHeadline metric={metric} mode={mode} />
        <BuildModePanel buildMode={buildMode} />
      </div>

      {isOg && snippet && (
        <div
          style={{
            display: "flex",
            fontSize: 14,
            color: "var(--ink-tertiary)",
            fontStyle: "italic",
            marginBottom: 16,
            letterSpacing: "0.01em",
          }}
        >
          “{snippet}”
        </div>
      )}

      <Divider />

      <RecentActions actions={recentActions} nowMs={nowMs} />
    </div>
  );
}

/* ─── Header ────────────────────────────────────────────────────────────── */

function CardHeader({ agent, mode }: { agent: Agent; mode: AgentCardMode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <AgentDot color={agent.tagColorVar} />
        <span
          style={{
            fontSize: mode === "og" ? 24 : 20,
            letterSpacing: "0.02em",
            color: "var(--ink-primary)",
          }}
        >
          {agent.ticker}
        </span>
      </div>
      <span
        style={{
          fontSize: 13,
          color: "var(--ink-tertiary)",
          letterSpacing: "0.01em",
        }}
      >
        agentfi.dev/agent/{agent.slug}
      </span>
    </div>
  );
}

function CardSubheader({
  contract,
  utcClock,
}: {
  contract: string;
  utcClock: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 32,
        marginTop: 14,
        fontSize: 12,
        color: "var(--ink-secondary)",
      }}
    >
      <span style={{ color: "var(--ink-secondary)" }}>
        {abbrevAddress(contract)}
      </span>
      <span style={{ color: "var(--ink-tertiary)" }}>BASE</span>
      <span style={{ color: "var(--ink-secondary)", marginLeft: "auto" }}>
        {utcClock}
      </span>
    </div>
  );
}

/* ─── Metric headline (left half) ───────────────────────────────────────── */

function MetricHeadline({
  metric,
  mode,
}: {
  metric: MetricResult;
  mode: AgentCardMode;
}) {
  const numberStr = formatMultiple(metric.multiple);
  const underline = "▔".repeat(numberStr.length);
  const isOg = mode === "og";
  const numberSize = isOg ? 96 : 80;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "50%" }}>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start" }}>
          <span
            style={{
              fontSize: numberSize,
              letterSpacing: "-0.02em",
              color: "var(--signal)",
              lineHeight: 1,
            }}
          >
            {numberStr}
          </span>
          {mode === "live" ? (
            <span
              className="cursor-caret"
              style={{
                fontSize: numberSize * 0.5,
                color: "var(--signal)",
                marginLeft: 6,
                marginTop: 8,
                lineHeight: 1,
              }}
            >
              ▌
            </span>
          ) : null}
        </div>
        <span
          aria-hidden
          style={{
            fontSize: numberSize,
            letterSpacing: "-0.02em",
            color: "var(--ink-tertiary)",
            marginTop: -numberSize * 0.55,
            lineHeight: 1,
          }}
        >
          {underline}
        </span>
      </div>

      <span
        style={{
          fontSize: 12,
          letterSpacing: "0.05em",
          color: "var(--ink-tertiary)",
          marginTop: 4,
        }}
      >
        {metric.label}
      </span>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginTop: 18,
          fontSize: 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <span style={{ color: "var(--ink-tertiary)" }}>{metric.primary.label}</span>
          <span style={{ color: "var(--ink-primary)" }}>
            {formatUsd(metric.primary.valueUsd)}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
          <span style={{ color: "var(--ink-tertiary)" }}>{metric.secondary.label}</span>
          <span style={{ color: "var(--ink-primary)" }}>
            {formatUsd(metric.secondary.valueUsd)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Build mode panel (right half) ─────────────────────────────────────── */

function BuildModePanel({ buildMode }: { buildMode: BuildMode }) {
  const percent = Math.round(buildMode.percent * 100);

  // Bar fill — rate plotted on 0–(threshold/0.6) axis so threshold sits at 60%.
  const axisMax = buildMode.threshold / THRESHOLD_TICK_PCT;
  const fillPct = axisMax > 0 ? Math.min(1, buildMode.rate / axisMax) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "50%" }}>
      <span
        style={{
          fontSize: 12,
          letterSpacing: "0.05em",
          color: "var(--ink-tertiary)",
        }}
      >
        BUILD MODE
      </span>
      <span
        style={{
          fontSize: 28,
          marginTop: 4,
          color: buildMode.state === "ACTIVE" ? "var(--signal)" : "var(--ink-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {buildMode.state}
      </span>

      {/*
        Build-mode bar — flexbox-only. position:absolute is NOT supported by
        the current next/og satori build (crashes with "Cannot read '256'");
        all overlays must be expressed as flex children. Threshold tick is a
        2px middle child between the pre-threshold and post-threshold halves.
      */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          height: 12,
          marginTop: 28,
        }}
      >
        {/* Pre-threshold half: 60% of bar width */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: `${THRESHOLD_TICK_PCT * 100}%`,
            height: 6,
            background: "var(--bg-sunken)",
          }}
        >
          <div
            style={{
              width: `${Math.min(1, fillPct / THRESHOLD_TICK_PCT) * 100}%`,
              height: 6,
              background: "var(--signal)",
            }}
          />
        </div>
        {/* Threshold tick */}
        <div style={{ width: 2, height: 12, background: "var(--ink-secondary)" }} />
        {/* Post-threshold half: 40% of bar width */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: `${(1 - THRESHOLD_TICK_PCT) * 100}%`,
            height: 6,
            background: "var(--bg-sunken)",
          }}
        >
          {fillPct > THRESHOLD_TICK_PCT && (
            <div
              style={{
                width: `${((fillPct - THRESHOLD_TICK_PCT) / (1 - THRESHOLD_TICK_PCT)) * 100}%`,
                height: 6,
                background: "var(--signal)",
              }}
            />
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 12,
          marginTop: 10,
          fontSize: 13,
          color: "var(--ink-secondary)",
        }}
      >
        <span style={{ color: "var(--ink-primary)" }}>{formatRate(buildMode.rate)}</span>
        <span style={{ color: "var(--ink-tertiary)" }}>·</span>
        <span>{percent}% of threshold</span>
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-secondary)",
          marginTop: 4,
        }}
      >
        {buildMode.etaDays != null
          ? `eta ~ ${buildMode.etaDays}d`
          : buildMode.state === "ACTIVE"
            ? "active — threshold crossed"
            : "eta unknown"}
      </div>
    </div>
  );
}

function truncateSnippet(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + "…";
}

/* ─── Divider + actions feed ────────────────────────────────────────────── */

function Divider() {
  return (
    <div
      style={{
        height: 1,
        width: "100%",
        background: "var(--ink-disabled)",
        marginTop: 8,
        marginBottom: 16,
      }}
    />
  );
}

function RecentActions({ actions, nowMs }: { actions: ActionEvent[]; nowMs?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {actions.slice(0, 3).map((a) => (
        <ActionRow key={a.txHash} action={a} nowMs={nowMs} />
      ))}
    </div>
  );
}

function ActionRow({ action, nowMs }: { action: ActionEvent; nowMs?: number }) {
  const isMilestone = action.type === "MILESTONE";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 12,
        fontSize: 13,
        paddingLeft: isMilestone ? 8 : 0,
        borderLeft: isMilestone ? "2px solid var(--signal)" : "2px solid transparent",
      }}
    >
      <span style={{ color: "var(--ink-tertiary)", width: 64 }}>recent</span>
      <span style={{ color: "var(--ink-tertiary)" }}>·</span>
      <span
        style={{
          color: "var(--ink-primary)",
          letterSpacing: "0.05em",
          width: 88,
        }}
      >
        {action.type}
      </span>
      {/* flexBasis: "auto" was removed — satori's CSS parser .trim()s string
          flex-basis values and crashes on non-numeric tokens. Default basis
          works the same for our needs. */}
      <span style={{ color: "var(--ink-secondary)" }}>
        {action.detail}
      </span>
      <span style={{ color: "var(--ink-tertiary)", marginLeft: "auto" }}>
        {humanizeAgo(action.ts, nowMs)}
      </span>
    </div>
  );
}

function humanizeAgo(iso: string, nowMsOverride?: number): string {
  const then = new Date(iso).getTime();
  const now = nowMsOverride ?? Date.now();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

/* ─── Agent dot ─────────────────────────────────────────────────────────── */

function AgentDot({ color }: { color: string }) {
  // display:flex (not inline-block) — satori rejects inline-block at render time.
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        width: 10,
        height: 10,
        borderRadius: 5,
        background: `var(${color})`,
      }}
    />
  );
}
