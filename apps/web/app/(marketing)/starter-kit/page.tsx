import { ProductLanding } from '../../../src/components/ProductLanding';
import { getCustomerDisplayName } from '../../../src/server/customerDisplayName';

// Phase 1G: this page's title was a second, independent hardcoded name
// (same bug class as apps/web/app/page.tsx) — now resolved at request
// time, same as the ProductLanding body it renders. force-dynamic per
// the Product Owner's Phase 1G rendering-mode decision.
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: await getCustomerDisplayName('ai_income_99') };
}

export default function StarterKitPage() {
  return (
    <ProductLanding
      productId="ai_income_99"
      blurb="The fastest way to find out whether AI work suits you, without committing a weekend or a budget to it."
      includes={[
        'Prompt library for the ten highest-demand AI tasks',
        'Pricing sheet for first-time freelancers',
        'Two outreach templates that do not read as templates',
      ]}
    />
  );
}
