/**
 * Agent OG card render. Imports the same `AgentCard` component the live page
 * uses — one component, two render targets, no divergence.
 *
 * (Earlier this route inlined the JSX as a workaround for a satori crash;
 * X8 root-caused it to `style: { ..., minHeight: undefined }` getting into
 * AgentCard's container styles. Fix is in AgentCard.tsx — see comment there.)
 */
import { ImageResponse } from "next/og";
import { getAgent } from "@/lib/agents";
import { getSnapshot, MOCK_NOW_ISO } from "@/lib/mock-data";
import { buildMode } from "@/lib/build-mode";
import { AgentCard } from "@/components/AgentCard";
import { OgRoot } from "@/lib/og/og-root";
import { loadJetBrainsMonoRegular } from "@/lib/og/fonts";
import { getConstitutionSnippet } from "@/lib/chain/constitution";

export const runtime = "nodejs";
export const revalidate = 3600; // CDN-cache for 1h; matches snapshot cadence

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const agent = getAgent(slug);
  const snap = await getSnapshot(slug);
  if (!agent || !snap) {
    return new Response("Not found", { status: 404 });
  }

  const bm = snap.buildMode ?? buildMode({ rate: 0, threshold: 0.5 });
  const [fontData, constitutionSnippet] = await Promise.all([
    loadJetBrainsMonoRegular(),
    getConstitutionSnippet(slug).catch(() => "—"),
  ]);

  // Pinned "now" so OG byte-snapshots are stable.
  // When real data lands, replace with snapshot-time-of-render from the indexer.
  const nowMs = new Date(MOCK_NOW_ISO).getTime();

  return new ImageResponse(
    (
      <OgRoot width={WIDTH} height={HEIGHT}>
        <AgentCard
          agent={agent}
          metric={snap.metric}
          buildMode={bm}
          recentActions={snap.recentActions.slice(0, 3)}
          utcClock="17:42:08 UTC"
          mode="og"
          nowMs={nowMs}
          constitutionSnippet={constitutionSnippet}
        />
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
