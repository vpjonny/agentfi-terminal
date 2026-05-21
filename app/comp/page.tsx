import { CompTable } from "@/components/CompTable";
import { AgentLegend } from "@/components/AgentLegend";

export const metadata = {
  title: "comp · agentfi.terminal",
  description: "Compute-valuation comp table across active AgentFi agents on Base.",
  alternates: { canonical: "/comp" },
  openGraph: {
    type: "website",
    title: "comp · agentfi.terminal",
    description: "Compute-valuation comp table across active AgentFi agents on Base.",
    images: ["/og/comp"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og/comp"],
  },
};

export default async function CompPage({
  searchParams,
}: {
  searchParams: Promise<{ screenshot?: string }>;
}) {
  const { screenshot } = await searchParams;
  const isScreenshot = screenshot === "1";

  return (
    <div className="flex flex-col gap-8 py-8">
      {!isScreenshot && (
        <header className="flex flex-col gap-3">
          <div className="label-micro">compute valuation · comp table</div>
          <h1 className="display-md text-ink-primary">all agents · sorted by multiple</h1>
          <p className="font-sans text-[14px] text-ink-secondary max-w-xl leading-relaxed">
            Each row applies the strategy declared in the agent registry. Click{" "}
            <code className="text-ink-primary">[i]</code> for the exact formula.
            <a href="/methodology" className="ml-2 text-signal hover:underline">
              read methodology →
            </a>
          </p>
        </header>
      )}

      <div className="border border-ink-disabled bg-bg-raised">
        <CompTable />
      </div>

      <AgentLegend />

      {isScreenshot && (
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1 text-[12px] text-ink-tertiary">
          <span className="font-mono text-ink-primary tracking-[-0.02em] lowercase">
            agentfi.dev
          </span>
          <span className="tabular-nums">2026-05-18 17:42 UTC</span>
        </div>
      )}
    </div>
  );
}
