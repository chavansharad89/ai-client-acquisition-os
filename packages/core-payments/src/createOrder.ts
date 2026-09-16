import { InvalidProductIdError, resolveProduct } from '@acos/catalog';
import type { Product } from '@acos/catalog';

import {
  CreateOrderValidationError,
  IdempotencyKeyConflictError,
  InvalidProductError,
  OrderPersistenceError,
} from './errors';
import type { OrderRepository, PersistedOrder } from './orderRepository';
import { UniqueConstraintViolationError } from './orderRepository';
import type { RazorpayOrdersClient } from './razorpayClient';
import { createOrderRequestSchema } from './schemas';

// -----------------------------------------------------------------------
// createOrder — the orchestration for POST /api/payments/create-order.
//
// This is the load-bearing implementation of "client must never
// determine authoritative price": the input type accepted here has no
// price field, the Zod schema (.strict()) rejects a request that
// includes one anyway, and the ONLY source of amountPaise/currency in
// the entire function is `resolveProduct(...)` from @acos/catalog.
//
// See architecture §5 (Payment Flow) — this function implements step 1
// only. Steps 3–4 (checkout-return verification, webhook processing) are
// explicitly out of scope here.
// -----------------------------------------------------------------------

export interface CreateOrderDeps {
  razorpay: RazorpayOrdersClient;
  orders: OrderRepository;
  /** Injectable for deterministic tests; defaults to crypto.randomUUID. */
  generateOrderId?: () => string;
}

export interface SafeOrderPaymentInfo {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountPaise: number;
  currency: string;
  productId: string;
  productName: string;
  status: string;
}

export interface CreateOrderOptions {
  /**
   * From the `Idempotency-Key` request header, if the client sent one.
   * Clients SHOULD generate one value per checkout attempt (e.g.
   * crypto.randomUUID() when the "Buy" button is first clicked) and
   * resend the same value on any retry. See architecture §14 item 4.
   */
  idempotencyKey?: string;
  razorpayKeyId: string;
}

function defaultGenerateOrderId(): string {
  return crypto.randomUUID();
}

export async function createOrder(
  rawInput: unknown,
  options: CreateOrderOptions,
  deps: CreateOrderDeps,
): Promise<SafeOrderPaymentInfo> {
  // --- 1. Shape/format validation (Zod) ---
  // Handles: malformed body, missing fields, invalid email format,
  // invalid phone format, and (via .strict()) a client that tried to
  // send a price field at all.
  const parsed = createOrderRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CreateOrderValidationError(parsed.error);
  }
  const input = parsed.data;

  // --- 2. Product existence + authoritative price (the catalog) ---
  // Handles: invalid/unknown productId. `product.amountPaise` below is
  // the ONLY amount used anywhere in this function — nothing from
  // `rawInput` is ever used as a price, because nothing in `input` even
  // has a price field.
  let product: Product;
  try {
    product = resolveProduct(input.productId);
  } catch (err) {
    if (err instanceof InvalidProductIdError) {
      throw new InvalidProductError(input.productId);
    }
    throw err;
  }

  // --- 3. Idempotency: has this exact request already been processed? ---
  // Handles: duplicate/retry requests. If the client resent the same
  // Idempotency-Key (network retry, double form submit), return the
  // existing order's payment info rather than creating a second
  // Razorpay order.
  const idempotencyKey = options.idempotencyKey?.trim() || null;
  if (idempotencyKey) {
    const existing = await safeFindByIdempotencyKey(deps.orders, idempotencyKey);
    if (existing) {
      // A hit is not automatically a retry. The key is only a promise
      // that the SAME request is being repeated; if the request differs,
      // honouring it would return an order for the wrong product, the
      // wrong price, or the wrong person.
      return acceptReplayOrConflict(existing, input, product, options.razorpayKeyId);
    }
  }

  // --- 4. Create the Razorpay order ---
  // Handles: Razorpay failure. RazorpayOrdersClient implementations are
  // required to throw RazorpayOrderCreationError on any failure (see
  // razorpayClient.ts) — that error propagates unchanged from here.
  const generateOrderId = deps.generateOrderId ?? defaultGenerateOrderId;
  const localOrderId = generateOrderId();

  const razorpayOrder = await deps.razorpay.createOrder({
    amountPaise: product.amountPaise,
    currency: product.currency,
    receipt: localOrderId,
    notes: { productId: product.id },
  });

  // --- 5. Persist the local Order row (status: PENDING) ---
  // Handles: database failure, and the race case of two concurrent
  // requests carrying the same Idempotency-Key (self-heals by re-reading
  // instead of erroring — see UniqueConstraintViolationError handling).
  try {
    const created = await deps.orders.create({
      razorpayOrderId: razorpayOrder.razorpayOrderId,
      idempotencyKey,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone ?? null,
      productSlug: product.id,
      productName: product.name,
      amountPaise: product.amountPaise,
      currency: product.currency,
    });
    return toSafeOrderPaymentInfo(created, options.razorpayKeyId);
  } catch (err) {
    if (err instanceof UniqueConstraintViolationError && idempotencyKey) {
      // Another request with the same idempotency key won the race and
      // committed first. Re-read its row rather than failing — this is
      // what makes concurrent retries safe, not just sequential ones.
      //
      // NOTE: the Razorpay order we just created above (razorpayOrder)
      // is now orphaned on Razorpay's side — it was never persisted
      // locally. This is a known, bounded consequence of the chosen
      // idempotency strategy (architecture §14 item 4) and is exactly
      // the kind of anomaly @acos/db's IdempotencyReconciliation table
      // exists to track. TODO(Phase 1.1): write a reconciliation row
      // here (recordType: 'ORDER', duplicateKey: idempotencyKey,
      // snapshot: { orphanedRazorpayOrderId: razorpayOrder.razorpayOrderId }
      // ) so this is operationally visible instead of only inferable
      // from logs.
      // Same rule on the race path. Two concurrent requests sharing a key
      // but differing in product or customer are not a retry pair — the
      // loser must be refused, not handed the winner's order.
      const existing = await safeFindByIdempotencyKey(deps.orders, idempotencyKey);
      if (existing) {
        return acceptReplayOrConflict(existing, input, product, options.razorpayKeyId);
      }
      // Row disappeared between the failed insert and this re-read
      // (should not happen in practice — orders are never deleted) —
      // fall through to treat as a genuine persistence failure.
    }
    if (err instanceof UniqueConstraintViolationError) {
      throw new OrderPersistenceError(
        `Order persistence failed: unique constraint violated on ${err.target.join(', ')}`,
        err,
      );
    }
    throw new OrderPersistenceError('Order persistence failed', err);
  }
}

/**
 * The request attributes an idempotency key is bound to.
 *
 * WHAT IS HERE AND WHY:
 *
 *   productSlug    — the whole point. Returning a starter-kit order for a
 *                    client-acquisition-system request hands the caller
 *                    the wrong product at the wrong price.
 *   customerEmail  — identity. Entitlement is keyed on this address, so
 *                    replaying a key under a different email would hand
 *                    one person an order belonging to another, and the
 *                    access token for it goes to whoever the order says.
 *   customerPhone  — part of the request body. A key identifies ONE
 *                    request; changing any supplied field makes it a
 *                    different request, and treating "same key, extra
 *                    phone number" as a retry means the phone the
 *                    customer actually typed is silently discarded.
 *
 * WHAT IS DELIBERATELY NOT HERE:
 *
 *   amountPaise / currency — these are not request attributes. They are
 *   derived from productSlug by the catalog, so comparing the product
 *   already covers them. Comparing them directly would be actively wrong:
 *   if a price changes between the original request and a retry, the
 *   retry MUST still return the original order at the price the customer
 *   agreed to, not conflict and not re-price. Server-side pricing is
 *   preserved either way — nothing in this file reads a price from the
 *   request, because the request has no price field to read.
 */
const BOUND_FIELDS = ['productSlug', 'customerEmail', 'customerPhone'] as const;

/** Normalised so a stored row written before schema normalisation still compares fairly. */
function normalise(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/**
 * Names the bound attributes on which an existing order and the current
 * request disagree. Empty means this is a genuine retry.
 */
export function idempotencyConflicts(
  existing: { productSlug: string; customerEmail: string; customerPhone: string | null },
  request: { productSlug: string; customerEmail: string; customerPhone: string | null },
): string[] {
  const differs: Record<(typeof BOUND_FIELDS)[number], boolean> = {
    productSlug: normalise(existing.productSlug) !== normalise(request.productSlug),
    customerEmail: normalise(existing.customerEmail) !== normalise(request.customerEmail),
    customerPhone: normalise(existing.customerPhone) !== normalise(request.customerPhone),
  };
  return BOUND_FIELDS.filter((field) => differs[field]);
}

/**
 * Returns the existing order for a genuine retry, or throws on a key
 * reused for a different request.
 *
 * Throwing is the only safe direction. Creating a second order under the
 * same key is impossible anyway — the unique index forbids it — so the
 * alternatives were "return the wrong order" or "refuse", and refusing is
 * the one that cannot take someone's money for the wrong thing.
 */
function acceptReplayOrConflict(
  existing: PersistedOrder,
  input: { customerEmail: string; customerPhone?: string | undefined },
  product: Product,
  razorpayKeyId: string,
): SafeOrderPaymentInfo {
  const conflicts = idempotencyConflicts(existing, {
    productSlug: product.id,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone ?? null,
  });
  if (conflicts.length > 0) throw new IdempotencyKeyConflictError(conflicts);
  return toSafeOrderPaymentInfo(existing, razorpayKeyId);
}

async function safeFindByIdempotencyKey(
  orders: OrderRepository,
  key: string,
): ReturnType<OrderRepository['findByIdempotencyKey']> {
  try {
    return await orders.findByIdempotencyKey(key);
  } catch (err) {
    throw new OrderPersistenceError('Idempotency lookup failed', err);
  }
}

function toSafeOrderPaymentInfo(
  order: {
    id: string;
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
    productSlug: string;
    productName: string;
    status: string;
  },
  razorpayKeyId: string,
): SafeOrderPaymentInfo {
  // Deliberately narrow: no customer email/phone, no internal
  // timestamps, and absolutely no Razorpay key SECRET or webhook
  // secret. `razorpayKeyId` is the Checkout widget's public key and is
  // meant to be client-visible — it is not sensitive.
  return {
    orderId: order.id,
    razorpayOrderId: order.razorpayOrderId,
    razorpayKeyId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    productId: order.productSlug,
    productName: order.productName,
    status: order.status,
  };
}
