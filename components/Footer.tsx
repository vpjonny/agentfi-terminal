import Link from "next/link";

export type IndexerState = "fresh" | "stale" | "empty";

type FooterProps = {
  lastSnapshotIso: string;
  sha?: string;
  indexerState?: IndexerState;
  indexerAgeLabel?: string;
};

const STATE_TONE: Record<IndexerState, string> = {
  fresh: "text-up",
  stale: "text-warn",
  empty: "text-ink-tertiary",
};

export function Footer({
  lastSnapshotIso,
  sha,
  indexerState,
  indexerAgeLabel,
}: FooterProps) {
  return (
    <footer className="mt-12 border-t border-ink-disabled">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-6 py-5 text-[12px] text-ink-tertiary">
        <div className="flex items-center gap-3">
          <Link href="/methodology" className="hover:text-ink-secondary transition-colors">
            methodology
          </Link>
          <span aria-hidden>·</span>
          <Link href="/status" className="hover:text-ink-secondary transition-colors">
            status
          </Link>
          <span aria-hidden>·</span>
          <Link href="/feed.xml" className="hover:text-ink-secondary transition-colors">
            rss
          </Link>
          <span aria-hidden>·</span>
          <Link href="/api/agents" className="hover:text-ink-secondary transition-colors">
            api
          </Link>
          <span aria-hidden>·</span>
          <a
            href="https://github.com/vpjonny/agentfi-terminal"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-ink-secondary transition-colors"
          >
            github ↗
          </a>
          <span aria-hidden>·</span>
          <Link href="/privacy" className="hover:text-ink-secondary transition-colors">
            privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-ink-secondary transition-colors">
            terms
          </Link>
          {sha && (
            <>
              <span aria-hidden>·</span>
              <span className="font-mono">build {sha}</span>
            </>
          )}
          {indexerState && (
            <>
              <span aria-hidden>·</span>
              <span>
                indexer{" "}
                <span className={STATE_TONE[indexerState]}>
                  {indexerState}
                </span>
                {indexerAgeLabel ? ` (${indexerAgeLabel})` : ""}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          <span>last snapshot</span>
          <span className="text-ink-secondary">{lastSnapshotIso}</span>
        </div>
      </div>
    </footer>
  );
}
