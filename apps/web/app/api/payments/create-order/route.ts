import { NextResponse } from 'next/server';

import { loadEnv } from '@acos/config';
import {
  CreateOrderValidationError,
  IdempotencyKeyConflictError,
  InvalidProductError,
  OrderPersistenceError,
  RazorpayOrderCreationError,
  createOrder,
  createPrismaOrderRepository,
  createRazorpayOrdersClient,
} from '@acos/core-payments';
import { prisma } from '@acos/db';
import { CREATE_ORDER_EMAIL_POLICY, CREATE_ORDER_IP_POLICY } from '@acos/rate-limit';

import { checkCreateOrderLimits } from '../../../../src/server/rateLimit';

// POST /api/payments/create-order
// -----------------------------------------------------------------------
// Thin HTTP adapter per architecture §5 step 1 — all real logic lives in
// @acos/core-payments.createOrder(). This route's only jobs are: parse
// the request, read the Idempotency-Key header, call createOrder, and
// map its typed errors to HTTP responses.
//
// Webhook processing (payment confirmation, entitlement/delivery) is
// deliberately NOT part of this route — see /api/webhooks/razorpay.
//
// RATE LIMITED, and that route is NOT. The two endpoints have opposite
// threat models: this one is anonymous, anyone may call it, and every
// accepted call spends real Razorpay quota. The webhook is authenticated
// by HMAC, comes from one known sender, and is RETRIED by that sender
// when it does not get a 200 — throttling it would turn a burst into a
// retry storm and delay the payment confirmations the whole system
// depends on. Sharing a limiter between them would be a mistake in the
// expensive direction.
// -----------------------------------------------------------------------

// Constructed once per process and then reused — Razorpay's SDK and env
// validation are both cheap to reuse and expensive to redo on every call.
//
// WHY LAZY AND NOT AT MODULE SCOPE: `next build` imports every route
// module to collect page data, so a `loadEnv()` at module scope ran
// during the image build and failed it. The only ways to make that build
// pass are to hold real secrets at build time or to bake placeholder ones
// in — and both put credentials into an image layer, which is precisely
// what the .dockerignore in this repository exists to prevent. Building
// an image must never require the secrets that image will run with.
//
// Fail-fast is preserved, not traded away: the first request still dies
// on a missing or malformed variable, with the same error, before any
// payment work happens. What changed is when "first" is — a served
// request rather than a compile step.
let deps: {
  env: ReturnType<typeof loadEnv>;
  razorpay: ReturnType<typeof createRazorpayOrdersClient>;
  orders: ReturnType<typeof createPrismaOrderRepository>;
} | null = null;

function getDeps(): NonNullable<typeof deps> {
  if (deps) return deps;
  const env = loadEnv();
  deps = {
    env,
    razorpay: createRazorpayOrdersClient({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
    }),
    // See orderRepository.ts's MinimalPrismaOrderClient doc comment: this
    // cast is safe once `prisma generate` has run against the real schema
    // in a normal (unrestricted-network) environment. It could not itself
    // be verified end-to-end in the sandbox this was authored in — see
    // that file and tests/integration/support/pgOrderRepository.ts for the
    // full explanation and the real-Postgres proof of the underlying logic.
    orders: createPrismaOrderRepository(prisma as never),
  };
  return deps;
}

/** Best-effort client address. Absent behind a proxy that strips both. */
function clientIpOf(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length > 0 && first.length <= 45) return first;
  const real = request.headers.get('x-real-ip')?.trim();
  return real && real.length > 0 && real.length <= 45 ? real : null;
}

/** A safe 429: no policy name, no counts, no identifier. Just wait. */
function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many checkout attempts. Please wait a moment and try again.',
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      // Standard, and genuinely useful to a well-behaved client. It says
      // WHEN to retry and nothing about WHY it was refused — telling a
      // caller which limit fired would say whether we had seen that
      // email before.
      headers: { 'Retry-After': String(retryAfterSeconds) },
    },
  );
}

export async function POST(request: Request) {
  const { env, razorpay, orders } = getDeps();

  // The IP check runs FIRST, before the body is even read: an obvious
  // flood should cost us a counter increment, not a JSON parse.
  const clientIp = clientIpOf(request);
  if (clientIp) {
    const decision = await checkCreateOrderLimits([
      { identifier: clientIp, policy: CREATE_ORDER_IP_POLICY },
    ]);
    if (!decision.allowed) return tooManyRequests(decision.retryAfterSeconds);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  // The email check needs the body, so it runs second. Taken from the raw
  // body rather than after validation on purpose: a caller sending junk
  // bodies at one address should still be counted.
  const claimedEmail =
    typeof body === 'object' && body !== null && 'customerEmail' in body
      ? String((body as { customerEmail: unknown }).customerEmail)
      : null;
  if (claimedEmail && claimedEmail.length <= 320) {
    const decision = await checkCreateOrderLimits([
      { identifier: claimedEmail, policy: CREATE_ORDER_EMAIL_POLICY },
    ]);
    if (!decision.allowed) return tooManyRequests(decision.retryAfterSeconds);
  }

  const idempotencyKeyHeader = request.headers.get('Idempotency-Key');

  try {
    const result = await createOrder(
      body,
      {
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        ...(idempotencyKeyHeader ? { idempotencyKey: idempotencyKeyHeader } : {}),
      },
      { razorpay, orders },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof CreateOrderValidationError) {
      return NextResponse.json(
        { error: err.message, code: err.code, issues: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof InvalidProductError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
    }
    if (err instanceof IdempotencyKeyConflictError) {
      // 409, not 400: the request is well-formed. It conflicts with what
      // this key already means. `conflictingFields` names which attributes
      // differ and never the stored values — the success response is
      // deliberately narrow about other customers' data and the error
      // path must not undo that.
      return NextResponse.json(
        { error: err.message, code: err.code, conflictingFields: err.conflictingFields },
        { status: 409 },
      );
    }
    if (err instanceof RazorpayOrderCreationError) {
      // Upstream provider failure — 502, not 500: our server and
      // database are fine, Razorpay's API call is what failed.
      return NextResponse.json(
        { error: 'Payment provider error', code: err.code },
        { status: 502 },
      );
    }
    if (err instanceof OrderPersistenceError) {
      return NextResponse.json({ error: 'Internal error', code: err.code }, { status: 500 });
    }

    // Anything else is unexpected — log with full detail server-side,
    // but never leak internals (stack traces, DB error text) to the client.
    console.error('Unhandled error in POST /api/payments/create-order:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
