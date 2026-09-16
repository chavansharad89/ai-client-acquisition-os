import {
  DUPLICATE_DIMENSIONS,
  RECORD_TYPE_BY_DIMENSION,
  type DuplicateDimension,
  type DuplicateGroup,
} from './types';

// Detection — READ-ONLY against every business table, and bounded.
// -----------------------------------------------------------------------
// Each query answers one question: within a time window, which values of a
// supposedly-unique column appear more than once?
//
// THREE THINGS ARE BOUNDED, AND ONE DELIBERATELY IS NOT.
//
//   Bounded — the WINDOW. `created_at >= $1 AND created_at < $2`, half
//   open so consecutive windows tile without double-counting a row on the
//   boundary. An unbounded scan re-reads the whole table on every run and
//   grows without limit; a windowed one costs what the window holds.
//
//   Bounded — the number of GROUPS returned, and the number of EXAMPLE
//   ROWS kept per group. A thousand duplicate groups is an incident, not a
//   report to page through, and five examples of a collision explain it as
//   well as five hundred.
//
//   NOT bounded — the COUNT. `record_count` is computed with a window
//   function over every row in the window, so it is the true size of the
//   group even when only a handful of examples are kept. Capping the count
//   would trade detection accuracy for performance, which is the one
//   trade this file must not make: a report saying "5 duplicates" when
//   there are 900 is worse than no report.
//
// NO PAYLOAD IS EVER SELECTED. The previous version used `to_jsonb(w)`,
// which pulled `webhook_events.payload` — the verbatim provider payload,
// carrying customer email, contact number and payment metadata — into an
// aggregate, into application memory, and then into a snapshot column in
// a table with different access expectations and no retention policy. The
// column lists below are explicit allowlists, so adding a PII column to a
// business table cannot silently widen what reconciliation copies.
//
// Nothing here may INSERT, UPDATE or DELETE. That is enforced four ways:
// the statements are SELECTs, the executor type is named for its contract,
// `assertReadOnly` rejects anything else before it reaches the database,
// and — the one that actually binds — the transaction is opened READ ONLY
// so PostgreSQL itself refuses a write.
// -----------------------------------------------------------------------

export interface ReadOnlyQueryExecutor {
  query(sql: string, params?: readonly unknown[]): Promise<{ rows: unknown[] }>;
}

/** A pool that can pin one connection, so BEGIN and SELECT share a session. */
export interface ReadOnlyPool {
  connect(): Promise<ReadOnlyQueryExecutor & { release: () => void }>;
}

/** Half-open: `[start, end)`. */
export interface ReconciliationWindow {
  start: Date;
  end: Date;
  /** Example rows kept per group. The COUNT is unaffected. */
  maxRowsPerGroup?: number;
  /** Groups returned per dimension. */
  maxGroups?: number;
}

export const DEFAULT_MAX_ROWS_PER_GROUP = 5;
export const DEFAULT_MAX_GROUPS = 500;

interface RawGroupRow {
  duplicate_key: string | null;
  record_count: number | string;
  rows: unknown[] | null;
  /** True when the group had more rows than the sample cap. */
  sample_truncated: boolean;
}

/**
 * Per-dimension spec. `columns` is an allowlist, not a convenience: it is
 * what stops a payload column joining the snapshot.
 */
interface DimensionSpec {
  table: string;
  keyColumn: string;
  /** Explicitly NOT `payload`, for webhook_events. */
  columns: readonly string[];
  orderBy: readonly string[];
}

const SPECS: Readonly<Record<DuplicateDimension, DimensionSpec>> = {
  'payment.razorpayPaymentId': {
    table: 'payments',
    keyColumn: 'razorpay_payment_id',
    columns: ['id', 'razorpay_payment_id', 'order_id', 'amount_paise', 'currency', 'status', 'created_at'],
    orderBy: ['created_at', 'id'],
  },
  'webhookEvent.razorpayEventId': {
    table: 'webhook_events',
    keyColumn: 'razorpay_event_id',
    // `payload` is deliberately absent. Identifying a duplicate webhook
    // needs its id, name and timing — not a copy of the provider's body.
    columns: [
      'id',
      'razorpay_event_id',
      'event_name',
      'order_id',
      'signature_valid',
      'received_at',
      'processed_at',
      'created_at',
    ],
    orderBy: ['received_at', 'id'],
  },
  // order_id is NOT unique in the schema by design, so this flags any
  // order carrying more than one meta event — the Phase 1 rule (one
  // Purchase per order). Narrow the key to (order_id, event_name) if the
  // event catalogue ever grows beyond Purchase.
  'metaEvent.orderId': {
    table: 'meta_events',
    keyColumn: 'order_id',
    columns: [
      'id',
      'meta_event_id',
      'order_id',
      'event_name',
      'product',
      'value_paise',
      'currency',
      'status',
      'attempts',
      'created_at',
    ],
    orderBy: ['created_at', 'id'],
  },
  'metaEvent.metaEventId': {
    table: 'meta_events',
    keyColumn: 'meta_event_id',
    columns: [
      'id',
      'meta_event_id',
      'order_id',
      'event_name',
      'product',
      'value_paise',
      'currency',
      'status',
      'attempts',
      'created_at',
    ],
    orderBy: ['created_at', 'id'],
  },
};

/** Every column name this module will ever put in a statement. */
const IDENTIFIER = /^[a-z_][a-z0-9_]*$/;

function assertIdentifier(name: string): string {
  if (!IDENTIFIER.test(name)) {
    throw new ReconciliationSafetyError(`refusing to build SQL with identifier "${name}"`);
  }
  return name;
}

/**
 * Builds the SELECT for one dimension.
 *
 * `$1` window start, `$2` window end, `$3` rows per group, `$4` max groups.
 *
 * The CTE computes the group size and a per-group row number in one pass;
 * the outer query then keeps only groups of two or more, samples the first
 * `$3` rows of each, and reports `max(group_count)` — the real total.
 */
export function buildDetectionSql(dimension: DuplicateDimension): string {
  const spec = SPECS[dimension];
  const table = assertIdentifier(spec.table);
  const key = assertIdentifier(spec.keyColumn);
  const columns = spec.columns.map(assertIdentifier);
  const orderCols = spec.orderBy.map(assertIdentifier);
  // Qualified inside the CTE (where the base table is aliased `t`),
  // unqualified outside it (where they are columns of `w`).
  const orderQualified = orderCols.map((c) => `t.${c}`).join(', ');
  const order = orderCols.join(', ');

  return `
    WITH windowed AS (
      SELECT ${columns.map((c) => `t.${c}`).join(', ')},
             count(*)    OVER (PARTITION BY t.${key}) AS group_count,
             row_number() OVER (PARTITION BY t.${key} ORDER BY ${orderQualified}) AS sample_rank
        FROM ${table} t
       WHERE t.${key} IS NOT NULL
         AND t.created_at >= $1
         AND t.created_at <  $2
    )
    SELECT w.${key} AS duplicate_key,
           max(w.group_count)::int AS record_count,
           coalesce(
             json_agg(to_jsonb(w) - 'group_count' - 'sample_rank' ORDER BY ${order})
               FILTER (WHERE w.sample_rank <= $3),
             '[]'::json
           ) AS rows,
           bool_or(w.group_count > $3) AS sample_truncated
      FROM windowed w
     WHERE w.group_count > 1
     GROUP BY w.${key}
     ORDER BY w.${key}
     LIMIT $4`;
}

/** The SELECT issued for each dimension. Exported so tests can assert on them. */
export const DETECTION_SQL: Readonly<Record<DuplicateDimension, string>> = Object.freeze(
  Object.fromEntries(
    DUPLICATE_DIMENSIONS.map((dimension) => [dimension, buildDetectionSql(dimension)]),
  ) as Record<DuplicateDimension, string>,
);

const WRITE_KEYWORD =
  /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|merge|copy)\b/i;

/**
 * Fails closed: anything that is not a bare SELECT (or a read-only CTE)
 * never reaches the database.
 *
 * Defence in depth, kept deliberately even though the READ ONLY
 * transaction is the real guarantee. This one catches a bad statement at
 * the point it is written, with a message naming this module; the
 * transaction catches it at the database, which is where correctness
 * actually lives. Neither is redundant — a future caller who forgets to
 * open the transaction still gets this.
 */
export function assertReadOnly(sql: string): void {
  const stripped = sql.replace(/--[^\n]*/g, '').trim();
  if (!/^(select|with)\b/i.test(stripped)) {
    throw new ReconciliationSafetyError(
      'reconciliation may only issue SELECT statements (or read-only CTEs)',
    );
  }
  if (WRITE_KEYWORD.test(stripped)) {
    throw new ReconciliationSafetyError(
      'reconciliation query contains a data-modifying keyword and was blocked',
    );
  }
  if (stripped.includes(';')) {
    throw new ReconciliationSafetyError('reconciliation query may not contain multiple statements');
  }
}

export class ReconciliationSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReconciliationSafetyError';
  }
}

/** Yields the duplicate groups for one dimension, within one window. */
export type DetectionSource = (
  dimension: DuplicateDimension,
  window: ReconciliationWindow,
) => Promise<DuplicateGroup[]>;

/** Builds a DetectionSource backed by the SELECTs above. */
export function createSqlDetectionSource(executor: ReadOnlyQueryExecutor): DetectionSource {
  return async (dimension, window) => {
    const sql = DETECTION_SQL[dimension];
    assertReadOnly(sql);
    assertWindow(window);
    const { rows } = await executor.query(sql, [
      window.start,
      window.end,
      window.maxRowsPerGroup ?? DEFAULT_MAX_ROWS_PER_GROUP,
      window.maxGroups ?? DEFAULT_MAX_GROUPS,
    ]);
    return (rows as RawGroupRow[])
      .filter((r) => r.duplicate_key !== null)
      .map((r) => toGroup(dimension, r));
  };
}

/**
 * Runs `fn` inside a PostgreSQL READ ONLY transaction.
 *
 * This is the guarantee that does not depend on anybody remembering
 * anything. Inside it the server rejects INSERT, UPDATE, DELETE and DDL
 * with SQLSTATE 25006 — a `SELECT` with a side-effecting function in it,
 * a mistyped statement, a future edit that adds a write "just this once":
 * all refused by the database rather than by a regex.
 *
 * The connection is pinned because BEGIN and the statements after it must
 * share a session; a pool that round-robins would leave the transaction
 * on one connection and the queries on another.
 */
export async function withReadOnlyTransaction<T>(
  pool: ReadOnlyPool,
  fn: (executor: ReadOnlyQueryExecutor) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function assertWindow(window: ReconciliationWindow): void {
  if (!(window.start instanceof Date) || !(window.end instanceof Date)) {
    throw new ReconciliationSafetyError('reconciliation window needs start and end Dates');
  }
  if (Number.isNaN(window.start.getTime()) || Number.isNaN(window.end.getTime())) {
    throw new ReconciliationSafetyError('reconciliation window dates must be valid');
  }
  if (window.start.getTime() >= window.end.getTime()) {
    throw new ReconciliationSafetyError(
      `reconciliation window start must be before end (got ${window.start.toISOString()} .. ${window.end.toISOString()})`,
    );
  }
  for (const [name, value] of [
    ['maxRowsPerGroup', window.maxRowsPerGroup],
    ['maxGroups', window.maxGroups],
  ] as const) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1)) {
      throw new ReconciliationSafetyError(`${name} must be a positive integer, received ${value}`);
    }
  }
}

function toGroup(dimension: DuplicateDimension, row: RawGroupRow): DuplicateGroup {
  const rawKey = String(row.duplicate_key);
  return {
    dimension,
    recordType: RECORD_TYPE_BY_DIMENSION[dimension],
    duplicateKey: qualifyKey(dimension, rawKey),
    rawKey,
    recordCount: Number(row.record_count),
    rows: row.rows ?? [],
    sampleTruncated: Boolean(row.sample_truncated),
  };
}

/** `<dimension>=<value>` — see the header note on META_EVENT ambiguity. */
export function qualifyKey(dimension: DuplicateDimension, rawKey: string): string {
  return `${dimension}=${rawKey}`;
}

/** Runs every dimension, in a stable order, and flattens the result. */
export async function detectDuplicates(
  source: DetectionSource,
  window: ReconciliationWindow,
  dimensions: readonly DuplicateDimension[] = DUPLICATE_DIMENSIONS,
): Promise<DuplicateGroup[]> {
  const groups: DuplicateGroup[] = [];
  for (const dimension of dimensions) {
    groups.push(...(await source(dimension, window)));
  }
  return groups;
}
