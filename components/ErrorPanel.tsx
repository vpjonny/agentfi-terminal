"use client";

/**
 * Terminal-themed error panel used by route-level error.tsx boundaries.
 * Each route's error.tsx renders this with a route-specific subtitle.
 */

interface ErrorPanelProps {
  title: string;
  subtitle: string;
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorPanel({ title, subtitle, error, reset }: ErrorPanelProps) {
  return (
    <div className="flex flex-col gap-4 border border-down/40 bg-down/5 p-6 my-8">
      <div className="label-micro text-down">⊘ {title}</div>
      <p className="font-mono text-[13px] text-ink-secondary leading-relaxed">
        {subtitle}
      </p>
      {error.digest && (
        <pre className="text-[11px] text-ink-tertiary font-mono">
          digest: {error.digest}
        </pre>
      )}
      <details className="text-[11px] text-ink-tertiary">
        <summary className="cursor-help hover:text-ink-secondary">
          error message
        </summary>
        <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-ink-tertiary">
          {error.message || "unknown"}
        </pre>
      </details>
      <button
        type="button"
        onClick={reset}
        className="self-start border border-signal text-signal px-3 py-1.5 text-[12px] font-mono hover:bg-signal/10 transition-colors"
      >
        retry ↻
      </button>
    </div>
  );
}
