import Link from 'next/link';

import { ENTRY_PRODUCT_ID, getProduct } from '@acos/catalog';

import { PriceTag } from '../src/components/PriceTag';

// Funnel entry. One offer, one decision.
// -----------------------------------------------------------------------
// A server component, so the price is in the HTML before any JavaScript
// runs. The three-tier grid lives at /kits for people who want to compare;
// this page deliberately does not, because a single ₹99 decision converts
// better than a three-way comparison.
// -----------------------------------------------------------------------

export const metadata = {
  title: 'AI Income Starter Kit',
  description: 'Start earning with AI for ₹99. One-time payment, delivered by email.',
};

const PROOF = [
  'Prompt library for the ten highest-demand AI tasks',
  'Pricing sheet built for first-time freelancers',
  'Two outreach templates that do not read as templates',
];

export default function FunnelEntryPage() {
  const product = getProduct(ENTRY_PRODUCT_ID);

  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '58ch' }}>
        <h1 className="page-title">{product.name}</h1>
        <p className="lede">
          Find out whether AI work suits you without committing a weekend or a budget to it.
          Everything you need to land the first paid task, for less than lunch.
        </p>

        <PriceTag amountPaise={product.amountPaise} />

        <ul className="stack" style={{ paddingLeft: '1.1rem', margin: 0, gap: '0.4rem' }}>
          {PROOF.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p style={{ margin: '8px 0 0' }}>
          <Link className="btn btn-primary" href={`/checkout/${product.id}`}>
            Start for ₹99
          </Link>
        </p>

        <ul className="trust">
          <li>One-time payment</li>
          <li>Delivered by email</li>
          <li>Secure payment by Razorpay</li>
        </ul>

        <p className="hint" style={{ marginTop: '8px' }}>
          Already bought a kit? <Link href="/access">Open your library</Link>. Want to compare all
          three? <Link href="/kits">See every kit</Link>.
        </p>
      </div>
    </main>
  );
}
