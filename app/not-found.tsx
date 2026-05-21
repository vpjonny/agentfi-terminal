import Link from "next/link";

export const metadata = {
  title: "not found · agentfi.terminal",
};

export default function NotFound() {
  return (
    <div className="flex flex-col gap-10 py-20 max-w-xl">
      <div className="flex flex-col gap-1">
        <div className="label-micro">error · 404</div>
        <div className="font-mono text-[11px] text-ink-disabled tabular-nums">
          E_NOT_FOUND · trap at 0x00
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="display-md text-down tracking-tight">compute_val not found</div>
        <div className="font-mono text-[14px] text-ink-secondary">
          agent dropped offline · <span className="text-ink-primary tabular-nums">0xDEAD…BEEF</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 font-mono text-[12px] text-ink-tertiary">
        <span>
          last known snapshot:{" "}
          <span className="text-ink-secondary tabular-nums">2026-05-18 17:42:08 UTC</span>
        </span>
        <span>
          stale for:{" "}
          <span className="text-down tabular-nums">∞</span>
        </span>
      </div>

      <div className="font-mono text-[13px]">
        <span className="text-ink-tertiary">$</span>{" "}
        <Link href="/" className="text-signal hover:underline">
          cd /terminal
        </Link>
        <span aria-hidden className="cursor-caret text-signal ml-2">▌</span>
      </div>
    </div>
  );
}
