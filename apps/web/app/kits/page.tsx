import { listProducts } from '@acos/catalog';

import { ProductCard } from '../../src/components/ProductCard';

export const metadata = { title: 'All kits' };

const BLURBS: Record<string, string> = {
  ai_income_99: 'The starting point. Templates and prompts to earn your first income with AI.',
  ai_freelancing_499:
    'Everything in the starter kit, plus the outreach system and pricing playbook freelancers use to land paid work.',
  ai_client_acquisition_1499:
    'The full operating system: acquisition funnel, delivery workflow, and the automation that keeps it running.',
};

export default function KitsPage() {
  return (
    <main id="main" className="shell">
      <div className="stack">
        <h1 className="page-title">Pick the kit that matches where you are</h1>
        <p className="lede">
          Each kit contains everything below it, so you never pay for the same material twice.
        </p>
      </div>
      <div className="pricing">
        {listProducts().map((product) => (
          <ProductCard key={product.id} product={product} blurb={BLURBS[product.id] ?? ''} />
        ))}
      </div>
    </main>
  );
}
