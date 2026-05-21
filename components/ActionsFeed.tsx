import type { ActionEvent } from "@/lib/types";
import { abbrevAddress } from "@/lib/format";

function humanizeAgo(iso: string, nowIso: string): string {
  const sec = Math.max(0, Math.round((new Date(nowIso).getTime() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

export function ActionsFeed({
  actions,
  nowIso,
}: {
  actions: ActionEvent[];
  nowIso: string;
}) {
  return (
    <section className="flex flex-col gap-1">
      <div className="label-micro mb-2">actions · live</div>
      <ul className="flex flex-col">
        {actions.map((a) => (
          <li
            key={a.txHash}
            className={`group flex items-baseline gap-3 py-2 text-[13px] transition-colors hover:bg-bg-sunken ${
              a.type === "MILESTONE" ? "border-l-2 border-signal pl-3" : "border-l-2 border-transparent pl-3"
            }`}
          >
            <span className="w-16 shrink-0 text-ink-tertiary tabular-nums">
              {new Date(a.ts).toISOString().slice(11, 16)}
            </span>
            <span
              className="w-24 shrink-0 tracking-[0.05em] text-ink-primary"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {a.type}
            </span>
            <span className="flex-1 text-ink-secondary">{a.detail}</span>
            <span className="hidden sm:inline text-ink-tertiary tabular-nums">
              {abbrevAddress(a.txHash, 4, 4)}
            </span>
            <span className="text-ink-tertiary tabular-nums">{humanizeAgo(a.ts, nowIso)}</span>
            <span
              aria-hidden
              className="ml-2 hidden text-signal opacity-0 transition-opacity group-hover:opacity-100 sm:inline"
            >
              → og/share
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
