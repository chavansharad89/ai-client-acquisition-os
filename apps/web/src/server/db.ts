import { Pool } from 'pg';

import { loadEnv } from '@acos/config';

// Shared Postgres pool for the Client Finder MVP surface (apps/web).
// -----------------------------------------------------------------------
// Every @acos/core-* domain package's createPg*Repository() takes a
// structurally-typed SqlExecutor (`{ query(sql, params) }`, defined once
// in @acos/core-entitlements). A single pg.Pool satisfies that interface
// for all of them, mirroring the lazy-singleton pattern already used by
// apps/web/src/server/rateLimit.ts and webhookStore.ts.
// -----------------------------------------------------------------------

let pool: Pool | null = null;

export function getPool(): Pool {
  pool ??= new Pool({ connectionString: loadEnv().DATABASE_URL, max: 5 });
  return pool;
}

/** Test seam. Not exported from any route. */
export function __setPoolForTests(next: Pool | null): void {
  pool = next;
}

/** Mirrors apps/web/src/server/webhookStore.ts's closeWebhookPool() — same lazy-pool test-teardown convention. */
export async function closeClientFinderPool(): Promise<void> {
  const current = pool;
  pool = null;
  if (current) await current.end();
}
