/**
 * Typed env-var accessors. One place to read; one place to validate.
 *
 * Two reasons this file exists:
 *   1. Fail loud at boot when a required var is missing (vs. failing at first
 *      cron run / first OG render).
 *   2. Co-locate "what's required where" — every reader of `process.env.X`
 *      should go through here.
 */

interface EnvHelpers {
  siteUrl: string;
  cronSecret: string | null;
  etherscanKey: string | null;
  adminUser: string;
  adminPass: string;
  pinConstitutionSnippet: string | null;
  snapshotDataDir: string | null;
  gitSha: string;
  builtAt: string;
}

function read(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

export function env(): EnvHelpers {
  return {
    siteUrl: (read("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
    cronSecret: read("CRON_SECRET"),
    etherscanKey: read("ETHERSCAN_API_KEY"),
    adminUser: read("ADMIN_USER") ?? "admin",
    adminPass: read("ADMIN_PASS") ?? "admin",
    pinConstitutionSnippet: read("PIN_CONSTITUTION_SNIPPET"),
    snapshotDataDir: read("SNAPSHOT_DATA_DIR"),
    gitSha: read("NEXT_PUBLIC_GIT_SHA") ?? "dev",
    builtAt: read("NEXT_PUBLIC_BUILT_AT") ?? "dev",
  };
}

/**
 * Boot-time validation. Call from any entrypoint that REQUIRES a key
 * (cron handlers, admin routes). Throws synchronously with the missing
 * variable name so the failure is on the first line of the trace.
 */
export function requireEnv(...keys: Array<keyof EnvHelpers>): void {
  const e = env();
  const missing: string[] = [];
  for (const k of keys) {
    if (!e[k]) missing.push(k);
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env var(s): ${missing.join(", ")}`);
  }
}
