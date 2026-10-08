import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { loadEnv } from '@acos/config';
import { deliverablesFor, getProduct, isValidProductId } from '@acos/catalog';
import { canAccessProduct, createDownloadGrant } from '@acos/core-entitlements';

import { currentAccess } from '../../../src/server/access';

// A product's contents. The direct-URL protection lives here.
// -----------------------------------------------------------------------
// Two denials, two destinations — collapsing them into one would dump a
// paying customer who simply hasn't bought THIS kit onto a sign-in wall.
//
// Renders `deliverablesFor(product.id)` — whatever the catalog manifest
// currently lists, however many entries that is. Nothing here assumes a
// fixed count: today that is 3 files for the ₹99 kit; DEC-012/DEC-013
// approved a future 10-asset bundle, and adding those rows to
// @acos/catalog's manifest is the only change a later delivery needs —
// this page, the download route, and the grant it mints already handle
// an arbitrary deliverables array.
// -----------------------------------------------------------------------

export const dynamic = 'force-dynamic';

export default async function ProductAccessPage({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) notFound();
  const product = getProduct(params.productId);
  const access = await currentAccess();

  // Unknown visitor: they need to log in, not see an offer.
  if (!access.granted) redirect('/access');

  // Known customer, wrong product: send them to the offer for it.
  if (!canAccessProduct(access.context.purchased, product.id)) {
    redirect(`/upsell/${product.id}`);
  }

  const secret = loadEnv().DOWNLOAD_GRANT_SECRET;
  const assets = deliverablesFor(product.id).map((asset) => ({
    asset,
    grant: createDownloadGrant(
      { productId: product.id, assetId: asset.id, customerEmail: access.context.customerEmail },
      secret,
    ),
  }));

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
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {assets.map(({ asset, grant }) => (
            <li key={asset.id}>
              <a
                className="btn btn-secondary btn-block"
                href={`/api/downloads/${product.id}/${asset.id}?grant=${encodeURIComponent(grant)}`}
              >
                {asset.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export function generateMetadata({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) return { title: 'Your library' };
  return { title: getProduct(params.productId).name };
}
