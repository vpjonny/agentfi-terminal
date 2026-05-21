/**
 * RSS 2.0 feed of recent on-chain actions across all agents.
 * Cached at the CDN-edge for 5 minutes — actions update hourly so this is
 * generous, and avoids re-running the snapshot fetch on every reader poll.
 *
 * Rate-limited: 30 req/min per IP.
 */

import { buildFeed } from "@/lib/feed";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const rl = checkRateLimit({
    name: "feed",
    key: clientKeyFromRequest(req),
    limit: 30,
    windowMs: 60_000,
  });

  const rlHeaders = {
    "x-ratelimit-limit": String(rl.limit),
    "x-ratelimit-remaining": String(rl.remaining),
    "x-ratelimit-reset": String(Math.floor(rl.resetAt / 1000)),
  };

  if (!rl.ok) {
    return new Response("Rate limit exceeded", {
      status: 429,
      headers: {
        ...rlHeaders,
        "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)),
      },
    });
  }

  const xml = await buildFeed();
  return new Response(xml, {
    status: 200,
    headers: {
      ...rlHeaders,
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
