import Link from 'next/link';

import { getProduct, type ProductId } from '@acos/catalog';

import { PriceTag } from './PriceTag';

/**
 * A single-product landing page body. Shares the catalog and the price
 * component with the pricing grid, so a product can never show one price
 * here and another there.
 */
export function ProductLanding({
  productId,
  blurb,
  includes,
}: {
  productId: ProductId;
  blurb: string;
  includes: string[];
}) {
  const product = getProduct(productId);
  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '62ch' }}>
        <p style={{ margin: 0 }}>
          <Link href="/">← All kits</Link>
        </p>
        <h1 className="page-title">{product.name}</h1>
        <p className="lede">{blurb}</p>
        <PriceTag amountPaise={product.amountPaise} />
        <ul className="stack" style={{ paddingLeft: '1.1rem', margin: 0, gap: '0.4rem' }}>
          {includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: '8px 0 0' }}>
          <Link className="btn btn-primary" href={`/checkout/${product.id}`}>
            Buy {product.name}
          </Link>
        </p>
      </div>
    </main>
  );
}
