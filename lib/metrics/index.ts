import type { MetricInput, MetricResult } from "../types";
import { computeValuation } from "./compute-valuation";
import { treasuryRunway } from "./treasury-runway";
import { feeRevenue } from "./fee-revenue";

export { computeValuation, treasuryRunway, feeRevenue };
export { runwayDays } from "./treasury-runway";

export function getMetric(input: MetricInput): MetricResult {
  switch (input.strategy) {
    case "compute-valuation":
      return computeValuation(input);
    case "treasury-runway":
      return treasuryRunway(input);
    case "fee-revenue":
      return feeRevenue(input);
  }
}
