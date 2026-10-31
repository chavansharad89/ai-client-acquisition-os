import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isRetiredFromNewPurchases, isValidProductId, getProduct } from '@acos/catalog';

import { CheckoutPanel } from '../../../src/components/CheckoutPanel';
import { getCustomerDisplayName } from '../../../src/server/customerDisplayName';

// Checkout. The product is resolved on the SERVER from the route segment;
// an unknown id 404s here rather than reaching the API.
// -----------------------------------------------------------------------
// Previously eligible for static generation via generateStaticParams,
// since nothing here read per-request data. Phase 1G's display name is
// CMS-configurable and resolved at request time (CMS-PO-001(R2):
// "automatically reflected"), so this page is force-dynamic now, per the
// Product Owner's explicit correctness-over-caching decision for Phase
// 1G. generateStaticParams was removed, not merely left inert: verified
// by a clean build that with both present, Next.js still pre-rendered
// (and baked a now-stale display name into) each of the 3 known
// productId params at build time, overriding force-dynamic for exactly
// those params — the opposite of what the Product Owner's decision
// requires. Removing it was necessary for force-dynamic to actually
// take effect, not a stylistic cleanup.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) notFound();
  // Retired from new purchases (COMMERCIAL-PO-05/17): the id still
  // resolves for historical orders elsewhere, but this checkout entry
  // point must not offer it to a new customer.
  if (isRetiredFromNewPurchases(params.productId)) notFound();
  const product = getProduct(params.productId);
  const displayName = await getCustomerDisplayName(product.id);

  return (
    <main id="main" className="shell">
      <div className="stack">
        <p style={{ margin: 0 }}>
          <Link href="/">← All kits</Link>
        </p>
        <h1 className="page-title">Checkout</h1>
        <p className="lede">
          You&rsquo;re buying the {displayName}. The amount is set by us at checkout, not by this
          page.
        </p>
      </div>

      <CheckoutPanel product={product} displayName={displayName} />
    </main>
  );
}
