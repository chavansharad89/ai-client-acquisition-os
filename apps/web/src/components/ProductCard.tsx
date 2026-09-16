import Link from 'next/link';

import type { Product } from '@acos/catalog';

import { PriceTag } from './PriceTag';

/**
 * A product in the pricing grid. The CTA is a link to the checkout route,
 * not a fetch — so it works before hydration and is keyboard/right-click
 * friendly, and the price shown here is never what gets charged.
 */
export function ProductCard({ product, blurb }: { product: Product; blurb: string }) {
  return (
    <article className="card">
      <h2>{product.name}</h2>
      <PriceTag amountPaise={product.amountPaise} />
      <p>{blurb}</p>
      <Link className="btn btn-primary btn-block" href={`/checkout/${product.id}`}>
        Buy {product.name}
      </Link>
    </article>
  );
}
