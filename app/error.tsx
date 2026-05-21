"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

export default function PageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="landing failed"
      subtitle="couldn't load the featured agent snapshot. the snapshot store or chain fetcher threw."
      error={error}
      reset={reset}
    />
  );
}
