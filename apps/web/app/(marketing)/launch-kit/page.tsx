import { ProductLanding } from '../../../src/components/ProductLanding';
import { getCustomerDisplayName } from '../../../src/server/customerDisplayName';

// Phase 1G: this page's title was a second, independent hardcoded name
// (same bug class as apps/web/app/page.tsx) — now resolved at request
// time, same as the ProductLanding body it renders. force-dynamic per
// the Product Owner's Phase 1G rendering-mode decision.
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: await getCustomerDisplayName('ai_freelancing_499') };
}

export default function LaunchKitPage() {
  return (
    <ProductLanding
      productId="ai_freelancing_499"
      blurb="Everything in the starter kit, plus the outreach system and pricing playbook freelancers use to land their first paid work."
      includes={[
        'Everything in the AI Income Starter Kit',
        'The outreach sequence, with the follow-ups most people skip',
        'Scope and pricing playbook for fixed-fee projects',
        'Proposal template that survives a procurement review',
      ]}
    />
  );
}
