"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "./Wordmark";

type StatusBarProps = {
  baseBlock: number;
  live: "fresh" | "stale";
};

function formatUtcClock(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss} UTC`;
}

function formatBlock(n: number): string {
  return n.toLocaleString("en-US");
}

export function StatusBar({ baseBlock, live }: StatusBarProps) {
  const [now, setNow] = useState<string>(() => formatUtcClock(new Date()));

  useEffect(() => {
    const tick = () => setNow(formatUtcClock(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const dotColor = live === "fresh" ? "var(--signal)" : "var(--down)";
  const dotPulse = live === "fresh" ? "live-pulse-fresh" : "";

  return (
    <div
      role="status"
      className="sticky top-0 z-40 h-8 border-b border-ink-disabled bg-bg-base/95 backdrop-blur-sm"
    >
      <div className="typewriter-reveal mx-auto flex h-full max-w-[1280px] items-center gap-3 px-6 text-[12px] text-ink-secondary">
        <Wordmark variant="inline" cursor />
        <Separator />
        <span suppressHydrationWarning className="tabular-nums text-ink-primary">
          {now}
        </span>
        <Separator />
        <span className="text-ink-tertiary">BASE</span>
        <span className="tabular-nums text-ink-primary">{formatBlock(baseBlock)}</span>
        <Separator />
        <span className={`inline-flex items-center gap-1.5 ${live === "fresh" ? "text-signal" : "text-down"}`}>
          <span
            aria-hidden="true"
            className={`inline-block h-1.5 w-1.5 rounded-full ${dotPulse}`}
            style={{ background: dotColor }}
          />
          {live === "fresh" ? "LIVE" : "STALE"}
        </span>
      </div>
    </div>
  );
}

function Separator() {
  return <span className="text-ink-disabled" aria-hidden="true">·</span>;
}
