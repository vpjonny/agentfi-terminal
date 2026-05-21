import type { BuildMode } from "@/lib/types";
import { formatRate } from "@/lib/format";

const THRESHOLD_TICK_PCT = 0.6;

/**
 * On-page only. Uses position:absolute for the threshold tick, which works in
 * the browser but would crash satori. AgentCard's inline BuildModePanel uses
 * a flexbox 3-segment layout instead (visually identical) so its OG render
 * doesn't break.
 */
export function BuildModeCountdown({ buildMode: bm }: { buildMode: BuildMode }) {
  const percent = Math.round(bm.percent * 100);
  const axisMax = bm.threshold / THRESHOLD_TICK_PCT;
  const fillPct = axisMax > 0 ? Math.min(1, bm.rate / axisMax) : 0;
  const isActive = bm.state === "ACTIVE";

  return (
    <section className="flex flex-col gap-3 border border-ink-disabled bg-bg-raised p-4">
      <div className="label-micro">build mode</div>
      <div className={`display-md tracking-tight ${isActive ? "text-signal" : "text-ink-primary"}`}>
        {bm.state}
      </div>

      <div className="relative mt-3 h-3 w-full">
        <div className="absolute left-0 right-0 top-1.5 h-1.5 bg-bg-sunken" />
        <div
          className="absolute left-0 top-1.5 h-1.5 bg-signal"
          style={{ width: `${fillPct * 100}%` }}
        />
        <div
          className="absolute top-0 h-3 w-[2px] bg-ink-secondary"
          style={{ left: `${THRESHOLD_TICK_PCT * 100}%` }}
          aria-label={`threshold ${bm.threshold}`}
        />
      </div>

      <div className="flex items-baseline gap-2 text-[13px] text-ink-secondary tabular-nums">
        <span className="text-ink-primary">{formatRate(bm.rate)}</span>
        <span className="text-ink-tertiary">·</span>
        <span>{percent}% of threshold</span>
      </div>

      <div className="text-[13px] text-ink-secondary">
        {bm.etaDays != null
          ? `eta ~ ${bm.etaDays}d`
          : isActive
            ? "active — threshold crossed"
            : "eta unknown"}
      </div>
    </section>
  );
}
