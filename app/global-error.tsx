"use client";

/**
 * Global error boundary — catches errors from the root layout itself.
 * Must render its own <html> + <body> because the layout has failed.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0A0B0D",
          color: "#E8E6E1",
          fontFamily: "ui-monospace, monospace",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.05em", color: "#4D4B47", textTransform: "uppercase" }}>
            kernel panic · root layout
          </div>
          <h1 style={{ fontSize: 36, margin: "12px 0 16px", color: "#C6FF3F" }}>
            agentfi.terminal · ⊘ panic
          </h1>
          <p style={{ fontSize: 14, color: "#8A8780", lineHeight: 1.6 }}>
            The root layout threw before we could render. This usually means the
            snapshot store is unreachable or a build-time constant is malformed.
          </p>
          {error.digest && (
            <pre style={{ fontSize: 12, color: "#4D4B47", marginTop: 16 }}>
              digest: {error.digest}
            </pre>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 24,
              padding: "8px 14px",
              border: "1px solid #C6FF3F",
              background: "transparent",
              color: "#C6FF3F",
              fontFamily: "inherit",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            retry ↻
          </button>
        </div>
      </body>
    </html>
  );
}
