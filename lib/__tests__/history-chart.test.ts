import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HistoryChart } from "../../components/HistoryChart";
import type { HistoryEntry } from "../db/snapshots-store";

const mk = (over: Partial<HistoryEntry>): HistoryEntry => ({
  ts: 1700000000000,
  slug: "autono",
  multiple: 199,
  mcapUsd: 1_234_795,
  stakedDiem: 17,
  ...over,
});

describe("HistoryChart", () => {
  it("renders empty-state pill when history is empty", () => {
    const html = renderToStaticMarkup(
      HistoryChart({
        history: [],
        selectValue: (e) => e.multiple,
        title: "compute multiple",
        format: (n) => `${n}×`,
      }),
    );
    expect(html).toContain("no history yet");
    expect(html).toContain("compute multiple");
    expect(html).not.toContain("<svg"); // empty state has no svg
  });

  it("renders an svg polyline with N points when history has N entries", () => {
    const history = [
      mk({ ts: 1700000000000, multiple: 100 }),
      mk({ ts: 1700100000000, multiple: 150 }),
      mk({ ts: 1700200000000, multiple: 199 }),
      mk({ ts: 1700300000000, multiple: 210 }),
      mk({ ts: 1700400000000, multiple: 220 }),
    ];
    const html = renderToStaticMarkup(
      HistoryChart({
        history,
        selectValue: (e) => e.multiple,
        title: "compute multiple",
        format: (n) => `${n}×`,
      }),
    );
    expect(html).toContain("<svg");
    expect(html).toContain("<polyline");
    const pointsMatch = html.match(/points="([^"]+)"/);
    expect(pointsMatch).not.toBeNull();
    const ptCount = pointsMatch![1].split(" ").length;
    expect(ptCount).toBe(5);
  });

  it("includes min and max y-axis labels", () => {
    const history = [
      mk({ ts: 1700000000000, multiple: 100 }),
      mk({ ts: 1700100000000, multiple: 220 }),
    ];
    const html = renderToStaticMarkup(
      HistoryChart({
        history,
        selectValue: (e) => e.multiple,
        title: "x",
        format: (n) => `${Math.round(n)}×`,
      }),
    );
    expect(html).toContain("100×");
    expect(html).toContain("220×");
  });

  it("shows current value (last entry) in the headline", () => {
    const history = [
      mk({ ts: 1700000000000, multiple: 100 }),
      mk({ ts: 1700100000000, multiple: 199 }),
    ];
    const html = renderToStaticMarkup(
      HistoryChart({
        history,
        selectValue: (e) => e.multiple,
        title: "x",
        format: (n) => `${Math.round(n)}×`,
      }),
    );
    expect(html).toContain("199×");
  });
});
