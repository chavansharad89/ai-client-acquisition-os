import { NextResponse } from 'next/server';

import { loadEnv } from '@acos/config';
import { handleRazorpayWebhook, verifyRazorpayWebhook } from '@acos/core-payments';
import { buildPurchaseEventId } from '@acos/core-capi';

import { recordWebhookRejection, webhookTransaction } from '../../../../src/server/webhookStore';

// POST /api/webhooks/razorpay
// -----------------------------------------------------------------------
// The single trusted entrypoint for payment truth (architecture §6), and
// a thin adapter over @acos/core-payments.
//
// THE ORDERING IS THE SECURITY PROPERTY:
//
//   1. read the RAW body — never request.json(), because parsing before
//      verifying means hashing bytes we did not receive, and because a
//      re-serialised body has a different signature.
//   2. verify the HMAC.
//   3. only then parse, persist, and process.
//
// Step 3 cannot be reached out of order: handleRazorpayWebhook takes a
// branded VerifiedWebhook that only verifyRazorpayWebhook can produce, so
// "parse first, verify later" does not compile.
//
// A rejected request writes NOTHING derived from its body. It gets a row
// of metadata in webhook_rejections — a table with no payload column —
// and a 401.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy for the same reason as create-order: `next build` imports route
// modules, and requiring secrets at build time is how secrets end up in
// image layers.
let env: ReturnType<typeof loadEnv> | null = null;
function getEnv(): ReturnType<typeof loadEnv> {
  env ??= loadEnv();
  return env;
}

/** Client IP for the rejection record, length-capped by the schema too. */
function sourceIpOf(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first && first.length > 0 && first.length <= 45) return first;
  const real = request.headers.get('x-real-ip')?.trim();
  return real && real.length > 0 && real.length <= 45 ? real : undefined;
}

export async function POST(request: Request) {
  const config = getEnv();

  // RAW bytes. `request.json()` here would be the bug: it consumes the
  // stream, and the object it returns cannot be re-serialised back to the
  // exact bytes the signature covers (key order and whitespace both
  // change the HMAC).
  const rawBody = Buffer.from(await request.arrayBuffer());

  const verification = verifyRazorpayWebhook({
    rawBody,
    signatureHeader: request.headers.get('x-razorpay-signature'),
    webhookSecret: config.RAZORPAY_WEBHOOK_SECRET,
    sourceIp: sourceIpOf(request),
  });

  if (!verification.ok) {
    // Metadata only. The body is discarded here and never touches a table.
    await recordWebhookRejection(verification.rejection);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Razorpay's own event id, from the header rather than the body: it is
  // covered by the signature we just checked, and using it means the
  // dedupe key is not something a body could restate.
  const eventId = request.headers.get('x-razorpay-event-id')?.trim();
  if (!eventId) {
    // Explicit fields only — spreading `verification.verified` here would
    // carry rawBody into the rejection object, which is precisely the
    // thing this path exists to avoid.
    await recordWebhookRejection({
      reason: 'malformed-signature',
      receivedAt: verification.verified.receivedAt,
      bodyBytes: rawBody.byteLength,
      signaturePresent: true,
      signatureWellFormed: true,
      sourceIp: sourceIpOf(request),
    });
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
  }

  try {
    const outcome = await handleRazorpayWebhook(verification.verified, {
      transaction: webhookTransaction,
      buildMetaEventId: (paymentId) => buildPurchaseEventId({ paymentId }),
      eventId,
    });

    if (outcome.status === 'rejected') {
      await recordWebhookRejection(outcome.rejection);
      return NextResponse.json({ error: 'Unprocessable payload' }, { status: 400 });
    }
    // 200 for processed, duplicate and ignored alike. Razorpay retries on
    // anything else, and a duplicate is a success from its point of view:
    // the event has been received and is recorded exactly once.
    return NextResponse.json({ status: outcome.status }, { status: 200 });
  } catch (err) {
    // 500 so Razorpay retries. The transaction has already rolled back,
    // so nothing partial survives. Never leak internals to the caller.
    console.error('Unhandled error in POST /api/webhooks/razorpay:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
