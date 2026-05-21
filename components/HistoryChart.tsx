/**
 * Generic SVG time-series line chart. Pure SVG (no chart lib).
 *
 * Empty input → renders an empty-state pill instead of an empty chart.
 *
 * Sized 320×120 by default; container can override via width/height props.
 */

import type { HistoryEntry } from "@/lib/db/snapshots-store";

export interface HistoryChartProps {
  history: HistoryEntry[];
  selectValue: (e: HistoryEntry) => number;
  title: string;
  /** Formatter for the headline current value + y-axis labels. */
  format: (n: number) => string;
  /** Stroke tone — defaults to --signal. */
  tone?: "signal" | "up" | "down" | "secondary";
  width?: number;
  height?: number;
}

const TONE_COLOR: Record<NonNullable<HistoryChartProps["tone"]>, string> = {
  signal: "var(--signal)",
  up: "var(--up)",
  down: "var(--down)",
  secondary: "var(--ink-secondary)",
};

function formatDateShort(ms: number): string {
  const d = new Date(ms);
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${month}-${day}`;
}

export function HistoryChart({
  history,
  selectValue,
  title,
  format,
  tone = "signal",
  width = 320,
  height = 120,
}: HistoryChartProps) {
  if (history.length === 0) {
    return <EmptyChartPill title={title} hint="run `pnpm snapshot` to populate" />;
  }

  const sorted = [...history].sort((a, b) => a.ts - b.ts);
  const values = sorted.map(selectValue);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const padX = 6;
  const padTop = 12;
  const padBottom = 22;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;

  const minT = sorted[0].ts;
  const maxT = sorted[sorted.length - 1].ts;
  const tRange = maxT - minT || 1;

  const points = sorted.map((e, i) => {
    const v = values[i];
    const x = padX + ((e.ts - minT) / tRange) * plotW;
    const y = padTop + plotH - ((v - minV) / range) * plotH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const currentValue = values[values.length - 1];
  const lastX = padX + plotW;
  const lastY = padTop + plotH - ((currentValue - minV) / range) * plotH;
  const strokeColor = TONE_COLOR[tone];

  return (
    <div className="flex flex-col gap-2 border border-ink-disabled bg-bg-raised p-4">
      <div className="flex items-baseline justify-between">
        <div className="label-micro">{title}</div>
        <div className="font-mono text-[14px] tabular-nums text-ink-primary">
          {format(currentValue)}
        </div>
      </div>
      <div
        className="flex items-center gap-2 text-[10px] font-mono text-ink-tertiary"
        aria-hidden
      >
        {["1h", "24h", "7d", "30d", "all"].map((r) => (
          <span
            key={r}
            className={
              r === "all"
                ? "text-signal font-bold"
                : "text-ink-tertiary"
            }
          >
            {r}
          </span>
        ))}
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
        {/* Min/max y labels */}
        <text x={padX} y={padTop - 2} className="fill-ink-tertiary" fontSize="9">
          {format(maxV)}
        </text>
        <text x={padX} y={height - 12} className="fill-ink-tertiary" fontSize="9">
          {format(minV)}
        </text>
        {/* X-axis dates */}
        <text x={padX} y={height - 2} className="fill-ink-tertiary" fontSize="9">
          {formatDateShort(minT)}
        </text>
        <text
          x={width - padX}
          y={height - 2}
          className="fill-ink-tertiary"
          fontSize="9"
          textAnchor="end"
        >
          {formatDateShort(maxT)}
        </text>
        {/* Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Last-point dot */}
        <circle cx={lastX} cy={lastY} r={2} fill="var(--ink-primary)" />
      </svg>
    </div>
  );
}

function EmptyChartPill({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col gap-2 border border-ink-disabled bg-bg-raised p-4">
      <div className="label-micro">{title}</div>
      <div className="flex h-[120px] flex-col items-center justify-center gap-1">
        <span className="font-mono text-[12px] text-ink-tertiary">no history yet</span>
        <span className="font-mono text-[11px] text-ink-disabled">{hint}</span>
      </div>
    </div>
  );
}
