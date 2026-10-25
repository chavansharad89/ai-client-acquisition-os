import { describe, expect, it } from 'vitest';

import { maskContactIdentifiersInText } from './contactValueMasking';

// Contact-evidence leak fix regression (₹1,499 Client Finder subscription,
// Phase 2 Part 1). Confirms masking recognizes exactly what K1/Path B
// recognize (same underlying rules) and never alters text with no
// qualifying contact identifier in it.

describe('maskContactIdentifiersInText', () => {
  it('masks a personal email embedded in an evidence quote', () => {
    const quote = 'Reach the owner directly at jane.doe@gmail.com for a quote.';
    const masked = maskContactIdentifiersInText(quote, 'acmehotel.com');
    expect(masked).not.toContain('jane.doe@gmail.com');
    expect(masked).toContain('[contact hidden — unlock to view]');
  });

  it('masks a business email (matching the known website domain) the same way', () => {
    const quote = 'Email sales@acmehotel.com for bookings.';
    const masked = maskContactIdentifiersInText(quote, 'acmehotel.com');
    expect(masked).not.toContain('sales@acmehotel.com');
    expect(masked).toContain('[contact hidden — unlock to view]');
  });

  it('masks a phone number embedded in an evidence quote', () => {
    const quote = 'Call us on 98765 43210 to book a table.';
    const masked = maskContactIdentifiersInText(quote, null);
    expect(masked).not.toContain('98765 43210');
    expect(masked).toContain('[contact hidden — unlock to view]');
  });

  it('leaves evidence text with no contact identifier unchanged', () => {
    const quote = 'We are open Monday to Saturday, 10am to 8pm.';
    expect(maskContactIdentifiersInText(quote, 'acmehotel.com')).toBe(quote);
  });

  it('leaves a bare numeric fragment (price, year, etc.) unmasked', () => {
    const quote = 'Established in 2018, serving over 500 customers a day.';
    expect(maskContactIdentifiersInText(quote, null)).toBe(quote);
  });

  it('masks every contact identifier when more than one appears in the same quote', () => {
    const quote = 'Email owner@personalmail.com or call 98765 43210 for details.';
    const masked = maskContactIdentifiersInText(quote, 'acmehotel.com');
    expect(masked).not.toContain('owner@personalmail.com');
    expect(masked).not.toContain('98765 43210');
  });

  it('passes through null/empty text unchanged', () => {
    expect(maskContactIdentifiersInText('', null)).toBe('');
  });
});
