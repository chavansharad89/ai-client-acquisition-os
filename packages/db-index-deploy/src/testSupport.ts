import type { SessionExecutor } from './sql';
import type { DeploymentStatus } from './deploy';

// A fake Postgres good enough to exercise the deployment's decisions:
// pg_index inspection, advisory locks, the state table, and the failure
// modes that matter (INVALID index, duplicates, mid-build crash).

export interface FakeIndex {
  table: string;
  columns: string[];
  isUnique: boolean;
  isValid: boolean;
  /**
   * Defaults to TRUE, independent of isValid. That is the real shape of a
   * failed CREATE INDEX CONCURRENTLY: indisvalid = false while
   * indisready = true. Defaulting this to isValid would let a broken
   * validity check hide behind the readiness check.
   */
  isReady?: boolean;
  /** Where the index lives. Defaults to `public`. */
  schema?: string;
  /** True for an index with a WHERE clause — a weaker promise. */
  isPartial?: boolean;
  isLive?: boolean;
}

export interface FakeDbOptions {
  indexes?: Record<string, FakeIndex>;
  duplicates?: Record<string, { rows: Record<string, unknown>[] }>;
  lockAvailable?: boolean;
  /** Make the CREATE statement fail, optionally leaving an INVALID index. */
  failCreate?: { message: string; leavesInvalidIndex?: boolean };
  /** CREATE returns success, but the index lands INVALID (silent failure). */
  createLandsInvalid?: boolean;
}

export interface FakeDb extends SessionExecutor {
  indexes: Map<string, FakeIndex>;
  state: Map<string, { status: DeploymentStatus; error: string | null }>;
  statements: string[];
  locks: string[];
  unlocks: string[];
  setState(migrationName: string, indexName: string, status: DeploymentStatus): void;
}

export function createFakeDb(options: FakeDbOptions = {}): FakeDb {
  const indexes = new Map<string, FakeIndex>(Object.entries(options.indexes ?? {}));
  const state = new Map<string, { status: DeploymentStatus; error: string | null }>();
  const statements: string[] = [];
  const locks: string[] = [];
  const unlocks: string[] = [];
  const lockAvailable = options.lockAvailable ?? true;

  const db: FakeDb = {
    indexes,
    state,
    statements,
    locks,
    unlocks,
    setState(migrationName, indexName, status) {
      state.set(`${migrationName}|${indexName}`, { status, error: null });
    },
    async query(sql: string, params: readonly unknown[] = []) {
      statements.push(sql.trim());
      const none = { rows: [] as unknown[], rowCount: 0 };

      if (sql.includes('pg_try_advisory_lock')) {
        locks.push(String(params[1]));
        return { rows: [{ acquired: lockAvailable }], rowCount: 1 };
      }
      if (sql.includes('pg_advisory_unlock')) {
        unlocks.push(String(params[1]));
        return { rows: [{ released: true }], rowCount: 1 };
      }

      if (sql.includes('FROM pg_index')) {
        const idx = indexes.get(String(params[0]));
        if (!idx) return none;

        // The fake filters on SCHEMA the way the real query does. Without
        // this it would return an index regardless of which schema was
        // asked for, and a test could not tell a schema-explicit lookup
        // from the current_schema() one it replaced.
        const requestedSchema = String(params[1] ?? 'public');
        if ((idx.schema ?? 'public') !== requestedSchema) return none;

        return {
          rows: [
            {
              index_name: String(params[0]),
              table_name: idx.table,
              schema_name: idx.schema ?? 'public',
              is_unique: idx.isUnique,
              is_valid: idx.isValid,
              is_ready: idx.isReady ?? true,
              is_live: idx.isLive ?? true,
              is_partial: idx.isPartial ?? false,
              natts: idx.columns.length,
              nkeyatts: idx.columns.length,
              columns: idx.columns,
            },
          ],
          rowCount: 1,
        };
      }

      if (sql.includes('INSERT INTO production_index_migrations')) {
        const key = `${params[0]}|${params[1]}`;
        if (!state.has(key)) state.set(key, { status: 'PENDING', error: null });
        return none;
      }
      if (sql.includes('FROM production_index_migrations')) {
        const row = state.get(`${params[0]}|${params[1]}`);
        return row ? { rows: [{ status: row.status, error: row.error }], rowCount: 1 } : none;
      }
      if (sql.includes('UPDATE production_index_migrations')) {
        const key = `${params[0]}|${params[1]}`;
        const status: DeploymentStatus = sql.includes("'RUNNING'")
          ? 'RUNNING'
          : sql.includes("'COMPLETED'")
            ? 'COMPLETED'
            : sql.includes("'FAILED'")
              ? 'FAILED'
              : 'PENDING';
        const error = status === 'FAILED' || status === 'PENDING' ? String(params[2] ?? '') : null;
        state.set(key, { status, error });
        return { rows: [], rowCount: 1 };
      }

      if (sql.trimStart().startsWith('CREATE UNIQUE INDEX CONCURRENTLY')) {
        // Both identifiers are now schema-qualified — "public"."name" —
        // so the fake parses the schema too and records the index where
        // the statement actually put it. A fake that ignored the schema
        // would let a build land in one schema and a lookup succeed in
        // another, which is the bug this change exists to remove.
        const name = /CONCURRENTLY "([^"]+)" ON "([^"]+)"\."([^"]+)" \(([^)]+)\)/.exec(sql);
        const indexName = name?.[1] ?? '';
        const schema = name?.[2] ?? 'public';
        const table = name?.[3] ?? '';
        const columns = (name?.[4] ?? '').split(',').map((c) => c.trim().replace(/"/g, ''));
        if (options.failCreate) {
          if (options.failCreate.leavesInvalidIndex) {
            indexes.set(indexName, { table, columns, isUnique: true, isValid: false, schema });
          }
          throw new Error(options.failCreate.message);
        }
        indexes.set(indexName, {
          table,
          columns,
          isUnique: true,
          isValid: !options.createLandsInvalid,
          schema,
        });
        return none;
      }

      // Duplicate preflight.
      if (sql.includes('HAVING count(*) > 1')) {
        // Schema-qualified now: FROM "public"."payments".
        const table = /FROM "[^"]+"\."([^"]+)"/.exec(sql)?.[1] ?? '';
        return { rows: options.duplicates?.[table]?.rows ?? [], rowCount: 0 };
      }

      return none;
    },
  };
  return db;
}

/** A pre-existing valid unique index, as 0001_init would have left it. */
export function validIndex(table: string, ...columns: string[]): FakeIndex {
  return { table, columns, isUnique: true, isValid: true, schema: 'public' };
}

/** The same index, sitting in a schema the caller did not ask about. */
export function indexInSchema(schema: string, table: string, ...columns: string[]): FakeIndex {
  return { table, columns, isUnique: true, isValid: true, schema };
}

/** Valid and unique, but only over the rows its predicate covers. */
export function partialIndex(table: string, ...columns: string[]): FakeIndex {
  return { table, columns, isUnique: true, isValid: true, isPartial: true, schema: 'public' };
}
