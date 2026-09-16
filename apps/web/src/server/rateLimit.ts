import { Pool } from 'pg';

import { loadEnv } from '@acos/config';
import {
  consumeAll,
  createMemoryRateLimiter,
  createPgRateLimiter,
  type RateLimitDecision,
  type RateLimiter,
  type RateLimitPolicy,
} from '@acos/rate-limit';

// Rate-limiter selection for apps/web.
// -----------------------------------------------------------------------
// DEVELOPMENT AND TEST use the in-memory limiter: no database round trip,
// deterministic, and `pnpm dev` is a single process so per-process
// counters are the same thing as global ones. It also means running the
// app locally does not need migration 0008 applied.
//
// PRODUCTION uses the PostgreSQL limiter, because production is more than
// one replica and per-process counters would silently multiply the budget
// by the replica count — a limiter that looks like it works and doesn't.
//
// The switch is on NODE_ENV and nothing else, so there is no way to be in
// production and accidentally get the development behaviour.
// -----------------------------------------------------------------------

let limiter: RateLimiter | null = null;
let pool: Pool | null = null;

export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;
  const env = loadEnv();
  if (env.NODE_ENV === 'production') {
    pool ??= new Pool({ connectionString: env.DATABASE_URL, max: 5 });
    limiter = createPgRateLimiter(pool);
  } else {
    limiter = createMemoryRateLimiter();
  }
  return limiter;
}

/** Test seam. Not exported from any route. */
export function __setRateLimiterForTests(next: RateLimiter | null): void {
  limiter = next;
}

export async function checkCreateOrderLimits(
  checks: readonly { identifier: string; policy: RateLimitPolicy }[],
): Promise<RateLimitDecision> {
  return consumeAll(getRateLimiter(), checks);
}
