import type { PlanDisplayName } from './types';

// Read/write side of plan_display_names (migration 0061).
// -----------------------------------------------------------------------
// Mirrors this repo's existing convention for a small, table-backed
// repository with its own locally-defined SqlClient interface rather
// than depending on @acos/db (same shape as
// packages/core-subscriptions/src/subscriptionPeriodRepository.ts).
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface PlanDisplayNameRepository {
  /** The override row for `productId`, or null if none has ever been set. */
  findByProductId(productId: string): Promise<PlanDisplayName | null>;

  /**
   * Upserts the display name for `productId`. Never touches `orders`,
   * `payments`, `entitlements`, or `subscription_periods` -- this write
   * is scoped to `plan_display_names` only (PO-1: changing a display
   * name must not change product/SKU identity, historical purchases, or
   * access).
   */
  upsert(productId: string, displayName: string, updatedBy: string | null): Promise<PlanDisplayName>;
}

interface PlanDisplayNameRow {
  product_id: string;
  display_name: string;
  updated_at: Date;
  updated_by: string | null;
}

function toPlanDisplayName(row: PlanDisplayNameRow): PlanDisplayName {
  return {
    productId: row.product_id,
    displayName: row.display_name,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

const COLUMNS = `product_id, display_name, updated_at, updated_by`;

export function createPgPlanDisplayNameRepository(sql: SqlClient): PlanDisplayNameRepository {
  return {
    async findByProductId(productId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM plan_display_names WHERE product_id = $1`,
        [productId],
      );
      const row = rows[0] as PlanDisplayNameRow | undefined;
      return row ? toPlanDisplayName(row) : null;
    },

    async upsert(productId, displayName, updatedBy) {
      const { rows } = await sql.query(
        `INSERT INTO plan_display_names (product_id, display_name, updated_at, updated_by)
              VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
         ON CONFLICT (product_id)
         DO UPDATE SET display_name = EXCLUDED.display_name,
                       updated_at = CURRENT_TIMESTAMP,
                       updated_by = EXCLUDED.updated_by
         RETURNING ${COLUMNS}`,
        [productId, displayName, updatedBy],
      );
      return toPlanDisplayName(rows[0] as PlanDisplayNameRow);
    },
  };
}
