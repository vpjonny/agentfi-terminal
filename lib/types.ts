export type HexAddress = `0x${string}`;

export type MetricStrategy =
  | "compute-valuation"
  | "treasury-runway"
  | "fee-revenue";

export interface Agent {
  slug: string;
  ticker: string;
  token: HexAddress;
  wallet: HexAddress;
  poolId?: string;
  strategy: MetricStrategy;
  tagColorVar: string;
  constitutionUrl?: string;
}

export interface MetricSide {
  label: string;
  valueUsd: number;
}

export interface MetricResult {
  label: string;
  unit: "multiple" | "days" | "pe";
  multiple: number;
  primary: MetricSide;
  secondary: MetricSide;
}

export type MetricInput =
  | {
      strategy: "compute-valuation";
      stakedDiem: number;
      mcapUsd: number;
      diemPriceUsd: number;
    }
  | {
      strategy: "treasury-runway";
      treasuryUsd: number;
      monthlyBurnUsd: number;
      mcapUsd: number;
    }
  | {
      strategy: "fee-revenue";
      feesUsd30d: number;
      mcapUsd: number;
    };

export type BuildModeState = "ACCUMULATE" | "ACTIVE";

export interface BuildMode {
  rate: number;
  threshold: number;
  percent: number;
  etaDays: number | null;
  state: BuildModeState;
}

export type ActionType =
  | "CLAIM"
  | "LP"
  | "SWAP"
  | "STAKE"
  | "LOG"
  | "MILESTONE";

export interface ActionEvent {
  type: ActionType;
  detail: string;
  txHash: HexAddress;
  ts: string;
}
