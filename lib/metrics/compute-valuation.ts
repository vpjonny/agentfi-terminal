import type { MetricResult } from "../types";

export interface ComputeValuationInput {
  stakedDiem: number;
  mcapUsd: number;
  diemPriceUsd: number;
}

export function computeValuation(input: ComputeValuationInput): MetricResult {
  const { stakedDiem, mcapUsd, diemPriceUsd } = input;

  const computeValUsd = stakedDiem * 365 * diemPriceUsd;
  const multiple = computeValUsd > 0 ? mcapUsd / computeValUsd : 0;

  return {
    label: "COMPUTE MULTIPLE",
    unit: "multiple",
    multiple,
    primary:   { label: "mcap",         valueUsd: mcapUsd },
    secondary: { label: "compute_val",  valueUsd: computeValUsd },
  };
}
