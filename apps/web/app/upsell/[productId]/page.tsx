
import { getProduct, isValidProductId } from '@acos/catalog';
import { isDuplicatePurchase } from '@acos/core-entitlements';
import { recordFunnelEvent } from '@acos/core-funnel-events';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PriceTag } from '../../../src/components/PriceTag';
import { UpsellTracker } from '../../../src/components/UpsellTracker';
import { currentAccess } from '../../../src/server/access';
import { getPool } from '../../../src/server/db';
import { readVisitorIdFromServerComponent } from '../../../src/server/visitor';

// The post-purchase upsell.
// -----------------------------------------------------------------------
// Reached after a purchase. Server-rendered and server-checked: if the
// visitor already owns this rung — directly or by ladder implication —
// they are shown their library instead of being sold it again.
// -----------------------------------------------------------------------

export default async function UpsellPage({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) notFound();
  const product = getProduct(params.productId);
  const access = await currentAccess();

  // Duplicate purchase handling: never offer something already owned.
  const alreadyOwned = access.granted && isDuplicatePurchase(access.context.purchased, product.id);

  if (alreadyOwned) {
    return (
      <main id="main" className="shell">
        <div className="stack" style={{ maxWidth: '56ch' }}>
          <h1 className="page-title">You already have this</h1>
          <p className="lede">
            The {product.name} is already in your library — there is nothing to buy here.
          </p>
          <p>
            <Link className="btn btn-primary" href="/access">
              Open your library
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // PCG-3A/3B exposure instrumentation (ED-5/B-1): the server-rendered
  // offer screen itself is the authoritative "exposure" record — the
  // client-side UpsellTracker below fires a browser event for UI
  // analytics only and is NOT the gate's data source (see that
  // component). product.id is the existing server-resolved tier
  // identity (no invented analytics-only ₹1,499 component). Fail-soft:
  // a request that reached this page without the visitor cookie (e.g.
  // middleware did not run) still renders the offer; it just is not
  // counted.
  const visitorId = readVisitorIdFromServerComponent();
  if (visitorId) {
    await recordFunnelEvent(getPool(), {
      eventName: 'upsell_viewed',
      visitorId,
      userId: null,
      subjectType: 'product',
      subjectId: product.id,
      payload: { fromTier: access.funnel.tier },
      occurredAt: new Date(),
    });
  }

  return (
    <main id="main" className="shell">
      <UpsellTracker productId={product.id} fromTier={access.funnel.tier} />

      <div className="stack" style={{ maxWidth: '58ch' }}>
        <p className="price-note" style={{ margin: 0 }}>
          Your kit is on its way by email
        </p>
        <h1 className="page-title">Before you go — the next step up</h1>
        <p className="lede">
          You have the fundamentals. The {product.name} is what turns them into paid work, and it
          includes everything you just bought.
        </p>

        <PriceTag amountPaise={product.amountPaise} />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
          <Link className="btn btn-primary" href={`/checkout/${product.id}`}>
            Add it for {product.amountPaise === 49900 ? '₹499' : '₹1,499'}
          </Link>
          <Link className="btn btn-secondary" href="/access">
            No thanks, take me to my kit
          </Link>
        </div>

        <p className="hint">
          This offer stays on your library page — declining now costs you nothing.
        </p>
      </div>
    </main>
  );
}

export function generateMetadata({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) return { title: 'Upsell' };
  return { title: `Add the ${getProduct(params.productId).name}` };
}

export const dynamic = 'force-dynamic'; // entitlement-dependent; never cached
