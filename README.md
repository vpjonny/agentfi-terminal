# agentfi.terminal

Compute-valuation terminal for autonomous on-chain agents on Base. Launch agent: **AUTONO** (Liquid Protocol).

Built as a publishing engine first, a product second — every component renders both on-page and as a 1200×630 social-share card.

## What it does

For each registered agent, the terminal computes a single headline number — a **multiple** that compares mcap to a per-strategy fundamental (compute-credit budget, treasury, or fee revenue). The fundamental is declared in the agent registry and rendered transparently on every card with a link back to [`/methodology`](https://agentfi.dev/methodology) explaining the formula.

Three strategies ship today:

- **compute-valuation** (AUTONO) — `mcap ÷ (staked_diem × 365 × diem_usd)`
- **treasury-runway** (AETHER) — `mcap ÷ treasury_usd`
- **fee-revenue / P-F** (ETHY, BANKR) — `mcap ÷ (fees_30d × 12)`

Each agent has a `/agent/[slug]` detail page, an `/og/agent/[slug]` share card, and lives in the `/comp` leaderboard.

## Stack

- **Next.js 16** (App Router, async server components, file-based sitemap/robots)
- **React 19**, **TypeScript 5**, **Tailwind v4** (CSS-first `@theme`)
- **Vitest 4** for unit tests, **Playwright 1.60** for smoke + visual regression
- **next/og** (satori) for OG image generation — JetBrains Mono TTF in `assets/fonts/`
- **JSON-file snapshot store** (atomic writes, swap-out path to Postgres preserved)

External data (gated behind keys — falls back to mock without):

- **Etherscan v2 multichain** — wallet balances, supply, transfer history (single key, all EVM chains via `chainid=8453` for Base)
- **GeckoTerminal** — token price + mcap (no key needed)
- **GitHub raw README** — agent constitution snippets (cached 1h)

## Quickstart

```bash
pnpm install
pnpm dev                       # http://localhost:3000

cp .env.example .env.local     # add ETHERSCAN_API_KEY for live AUTONO data
                               # (works without — mock mode by default)

pnpm test                      # vitest (~160 tests, ~8s)
pnpm build && pnpm exec playwright test   # full e2e (~25s)
```

## Environment variables

| Var | Required | Purpose |
|-----|----------|---------|
| `ETHERSCAN_API_KEY` | live mode | Single v2 multichain key. Without it, all agents render from mock data. |
| `CRON_SECRET` | prod | Bearer token for `/api/cron/snapshot`. Use any 32+ random char string. |
| `ADMIN_USER` / `ADMIN_PASS` | prod | Basic auth for `/admin/*`. Defaults to `admin/admin` in dev. |
| `NEXT_PUBLIC_SITE_URL` | prod | Base URL for OG image absolute paths + sitemap/robots. |
| `NEXT_PUBLIC_GIT_SHA` | prod | Build-time git SHA, surfaced in footer. Set in CI: `NEXT_PUBLIC_GIT_SHA=$(git rev-parse HEAD)`. |
| `PIN_CONSTITUTION_SNIPPET` | tests only | Pins the constitution fetch result for deterministic byte snapshots. |
| `SNAPSHOT_DATA_DIR` | tests only | Override snapshot JSON store dir (defaults to `./data`). |

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing — featured AUTONO card + comp teaser |
| `/agent/[slug]` | Per-agent detail: AgentCard, MetricsStrip, ActionsFeed, history charts, constitution |
| `/comp` | Leaderboard of all agents with sparklines |
| `/methodology` | Formula explainer with live AUTONO worked example |
| `/status` | Operational dashboard (per-agent indexer freshness + system checks) |
| `/admin` | Basic-auth gated admin chrome (post composer dry-run) |
| `/og/agent/[slug]` | 1200×630 share card |
| `/og/comp` | Comp-table share card |
| `/og/action/[txhash]` | Per-tx share card |
| `/api/health` | JSON health check (200/503) — used by `/status` and external uptime |
| `/api/cron/snapshot` | Bearer-gated hourly snapshot trigger (Vercel cron at `0 * * * *`) |
| `/sitemap.xml`, `/robots.txt` | SEO baseline (Next 16 file conventions) |

## Data flow

```
            ┌──────────────────────────────────────┐
            │ Vercel Cron @ 0 * * * *              │
            │   → /api/cron/snapshot (bearer-gate) │
            └────────────────┬─────────────────────┘
                             │
            ┌────────────────▼────────────────┐
            │ lib/chain/<agent>.ts            │
            │   getAutonoSnapshotLive()       │
            │   Etherscan v2 + GeckoTerminal  │
            └────────────────┬────────────────┘
                             │
            ┌────────────────▼────────────────┐
            │ lib/db/snapshots-store.ts       │
            │   recordSnapshot() — atomic JSON│
            └────────────────┬────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
  /agent/[slug]         /api/health          /og/agent/[slug]
  (history charts +     (consumed by         (satori → PNG)
   live snapshot)        /status page)
```

## Agent registry

Adding an agent is one entry in `lib/agents.ts`:

```ts
autono: {
  slug: "autono",
  ticker: "AUTONO",
  token: "0x...",              // ERC-20 contract on Base
  wallet: "0x...",             // Agent's chain wallet
  strategy: "compute-valuation",
  tagColorVar: "--tag-autono",
  constitutionUrl: "https://...",
}
```

Three strategies wire to three metric functions in `lib/metrics/`. Adding a fourth strategy is one new metric file + registry entry.

## Testing strategy

- **Unit (vitest)** — pure functions, data layer, format helpers, classifier, route handlers via direct invocation
- **Smoke (Playwright)** — every visible route returns 200 with expected DOM contents; OG routes return `image/png`
- **Visual regression** — byte-comparison on `/og/agent/autono` PNG; live-page screenshot of agent card
- **Determinism** — everything time-sensitive accepts a `nowMs` prop; constitution fetches honor `PIN_CONSTITUTION_SNIPPET` env var in test webServer

Visual baselines update with `pnpm exec playwright test --update-snapshots`.

## Deploy notes

- Vercel auto-detects Next 16. Set the env vars from the table above.
- Cron config in `vercel.json` is hourly.
- `/admin/*` and `/api/cron/*` should stay private — basic auth + bearer-token are wired but customize the secrets.
- External uptime monitoring should hit `/api/health` and alert on 503.

## Project conventions

- Live-or-mock pattern: every chain fetcher has a typed null return + mock fallback so the app boots without keys
- Component contracts: anything that renders in OG mode must stay inside satori's CSS subset (no `display: inline-block`, no `position: absolute`, no `undefined` style values)
- Snapshot store API is stable; the JSON file is an implementation detail — Postgres swap-out preserves `recordSnapshot` / `getHistory` / `getLatest` signatures

## Workflow

This repo is built task-by-task with the agentic workflow pipeline in `~/agentic/workflows/`. Each shipped feature has a `done/<date>-agentfi-<key>.md` record with `## Outcome` notes and (where applicable) a `.sc` skill candidate documenting non-obvious patterns learned.

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) — source-visible, commercial use restricted. Copyright 2026 Lyubomir Pacheliev.
