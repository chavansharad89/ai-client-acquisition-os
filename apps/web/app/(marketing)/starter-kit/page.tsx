import { ProductLanding } from '../../../src/components/ProductLanding';

export const metadata = { title: 'AI Income Starter Kit' };

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
