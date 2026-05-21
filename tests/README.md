# tests/

End-to-end test layout for agentfi-terminal.

| File | Scope |
|------|-------|
| `smoke.spec.ts` | DOM + status + content assertions for every visible route + a11y attributes |
| `snapshots.spec.ts` | Visual regression: byte-comparison on `/og/agent/autono`, screenshot of `/agent/autono` AgentCard region |

Unit tests live in `lib/__tests__/` (run via `pnpm test`, not Playwright).

## Running

```bash
pnpm exec playwright test               # full suite
pnpm exec playwright test --grep "..."  # subset
pnpm exec playwright test --update-snapshots   # regenerate visual baselines
```

The webServer config in `playwright.config.ts` sets `PIN_CONSTITUTION_SNIPPET` so
the GitHub raw README fetch stays deterministic across runs. Without it the OG
byte snapshot would drift whenever upstream README changes.

## Visual regression baseline regen workflow

When a component touches the OG card or the on-page AgentCard region, the
visual baselines will drift. To regenerate cleanly:

```bash
# 1. Regenerate the baselines from the current code
pnpm exec playwright test --update-snapshots

# 2. Re-run the full suite (NO --update-snapshots) to verify byte stability
pnpm exec playwright test
```

If the second run passes, commit the new baselines. **Don't ship a regenerated
baseline you haven't verified for stability** — a flaky baseline causes CI noise
forever.

If the second run fails on the byte snapshot, something is non-deterministic in
the render path. Common sources:

- `Date.now()` used instead of the threaded `nowMs` prop in AgentCard
- Network fetch that hits a different upstream between runs
- Random IDs in JSX (shouldn't happen but check)
- Module-level cache state that differs across processes

Pin or stub the source, regenerate, verify again.
