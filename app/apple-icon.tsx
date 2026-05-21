import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Apple touch icon — 180×180 PNG for iOS home-screen pin.
 * Mirrors app/icon.tsx (cursor glyph) at larger size.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 180,
          height: 180,
          background: "#0A0B0D",
          color: "#C6FF3F",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 140,
          lineHeight: 1,
        }}
      >
        ▌
      </div>
    ),
    { ...size },
  );
}
