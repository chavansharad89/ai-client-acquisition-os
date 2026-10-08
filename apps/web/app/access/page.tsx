import Link from 'next/link';

import { getProduct, PRODUCT_LADDER } from '@acos/catalog';

import { LogoutButton } from '../../src/components/LogoutButton';
import { formatInrDisplay } from '../../src/lib/format/inr';
import { currentAccess } from '../../src/server/access';

// The library. Server-gated.
// -----------------------------------------------------------------------
// Entitlements are read on the server from the authenticated session
// cookie (DEC-010 item 2/5: account login, not an emailed link). There
// is no client-side purchase state anywhere in this page, so clearing or
// forging localStorage changes nothing about what opens.
// -----------------------------------------------------------------------

export const metadata = { title: 'Your library' };
export const dynamic = 'force-dynamic';

export default async function AccessPage() {
  const access = await currentAccess();

  if (!access.granted) {
    return (
      <main id="main" className="shell">
        <div className="stack" style={{ maxWidth: '56ch' }}>
          <h1 className="page-title">Open your library</h1>
          <p className="lede">
            Log in to the account you created after your purchase to see your kits here.
          </p>
          <p>
            <Link className="btn btn-primary" href="/access/login">
              Log in
            </Link>
          </p>
          <p>
            <Link className="btn btn-secondary" href="/">
              Back to the starter kit
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { funnel } = access;

  return (
    <main id="main" className="shell">
      <div className="stack">
        <h1 className="page-title">Your library</h1>
        <p className="lede">
          Signed in as {access.context.customerEmail}. {funnel.accessible.length} of{' '}
          {PRODUCT_LADDER.length} kits unlocked.
        </p>
        <LogoutButton />
      </div>

      <div className="pricing">
        {PRODUCT_LADDER.map((id) => {
          const product = getProduct(id);
          const unlocked = funnel.accessible.includes(id);
          return (
            <article className="card" key={id}>
              <h2>{product.name}</h2>
              {unlocked ? (
                <>
                  <p>Yours. Open it any time.</p>
                  <Link className="btn btn-primary btn-block" href={`/access/${id}`}>
                    Open {product.name}
                  </Link>
                </>
              ) : (
                <>
                  <p>Not in your library yet.</p>
                  <p className="price">
                    <span className="price-amount">{formatInrDisplay(product.amountPaise)}</span>
                  </p>
                  <Link className="btn btn-secondary btn-block" href={`/checkout/${id}`}>
                    Add it
                  </Link>
                </>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
