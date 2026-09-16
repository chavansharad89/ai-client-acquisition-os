import { Pool } from 'pg';

import {
  createWebhookTransactionRunner,
  recordWebhookRejection as record,
  type WebhookRejection,
} from '@acos/core-payments';
import { loadEnv } from '@acos/config';

// Webhook persistence wiring for apps/web.
// -----------------------------------------------------------------------
// A `pg` Pool rather than the Prisma client: the handler needs one pinned
// connection for its transaction and `ON CONFLICT DO NOTHING` with a row
// count for the dedupe, neither of which Prisma's query builder expresses
// cleanly. The SQL itself lives in @acos/core-payments so it is testable
// against a real database without Next.js in the way.
//
// Lazy, for the same reason the route is: importing this module during
// `next build` must not require DATABASE_URL.
// -----------------------------------------------------------------------

let pool: Pool | null = null;
function getPool(): Pool {
  pool ??= new Pool({ connectionString: loadEnv().DATABASE_URL, max: 5 });
  return pool;
}

export async function recordWebhookRejection(rejection: WebhookRejection): Promise<void> {
  await record(getPool(), rejection);
}

export const webhookTransaction: ReturnType<typeof createWebhookTransactionRunner> = (fn) =>
  createWebhookTransactionRunner(getPool())(fn);

/**
 * Closes the pool and forgets it.
 *
 * A real lifecycle function, not a test hack: a process that wants to
 * shut down cleanly has to drain its connections, and without this the
 * pool keeps the event loop alive. Tests use it too, because tearing
 * down a database out from under an open pool produces a storm of
 * "terminating connection due to administrator command".
 */
export async function closeWebhookPool(): Promise<void> {
  const current = pool;
  pool = null;
  if (current) await current.end();
}
