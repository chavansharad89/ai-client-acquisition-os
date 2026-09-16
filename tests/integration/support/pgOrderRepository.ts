import { Pool } from 'pg';

import type {
  CreateOrderRecordInput,
  OrderRepository,
  OrderStatus,
  PersistedOrder,
} from '@acos/core-payments';
import { UniqueConstraintViolationError } from '@acos/core-payments';

// -----------------------------------------------------------------------
// A `pg`-backed implementation of @acos/core-payments' OrderRepository
// interface, used ONLY by these integration tests.
//
// WHY THIS EXISTS INSTEAD OF THE REAL PrismaOrderRepository: this
// sandbox's network policy blocks binaries.prisma.sh, which `prisma
// generate` requires to produce a working query engine. There is no
// npm-hosted fallback (verified). A real PostgreSQL 16 instance IS
// available here, though, so this file talks to it directly via `pg` —
// issuing the same SQL semantics core-payments' PrismaOrderRepository
// would generate — so these tests can genuinely exercise the orders
// table's real constraints (the amount_paise CHECK, the idempotency_key
// unique index) rather than mocking them away.
//
// In a normal (unrestricted) environment, delete this file and use
// `createPrismaOrderRepository(prisma)` from @acos/core-payments
// directly against the same schema — the OrderRepository interface is
// identical, so createOrder.ts itself needs no changes either way.
// -----------------------------------------------------------------------

export function createPgOrderRepository(pool: Pool): OrderRepository {
  return {
    async findByIdempotencyKey(key: string): Promise<PersistedOrder | null> {
      const { rows } = await pool.query(
        `SELECT id, razorpay_order_id, idempotency_key, customer_email, customer_phone,
                product_slug, product_name, amount_paise, currency, status, created_at
         FROM orders
         WHERE idempotency_key = $1`,
        [key],
      );
      return rows[0] ? mapRow(rows[0]) : null;
    },

    async create(input: CreateOrderRecordInput): Promise<PersistedOrder> {
      try {
        const { rows } = await pool.query(
          `INSERT INTO orders
             (id, razorpay_order_id, idempotency_key, customer_email, customer_phone,
              product_slug, product_name, amount_paise, currency, status, updated_at)
           VALUES
             (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', now())
           RETURNING id, razorpay_order_id, idempotency_key, customer_email, customer_phone,
                     product_slug, product_name, amount_paise, currency, status, created_at`,
          [
            input.razorpayOrderId,
            input.idempotencyKey,
            input.customerEmail,
            input.customerPhone,
            input.productSlug,
            input.productName,
            input.amountPaise,
            input.currency,
          ],
        );
        return mapRow(rows[0]);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new UniqueConstraintViolationError([constraintToColumn(err)], err);
        }
        throw err;
      }
    },
  };
}

function mapRow(row: {
  id: string;
  razorpay_order_id: string;
  idempotency_key: string | null;
  customer_email: string;
  customer_phone: string | null;
  product_slug: string;
  product_name: string;
  amount_paise: number;
  currency: string;
  status: string;
  created_at: Date;
}): PersistedOrder {
  return {
    id: row.id,
    razorpayOrderId: row.razorpay_order_id,
    idempotencyKey: row.idempotency_key,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    productSlug: row.product_slug,
    productName: row.product_name,
    amountPaise: row.amount_paise,
    currency: row.currency,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
  };
}

/** Postgres error code 23505 = unique_violation. */
function isUniqueViolation(err: unknown): err is { code: '23505'; constraint?: string } {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

function constraintToColumn(err: { constraint?: string }): string {
  if (err.constraint === 'orders_idempotency_key_key') return 'idempotency_key';
  if (err.constraint === 'orders_razorpay_order_id_key') return 'razorpay_order_id';
  return err.constraint ?? 'unknown';
}
