// The unique indexes this deployment owns.
// -----------------------------------------------------------------------
// Index names deliberately match the names Prisma generates
// (`<table>_<column>_key`). That is what makes the whole system
// idempotent against an environment where 0001_init already created the
// index non-concurrently: the script finds it, verifies it, and records
// COMPLETED instead of trying to build it again.
// -----------------------------------------------------------------------

export interface IndexTarget {
  /** Groups targets into one deployment run; also the advisory-lock key. */
  migrationName: string;
  indexName: string;
  table: string;
  columns: readonly string[];
  /**
   * Rows where any indexed column is NULL cannot collide under a unique
   * index, so preflight skips them.
   */
  nullableColumns?: readonly string[];
  /** Why this uniqueness exists, surfaced in operator output. */
  rationale: string;
}

export const MIGRATION_NAME = '0002_concurrent_unique_indexes';

export const INDEX_TARGETS: readonly IndexTarget[] = [
  {
    migrationName: MIGRATION_NAME,
    indexName: 'payments_razorpay_payment_id_key',
    table: 'payments',
    columns: ['razorpay_payment_id'],
    rationale: 'One payment row per Razorpay payment id (webhook replay safety).',
  },
  {
    migrationName: MIGRATION_NAME,
    indexName: 'webhook_events_razorpay_event_id_key',
    table: 'webhook_events',
    columns: ['razorpay_event_id'],
    rationale: 'One webhook row per Razorpay event id (at-least-once delivery dedup).',
  },
  {
    migrationName: MIGRATION_NAME,
    indexName: 'meta_events_order_id_key',
    table: 'meta_events',
    columns: ['order_id'],
    rationale:
      'One Meta event per order. NOTE: this forbids an order ever carrying a second ' +
      'event type; narrow to (order_id, event_name) if the catalogue grows past Purchase.',
  },
  {
    migrationName: MIGRATION_NAME,
    indexName: 'meta_events_meta_event_id_key',
    table: 'meta_events',
    columns: ['meta_event_id'],
    rationale: 'One row per deterministic Meta event id (CAPI dedup key).',
  },
];

/**
 * Postgres cannot parameterise identifiers, so every table/column name
 * that reaches a statement is validated against this and then quoted.
 * The names above are compile-time constants, but this closes the door on
 * a future caller passing a target built from configuration.
 */
const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/;

export class UnsafeIdentifierError extends Error {
  constructor(identifier: string) {
    super(`refusing to interpolate unsafe SQL identifier: ${JSON.stringify(identifier)}`);
    this.name = 'UnsafeIdentifierError';
  }
}

export function quoteIdentifier(identifier: string): string {
  if (!SAFE_IDENTIFIER.test(identifier)) throw new UnsafeIdentifierError(identifier);
  return `"${identifier}"`;
}

export function assertTargetIsSafe(target: IndexTarget): void {
  quoteIdentifier(target.table);
  quoteIdentifier(target.indexName);
  if (target.columns.length === 0) {
    throw new UnsafeIdentifierError(`${target.indexName} has no columns`);
  }
  target.columns.forEach(quoteIdentifier);
}

/**
 * Schema names this library will put in a statement.
 *
 * Same reasoning as assertTargetIsSafe: the schema reaches SQL as a
 * quoted identifier for the CREATE and preflight statements, so it is
 * validated against a conservative pattern rather than trusted. A caller
 * supplying `public"; DROP SCHEMA ...` is refused rather than quoted and
 * hoped for.
 */
const SCHEMA_PATTERN = /^[a-z_][a-z0-9_$]*$/;

export function assertSchemaIsSafe(schema: string): void {
  if (typeof schema !== 'string' || !SCHEMA_PATTERN.test(schema)) {
    throw new Error(
      `refusing to build SQL with schema name ${JSON.stringify(schema)} — ` +
        `expected a plain lowercase identifier`,
    );
  }
}
