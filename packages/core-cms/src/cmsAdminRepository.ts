import type { CmsAdmin } from './types';

// Read side of cms_admins (migration 0065, CMS-PO-006(R3)).
// -----------------------------------------------------------------------
// Mirrors this repo's existing convention for a small, table-backed
// repository with its own locally-defined SqlClient interface (same
// shape as planDisplayNameRepository.ts/contentItemRepository.ts).
//
// Deliberately READ-ONLY: this phase is the authorization foundation
// only (requireCmsAdmin, cmsAdminAuthorization.ts). Granting/revoking
// membership is operator-controlled, directly against the database
// (CMS-PO-006(R3)) -- there is no `grant`/`revoke` method here, and
// none should be added until a later, explicitly authorized phase
// builds an operator-only provisioning path.
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface CmsAdminRepository {
  /** The membership row for `userId`, or null if they are not a CMS administrator. */
  findByUserId(userId: string): Promise<CmsAdmin | null>;
}

interface CmsAdminRow {
  user_id: string;
  created_at: Date;
  created_by: string | null;
}

function toCmsAdmin(row: CmsAdminRow): CmsAdmin {
  return {
    userId: row.user_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

const COLUMNS = `user_id, created_at, created_by`;

export function createPgCmsAdminRepository(sql: SqlClient): CmsAdminRepository {
  return {
    async findByUserId(userId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM cms_admins WHERE user_id = $1`,
        [userId],
      );
      const row = rows[0] as CmsAdminRow | undefined;
      return row ? toCmsAdmin(row) : null;
    },
  };
}
