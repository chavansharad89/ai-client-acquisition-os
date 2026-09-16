import { formatInrDisplay } from '../lib/format/inr';

// Renders a price from the catalog amount. Presentation only — this value
// is never sent back to the server, which resolves the price itself.

export function PriceTag({
  amountPaise,
  note = 'one-time',
}: {
  amountPaise: number;
  note?: string;
}) {
  return (
    <p className="price">
      <span className="price-amount">{formatInrDisplay(amountPaise)}</span>
      <span className="price-note">{note}</span>
    </p>
  );
}
