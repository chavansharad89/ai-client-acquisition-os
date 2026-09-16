// Per-run bookkeeping and scoped cleanup.
// -----------------------------------------------------------------------
// Every fixture registers the exact primary keys it inserts here, and
// cleanup deletes those keys and nothing else.
//
// WHY NOT `DELETE FROM payments`: integration suites share a server, and
// sometimes a database. A broad delete in one test silently destroys
// another test's data — or, run against the wrong DATABASE_URL, real
// data. Deleting by explicit id list means the blast radius of a mistake
// is bounded by what this run actually created.
//
// Indexes are never touched. Cleanup removes ROWS; the schema, and in
// particular any index the deployment created, is left exactly as it was.
// -----------------------------------------------------------------------

/**
 * The minimal surface these fixtures need. Declared structurally rather
 * than as Pick<Client, 'query'> because pg's `query` is a heavily
 * overloaded signature that no simple implementation can satisfy — and
 * because the fixtures should not depend on the driver's types. A real
 * `pg` Client or Pool satisfies this.
 */
export interface Queryable {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface TestRunIds {
  orderIds: string[];
  paymentIds: string[];
  webhookEventIds: string[];
  metaEventIds: string[];
}

/**
 * Child-to-parent, matching the foreign keys. meta_events, webhook_events,
 * payments and entitlements all reference orders with ON DELETE RESTRICT,
 * so orders must go last or the delete is rejected.
 *
 * `entitlements` was missing here from the day migration 0004 added it,
 * and nobody noticed for a simple reason: every suite that creates an
 * entitlement also failed at setup, because the migration chain could not
 * be applied at all. With the chain fixed those suites run, and cleanup
 * died on
 *
 *   update or delete on table "orders" violates foreign key constraint
 *   "entitlements_order_id_fkey" on table "entitlements"
 *
 * — twenty times. A broken migration was hiding a broken teardown.
 */
export const CLEANUP_ORDER = [
  'meta_events',
  'webhook_events',
  'payments',
  'entitlements',
  'orders',
] as const;

export type CleanupTable = (typeof CLEANUP_ORDER)[number];

export interface CleanupReport {
  /** Rows actually removed, per table, in deletion order. */
  deleted: Record<CleanupTable, number>;
  /** Ids this run registered, per table. */
  expected: Record<CleanupTable, number>;
  /** Rows still present after cleanup — must be empty. */
  leftover: Record<CleanupTable, string[]>;
  clean: boolean;
}

export interface TestRunContext extends TestRunIds {
  /** Deterministic seed: every id this run generates contains it. */
  readonly runId: string;
  /** `<prefix>_<runId>_<suffix>` — stable across runs with the same runId. */
  id(prefix: string, suffix: string | number): string;
  trackOrder(id: string): string;
  trackPayment(id: string): string;
  trackWebhookEvent(id: string): string;
  trackMetaEvent(id: string): string;
  /** Every id this run created, newest table first. */
  idsFor(table: CleanupTable): string[];
  totalTracked(): number;
}

let counter = 0;

/** A run id that is stable when supplied and unique when not. */
export function createRunId(seed?: string): string {
  if (seed) return sanitize(seed);
  counter += 1;
  return sanitize(`r${Date.now().toString(36)}${counter.toString(36)}`);
}

function sanitize(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '_');
  if (cleaned.length === 0) throw new Error('runId must contain at least one usable character');
  return cleaned;
}

export function createTestRunContext(seed?: string): TestRunContext {
  const runId = createRunId(seed);
  const orderIds: string[] = [];
  const paymentIds: string[] = [];
  const webhookEventIds: string[] = [];
  const metaEventIds: string[] = [];

  const track = (bucket: string[]) => (id: string) => {
    if (!id.includes(runId)) {
      // Guards the invariant cleanup depends on: if an id is not tagged
      // with this run, cleanup cannot prove it owns it.
      throw new Error(`id "${id}" does not carry runId "${runId}" and cannot be tracked`);
    }
    if (!bucket.includes(id)) bucket.push(id);
    return id;
  };

  return {
    runId,
    orderIds,
    paymentIds,
    webhookEventIds,
    metaEventIds,
    id: (prefix, suffix) => `${prefix}_${runId}_${suffix}`,
    trackOrder: track(orderIds),
    trackPayment: track(paymentIds),
    trackWebhookEvent: track(webhookEventIds),
    trackMetaEvent: track(metaEventIds),
    idsFor(table) {
      switch (table) {
        case 'entitlements':
          // Entitlements are created THROUGH the repository, which mints
          // its own ids, so a test cannot register them the way it
          // registers an order it inserted itself. They are deleted by
          // order_id instead — still strictly scoped to rows this run
          // created, because the order ids are this run's.
          return orderIds;
        case 'meta_events':
          return metaEventIds;
        case 'webhook_events':
          return webhookEventIds;
        case 'payments':
          return paymentIds;
        case 'orders':
          return orderIds;
      }
    },
    totalTracked: () =>
      orderIds.length + paymentIds.length + webhookEventIds.length + metaEventIds.length,
  };
}

/**
 * Deletes exactly the rows this run created, child tables first, and then
 * verifies none survive.
 *
 * Returns a report rather than throwing, so a test can assert on it;
 * {@link assertCleanupSucceeded} is the throwing wrapper.
 */
export async function cleanupTestRun(
  db: Queryable,
  context: TestRunContext,
): Promise<CleanupReport> {
  const deleted = emptyCounts();
  const expected = emptyCounts();
  const leftover: Record<CleanupTable, string[]> = {
    meta_events: [],
    webhook_events: [],
    payments: [],
    entitlements: [],
    orders: [],
  };

  for (const table of CLEANUP_ORDER) {
    const ids = context.idsFor(table);
    expected[table] = ids.length;
    if (ids.length === 0) continue;

    // Always id = ANY($1). Never a predicate that could match a row this
    // run did not create.
    // Always a run-scoped id list. Never a predicate that could match a
    // row this run did not create.
    const column = table === 'entitlements' ? 'order_id' : 'id';
    const result = await db.query(`DELETE FROM "${table}" WHERE ${column} = ANY($1::text[])`, [
      ids,
    ]);
    deleted[table] = result.rowCount ?? 0;
  }

  // Verification pass: re-read, do not trust the rowcounts.
  for (const table of CLEANUP_ORDER) {
    const ids = context.idsFor(table);
    if (ids.length === 0) continue;
    const verifyColumn = table === 'entitlements' ? 'order_id' : 'id';
    const { rows } = await db.query(
      `SELECT id FROM "${table}" WHERE ${verifyColumn} = ANY($1::text[]) ORDER BY id`,
      [ids],
    );
    leftover[table] = (rows as { id: string }[]).map((r) => r.id);
  }

  return {
    deleted,
    expected,
    leftover,
    clean: CLEANUP_ORDER.every((t) => leftover[t].length === 0),
  };
}

/** Cleanup plus a hard failure if anything survived. */
export async function assertCleanupSucceeded(
  db: Queryable,
  context: TestRunContext,
): Promise<CleanupReport> {
  const report = await cleanupTestRun(db, context);
  if (!report.clean) {
    const detail = CLEANUP_ORDER.filter((t) => report.leftover[t].length > 0)
      .map((t) => `${t}: ${report.leftover[t].join(', ')}`)
      .join('; ');
    throw new Error(`cleanup left rows behind for run ${context.runId} — ${detail}`);
  }
  return report;
}

/**
 * Counts rows belonging to this run. Useful for asserting a fixture
 * inserted what it claimed, and that cleanup removed all of it.
 */
export async function countRunRows(
  db: Queryable,
  context: TestRunContext,
): Promise<Record<CleanupTable, number>> {
  const counts = emptyCounts();
  for (const table of CLEANUP_ORDER) {
    const ids = context.idsFor(table);
    if (ids.length === 0) continue;
    const countColumn = table === 'entitlements' ? 'order_id' : 'id';
    const { rows } = await db.query(
      `SELECT count(*)::int AS n FROM "${table}" WHERE ${countColumn} = ANY($1::text[])`,
      [ids],
    );
    counts[table] = (rows[0] as { n: number }).n;
  }
  return counts;
}

function emptyCounts(): Record<CleanupTable, number> {
  return { meta_events: 0, webhook_events: 0, payments: 0, entitlements: 0, orders: 0 };
}
