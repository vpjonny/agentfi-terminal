import { AgentCard } from "@/components/AgentCard";
import { requireAgent } from "@/lib/agents";
import { getMetric } from "@/lib/metrics";
import { buildMode } from "@/lib/build-mode";
import { DIEM_PRICE_USD } from "@/lib/constants";
import type { ActionEvent } from "@/lib/types";

export const metadata = {
  title: "preview · agent card · agentfi.terminal",
};

const NOW_ISO = "2026-05-18T17:42:08Z";

const mockActions: ActionEvent[] = [
  {
    type: "CLAIM",
    detail: "+0.18 DIEM",
    txHash: "0x4a1f0c3e9bee0c3d7b62d9e6a36a3f7c2b1ffffeebb1c3e2d7c8a90b3a52b1f0",
    ts: "2026-05-18T17:28:00Z",
  },
  {
    type: "LP",
    detail: "0.5 ETH paired",
    txHash: "0x9100a6c47b3acdee08aaf4413ee08c9bdee10c3e7ff408bccaa30a73ee08ee08",
    ts: "2026-05-18T16:42:00Z",
  },
  {
    type: "LOG",
    detail: "“compute below threshold; accumulating”",
    txHash: "0x77a420aa3000ee30a7baa3000aa30bbcc9deef000aa30a7baa3000aa30ddaa30",
    ts: "2026-05-18T14:42:00Z",
  },
];

export default function PreviewCard() {
  const agent = requireAgent("autono");
  const metric = getMetric({
    strategy: "compute-valuation",
    stakedDiem: 17,
    mcapUsd: 1_234_795,
    diemPriceUsd: DIEM_PRICE_USD,
  });
  const bm = buildMode({ rate: 0.15, threshold: 0.5, recentDailyDelta: 0.02 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "32px 0" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 24, color: "var(--ink-primary)" }}>
          preview · agent card
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-tertiary)" }}>
          live-mode render. OG render comes in T6; this is the on-page target the OG must match.
        </p>
      </header>

      <section>
        <Label>live mode (on-page)</Label>
        <AgentCard
          agent={agent}
          metric={metric}
          buildMode={bm}
          recentActions={mockActions}
          utcClock="17:42:08 UTC"
          mode="live"
        />
      </section>

      <section>
        <Label>og mode (no cursor — preview of what T6 will render)</Label>
        <div style={{ overflow: "auto", border: "1px solid var(--ink-disabled)" }}>
          <div style={{ width: 1200 }}>
            <AgentCard
              agent={agent}
              metric={metric}
              buildMode={bm}
              recentActions={mockActions}
              utcClock="17:42:08 UTC"
              mode="og"
            />
          </div>
        </div>
      </section>

      <section>
        <Label>build mode at threshold (ACTIVE state)</Label>
        <AgentCard
          agent={agent}
          metric={metric}
          buildMode={buildMode({ rate: 0.55, threshold: 0.5 })}
          recentActions={[
            {
              type: "MILESTONE",
              detail: "build_rate ▲ crossed threshold",
              txHash: "0x12be4300aa00aa00bbcc1100aa00aa00bbcc1100aa00aa00bbcc1100aa00aa00",
              ts: "2026-05-18T09:42:00Z",
            },
            ...mockActions.slice(0, 2),
          ]}
          utcClock="17:42:08 UTC"
          mode="live"
        />
      </section>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--ink-tertiary)",
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}
