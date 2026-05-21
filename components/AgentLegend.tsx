import { listAgents } from "@/lib/agents";

export function AgentLegend() {
  const agents = listAgents();
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-ink-tertiary">
      <span className="label-micro">legend</span>
      {agents.map((a) => (
        <span key={a.slug} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: `var(${a.tagColorVar})` }}
          />
          <span className="text-ink-secondary tracking-[0.02em]">{a.ticker}</span>
        </span>
      ))}
    </div>
  );
}
