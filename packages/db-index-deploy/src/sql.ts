import {
  assertSchemaIsSafe,
  assertTargetIsSafe,
  quoteIdentifier,
  type IndexTarget,
} from './targets';

// Every statement the deployment issues, in one place so they can be
// asserted on in tests and reviewed by a DBA without reading the driver.
// -----------------------------------------------------------------------

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

/** A connection pinned for the whole run — advisory locks are session-scoped. */
export interface SessionExecutor extends SqlExecutor {
  release?: () => Promise<void> | void;
}

/** Namespace half of the two-int advisory lock key; 'AC' in hex. */
export const ADVISORY_LOCK_NAMESPACE = 4919;

export const ACQUIRE_LOCK_SQL = `SELECT pg_try_advisory_lock($1, hashtext($2)) AS acquired`;
export const RELEASE_LOCK_SQL = `SELECT pg_advisory_unlock($1, hashtext($2)) AS released`;

/**
 * The single source of truth for whether an index is really usable.
 *
 * `indisvalid = false` is the signature of a CREATE INDEX CONCURRENTLY
 * that failed partway: the index exists, consumes writes, and is NOT used
 * by the planner. It must never be treated as success, and this system
 * never drops it automatically — see deploy.ts.
 */
export const DEFAULT_SCHEMA = 'public';

/**
 * Inspect one index BY NAME AND SCHEMA.
 *
 * `$1` index name, `$2` schema name.
 *
 * WHY THE SCHEMA IS A PARAMETER AND NOT current_schema():
 *
 * This used to filter on `n.nspname = current_schema()`, which resolves
 * to the FIRST existing entry in the caller's search_path. That is a
 * property of the connection, not of the database — and this library runs
 * in a standalone script with its own connection, whose search_path can
 * be set by the connection string, by ALTER ROLE, by ALTER DATABASE, or
 * by a pooler's session defaults.
 *
 * The failure is silent and points the wrong way: a real, valid index in
 * `public` looks MISSING when search_path happens to start elsewhere, so
 * the deployment decides to build it — and `CREATE UNIQUE INDEX
 * CONCURRENTLY` then fails with "relation already exists", or worse
 * succeeds in the other schema and leaves two. Reporting "missing" for
 * something that exists is the kind of wrong answer that makes an
 * operator distrust the tool and go around it.
 *
 * Creation and preflight take the same schema, deliberately. Making only
 * inspection explicit would be worse than leaving it alone: the script
 * would then look in one schema and build in another, forever.
 */
export const INSPECT_INDEX_SQL = `
  SELECT c.relname                         AS index_name,
         t.relname                         AS table_name,
         n.nspname                         AS schema_name,
         i.indpred IS NOT NULL             AS is_partial,
         i.indnatts                        AS natts,
         i.indnkeyatts                     AS nkeyatts,
         i.indisunique                     AS is_unique,
         i.indisvalid                      AS is_valid,
         i.indisready                      AS is_ready,
         i.indislive                       AS is_live,
         -- The ::text[] cast matters. attname has type name, and node-pg
         -- hands a name[] back as a raw literal string instead of a JS
         -- array, so every column comparison downstream failed with
         -- columns.join is not a function. The in-memory fake returns a
         -- real array, which is why no unit test ever saw this.
         array_agg(a.attname::text ORDER BY k.ord) AS columns
    FROM pg_index i
    JOIN pg_class c      ON c.oid = i.indexrelid
    JOIN pg_class t      ON t.oid = i.indrelid
    JOIN pg_namespace n  ON n.oid = c.relnamespace
    CROSS JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a  ON a.attrelid = t.oid AND a.attnum = k.attnum
   WHERE c.relname = $1
     AND n.nspname = $2
   GROUP BY c.relname, t.relname, n.nspname, i.indisunique, i.indisvalid,
            i.indisready, i.indislive, i.indpred, i.indnatts, i.indnkeyatts`;

/**
 * CREATE UNIQUE INDEX CONCURRENTLY.
 *
 * IF NOT EXISTS is deliberately omitted: it would silently succeed against
 * an existing INVALID index from a previous failed build, which is exactly
 * the condition an operator must see. Existence is checked beforehand
 * instead, so the script knows which case it is in.
 *
 * This statement MUST be issued outside any transaction. Postgres rejects
 * it inside one ("CREATE INDEX CONCURRENTLY cannot run inside a
 * transaction block"), which is why this deployment is a standalone
 * script rather than a Prisma migration.
 */
export function createIndexSql(target: IndexTarget, schema: string = DEFAULT_SCHEMA): string {
  assertTargetIsSafe(target);
  assertSchemaIsSafe(schema);
  const columns = target.columns.map(quoteIdentifier).join(', ');
  // The TABLE is qualified; the index name is not, and must not be.
  // PostgreSQL rejects a schema-qualified index name in CREATE INDEX
  // ("syntax error at or near \".\"") because an index always lands in
  // the schema of the table it indexes. Qualifying the table is therefore
  // both necessary and sufficient: it pins the destination without
  // consulting search_path, which is what the schema-explicit inspection
  // above needs in order to look in the right place afterwards.
  return (
    `CREATE UNIQUE INDEX CONCURRENTLY ${quoteIdentifier(target.indexName)} ` +
    `ON ${quoteIdentifier(schema)}.${quoteIdentifier(target.table)} (${columns})`
  );
}

/** Duplicate preflight: what WOULD break the unique build, with examples. */
export function duplicatePreflightSql(
  target: IndexTarget,
  limit = 20,
  schema: string = DEFAULT_SCHEMA,
): string {
  assertTargetIsSafe(target);
  assertSchemaIsSafe(schema);
  const cols = target.columns.map(quoteIdentifier);
  const notNull = cols.map((c) => `${c} IS NOT NULL`).join(' AND ');
  return `
    SELECT ${cols.join(', ')}, count(*)::int AS record_count
      FROM ${quoteIdentifier(schema)}.${quoteIdentifier(target.table)}
     WHERE ${notNull}
     GROUP BY ${cols.join(', ')}
    HAVING count(*) > 1
     ORDER BY count(*) DESC
     LIMIT ${Number.isInteger(limit) && limit > 0 ? limit : 20}`;
}

// --- ProductionIndexMigration state table -------------------------------
//
// NOTE ON STATUS NAMES: the brief asked for APPLIED, but the deployed
// enum ProductionIndexMigrationStatus is
// (PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK). COMPLETED is used
// as the terminal success state. Adding an APPLIED value would need its
// own migration, and `ALTER TYPE ... ADD VALUE` has the same
// cannot-run-in-a-transaction problem this system exists to solve.

export const ENSURE_STATE_ROW_SQL = `
  INSERT INTO production_index_migrations
    (id, migration_name, index_name, deployment_status, created_at, updated_at)
  VALUES (gen_random_uuid()::text, $1, $2, 'PENDING', $3, $3)
  ON CONFLICT (migration_name, index_name) DO NOTHING`;

export const READ_STATE_SQL = `
  SELECT deployment_status AS status, start_time, completion_time, error
    FROM production_index_migrations
   WHERE migration_name = $1 AND index_name = $2`;

export const MARK_RUNNING_SQL = `
  UPDATE production_index_migrations
     SET deployment_status = 'RUNNING', start_time = $3, error = NULL, updated_at = $3
   WHERE migration_name = $1 AND index_name = $2`;

export const MARK_COMPLETED_SQL = `
  UPDATE production_index_migrations
     SET deployment_status = 'COMPLETED', completion_time = $3, error = NULL, updated_at = $3
   WHERE migration_name = $1 AND index_name = $2`;

export const MARK_FAILED_SQL = `
  UPDATE production_index_migrations
     SET deployment_status = 'FAILED', error = $3, updated_at = $4
   WHERE migration_name = $1 AND index_name = $2`;

export const RESET_TO_PENDING_SQL = `
  UPDATE production_index_migrations
     SET deployment_status = 'PENDING', start_time = NULL, error = $3, updated_at = $4
   WHERE migration_name = $1 AND index_name = $2`;
