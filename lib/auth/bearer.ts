/**
 * Bearer-token verification for cron / webhook endpoints.
 *
 * Accepts the token via `Authorization: Bearer <token>` header (Vercel cron's
 * default) OR `?token=<token>` query param (manual curl, easier in dev).
 *
 * Uses `crypto.timingSafeEqual` for constant-time string compare so a bad
 * token can't be brute-forced via response timing.
 */

import { timingSafeEqual } from "node:crypto";

export function getBearer(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  const url = new URL(req.url);
  const q = url.searchParams.get("token");
  if (q) return q;

  return null;
}

export function verifyCronSecret(req: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const provided = getBearer(req);
  if (!provided) return false;

  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
