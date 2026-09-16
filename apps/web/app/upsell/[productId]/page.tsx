import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getProduct, isValidProductId } from '@acos/catalog';
import { isDuplicatePurchase } from '@acos/core-entitlements';

import { PriceTag } from '../../../src/components/PriceTag';
import { UpsellTracker } from '../../../src/components/UpsellTracker';
import { currentAccess } from '../../../src/server/access';

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
