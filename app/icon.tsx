import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon: a `▌` cursor glyph in --signal on --bg-base.
 *
 * No custom font load — satori's default fallback renders the U+258C glyph
 * fine, AND it avoids the `Cannot read '256'` build-time crash that happens
 * when ImageResponse prerenders a variable font with an explicit weight at
 * static-gen time.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 32,
          height: 32,
          background: "#0A0B0D",
          color: "#C6FF3F",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        ▌
      </div>
    ),
    { ...size },
  );
}
