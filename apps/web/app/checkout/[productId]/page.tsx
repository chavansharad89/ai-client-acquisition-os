import Link from 'next/link';
import { notFound } from 'next/navigation';

import { isValidProductId, getProduct, PRODUCT_IDS } from '@acos/catalog';

import { CheckoutPanel } from '../../../src/components/CheckoutPanel';

// Checkout. The product is resolved on the SERVER from the route segment;
// an unknown id 404s here rather than reaching the API. The page itself is
// a server component — only CheckoutPanel ships JavaScript.

export function generateStaticParams() {
  return PRODUCT_IDS.map((productId) => ({ productId }));
}

export default function CheckoutPage({ params }: { params: { productId: string } }) {
  if (!isValidProductId(params.productId)) notFound();
  const product = getProduct(params.productId);

  return (
    <main id="main" className="shell">
      <div className="stack">
        <p style={{ margin: 0 }}>
          <Link href="/">← All kits</Link>
        </p>
        <h1 className="page-title">Checkout</h1>
        <p className="lede">
          You&rsquo;re buying the {product.name}. The amount is set by us at checkout, not by this
          page.
        </p>
      </div>

      <CheckoutPanel product={product} />
    </main>
  );
}
