import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getProduct, isValidProductId } from '@acos/catalog';
import { canAccessProduct } from '@acos/core-entitlements';

import { currentAccess } from '../../../src/server/access';

// A product's contents. The direct-URL protection lives here.
// -----------------------------------------------------------------------
// Two denials, two destinations — collapsing them into one would dump a
// paying customer who simply hasn't bought THIS kit onto a sign-in wall.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export default async function ProductAccessPage({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) notFound();
  const product = getProduct(params.productId);
  const access = await currentAccess();

  // Unknown visitor: they need their access link, not an offer.
  if (!access.granted) redirect('/access');

  // Known customer, wrong product: send them to the offer for it.
  if (!canAccessProduct(access.context.purchased, product.id)) {
    redirect(`/upsell/${product.id}`);
  }

  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '62ch' }}>
        <p style={{ margin: 0 }}>
          <Link href="/access">← Your library</Link>
        </p>
        <h1 className="page-title">{product.name}</h1>
        <div className="status status-good" role="status">
          <p style={{ margin: 0 }}>
            <strong>Unlocked.</strong> This kit is part of your library.
          </p>
        </div>
        <p className="lede">
          TODO(Phase 4): the kit&rsquo;s downloads and lessons render here. Access control above is
          complete and server-enforced.
        </p>
      </div>
    </main>
  );
}

export function generateMetadata({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) return { title: 'Your library' };
  return { title: getProduct(params.productId).name };
}
