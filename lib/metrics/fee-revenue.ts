import type { MetricResult } from "../types";

export interface FeeRevenueInput {
  feesUsd30d: number;
  mcapUsd: number;
}

export function feeRevenue(input: FeeRevenueInput): MetricResult {
  const { feesUsd30d, mcapUsd } = input;

  const annualizedFees = feesUsd30d * 12;
  const multiple = annualizedFees > 0 ? mcapUsd / annualizedFees : 0;

  return {
    label: "REVENUE MULTIPLE",
    unit: "pe",
    multiple,
    primary:   { label: "mcap",      valueUsd: mcapUsd },
    secondary: { label: "30d fees",  valueUsd: feesUsd30d },
  };
}
