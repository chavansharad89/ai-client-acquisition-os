import type { Queryable } from './test-run-context';

// A small in-memory Postgres stand-in for exercising the fixtures'
// CONTRACT: what ids they produce, what SQL they issue, and whether
// cleanup respects foreign keys. It is not a database, and the real
// behaviour of these fixtures is still covered by the integration suite.

interface Row {
  id: string;
  [column: string]: unknown;
}

export interface FakeDb extends Queryable {
  tables: Record<string, Row[]>;
  statements: { sql: string; params: readonly unknown[] }[];
  /** Tables touched by DELETE, in the order they were deleted. */
  deleteOrder: string[];
  rowsIn(table: string): Row[];
}

/** ON DELETE RESTRICT: child -> parent. */
const CHILD_TABLES: Record<string, { column: string }> = {
  meta_events: { column: 'order_id' },
  webhook_events: { column: 'order_id' },
  payments: { column: 'order_id' },
  // Added by migration 0004. Missing here for as long as it was missing
  // from CLEANUP_ORDER, which is why this fake happily reported a clean
  // teardown while the real database was rejecting it.
  entitlements: { column: 'order_id' },
};

export function createFakeDb(): FakeDb {
  const tables: Record<string, Row[]> = {
    orders: [],
    payments: [],
    webhook_events: [],
    meta_events: [],
    entitlements: [],
  };
  const statements: { sql: string; params: readonly unknown[] }[] = [];
  const deleteOrder: string[] = [];

  const db: FakeDb = {
    tables,
    statements,
    deleteOrder,
    rowsIn: (table) => tables[table] ?? [],
    async query(sql: string, params: readonly unknown[] = []) {
      statements.push({ sql, params });
      const insert = /INSERT INTO (\w+)/i.exec(sql);
      const del = /DELETE FROM "(\w+)"/i.exec(sql);
      const select = /FROM "(\w+)"/i.exec(sql);

      if (insert) {
        const table = insert[1]!;
        const id = String(params[0]);
        const rows = tables[table]!;
        const exists = rows.some((r) => r.id === id);
        if (exists && /ON CONFLICT \(id\) DO NOTHING/i.test(sql)) {
          return { rows: [], rowCount: 0 };
        }
        if (exists)
          throw new Error(`duplicate key value violates unique constraint on ${table}.id`);
        // Record the order reference so FK restriction can be simulated.
        const orderId = /order_id/i.test(sql)
          ? params.find((p) => typeof p === 'string' && p.startsWith('order_'))
          : undefined;
        rows.push({ id, ...(orderId ? { order_id: String(orderId) } : {}) });
        return { rows: [], rowCount: 1 };
      }

      if (del) {
        const table = del[1]!;
        const ids = (params[0] as string[]) ?? [];
        const keyed = /WHERE\s+order_id\s*=\s*ANY/i.test(sql) ? 'order_id' : 'id';
        if (table === 'orders') {
          // ON DELETE RESTRICT — refuse while children still reference it.
          for (const child of Object.keys(CHILD_TABLES)) {
            const blocking = tables[child]!.filter((r) => ids.includes(String(r.order_id)));
            if (blocking.length > 0) {
              throw new Error(
                `update or delete on table "orders" violates foreign key constraint on "${child}"`,
              );
            }
          }
        }
        const before = tables[table]!.length;
        tables[table] = tables[table]!.filter((r) => !ids.includes(String(r[keyed])));
        deleteOrder.push(table);
        return { rows: [], rowCount: before - tables[table]!.length };
      }

      if (/SELECT count\(\*\)/i.test(sql) && select) {
        const ids = (params[0] as string[]) ?? [];
        const col = /WHERE\s+order_id\s*=\s*ANY/i.test(sql) ? 'order_id' : 'id';
        const n = tables[select[1]!]!.filter((r) => ids.includes(String(r[col]))).length;
        return { rows: [{ n }], rowCount: 1 };
      }

      if (select) {
        const ids = (params[0] as string[]) ?? [];
        const col = /WHERE\s+order_id\s*=\s*ANY/i.test(sql) ? 'order_id' : 'id';
        const rows = tables[select[1]!]!.filter((r) => ids.includes(String(r[col]))).map((r) => ({
          id: r.id,
        }));
        return { rows, rowCount: rows.length };
      }

      return { rows: [], rowCount: 0 };
    },
  };
  return db;
}
