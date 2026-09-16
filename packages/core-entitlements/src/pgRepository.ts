import type { ProductId } from '@acos/catalog';

import type { StoredAccessToken } from './accessToken';
import { normaliseEmail, type EntitlementRepository } from './repository';
import type { Entitlement, GrantEntitlementInput, GrantResult } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor rather than Prisma, matching
// tests/integration/support/pgOrderRepository.ts — this sandbox cannot
// generate a Prisma engine, and these statements are what Prisma would
// emit anyway.
// -----------------------------------------------------------------------

export interface SqlExecutor {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

interface EntitlementRow {
  id: string;
  customer_email: string;
  product_slug: string;
  order_id: string;
  granted_at: Date;
  revoked_at: Date | null;
}

const COLUMNS = `id, customer_email, product_slug, order_id, granted_at, revoked_at`;

export function createPgEntitlementRepository(sql: SqlExecutor): EntitlementRepository {
  return {
    async grant(input: GrantEntitlementInput, now: Date): Promise<GrantResult> {
      const email = normaliseEmail(input.customerEmail);

      // ON CONFLICT DO NOTHING plus a follow-up read, rather than DO
      // UPDATE: a second purchase of the same product must not rewrite the
      // provenance of the first. The original order is the one that paid.
      const inserted = await sql.query(
        `INSERT INTO entitlements
           (id, customer_email, product_slug, order_id, granted_at, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $4, $4)
         ON CONFLICT (customer_email, product_slug) DO NOTHING
         RETURNING ${COLUMNS}`,
        [email, input.productSlug, input.orderId, now],
      );

      if (inserted.rows[0]) {
        return { outcome: 'granted', entitlement: mapRow(inserted.rows[0] as EntitlementRow) };
      }

      const existing = await sql.query(
        `SELECT ${COLUMNS} FROM entitlements
          WHERE customer_email = $1 AND product_slug = $2`,
        [email, input.productSlug],
      );
      if (!existing.rows[0]) {
        throw new Error(
          `entitlement grant for ${input.productSlug} neither inserted nor found — ` +
            'the unique index and this query disagree',
        );
      }
      return { outcome: 'already-held', entitlement: mapRow(existing.rows[0] as EntitlementRow) };
    },

    async listActive(customerEmail: string): Promise<readonly Entitlement[]> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM entitlements
          WHERE customer_email = $1 AND revoked_at IS NULL
          ORDER BY granted_at, id`,
        [normaliseEmail(customerEmail)],
      );
      return (rows as EntitlementRow[]).map(mapRow);
    },

    async revoke(entitlementId: string, reason: string, now: Date): Promise<boolean> {
      // Conditional on revoked_at IS NULL so revoking twice reports false
      // rather than silently moving the revocation date.
      const { rowCount } = await sql.query(
        `UPDATE entitlements
            SET revoked_at = $2, revoked_reason = $3, updated_at = $2
          WHERE id = $1 AND revoked_at IS NULL`,
        [entitlementId, now, reason],
      );
      return (rowCount ?? 0) > 0;
    },

    async findAccessToken(tokenHash: string): Promise<StoredAccessToken | null> {
      const { rows } = await sql.query(
        `SELECT customer_email, expires_at, revoked_at
           FROM access_tokens WHERE token_hash = $1`,
        [tokenHash],
      );
      const row = rows[0] as
        { customer_email: string; expires_at: Date; revoked_at: Date | null } | undefined;
      if (!row) return null;
      return {
        customerEmail: row.customer_email,
        expiresAt: new Date(row.expires_at),
        revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
      };
    },

    async saveAccessToken({ tokenHash, customerEmail, expiresAt, now }) {
      await sql.query(
        `INSERT INTO access_tokens (id, token_hash, customer_email, created_at, expires_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
        [tokenHash, normaliseEmail(customerEmail), now, expiresAt],
      );
    },
  };
}

function mapRow(row: EntitlementRow): Entitlement {
  return {
    id: row.id,
    customerEmail: row.customer_email,
    productSlug: row.product_slug as ProductId,
    orderId: row.order_id,
    grantedAt: new Date(row.granted_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  };
}
