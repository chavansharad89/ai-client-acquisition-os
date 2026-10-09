import type { SubscriptionPeriod } from './types';

// Read side of subscription_periods (migration 0040).
// -----------------------------------------------------------------------
// WRITES to this table happen inside the Razorpay webhook transaction
// (packages/core-payments' webhookPgStore.ts, on `subscription.charged`
// and `refund.*`) -- the same convention @acos/core-entitlements'
// `entitlements` table already follows: the webhook owns the write, a
// separate domain package owns the read-side repository used by access
// checks. This file is read-only by design.
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface SubscriptionPeriodRepository {
  /**
   * The user's most recently activated, currently-active period for
   * `productSlug`, or null. "Active" is computed, not stored (IRL-O):
   * `refunded_at IS NULL AND activation_at + duration_days days > now`.
   * Razorpay's own live subscription status is never consulted here.
   */
  findActiveForUser(
    userId: string,
    productSlug: string,
    now: Date,
  ): Promise<SubscriptionPeriod | null>;

  getById(id: string): Promise<SubscriptionPeriod | null>;
}

interface SubscriptionPeriodRow {
  id: string;
  user_id: string;
  product_slug: string;
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  activation_at: Date;
  duration_days: number;
  refunded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toSubscriptionPeriod(row: SubscriptionPeriodRow): SubscriptionPeriod {
  return {
    id: row.id,
    userId: row.user_id,
    productSlug: row.product_slug,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    razorpayPaymentId: row.razorpay_payment_id,
    activationAt: row.activation_at,
    durationDays: Number(row.duration_days),
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const COLUMNS = `id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id,
       activation_at, duration_days, refunded_at, created_at, updated_at`;

export function createPgSubscriptionPeriodRepository(sql: SqlClient): SubscriptionPeriodRepository {
  return {
    async findActiveForUser(userId, productSlug, now) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS}
           FROM subscription_periods
          WHERE user_id = $1 AND product_slug = $2
            AND refunded_at IS NULL
            AND activation_at + (duration_days * INTERVAL '1 day') > $3
          ORDER BY activation_at DESC
          LIMIT 1`,
        [userId, productSlug, now],
      );
      const row = rows[0] as SubscriptionPeriodRow | undefined;
      return row ? toSubscriptionPeriod(row) : null;
    },

    async getById(id) {
      const { rows } = await sql.query(`SELECT ${COLUMNS} FROM subscription_periods WHERE id = $1`, [
        id,
      ]);
      const row = rows[0] as SubscriptionPeriodRow | undefined;
      return row ? toSubscriptionPeriod(row) : null;
    },
  };
}
