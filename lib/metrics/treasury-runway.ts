import type { MetricResult } from "../types";

export interface TreasuryRunwayInput {
  treasuryUsd: number;
  monthlyBurnUsd: number;
  mcapUsd: number;
}

export function treasuryRunway(input: TreasuryRunwayInput): MetricResult {
  const { treasuryUsd, mcapUsd } = input;

  const multiple = treasuryUsd > 0 ? mcapUsd / treasuryUsd : 0;

  return {
    label: "RUNWAY MULTIPLE",
    unit: "multiple",
    multiple,
    primary:   { label: "mcap",     valueUsd: mcapUsd },
    secondary: { label: "treasury", valueUsd: treasuryUsd },
  };
}

export function runwayDays(treasuryUsd: number, monthlyBurnUsd: number): number | null {
  if (monthlyBurnUsd <= 0) return null;
  return Math.round((treasuryUsd / monthlyBurnUsd) * 30);
}
