import { loadEnv } from '@acos/config';
import {
  createRazorpaySubscriptionsClient,
  createSubscription,
  createSubscriptionRequestSchema,
  CreateSubscriptionValidationError,
  RazorpaySubscriptionCreationError,
  SubscriptionNotConfiguredError,
} from '@acos/core-payments';
import { NextResponse, type NextRequest } from 'next/server';

import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';

// POST /api/payments/create-subscription — begins a ₹1,499 Client Finder
// subscription checkout (plan §H.3 item 2, §J).
// -----------------------------------------------------------------------
// PURCHASE-FIRST (AUTH Phase 1b, AUTH-PO-25): unauthenticated, like
// create-order's guest-checkout convention — no session is required or
// read. Identity is server-established, not session-derived: the
// request's own `customerEmail` is resolved (or created, password-less)
// against `users` via `identity.findOrCreateUser()` BEFORE the Razorpay
// call, and that server-resolved `userId` — never anything the client
// could assert directly — is what gets embedded in `notes.userId` for
// the `subscription.charged` webhook to attribute the resulting
// `subscription_periods` row to (createSubscription.ts's own header,
// unchanged). A client cannot choose `users.id`: it only ever supplies
// an email, used purely as a lookup/creation key. An existing account
// for that email (with or without a password already set) is reused
// as-is — `findOrCreateUser` never creates a second row for the same
// normalized email and never touches an existing `password_hash`.
//
// The email is validated against the same schema createSubscription()
// itself re-validates against, so a malformed request is rejected
// before it can create a dormant `users` row for an address that will
// go on to fail validation anyway.
//
// Thin HTTP adapter otherwise: all remaining logic lives in
// @acos/core-payments.createSubscription().
// -----------------------------------------------------------------------

let deps: {
  env: ReturnType<typeof loadEnv>;
  razorpay: ReturnType<typeof createRazorpaySubscriptionsClient>;
} | null = null;

function getDeps(): NonNullable<typeof deps> {
  if (deps) return deps;
  const env = loadEnv();
  deps = {
    env,
    razorpay: createRazorpaySubscriptionsClient({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
    }),
  };
  return deps;
}

export async function POST(request: NextRequest) {
  const { env, razorpay } = getDeps();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  // Validated here, ahead of any identity resolution, so a malformed
  // request (e.g. not-an-email) never reaches findOrCreateUser and
  // never creates a dormant `users` row for it. createSubscription()
  // re-validates the same body against the same schema below — cheap,
  // and keeps this route from having two divergent definitions of
  // "valid" for the same input.
  const parsed = createSubscriptionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Request body failed validation',
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const idempotencyKeyHeader = request.headers.get('Idempotency-Key');

  try {
    const { identity } = clientFinderRepositories();
    // AUTH-PO-25: server-owned pending identity, resolved BEFORE the
    // Razorpay call — never a client-supplied userId/session.
    const user = await identity.findOrCreateUser(parsed.data.customerEmail, new Date());

    const result = await createSubscription(
      body,
      {
        userId: user.id,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        razorpayPlanId: env.RAZORPAY_SUBSCRIPTION_PLAN_ID,
        ...(idempotencyKeyHeader ? { idempotencyKey: idempotencyKeyHeader } : {}),
      },
      { razorpay },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof CreateSubscriptionValidationError) {
      return NextResponse.json(
        { error: err.message, code: err.code, issues: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof SubscriptionNotConfiguredError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 503 });
    }
    if (err instanceof RazorpaySubscriptionCreationError) {
      return NextResponse.json(
        { error: 'Payment provider error', code: err.code },
        { status: 502 },
      );
    }
    console.error('Unhandled error in POST /api/payments/create-subscription:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
