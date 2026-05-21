"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

export default function AgentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="agent page failed"
      subtitle="chain read, history store, or constitution fetch threw while building this agent's snapshot."
      error={error}
      reset={reset}
    />
  );
}
