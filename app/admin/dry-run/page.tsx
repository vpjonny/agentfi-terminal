/**
 * Dry-run viewer for the publishing orchestrator. Intentionally uglier per
 * /admin design contract (system-ui white-on-light inside dark canvas).
 *
 * Gated by proxy.ts basic-auth. Loads the mock snapshot, runs the orchestrator,
 * shows what WOULD post if the live switch were flipped.
 */
import { processActions } from "@/lib/poster/orchestrator";
import { listAgents, getAgent } from "@/lib/agents";
import { listSnapshots, MOCK_NOW_ISO } from "@/lib/mock-data";

export const metadata = {
  title: "dry-run · admin · agentfi.terminal",
};

export default async function DryRunAdminPage() {
  const snapshots = await listSnapshots();
  const agents = listAgents();

  // Build orchestrator input from all snapshots' recent actions
  const actions = snapshots.flatMap((s) => {
    const agent = getAgent(s.slug);
    if (!agent) return [];
    return s.recentActions.map((a) => ({ agent, action: a }));
  });

  const metricBySlug = Object.fromEntries(snapshots.map((s) => [s.slug, s.metric]));
  const buildModeBySlug = Object.fromEntries(
    snapshots.filter((s) => s.buildMode).map((s) => [s.slug, s.buildMode!]),
  );

  const intended = processActions({
    actions,
    metricBySlug,
    buildModeBySlug,
  });

  const materialCount = intended.filter((i) => i.decision.material).length;
  const skippedCount = intended.length - materialCount;

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
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>agentfi · admin · dry-run</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        Orchestrator output against current mock snapshots. Nothing posts. Review templates
        + materiality reasons before flipping the live switch.
      </p>

      <div style={{ display: "flex", gap: 18, marginBottom: 24, fontSize: 13 }}>
        <Stat label="agents in registry" value={String(agents.length)} />
        <Stat label="actions evaluated" value={String(actions.length)} />
        <Stat label="intended posts" value={String(materialCount)} tone="positive" />
        <Stat label="skipped" value={String(skippedCount)} tone="muted" />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", background: "#f5f5f5" }}>
            <Th>time</Th>
            <Th>surface</Th>
            <Th>agent</Th>
            <Th>type</Th>
            <Th>material?</Th>
            <Th>reason</Th>
            <Th>template</Th>
            <Th>caption</Th>
          </tr>
        </thead>
        <tbody>
          {intended.map((p, i) => (
            <tr key={`${p.action.txHash}-${p.surface}-${i}`} style={{ verticalAlign: "top" }}>
              <Td><code>{new Date(p.action.ts).toISOString().slice(11, 16)}</code></Td>
              <Td>{p.surface}</Td>
              <Td>{p.agent.ticker}</Td>
              <Td><code>{p.action.type}</code></Td>
              <Td>
                <span
                  style={{
                    fontWeight: 600,
                    color: p.decision.material ? "#1a7f37" : "#888",
                  }}
                >
                  {p.decision.material ? "yes" : "no"}
                </span>
              </Td>
              <Td><span style={{ color: "#555" }}>{p.decision.reason}</span></Td>
              <Td><code style={{ fontSize: 12 }}>{p.caption?.templateId ?? "—"}</code></Td>
              <Td>
                <div style={{ maxWidth: 480 }}>
                  {p.caption ? (
                    <>
                      <code style={{ fontSize: 12, color: "#222" }}>{p.caption.text}</code>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                        len {p.caption.text.length}
                        {p.caption.warnings.length > 0 && (
                          <span style={{ color: "#c0392b", marginLeft: 8 }}>
                            ⚠ {p.caption.warnings.join("; ")}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <em style={{ color: "#aaa" }}>—</em>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: 12, color: "#888", marginTop: 24 }}>
        Snapshot at {MOCK_NOW_ISO}. CLI equivalent: <code>pnpm dry-run-poster</code>.
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "muted" }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: "6px 12px" }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: tone === "positive" ? "#1a7f37" : tone === "muted" ? "#888" : "#222",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "6px 10px", borderBottom: "1px solid #ddd", fontWeight: 600 }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>{children}</td>;
}
