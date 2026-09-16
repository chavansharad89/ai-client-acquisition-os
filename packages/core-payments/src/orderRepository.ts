// -----------------------------------------------------------------------
// Persistence boundary for orders, scoped to exactly what createOrder.ts
// needs: look up an existing order by idempotency key, and create a new
// one. This is NOT a general-purpose Order repository — core-payments is
// the only module permitted to write to the orders table (see
// architecture §3 Module Boundaries), and even within core-payments this
// file is the only thing that touches `prisma.order`.
//
// The OrderStatus type below is intentionally a hand-written literal
// union, NOT imported from `@acos/db`'s generated Prisma types. This
// keeps every type that createOrder.ts and its tests depend on free of
// any dependency on `prisma generate` having run — only the small
// `createPrismaOrderRepository` function body at the bottom of this file
// touches the generated client, isolating that dependency to the one
// piece of code that actually needs it.
// -----------------------------------------------------------------------

export type OrderStatus = 'PENDING' | 'ATTEMPTED' | 'PAID' | 'FAILED' | 'EXPIRED';

export interface PersistedOrder {
  id: string;
  razorpayOrderId: string;
  idempotencyKey: string | null;
  customerEmail: string;
  customerPhone: string | null;
  productSlug: string;
  productName: string;
  amountPaise: number;
  currency: string;
  status: OrderStatus;
  createdAt: Date;
}

export interface CreateOrderRecordInput {
  razorpayOrderId: string;
  idempotencyKey: string | null;
  customerEmail: string;
  customerPhone: string | null;
  productSlug: string;
  productName: string;
  amountPaise: number;
  currency: string;
}

/**
 * Thrown by `create()` specifically when the row could not be inserted
 * because of a unique-constraint violation (Postgres/Prisma error code
 * P2002) — most commonly a race on `idempotencyKey` between two
 * concurrent requests carrying the same key. createOrder.ts catches this
 * specifically and self-heals by re-reading the row the other request
 * just inserted, rather than treating it as a generic database failure.
 */
export class UniqueConstraintViolationError extends Error {
  readonly target: string[];

  constructor(target: string[], cause?: unknown) {
    super(`Unique constraint violated on: ${target.join(', ')}`);
    this.name = 'UniqueConstraintViolationError';
    this.target = target;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

export interface OrderRepository {
  findByIdempotencyKey(key: string): Promise<PersistedOrder | null>;
  create(input: CreateOrderRecordInput): Promise<PersistedOrder>;
}

/**
 * Production implementation, backed by @acos/db's Prisma client.
 *
 * NOTE ON THIS SANDBOX: this function's logic is correct and is what
 * should run in any normal environment. It could not itself be executed
 * or fully type-checked in the environment this was authored in, because
 * `prisma generate` requires downloading a native query-engine binary
 * from binaries.prisma.sh, which this sandbox's network policy blocks
 * (verified — see the earlier delivery's explicit `prisma generate`
 * attempts and their 403 errors). The generated `@prisma/client` types
 * available here are a stale default template, not a reflection of our
 * actual schema.
 *
 * The integration tests in /tests/integration therefore run against a
 * hand-authored SQL migration applied directly to a real Postgres
 * instance, using a small pg-backed test double that implements this
 * exact `OrderRepository` interface (see
 * tests/integration/support/pgOrderRepository.ts) — proving the
 * orchestration logic and the database constraints it depends on
 * (idempotency-key uniqueness, the amount_paise CHECK) for real, even
 * though this specific function's Prisma calls weren't directly
 * exercised. Run `prisma generate` in a normal environment, then
 * typecheck this file — it should need no changes.
 *
 * `db` is typed loosely (structurally) rather than as the generated
 * `PrismaClient` type, precisely because that generated type isn't
 * trustworthy in this sandbox. In a normal environment, importing and
 * passing `@acos/db`'s `prisma` singleton satisfies this shape.
 */
export interface MinimalPrismaOrderClient {
  order: {
    findUnique(args: { where: { idempotencyKey: string } }): Promise<{
      id: string;
      razorpayOrderId: string;
      idempotencyKey: string | null;
      customerEmail: string;
      customerPhone: string | null;
      productSlug: string;
      productName: string;
      amountPaise: number;
      currency: string;
      status: string;
      createdAt: Date;
    } | null>;
    create(args: {
      data: {
        razorpayOrderId: string;
        idempotencyKey: string | null;
        customerEmail: string;
        customerPhone: string | null;
        productSlug: string;
        productName: string;
        amountPaise: number;
        currency: string;
        status: 'PENDING';
      };
    }): Promise<{
      id: string;
      razorpayOrderId: string;
      idempotencyKey: string | null;
      customerEmail: string;
      customerPhone: string | null;
      productSlug: string;
      productName: string;
      amountPaise: number;
      currency: string;
      status: string;
      createdAt: Date;
    }>;
  };
}

/** True when `err` is Prisma's "unique constraint failed" error (P2002),
 *  checked structurally so this file has no hard import-time dependency
 *  on `@prisma/client`'s (possibly stale, in this sandbox) generated
 *  error classes. */
function isPrismaUniqueConstraintError(
  err: unknown,
): err is { code: 'P2002'; meta?: { target?: string[] | string } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 'P2002'
  );
}

export function createPrismaOrderRepository(db: MinimalPrismaOrderClient): OrderRepository {
  return {
    async findByIdempotencyKey(key: string): Promise<PersistedOrder | null> {
      const row = await db.order.findUnique({ where: { idempotencyKey: key } });
      return row ? toPersistedOrder(row) : null;
    },

    async create(input: CreateOrderRecordInput): Promise<PersistedOrder> {
      try {
        const row = await db.order.create({
          data: {
            razorpayOrderId: input.razorpayOrderId,
            idempotencyKey: input.idempotencyKey,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            productSlug: input.productSlug,
            productName: input.productName,
            amountPaise: input.amountPaise,
            currency: input.currency,
            // status set explicitly to PENDING here (matching the schema
            // default) so the "create as PENDING" requirement is visible
            // at the call site, not just implied by a schema default.
            status: 'PENDING',
          },
        });
        return toPersistedOrder(row);
      } catch (err) {
        if (isPrismaUniqueConstraintError(err)) {
          const target = Array.isArray(err.meta?.target)
            ? err.meta.target
            : typeof err.meta?.target === 'string'
              ? [err.meta.target]
              : [];
          throw new UniqueConstraintViolationError(target, err);
        }
        throw err;
      }
    },
  };
}

function toPersistedOrder(row: {
  id: string;
  razorpayOrderId: string;
  idempotencyKey: string | null;
  customerEmail: string;
  customerPhone: string | null;
  productSlug: string;
  productName: string;
  amountPaise: number;
  currency: string;
  status: string;
  createdAt: Date;
}): PersistedOrder {
  return {
    id: row.id,
    razorpayOrderId: row.razorpayOrderId,
    idempotencyKey: row.idempotencyKey,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    productSlug: row.productSlug,
    productName: row.productName,
    amountPaise: row.amountPaise,
    currency: row.currency,
    status: row.status as OrderStatus,
    createdAt: row.createdAt,
  };
}
