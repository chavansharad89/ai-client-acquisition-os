import { suggestOffers, type ResearchSignal, type ServiceRule } from '@acos/core-acquisition';
import { describe, expect, it } from 'vitest';

import {
  applySystemServiceProfileDefaults,
  deriveSystemKeywords,
  SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE,
  SYSTEM_DEFAULT_RATIONALE,
  SYSTEM_DEFAULT_TARGET_CUSTOMER,
  SYSTEM_DEFAULT_TRIGGERS,
} from './systemDefaults';
import type { NewSearchServiceProfileInput } from './types';

// CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002.

describe('SYSTEM_DEFAULT_TARGET_CUSTOMER', () => {
  it('parses to zero segments under the same rule as parseTargetSegments() (core-research/categoryPlausibility.ts)', () => {
    const segments = SYSTEM_DEFAULT_TARGET_CUSTOMER.split(';')
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);
    expect(segments).toEqual([]);
  });

  it('is a non-empty string (satisfies requireNonEmptyString)', () => {
    expect(SYSTEM_DEFAULT_TARGET_CUSTOMER.trim().length).toBeGreaterThan(0);
  });
});

describe('deriveSystemKeywords', () => {
  it('derives the literal-match-term keyword list for Web & Software Development, lowercased', () => {
    expect(deriveSystemKeywords('Web & Software Development')).toEqual([
      'website development',
      'website redesign',
      'landing pages',
      'e-commerce development',
      'wordpress development',
      'shopify development',
      'web applications',
      'mobile apps',
      'saas development',
      'custom software',
      'api development',
      'api integration',
      'database development',
      'bug fixing',
      'website maintenance',
      'performance optimization',
      'technical consulting',
    ]);
  });

  it('derives the keyword list for Photography (no slash-split, no generic bare words, no spelling variants)', () => {
    expect(deriveSystemKeywords('Photography')).toEqual([
      'product photography',
      'food photography',
      'fashion photography',
      'corporate photography',
      'event photography',
      'real-estate photography',
      'e-commerce photography',
      'photo editing',
      'background removal',
      'image retouching',
    ]);
  });

  it('excludes a generic bare-word sub-service (D3) even though other families reuse the same word compounded', () => {
    // "Consulting" alone is excluded; "Technical consulting" (Web & Software
    // Development, Specialized Professional Services) is not excluded.
    const keywords = deriveSystemKeywords('Finance / Professional Services');
    expect(keywords).not.toContain('consulting');
  });

  it('returns an empty array for a service that is not a catalogue family', () => {
    expect(deriveSystemKeywords('something I made up')).toEqual([]);
  });
});

describe('applySystemServiceProfileDefaults', () => {
  function minimalInput(overrides: Partial<NewSearchServiceProfileInput> = {}): NewSearchServiceProfileInput {
    return { service: 'Photography', geography: 'Delhi', ...overrides };
  }

  it('fills all five system-owned fields from the caller-supplied service + geography alone', () => {
    const fields = applySystemServiceProfileDefaults(minimalInput());
    expect(fields.service).toBe('Photography');
    expect(fields.geography).toBe('Delhi');
    expect(fields.targetCustomer).toBe(SYSTEM_DEFAULT_TARGET_CUSTOMER);
    expect(fields.minProjectValuePaise).toBe(SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE);
    expect(fields.triggers).toEqual(SYSTEM_DEFAULT_TRIGGERS);
    expect(fields.keywords).toEqual(deriveSystemKeywords('Photography'));
    expect(fields.rationale).toBe(SYSTEM_DEFAULT_RATIONALE);
  });

  it('never reads a caller-supplied value for any of the five system-owned fields, even an unsafely-smuggled one', () => {
    // NewSearchServiceProfileInput has no field named targetCustomer/
    // minProjectValuePaise/triggers/keywords/rationale — simulating an
    // untyped request body that tries anyway, via a cast.
    const smuggled = {
      service: 'Photography',
      geography: 'Delhi',
      targetCustomer: 'D2C restaurants',
      minProjectValuePaise: 5_000_000,
      triggers: ['JOB_POST'],
      keywords: ['custom keyword'],
      rationale: 'A freelancer-authored rationale.',
    } as unknown as NewSearchServiceProfileInput;

    const fields = applySystemServiceProfileDefaults(smuggled);
    expect(fields.targetCustomer).toBe(SYSTEM_DEFAULT_TARGET_CUSTOMER);
    expect(fields.minProjectValuePaise).toBe(SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE);
    expect(fields.triggers).toEqual(SYSTEM_DEFAULT_TRIGGERS);
    expect(fields.keywords).toEqual(deriveSystemKeywords('Photography'));
    expect(fields.rationale).toBe(SYSTEM_DEFAULT_RATIONALE);
  });
});

describe('system defaults preserve the suggestOffers() AND-gate (D1/D5)', () => {
  function toRule(service: string): ServiceRule {
    return {
      service,
      triggers: SYSTEM_DEFAULT_TRIGGERS as ServiceRule['triggers'],
      keywords: deriveSystemKeywords(service),
      typicalValuePaise: SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE,
      rationale: SYSTEM_DEFAULT_RATIONALE,
    };
  }

  it('positive case: a WEBSITE signal whose text contains a derived keyword is detected as an offer', () => {
    const signals: readonly ResearchSignal[] = [
      {
        kind: 'WEBSITE',
        signal: 'Their homepage has no website redesign in years and looks outdated.',
        confidence: 80,
        observedAt: new Date(),
      },
    ];
    const suggestions = suggestOffers(signals, [toRule('Web & Software Development')]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]!.rationale).toBe(
      'A potential fit for Their homepage has no website redesign in years and looks outdated. — review the evidence below before reaching out.',
    );
  });

  it('negative case: a signal kind outside the system trigger set never matches, even with a keyword hit', () => {
    const signals: readonly ResearchSignal[] = [
      {
        kind: 'JOB_POST',
        signal: 'Hiring for website redesign work.',
        confidence: 90,
        observedAt: new Date(),
      },
    ];
    const suggestions = suggestOffers(signals, [toRule('Web & Software Development')]);
    expect(suggestions).toEqual([]);
  });

  it('negative case: a signal whose text matches no derived keyword never matches, even with a trigger-kind hit', () => {
    const signals: readonly ResearchSignal[] = [
      {
        kind: 'WEBSITE',
        signal: 'Their homepage loads quickly and looks modern.',
        confidence: 80,
        observedAt: new Date(),
      },
    ];
    const suggestions = suggestOffers(signals, [toRule('Web & Software Development')]);
    expect(suggestions).toEqual([]);
  });
});
