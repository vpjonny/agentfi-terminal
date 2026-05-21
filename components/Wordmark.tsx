type WordmarkProps = {
  variant?: "full" | "inline";
  cursor?: boolean;
};

const TEXT = "agentfi.terminal";

export function Wordmark({ variant = "full", cursor = false }: WordmarkProps) {
  if (variant === "inline") {
    return (
      <span className="font-mono text-ink-primary tracking-[-0.02em] lowercase">
        {TEXT}
        {cursor && (
          <span className="cursor-caret ml-[2px] text-signal">▌</span>
        )}
      </span>
    );
  }

  const underline = "▔".repeat(TEXT.length);

  return (
    <span className="inline-flex flex-col leading-none font-mono text-ink-primary tracking-[-0.02em] lowercase">
      <span className="text-[20px]">
        {TEXT}
        {cursor && (
          <span className="cursor-caret ml-[2px] text-signal">▌</span>
        )}
      </span>
      <span aria-hidden="true" className="text-[20px] -mt-[10px] text-ink-tertiary">
        {underline}
      </span>
    </span>
  );
}
