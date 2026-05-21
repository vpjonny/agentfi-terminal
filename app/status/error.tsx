"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

export default function StatusError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="status page failed"
      subtitle="health-state gatherer threw. the snapshot store may be unreachable."
      error={error}
      reset={reset}
    />
  );
}
