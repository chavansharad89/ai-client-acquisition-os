import { describe, expect, it } from 'vitest';

import { extractContactValues } from './contactValueExtraction';
import type { StoredResearchSignal, StoredResearchSignalSource } from './types';

// ₹1,499 Client Finder subscription -- contact-value extraction (Revision 5
// of requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md).
// See CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md §7-§8 for the
// behavior these tests assert against.

function source(overrides: Partial<StoredResearchSignalSource> = {}): StoredResearchSignalSource {
  return {
    id: 'source-1',
    sourceUrl: 'https://example.com/about',
    sourceQuote: 'Contact us anytime.',
    sourceLabel: 'About page',
    ...overrides,
  };
}

function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal-1',
    prospectId: 'prospect-1',
    field: 'companySummary',
    kind: 'FIRST_PARTY',
    classification: 'OBSERVED',
    signal: 'A growing local business.',
    confidence: 80,
    basis: null,
    observedAt: new Date('2026-01-01T00:00:00Z'),
    supersededAt: null,
    sources: [source()],
    ...overrides,
  };
}

describe('extractContactValues', () => {
  it('extracts a business email whose domain matches the website', () => {
    const signals = [
      signal({ signal: 'Reach the owner at owner@acme.com for quotes.', sources: [] }),
    ];
    const result = extractContactValues(signals, 'acme.com');
    expect(result).toEqual([{ kind: 'BUSINESS_EMAIL', value: 'owner@acme.com' }]);
  });

  it('extracts a personal email (gmail-style domain, no website match)', () => {
    const signals = [signal({ signal: 'Email the owner directly: owner@gmail.com', sources: [] })];
    const result = extractContactValues(signals, 'acme.com');
    expect(result).toEqual([{ kind: 'PERSONAL_EMAIL', value: 'owner@gmail.com' }]);
  });

  it('extracts a phone number', () => {
    const signals = [signal({ signal: 'Call us at +1 415-555-0182 for a quote.', sources: [] })];
    const result = extractContactValues(signals, null);
    expect(result).toEqual([{ kind: 'PHONE', value: '+1 415-555-0182' }]);
  });

  it('finds values in source quotes, not only the top-level signal text', () => {
    const signals = [
      signal({
        signal: 'A growing local business.',
        sources: [source({ sourceQuote: 'For support, write to help@acme.com.' })],
      }),
    ];
    const result = extractContactValues(signals, 'acme.com');
    expect(result).toEqual([{ kind: 'BUSINESS_EMAIL', value: 'help@acme.com' }]);
  });

  it('returns every distinct qualifying channel across multiple signals (no precedence, no omission)', () => {
    const signals = [
      signal({ id: 's1', signal: 'Office line: +1 415-555-0100.', sources: [] }),
      signal({ id: 's2', signal: 'Or email owner@acme.com.', sources: [] }),
    ];
    const result = extractContactValues(signals, 'acme.com');
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        { kind: 'PHONE', value: '+1 415-555-0100' },
        { kind: 'BUSINESS_EMAIL', value: 'owner@acme.com' },
      ]),
    );
  });

  it('de-duplicates the identical value appearing in multiple evidence rows', () => {
    const signals = [
      signal({ id: 's1', signal: 'Contact owner@acme.com.', sources: [] }),
      signal({ id: 's2', signal: 'Again, owner@acme.com is best.', sources: [] }),
    ];
    const result = extractContactValues(signals, 'acme.com');
    expect(result).toEqual([{ kind: 'BUSINESS_EMAIL', value: 'owner@acme.com' }]);
  });

  it('de-duplicates a phone number written with different formatting', () => {
    const signals = [
      signal({ id: 's1', signal: 'Call 415-555-0182.', sources: [] }),
      signal({ id: 's2', signal: 'Or dial 4155550182 directly.', sources: [] }),
    ];
    const result = extractContactValues(signals, null);
    expect(result).toHaveLength(1);
  });

  it('returns nothing when no evidence contains a contact-shaped candidate', () => {
    const signals = [signal({ signal: 'A quiet, unremarkable storefront.', sources: [] })];
    expect(extractContactValues(signals, 'acme.com')).toEqual([]);
  });

  it('returns nothing for an UNKNOWN signal (signal text is null)', () => {
    const signals = [signal({ signal: null, classification: 'UNKNOWN', sources: [] })];
    expect(extractContactValues(signals, 'acme.com')).toEqual([]);
  });

  it('never returns a value for an opportunity with no signals at all', () => {
    expect(extractContactValues([], 'acme.com')).toEqual([]);
  });

  it('extracts valid unobfuscated emails, including plus-tagged and multi-level TLD forms', () => {
    expect(
      extractContactValues([signal({ signal: 'Email john@gmail.com now.', sources: [] })], null),
    ).toEqual([{ kind: 'PERSONAL_EMAIL', value: 'john@gmail.com' }]);

    expect(
      extractContactValues(
        [signal({ signal: 'Write to first.last@example.co.in please.', sources: [] })],
        null,
      ),
    ).toEqual([{ kind: 'PERSONAL_EMAIL', value: 'first.last@example.co.in' }]);

    expect(
      extractContactValues([signal({ signal: 'Try user+tag@example.com.', sources: [] })], null),
    ).toEqual([{ kind: 'PERSONAL_EMAIL', value: 'user+tag@example.com' }]);
  });

  it.each([
    ['jo**n@gmail.com'],
    ['j***@gmail.com'],
    ['john***@gmail.com'],
    ['jo**n+tag@gmail.com'],
  ])('never fabricates a partial email from masked/obfuscated text: %s', (masked) => {
    const signals = [signal({ signal: `Contact: ${masked}`, sources: [] })];
    expect(extractContactValues(signals, null)).toEqual([]);
  });

  it('extracts only the valid email when evidence contains both a masked email and a separate valid email', () => {
    const signals = [
      signal({ signal: 'Masked: jo**n@gmail.com. Valid: john@gmail.com.', sources: [] }),
    ];
    const result = extractContactValues(signals, null);
    expect(result).toEqual([{ kind: 'PERSONAL_EMAIL', value: 'john@gmail.com' }]);
  });
});
