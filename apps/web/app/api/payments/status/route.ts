import { NextResponse, type NextRequest } from 'next/server';

import { commerceRepositories } from '../../../../src/server/commerceRepositories';
import { getOrderRepository } from '../../../../src/server/orderRepository';

// GET /api/payments/status?razorpayOrderId=...
// -----------------------------------------------------------------------
// The browser's post-checkout poll (architecture §2 transition "buyer
// returns to app"). Read-only: it reports what the webhook/reconciliation
// path has already written, and never grants, creates, or mutates
// anything. This is deliberately NOT a replacement for
// /api/payments/verify — that endpoint's own doc comment states the
// invariant this route also respects: only the webhook (or
// reconciliation, which writes through the same path) may grant
// entitlement.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const razorpayOrderId = request.nextUrl.searchParams.get('razorpayOrderId')?.trim();
  if (!razorpayOrderId || razorpayOrderId.length > 120) {
    return NextResponse.json(
      { error: 'A valid razorpayOrderId is required', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const order = await getOrderRepository().findByRazorpayOrderId(razorpayOrderId);
    if (!order) {
      return NextResponse.json({ error: 'Unknown order', code: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    const { entitlements } = commerceRepositories();
    const entitlement = await entitlements.findByOrderId(order.id);

    return NextResponse.json(
      { status: order.status, entitlementExists: entitlement !== null },
      { status: 200 },
    );
  } catch (err) {
    console.error('Unhandled error in GET /api/payments/status:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
