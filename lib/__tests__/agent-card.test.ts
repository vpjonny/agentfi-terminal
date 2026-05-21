import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentCard } from "../../components/AgentCard";
import { requireAgent } from "../agents";
import { getMetric } from "../metrics";
import { buildMode } from "../build-mode";

describe("AgentCard render", () => {
  const agent = requireAgent("autono");
  const metric = getMetric({
    strategy: "compute-valuation",
    stakedDiem: 17,
    mcapUsd: 1_234_795,
    diemPriceUsd: 1.0,
  });
  const bm = buildMode({ rate: 0.15, threshold: 0.5, recentDailyDelta: 0.02 });

  it("renders the AUTONO compute multiple and key labels", () => {
    const html = renderToStaticMarkup(
      AgentCard({
        agent,
        metric,
        buildMode: bm,
        recentActions: [],
        utcClock: "17:42:08 UTC",
        mode: "og",
      }),
    );
    expect(html).toContain("AUTONO");
    expect(html).toContain("199×");
    expect(html).toContain("COMPUTE MULTIPLE");
    expect(html).toContain("ACCUMULATE");
    expect(html).toContain("0xB3D7e0…6d8e");
    expect(html).toContain("17:42:08 UTC");
  });

  it("omits the blinking cursor in og mode", () => {
    const html = renderToStaticMarkup(
      AgentCard({
        agent,
        metric,
        buildMode: bm,
        recentActions: [],
        utcClock: "17:42:08 UTC",
        mode: "og",
      }),
    );
    expect(html).not.toContain("cursor-caret");
  });

  it("includes the blinking cursor in live mode", () => {
    const html = renderToStaticMarkup(
      AgentCard({
        agent,
        metric,
        buildMode: bm,
        recentActions: [],
        utcClock: "17:42:08 UTC",
        mode: "live",
      }),
    );
    expect(html).toContain("cursor-caret");
  });

  it("flips state label to ACTIVE when rate meets threshold", () => {
    const activeBm = buildMode({ rate: 0.55, threshold: 0.5 });
    const html = renderToStaticMarkup(
      AgentCard({
        agent,
        metric,
        buildMode: activeBm,
        recentActions: [],
        utcClock: "17:42:08 UTC",
        mode: "og",
      }),
    );
    expect(html).toContain("ACTIVE");
    expect(html).not.toContain("ACCUMULATE");
  });
});
