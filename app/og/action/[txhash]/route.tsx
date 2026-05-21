import { ImageResponse } from "next/og";
import { listSnapshots } from "@/lib/mock-data";
import { listAgents } from "@/lib/agents";
import { abbrevAddress } from "@/lib/format";
import { OgRoot } from "@/lib/og/og-root";
import { loadJetBrainsMonoRegular } from "@/lib/og/fonts";

export const runtime = "nodejs";
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ txhash: string }> },
) {
  const { txhash } = await params;

  // Find which snapshot the tx hash belongs to.
  const snapshots = await listSnapshots();
  const agents = listAgents();
  let matchedAction = null;
  let matchedAgent = null;
  for (const snap of snapshots) {
    const found = snap.recentActions.find((a) => a.txHash === txhash);
    if (found) {
      matchedAction = found;
      matchedAgent = agents.find((a) => a.slug === snap.slug);
      break;
    }
  }

  if (!matchedAction || !matchedAgent) {
    return new Response("Action not found", { status: 404 });
  }

  const fontData = await loadJetBrainsMonoRegular();
  const isMilestone = matchedAction.type === "MILESTONE";

  return new ImageResponse(
    (
      <OgRoot width={WIDTH} height={HEIGHT} padding={64}>
        {/* top: agent */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              borderRadius: 7,
              background: `var(${matchedAgent.tagColorVar})`,
            }}
          />
          <span style={{ fontSize: 28, color: "#E8E6E1" }}>{matchedAgent.ticker}</span>
          <span style={{ fontSize: 16, color: "#4D4B47", marginLeft: 8 }}>
            agentfi.dev/agent/{matchedAgent.slug}
          </span>
        </div>

        {/* center: action type + detail */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            marginTop: 40,
          }}
        >
          <span
            style={{
              fontSize: 14,
              letterSpacing: "0.08em",
              color: isMilestone ? "#C6FF3F" : "#4D4B47",
              textTransform: "uppercase",
            }}
          >
            {isMilestone ? "● milestone" : "action"}
          </span>
          <span
            style={{
              fontSize: 88,
              color: isMilestone ? "#C6FF3F" : "#E8E6E1",
              letterSpacing: "-0.02em",
              marginTop: 8,
              lineHeight: 1,
            }}
          >
            {matchedAction.type}
          </span>
          <span
            style={{
              fontSize: 32,
              color: "#E8E6E1",
              marginTop: 18,
              letterSpacing: "-0.01em",
            }}
          >
            {matchedAction.detail}
          </span>
        </div>

        {/* bottom: tx + ts */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            fontSize: 16,
            color: "#8A8780",
            borderTop: "1px solid #2A2926",
            paddingTop: 16,
          }}
        >
          <span style={{ color: "#8A8780" }}>tx {abbrevAddress(matchedAction.txHash, 6, 4)}</span>
          <span style={{ color: "#4D4B47" }}>
            {new Date(matchedAction.ts).toISOString().replace("T", " ").slice(0, 16)} UTC
          </span>
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
