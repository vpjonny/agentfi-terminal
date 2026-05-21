"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatUsd, formatMultiple, signedDelta } from "@/lib/format";
import { Sparkline } from "./Sparkline";

const STRATEGY_FORMULA: Record<string, string> = {
  "compute-valuation": "mcap ÷ (staked_diem × 365 × spot_diem_usd)",
  "treasury-runway":   "mcap ÷ treasury_usd",
  "fee-revenue":       "mcap ÷ (fees_30d × 12)",
};

export interface CompRow {
  slug: string;
  ticker: string;
  strategy: string;
  strategyLabel: string;
  tagColorVar: string;
  mcapUsd: number;
  fundValUsd: number;
  multiple: number;
  delta7dPct: number;
  multiple7d: number[];
}

type SortKey = "ticker" | "mcapUsd" | "fundValUsd" | "multiple" | "delta7dPct";
type SortDir = "asc" | "desc";

const STRATEGY_CHIPS: Array<{ value: string | null; label: string }> = [
  { value: null,                 label: "ALL" },
  { value: "compute-valuation",  label: "compute_val" },
  { value: "treasury-runway",    label: "treasury" },
  { value: "fee-revenue",        label: "fee_revenue" },
];

const COLUMN_CONFIG: Array<{
  key: SortKey;
  label: string;
  align: "left" | "right";
  defaultDir: SortDir;
}> = [
  { key: "ticker",      label: "AGENT", align: "left",  defaultDir: "asc"  },
  { key: "mcapUsd",     label: "MCAP",  align: "right", defaultDir: "desc" },
  { key: "fundValUsd",  label: "FUND_VAL", align: "right", defaultDir: "desc" },
  { key: "multiple",    label: "MULT",  align: "right", defaultDir: "desc" },
  { key: "delta7dPct",  label: "7D",    align: "right", defaultDir: "desc" },
];

function compareBy(a: CompRow, b: CompRow, key: SortKey, dir: SortDir): number {
  const av = a[key];
  const bv = b[key];
  let cmp: number;
  if (typeof av === "number" && typeof bv === "number") {
    cmp = av - bv;
  } else {
    cmp = String(av).localeCompare(String(bv));
  }
  return dir === "asc" ? cmp : -cmp;
}

export function CompTableClient({ rows }: { rows: CompRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("multiple");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [strategyFilter, setStrategyFilter] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const filtered = strategyFilter
      ? rows.filter((r) => r.strategy === strategyFilter)
      : rows;
    return [...filtered].sort((a, b) => compareBy(a, b, sortKey, sortDir));
  }, [rows, sortKey, sortDir, strategyFilter]);

  const handleSort = (col: { key: SortKey; defaultDir: SortDir }) => {
    if (col.key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir(col.defaultDir);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px] font-mono">
        <span className="text-ink-tertiary uppercase tracking-[0.05em]">filter</span>
        {STRATEGY_CHIPS.map((chip) => {
          const active = strategyFilter === chip.value;
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setStrategyFilter(chip.value)}
              data-filter-value={chip.value ?? "all"}
              aria-pressed={active}
              aria-label={`filter by ${chip.label} strategy`}
              className={`px-2 py-0.5 border transition-colors ${
                active
                  ? "border-signal text-ink-primary bg-signal/10"
                  : "border-ink-disabled text-ink-tertiary hover:text-ink-primary"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
        <span className="ml-auto text-ink-tertiary">
          showing {sorted.length} of {rows.length}
        </span>
      </div>
      <table className="w-full border-collapse text-[13px]">
        <thead>
        <tr className="text-ink-tertiary">
          {COLUMN_CONFIG.map((col) => {
            const isActive = col.key === sortKey;
            const caret = !isActive ? "" : sortDir === "asc" ? " ▲" : " ▼";
            return (
              <th
                key={col.key}
                className={`px-3 py-2 font-normal tracking-[0.05em] ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
                aria-sort={
                  isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort(col)}
                  className={`hover:text-ink-primary transition-colors ${
                    isActive ? "text-ink-primary" : ""
                  }`}
                  data-sort-key={col.key}
                  aria-label={`sort by ${col.label}${isActive ? `, currently ${sortDir}ending` : ""}`}
                >
                  {col.label}
                  <span className="font-mono text-[10px]" aria-hidden>
                    {caret}
                  </span>
                </button>
              </th>
            );
          })}
          <th className="px-3 py-2 text-left font-normal tracking-[0.05em]">METRIC</th>
          <th className="px-3 py-2 text-center font-normal tracking-[0.05em]">METHOD</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => {
          const delta = signedDelta(row.delta7dPct);
          const toneClass =
            delta.tone === "up"
              ? "text-up"
              : delta.tone === "down"
                ? "text-down"
                : "text-ink-secondary";
          const sparkStroke =
            delta.tone === "up"
              ? "var(--up)"
              : delta.tone === "down"
                ? "var(--down)"
                : "var(--ink-secondary)";

          return (
            <tr key={row.slug} className="hover:bg-bg-sunken transition-colors" data-row-slug={row.slug}>
              <td className="px-3 py-3">
                <Link
                  href={`/agent/${row.slug}`}
                  className="inline-flex items-center gap-2 text-ink-primary hover:text-signal"
                >
                  <span
                    aria-hidden
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: `var(${row.tagColorVar})` }}
                  />
                  {row.ticker}
                </Link>
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-ink-primary">
                {formatUsd(row.mcapUsd)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-ink-secondary">
                {formatUsd(row.fundValUsd)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-signal">
                {formatMultiple(row.multiple)}
              </td>
              <td className="px-3 py-3 text-right tabular-nums">
                <div className="inline-flex items-center justify-end gap-2.5">
                  <span className={toneClass}>{delta.text}</span>
                  <Sparkline values={row.multiple7d} width={56} height={18} stroke={sparkStroke} />
                </div>
              </td>
              <td className="px-3 py-3 text-ink-secondary">{row.strategyLabel}</td>
              <td className="px-3 py-3 text-center">
                <FormulaTooltip
                  label="[i]"
                  formula={STRATEGY_FORMULA[row.strategy] ?? ""}
                  agent={row.ticker}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
}

function FormulaTooltip({
  label,
  formula,
  agent,
}: {
  label: string;
  formula: string;
  agent: string;
}) {
  return (
    <span className="group relative inline-block">
      <span
        className="cursor-help text-ink-tertiary group-hover:text-ink-primary"
        tabIndex={0}
        aria-label={`${agent} formula: ${formula}`}
      >
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none invisible absolute right-0 top-full z-10 mt-1 w-72 -translate-x-2 whitespace-normal border border-ink-disabled bg-bg-sunken px-3 py-2 text-left text-[12px] text-ink-secondary opacity-0 transition-opacity duration-75 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <span className="block text-ink-tertiary text-[10px] tracking-[0.08em] uppercase">
          {agent} · formula
        </span>
        <span className="mt-1 block font-mono text-ink-primary">{formula}</span>
      </span>
    </span>
  );
}
