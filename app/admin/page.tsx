/**
 * Intentionally uglier than the public terminal — design doc §12.
 *
 * Public face / back-of-house. Plain sans-serif on white, default browser
 * styling, no --signal accent, no grid texture. The contrast tells humans
 * where they are.
 *
 * Gated by middleware.ts basic-auth (ADMIN_USER / ADMIN_PASS env, defaults
 * admin/admin in dev).
 */
export const metadata = {
  title: "admin · agentfi.terminal",
};

export default function AdminPage() {
  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#222",
        background: "#fff",
        padding: 24,
        minHeight: "70vh",
        margin: "-32px 0",
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>agentfi · admin</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
        Back-of-house. Intentionally uglier than the public terminal.
      </p>

      <Section title="Posts by template (last 24h / 7d)">
        <p>No data — auto-poster wiring lands in a later task.</p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f5f5f5" }}>
              <Th>template</Th><Th>posts 24h</Th><Th>impressions</Th><Th>replies</Th><Th>reposts</Th>
            </tr>
          </thead>
          <tbody>
            {["CLAIM", "LP", "SWAP", "STAKE", "LOG", "MILESTONE"].map((t) => (
              <tr key={t}>
                <Td>{t}</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Top referrers (last 7d)">
        <p>No data — /track/click route lands with auto-poster.</p>
      </Section>

      <Section title="Poster dry-run log (last 50)">
        <pre style={{ background: "#f9f9f9", padding: 12, fontSize: 12, overflow: "auto" }}>
{`[dry-run] no posts yet — orchestrator not wired.`}
        </pre>
      </Section>

      <Section title="Indexer health">
        <ul style={{ marginLeft: 18, fontSize: 14 }}>
          <li>autono — last snapshot: <em>mock</em>, gap: <em>n/a</em></li>
          <li>ethy   — placeholder</li>
          <li>bankr  — placeholder</li>
          <li>aether — placeholder</li>
        </ul>
      </Section>

      <Section title="Operator controls">
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            disabled
            style={{
              background: "#c0392b",
              color: "#fff",
              border: 0,
              padding: "10px 18px",
              fontSize: 14,
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          >
            FORCE SNAPSHOT
          </button>
          <button
            disabled
            style={{
              background: "#c0392b",
              color: "#fff",
              border: 0,
              padding: "10px 18px",
              fontSize: 14,
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          >
            PAUSE POSTER
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>
          Both disabled in scaffold — wired in indexer / poster tasks.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, marginBottom: 6 }}>{title}</h2>
      <div style={{ fontSize: 14 }}>{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "6px 10px", borderBottom: "1px solid #ddd", fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "6px 10px", borderBottom: "1px solid #eee" }}>{children}</td>;
}
