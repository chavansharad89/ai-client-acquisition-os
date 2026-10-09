import { describe, expect, it, vi } from 'vitest';

import {
  CreateSubscriptionValidationError,
  RazorpaySubscriptionCreationError,
  SubscriptionNotConfiguredError,
} from './errors';
import { createSubscription } from './createSubscription';
import type { CreateRazorpaySubscriptionParams, RazorpaySubscription, RazorpaySubscriptionsClient } from './razorpayClient';

// Pure unit tests: no real Postgres, no real Razorpay API — mirrors
// createOrder.test.ts's own fake-dependency convention. A hand-rolled
// fake RazorpaySubscriptionsClient exercises ONLY createSubscription.ts's
// own orchestration logic.

const RAZORPAY_KEY_ID = 'rzp_test_fake_key_id';
const PLAN_ID = 'plan_fake_client_finder';
const USER_ID = 'user_1';

function makeFakeRazorpay(
  overrides?: Partial<RazorpaySubscriptionsClient>,
): RazorpaySubscriptionsClient & { calls: CreateRazorpaySubscriptionParams[] } {
  const calls: CreateRazorpaySubscriptionParams[] = [];
  return {
    calls,
    createSubscription: vi.fn(async (params: CreateRazorpaySubscriptionParams): Promise<RazorpaySubscription> => {
      calls.push(params);
      return {
        razorpaySubscriptionId: `sub_fake_${calls.length}`,
        status: 'created',
        shortUrl: 'https://rzp.io/i/fake',
      };
    }),
    ...overrides,
  };
}

describe('createSubscription', () => {
  it('rejects a malformed request body before ever calling Razorpay', async () => {
    const razorpay = makeFakeRazorpay();
    await expect(
      createSubscription(
        { customerEmail: 'not-an-email' },
        { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: PLAN_ID },
        { razorpay },
      ),
    ).rejects.toThrow(CreateSubscriptionValidationError);
    expect(razorpay.calls).toHaveLength(0);
  });

  it('rejects a request carrying a client-supplied price-like field (defense in depth, .strict())', async () => {
    const razorpay = makeFakeRazorpay();
    await expect(
      createSubscription(
        { customerEmail: 'buyer@example.test', amountPaise: 1 },
        { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: PLAN_ID },
        { razorpay },
      ),
    ).rejects.toThrow(CreateSubscriptionValidationError);
    expect(razorpay.calls).toHaveLength(0);
  });

  it('throws SubscriptionNotConfiguredError when RAZORPAY_SUBSCRIPTION_PLAN_ID is unset, before calling Razorpay', async () => {
    const razorpay = makeFakeRazorpay();
    await expect(
      createSubscription(
        { customerEmail: 'buyer@example.test' },
        { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: undefined },
        { razorpay },
      ),
    ).rejects.toThrow(SubscriptionNotConfiguredError);
    expect(razorpay.calls).toHaveLength(0);
  });

  it('creates a subscription against the catalog product, carrying userId in notes for webhook attribution', async () => {
    const razorpay = makeFakeRazorpay();
    const result = await createSubscription(
      { customerEmail: 'buyer@example.test', customerPhone: '+14155550182' },
      { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: PLAN_ID, idempotencyKey: 'idem-1' },
      { razorpay },
    );

    expect(razorpay.calls).toHaveLength(1);
    expect(razorpay.calls[0]).toMatchObject({
      planId: PLAN_ID,
      customerNotify: true,
      notes: {
        userId: USER_ID,
        productId: 'ai_client_acquisition_1499_subscription',
        customerEmail: 'buyer@example.test',
        customerPhone: '+14155550182',
        idempotencyKey: 'idem-1',
      },
    });
    expect(result).toMatchObject({
      razorpaySubscriptionId: 'sub_fake_1',
      razorpayKeyId: RAZORPAY_KEY_ID,
      productId: 'ai_client_acquisition_1499_subscription',
      productName: 'AI Client Finder Subscription',
      shortUrl: 'https://rzp.io/i/fake',
      status: 'created',
    });
  });

  it('never reads an amount from the request — nothing in the request schema even has a price field', async () => {
    const razorpay = makeFakeRazorpay();
    const result = await createSubscription(
      { customerEmail: 'buyer@example.test' },
      { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: PLAN_ID },
      { razorpay },
    );
    // The catalog's amountPaise never appears anywhere in the Razorpay
    // call or the response — the Plan itself (external config) is the
    // sole authority for the recurring amount.
    expect(JSON.stringify(razorpay.calls[0])).not.toMatch(/149900|amountPaise/);
    expect(JSON.stringify(result)).not.toMatch(/149900|amountPaise/);
  });

  it('wraps a Razorpay API failure as RazorpaySubscriptionCreationError', async () => {
    const razorpay = makeFakeRazorpay({
      createSubscription: vi.fn(async () => {
        throw new Error('network blip');
      }),
    });
    await expect(
      createSubscription(
        { customerEmail: 'buyer@example.test' },
        { userId: USER_ID, razorpayKeyId: RAZORPAY_KEY_ID, razorpayPlanId: PLAN_ID },
        { razorpay },
      ),
    ).rejects.toThrow(RazorpaySubscriptionCreationError);
  });
});
