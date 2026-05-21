"use client";

import { ErrorPanel } from "@/components/ErrorPanel";

export default function CompError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPanel
      title="comp table failed"
      subtitle="couldn't build the leaderboard. snapshot store or agent registry threw."
      error={error}
      reset={reset}
    />
  );
}
