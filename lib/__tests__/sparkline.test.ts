import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Sparkline } from "../../components/Sparkline";

describe("Sparkline", () => {
  it("renders an svg with a polyline of N points", () => {
    const html = renderToStaticMarkup(
      Sparkline({ values: [1, 2, 3, 4, 5], width: 50, height: 10 }),
    );
    expect(html).toContain("<svg");
    expect(html).toContain("<polyline");
    // 5 points → 5 coordinate pairs in the polyline
    const points = html.match(/points="([^"]+)"/)?.[1].split(" ").length ?? 0;
    expect(points).toBe(5);
  });

  it("renders a flat line for single-value series", () => {
    const html = renderToStaticMarkup(Sparkline({ values: [42], width: 50, height: 10 }));
    expect(html).toContain("<line");
    expect(html).not.toContain("<polyline");
  });

  it("renders a flat line at midpoint for all-equal values", () => {
    const html = renderToStaticMarkup(
      Sparkline({ values: [5, 5, 5, 5], width: 50, height: 20 }),
    );
    // With min == max, range = 1 (clamped) so all points land on the same y
    expect(html).toContain("<polyline");
  });

  it("adds a last-point dot by default", () => {
    const html = renderToStaticMarkup(
      Sparkline({ values: [1, 2, 3], width: 40, height: 10 }),
    );
    expect(html).toContain("<circle");
  });

  it("omits last-point dot when showLastPoint=false", () => {
    const html = renderToStaticMarkup(
      Sparkline({ values: [1, 2, 3], showLastPoint: false }),
    );
    expect(html).not.toContain("<circle");
  });
});
