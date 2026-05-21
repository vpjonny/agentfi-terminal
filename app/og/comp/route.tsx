import { ImageResponse } from "next/og";
import { listAgents } from "@/lib/agents";
import { listSnapshots } from "@/lib/mock-data";
import { formatUsd, formatMultiple, signedDelta } from "@/lib/format";
import { OgRoot } from "@/lib/og/og-root";
import { loadJetBrainsMonoRegular } from "@/lib/og/fonts";

export const runtime = "nodejs";
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

const STRATEGY_LABEL: Record<string, string> = {
  "compute-valuation": "compute_val",
  "treasury-runway":   "treasury",
  "fee-revenue":       "fee_revenue",
};

export async function GET() {
  const agents = listAgents();
  const snapshots = await listSnapshots();

  const rows = agents
    .map((a) => ({ agent: a, snap: snapshots.find((s) => s.slug === a.slug)! }))
    .filter((r) => r.snap)
    .sort((a, b) => b.snap.metric.multiple - a.snap.metric.multiple);

  const fontData = await loadJetBrainsMonoRegular();

  return new ImageResponse(
    (
      <OgRoot width={WIDTH} height={HEIGHT} padding={48}>
        {/* header */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
          <span style={{ fontSize: 12, letterSpacing: "0.08em", color: "#4D4B47", textTransform: "uppercase" }}>
            agentfi.terminal · comp · 2026-05-18 17:42 UTC
          </span>
          <span style={{ fontSize: 36, color: "#E8E6E1", marginTop: 8, letterSpacing: "-0.01em" }}>
            compute valuation comp
          </span>
        </div>

        {/* column header */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            fontSize: 13,
            color: "#4D4B47",
            letterSpacing: "0.05em",
            paddingBottom: 12,
            borderBottom: "1px solid #2A2926",
          }}
        >
          <span style={{ width: 220 }}>AGENT</span>
          <span style={{ width: 240 }}>METRIC</span>
          <span style={{ width: 180, textAlign: "right" }}>MCAP</span>
          <span style={{ width: 180, textAlign: "right" }}>FUND_VAL</span>
          <span style={{ width: 140, textAlign: "right" }}>MULT</span>
          <span style={{ width: 100, textAlign: "right" }}>7D</span>
        </div>

        {/* rows */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
          {rows.map(({ agent, snap }) => {
            const delta = signedDelta(snap.delta7dPct);
            const deltaColor =
              delta.tone === "up" ? "#6FCF97" :
              delta.tone === "down" ? "#EB5757" : "#8A8780";

            return (
              <div
                key={agent.slug}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  fontSize: 18,
                  paddingTop: 16,
                  paddingBottom: 16,
                  alignItems: "center",
                }}
              >
                <div style={{ width: 220, display: "flex", flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: `var(${agent.tagColorVar})`,
                    }}
                  />
                  <span style={{ color: "#E8E6E1" }}>{agent.ticker}</span>
                </div>
                <span style={{ width: 240, color: "#8A8780" }}>
                  {STRATEGY_LABEL[agent.strategy]}
                </span>
                <span style={{ width: 180, textAlign: "right", color: "#E8E6E1" }}>
                  {formatUsd(snap.metric.primary.valueUsd)}
                </span>
                <span style={{ width: 180, textAlign: "right", color: "#8A8780" }}>
                  {formatUsd(snap.metric.secondary.valueUsd)}
                </span>
                <span style={{ width: 140, textAlign: "right", color: "#C6FF3F" }}>
                  {formatMultiple(snap.metric.multiple)}
                </span>
                <span style={{ width: 100, textAlign: "right", color: deltaColor }}>
                  {delta.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer / watermark */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: "auto",
            fontSize: 12,
            color: "#4D4B47",
            letterSpacing: "0.05em",
          }}
        >
          <span>sorted by multiple desc</span>
          <span>agentfi.dev</span>
        </div>
      </OgRoot>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        { name: "JetBrains Mono", data: fontData, style: "normal", weight: 400 },
      ],
    },
  );
}
