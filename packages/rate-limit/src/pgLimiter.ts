import { decide, bucketKey, type RateLimitDecision, type RateLimiter } from './limiter';
import { assertPolicy, windowStart, type RateLimitPolicy } from './policy';

// PostgreSQL-backed limiter — the production one.
// -----------------------------------------------------------------------
// Distributed because the database is, and it is already a dependency of
// every process that would need to share this state. One row per
// (bucket, window), one statement per request.
//
// THE UPSERT IS THE WHOLE DESIGN. `INSERT ... ON CONFLICT DO UPDATE SET
// hits = hits + 1 RETURNING hits` is atomic in one round trip: no
// SELECT-then-UPDATE, so two concurrent requests at the boundary cannot
// both read "limit - 1" and both proceed. PostgreSQL serialises them on
// the row and hands each a different number.
//
// COST. One small upsert per request on an unauthenticated endpoint is
// itself work an attacker can make us do — but it is one indexed write
// against a narrow table, versus an outbound HTTPS call to Razorpay plus
// an order row, which is what it prevents. That trade is heavily
// favourable, and it is the reason the limiter runs before anything else
// in the route.
// -----------------------------------------------------------------------

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export function createPgRateLimiter(sql: SqlExecutor): RateLimiter & {
  deleteExpired(now?: Date): Promise<number>;
} {
  return {
    async consume(identifier, policy: RateLimitPolicy, now = new Date()): Promise<RateLimitDecision> {
      assertPolicy(policy);
      const start = windowStart(now, policy.windowMs);
      const expiresAt = new Date(start.getTime() + policy.windowMs);

      const { rows } = await sql.query(
        `INSERT INTO rate_limit_counters (bucket_key, window_start, hits, expires_at)
         VALUES ($1, $2, 1, $3)
         ON CONFLICT (bucket_key, window_start) DO UPDATE
            SET hits = rate_limit_counters.hits + 1
         RETURNING hits`,
        [bucketKey(policy, identifier), start, expiresAt],
      );

      const hits = Number((rows[0] as { hits: number | string }).hits);
      return decide(policy, hits, start, now);
    },

    /**
     * Removes windows that have closed.
     *
     * Not scheduled from inside this package: a limiter that sweeps on a
     * timer is a limiter that keeps a process alive and does surprising
     * work under load. Call it from an operational job. Rows are tiny and
     * harmless until then — the expires_at index makes the delete cheap.
     */
    async deleteExpired(now = new Date()): Promise<number> {
      const { rowCount } = await sql.query(
        `DELETE FROM rate_limit_counters WHERE expires_at <= $1`,
        [now],
      );
      return rowCount ?? 0;
    },
  };
}
