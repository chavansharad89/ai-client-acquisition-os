import { ProductLanding } from '../../../src/components/ProductLanding';

export const metadata = { title: 'AI Freelancing Launch Kit' };

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
