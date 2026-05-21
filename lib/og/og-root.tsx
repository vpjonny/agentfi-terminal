import type { CSSProperties, ReactNode } from "react";

/**
 * Wrapper that declares all design-token CSS variables inline so satori can
 * resolve `var(--bg-raised)` etc. inside the rendered tree. Globals.css is
 * NOT visible to satori — these variables must be set on the satori root.
 */
const TOKEN_VARS = {
  "--bg-base":       "#0A0B0D",
  "--bg-raised":     "#111317",
  "--bg-sunken":     "#06070A",
  "--bg-grid":       "#15181E",

  "--ink-primary":   "#E8E6E1",
  "--ink-secondary": "#8A8780",
  "--ink-tertiary":  "#4D4B47",
  "--ink-disabled":  "#2A2926",

  "--signal":        "#C6FF3F",

  "--up":            "#6FCF97",
  "--down":          "#EB5757",
  "--warn":          "#F2C94C",
  "--neutral":       "#8A8780",

  "--tag-autono":    "#C6FF3F",
  "--tag-ethy":      "#58A6FF",
  "--tag-bankr":     "#FF8A4C",
  "--tag-aether":    "#B084EB",
} as const;

export interface OgRootProps {
  width: number;
  height: number;
  padding?: number;
  children: ReactNode;
}

export function OgRoot({ width, height, padding = 0, children }: OgRootProps) {
  const style: CSSProperties = {
    width,
    height,
    display: "flex",
    flexDirection: "column",
    background: "#0A0B0D",
    color: "#E8E6E1",
    fontFamily: "JetBrains Mono",
    padding,
    ...(TOKEN_VARS as CSSProperties),
  };

  return <div style={style}>{children}</div>;
}
