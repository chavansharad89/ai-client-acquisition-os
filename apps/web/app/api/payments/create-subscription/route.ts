import { NextResponse, type NextRequest } from 'next/server';

import { loadEnv } from '@acos/config';
import {
  createRazorpaySubscriptionsClient,
  createSubscription,
  CreateSubscriptionValidationError,
  RazorpaySubscriptionCreationError,
  SubscriptionNotConfiguredError,
} from '@acos/core-payments';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';

import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../src/server/session';

// POST /api/payments/create-subscription — begins a ₹1,499 Client Finder
// subscription checkout (plan §H.3 item 2, §J).
// -----------------------------------------------------------------------
// REQUIRES AN AUTHENTICATED SESSION (see createSubscription.ts's own
// header for why) — unlike create-order's guest-or-session convention.
// Thin HTTP adapter: all real logic lives in
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
  const token = readSessionToken(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  const idempotencyKeyHeader = request.headers.get('Idempotency-Key');

  try {
    const { identity } = clientFinderRepositories();
    const userId = await requireUser(identity, token);

    const result = await createSubscription(
      body,
      {
        userId,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
        razorpayPlanId: env.RAZORPAY_SUBSCRIPTION_PLAN_ID,
        ...(idempotencyKeyHeader ? { idempotencyKey: idempotencyKeyHeader } : {}),
      },
      { razorpay },
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
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
