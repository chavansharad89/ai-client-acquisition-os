import type { ProposalInput } from './schema';

// Price integrity.
// -----------------------------------------------------------------------
// The single most consequential rule in this package. A model that writes
// "₹1,20,000" into a proposal when the operator set ₹1,50,000 has not made
// a wording mistake — it has changed the contract, and nobody notices
// until the client accepts the wrong number.
//
// So: the figure is an input, the schema stores the input, and any money
// figure appearing in the prose must equal it. Approximations, discounts
// and "starting from" phrasing are all rejected, because each of them
// turns a fixed price into a negotiation the operator did not agree to.
// -----------------------------------------------------------------------

/** Matches rupee figures in prose: ₹1,50,000 / Rs 150000 / INR 1.5 lakh. */
const MONEY = /(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)\s*(lakh|lakhs|crore|k)?/gi;

export interface MoneyMention {
  raw: string;
  paise: number;
}

/** Every money figure in a piece of prose, normalised to paise. */
export function extractMoney(text: string): readonly MoneyMention[] {
  const mentions: MoneyMention[] = [];
  for (const match of text.matchAll(MONEY)) {
    const digits = Number(match[1]!.replace(/,/g, ''));
    if (Number.isNaN(digits)) continue;
    const unit = match[2]?.toLowerCase();
    const rupees =
      unit === 'lakh' || unit === 'lakhs'
        ? digits * 100_000
        : unit === 'crore'
          ? digits * 10_000_000
          : unit === 'k'
            ? digits * 1_000
            : digits;
    mentions.push({ raw: match[0], paise: Math.round(rupees * 100) });
  }
  return mentions;
}

/** Phrases that quietly turn a fixed price into a negotiable one. */
export const HEDGE_PHRASES: readonly string[] = [
  'starting from',
  'starting at',
  'approximately',
  'around ₹',
  'roughly ₹',
  'in the region of',
  'ballpark',
  'give or take',
  'plus or minus',
  'we can discuss',
  'negotiable',
  'discount',
];

export type PricingDefect = 'wrong-amount' | 'no-amount' | 'hedged' | 'extra-amount';

export interface PricingCheck {
  ok: boolean;
  defects: readonly { code: PricingDefect; detail: string }[];
}

/**
 * Checks the generated pricing prose against the authoritative figure.
 *
 * The prose MUST state the figure, must not state a different one, and
 * must not hedge it.
 */
export function checkPricing(pricingText: string, input: ProposalInput): PricingCheck {
  const defects: { code: PricingDefect; detail: string }[] = [];
  const expected = input.pricing.amountPaise;
  const mentions = extractMoney(pricingText);

  if (mentions.length === 0) {
    defects.push({ code: 'no-amount', detail: 'the pricing section states no figure at all' });
  }

  const matching = mentions.filter((mention) => mention.paise === expected);
  const wrong = mentions.filter((mention) => mention.paise !== expected);

  if (mentions.length > 0 && matching.length === 0) {
    defects.push({
      code: 'wrong-amount',
      detail: `states ${wrong.map((m) => m.raw).join(', ')} but the agreed figure is ${formatPaise(expected)}`,
    });
  } else if (wrong.length > 0) {
    // A correct figure plus another one is worse than a wrong one alone:
    // the reader cannot tell which is the price.
    defects.push({
      code: 'extra-amount',
      detail: `also states ${wrong.map((m) => m.raw).join(', ')}, which is not the agreed figure`,
    });
  }

  const lower = pricingText.toLowerCase();
  for (const phrase of HEDGE_PHRASES) {
    if (lower.includes(phrase)) {
      defects.push({
        code: 'hedged',
        detail: `contains "${phrase}" — the price is fixed, not indicative`,
      });
    }
  }

  return { ok: defects.length === 0, defects };
}

export function formatPaise(paise: number): string {
  return `₹${new Intl.NumberFormat('en-IN').format(Math.round(paise / 100))}`;
}
