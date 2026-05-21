/**
 * One-line marquee ticker — terminal-tape vibe.
 * Renders agent multiples + deltas on a single overflow-hidden row.
 * No animation by default (the data is static between snapshots);
 * if scrolling is desired later, add a CSS keyframe on the inner row.
 */

import { listAgents } from "@/lib/agents";
import { listSnapshots } from "@/lib/mock-data";
import { formatMultiple, signedDelta } from "@/lib/format";

export async function Ticker() {
  const agents = listAgents();
  const snaps = await listSnapshots();
  const items = agents
    .map((a) => {
      const snap = snaps.find((s) => s.slug === a.slug);
      if (!snap) return null;
      return {
        ticker: a.ticker,
        slug: a.slug,
        tagColorVar: a.tagColorVar,
        mult: snap.metric.multiple,
        delta: signedDelta(snap.delta7dPct),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div
      className="row aic border-b border-ink-disabled overflow-hidden whitespace-nowrap font-mono"
      style={{ display: "flex", padding: "6px 0", fontSize: 11 }}
    >
      <div className="flex items-center gap-7 px-4 text-ink-secondary">
        {items.map((it) => (
          <span key={it.slug} className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-[7px] w-[7px] rounded-full"
              style={{ background: `var(${it.tagColorVar})` }}
            />
            <span className="text-ink-primary">{it.ticker}</span>
            <span className="text-signal">{formatMultiple(it.mult)}</span>
            <span
              className={
                it.delta.tone === "up"
                  ? "text-up"
                  : it.delta.tone === "down"
                    ? "text-down"
                    : "text-ink-secondary"
              }
            >
              {it.delta.text}
            </span>
          </span>
        ))}
        <span className="text-ink-tertiary">· compute multiples · base · indexed hourly</span>
      </div>
    </div>
  );
}
