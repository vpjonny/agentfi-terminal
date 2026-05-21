import { formatUsd, signedDelta } from "@/lib/format";

export interface MetricStripEntry {
  label: string;
  /** USD value — auto-formatted via formatUsd */
  valueUsd?: number;
  /** Override with a free-text value (e.g. "248", "0.83M DIEM") */
  valueText?: string;
  delta7dPct?: number;
  /** Optional sub-label below the value (e.g. "·7d", "active") */
  hint?: string;
}

export function MetricsStrip({ entries }: { entries: MetricStripEntry[] }) {
  const cols = entries.length >= 6 ? "lg:grid-cols-6" : "md:grid-cols-4";
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${cols} gap-3`}>
      {entries.map((e) => (
        <Card key={e.label} entry={e} />
      ))}
    </div>
  );
}

function Card({ entry }: { entry: MetricStripEntry }) {
  const delta = entry.delta7dPct != null ? signedDelta(entry.delta7dPct) : null;
  const toneClass =
    delta?.tone === "up"
      ? "text-up"
      : delta?.tone === "down"
        ? "text-down"
        : "text-ink-secondary";
  const value =
    entry.valueText ?? (entry.valueUsd != null ? formatUsd(entry.valueUsd) : "—");

  return (
    <div className="group flex flex-col gap-2 border border-ink-disabled bg-bg-raised px-4 py-3 transition-colors hover:border-b-signal">
      <span className="label-micro">{entry.label}</span>
      <span className="font-mono text-[20px] font-bold tabular-nums text-ink-primary leading-none">
        {value}
      </span>
      {delta ? (
        <span className={`text-[11px] tabular-nums ${toneClass}`}>{delta.text} · 7d</span>
      ) : entry.hint ? (
        <span className="text-[11px] text-ink-tertiary">{entry.hint}</span>
      ) : null}
    </div>
  );
}
