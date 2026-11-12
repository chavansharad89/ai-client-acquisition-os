import { CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG } from '@acos/core-subscriptions';
import Link from 'next/link';

// ₹1,499 Client Finder subscription — subscriber status indicator
// (Phase 2, Part 2). Pure presentation over the EXISTING
// getClientFinderSubscriptionStatus() result (same function GET
// /api/subscriptions/status wraps) — never a second status computation.
//
// `active` is the only distinction the existing status function can make
// (ClientFinderSubscriptionStatus has no "previously subscribed, now
// expired" field — ClientFinderAccessDeps' SubscriptionPeriodRepository
// exposes only findActiveForUser/getById, not a "most recent period for
// this user" read). A never-subscribed and an expired-subscription user
// therefore both render the "Not active" state below; see the governance
// note in the final report for why that distinction is out of scope here.

export function SubscriptionStatusBadge({
  active,
  expiresAt,
}: {
  active: boolean;
  expiresAt: Date | null;
}) {
  if (active) {
    return (
      <p className="status status-good">
        <strong>Client Finder subscription: Active</strong>
        {expiresAt ? ` — renews/expires ${expiresAt.toISOString().slice(0, 10)}` : ''}
      </p>
    );
  }

  return (
    <p className="status status-pending">
      <strong>Client Finder subscription: Not active</strong> — browsing stays free; unlocking contact
      details needs an active ₹1,499/month subscription.{' '}
      <Link className="btn btn-secondary" href={`/checkout/${CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG}`}>
        Subscribe
      </Link>
    </p>
  );
}
