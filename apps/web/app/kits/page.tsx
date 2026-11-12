import { listProducts } from '@acos/catalog';

import { ProductCard } from '../../src/components/ProductCard';
import { getCustomerDisplayName } from '../../src/server/customerDisplayName';

export const metadata = { title: 'All kits' };

// Phase 1G: force-dynamic since each card's name is now resolved at
// request time. listProducts() includes the retired legacy
// ai_client_acquisition_1499 SKU -- getCustomerDisplayName resolves it
// safely to its catalog default (no CMS override can exist for a
// non-CMS-eligible product), same as every other product here.
export const dynamic = 'force-dynamic';

const BLURBS: Record<string, string> = {
  ai_income_99: 'The starting point. Templates and prompts to earn your first income with AI.',
  ai_freelancing_499:
    'Everything in the starter kit, plus the outreach system and pricing playbook freelancers use to land paid work.',
  ai_client_acquisition_1499:
    'The full operating system: acquisition funnel, delivery workflow, and the automation that keeps it running.',
};

export default async function KitsPage() {
  const products = await Promise.all(
    listProducts().map(async (product) => ({ product, displayName: await getCustomerDisplayName(product.id) })),
  );

  return (
    <main id="main" className="shell">
      <div className="stack">
        <h1 className="page-title">Pick the kit that matches where you are</h1>
        <p className="lede">
          Each kit contains everything below it, so you never pay for the same material twice.
        </p>
      </div>
      <div className="pricing">
        {products.map(({ product, displayName }) => (
          <ProductCard key={product.id} product={product} displayName={displayName} blurb={BLURBS[product.id] ?? ''} />
        ))}
      </div>
    </main>
  );
}
