import { describe, expect, it } from 'vitest';

import { resolveFieldVisibility } from './fieldClassification';
import { lookupCachedSignalForOwner } from './service';
import { evaluateEntityPublicLookup } from './signalCache';
import { fakeFieldClassificationRepository, fakeResearchSignalCacheRepository } from './testSupport';
import type { StoredResearchSignal } from './types';

// Phase H — field-level public/private classification
// (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
// SPECIFICATION.md; migration 0058, already applied — these tests never
// write to research_signal_field_classification, only read it through
// the fake/pg repository contract). See
// tests/integration/research-signal-field-classification.integration.
// test.ts for the real-Postgres proof against the actual seeded table.

describe('resolveFieldVisibility — fail-closed decision function', () => {
  it('1. companySummary => PUBLIC_ELIGIBLE', () => {
    expect(resolveFieldVisibility('PUBLIC_ELIGIBLE')).toBe('PUBLIC_ELIGIBLE');
  });

  it('7. an undefined row (unknown field) => PRIVATE', () => {
    expect(resolveFieldVisibility(undefined)).toBe('PRIVATE');
  });

  it('8. a null value (row present but no classification) => PRIVATE', () => {
    expect(resolveFieldVisibility(null)).toBe('PRIVATE');
  });

  it('an invalid/unrecognized classification value => PRIVATE, never PUBLIC_ELIGIBLE by typo or drift', () => {
    expect(resolveFieldVisibility('public_eligible')).toBe('PRIVATE'); // case-sensitive, no normalization
    expect(resolveFieldVisibility('SEMI_PUBLIC')).toBe('PRIVATE');
    expect(resolveFieldVisibility('')).toBe('PRIVATE');
  });
});

describe('FieldClassificationRepository (fake, mirrors createPgFieldClassificationRepository)', () => {
  const repo = fakeFieldClassificationRepository();

  it('1. companySummary => PUBLIC_ELIGIBLE', async () => {
    expect(await repo.isFieldPublicEligible('companySummary')).toBe(true);
  });

  it('2. businessModel => PUBLIC_ELIGIBLE', async () => {
    expect(await repo.isFieldPublicEligible('businessModel')).toBe(true);
  });

  it('3. websiteIssues => PRIVATE', async () => {
    expect(await repo.isFieldPublicEligible('websiteIssues')).toBe(false);
  });

  it('4. contentOpportunities => PRIVATE', async () => {
    expect(await repo.isFieldPublicEligible('contentOpportunities')).toBe(false);
  });

  it('5. aiOpportunities => PRIVATE', async () => {
    expect(await repo.isFieldPublicEligible('aiOpportunities')).toBe(false);
  });

  it('6. growthOpportunities => PRIVATE', async () => {
    expect(await repo.isFieldPublicEligible('growthOpportunities')).toBe(false);
  });

  it('7. an unknown field => PRIVATE', async () => {
    expect(await repo.isFieldPublicEligible('somethingNotInTheTable')).toBe(false);
  });

  it('8. missing classification (empty table) => PRIVATE', async () => {
    const empty = fakeFieldClassificationRepository({});
    expect(await empty.isFieldPublicEligible('companySummary')).toBe(false);
  });

  it('targetCustomers/visibleProblems/automationOpportunities also default PRIVATE (Q4 interim default, migration 0058)', async () => {
    expect(await repo.isFieldPublicEligible('targetCustomers')).toBe(false);
    expect(await repo.isFieldPublicEligible('visibleProblems')).toBe(false);
    expect(await repo.isFieldPublicEligible('automationOpportunities')).toBe(false);
  });

  it('12. no LLM/provider/network dependency exists on this repository\'s contract at all — it is a single function of one string argument', async () => {
    // Static shape check, not a mock-call assertion: the interface itself
    // has no provider/model/credential parameter to call through.
    expect(Object.keys(repo)).toEqual(['isFieldPublicEligible']);
    expect(repo.isFieldPublicEligible.length).toBe(1);
  });
});

describe('9/10/11/13 — classification interacts with the rest of the system only through evaluateEntityPublicLookup, never on its own', () => {
  function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
    return {
      id: 'signal_1',
      prospectId: 'prospect_1',
      field: 'companySummary',
      kind: 'WEBSITE',
      classification: 'OBSERVED',
      signal: 'Acme sells widgets',
      confidence: 90,
      basis: null,
      observedAt: new Date('2026-06-01T00:00:00.000Z'),
      supersededAt: null,
      sources: [{ id: 'source_1', sourceUrl: 'https://acme.test', sourceQuote: 'q', sourceLabel: 'homepage' }],
      ...overrides,
    };
  }

  const now = new Date('2026-06-01T00:00:00.000Z');

  it('9. classification alone never authorizes sharing — PUBLIC_ELIGIBLE with no authorization check wired is still excluded', async () => {
    const repo = fakeFieldClassificationRepository();
    const s = signal({ field: 'companySummary' });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, {
      isFieldPublicEligible: () => true, // stands in for a classification check that already ran
      isAuthorized: () => false, // Phase I not implemented — no real authorization source exists
    });
    expect(result.outcome).toBe('none');
    // The repository itself has no method that could have produced an
    // authorization decision — proven by its single-method shape above.
    void repo;
  });

  it('10. Phase G cache cannot bypass classification — a private field pointer from findByEntity is still excluded once routed through the real classification repository', async () => {
    const repo = fakeFieldClassificationRepository();
    // Mirrors how a future Phase I caller would adapt the async
    // repository into evaluateEntityPublicLookup's required sync
    // predicate: pre-resolve each field once, synchronously check after.
    const eligibility = new Map<string, boolean>();
    for (const field of ['companySummary', 'websiteIssues']) {
      eligibility.set(field, await repo.isFieldPublicEligible(field));
    }

    const publicSignal = signal({ id: 'signal_pub', field: 'companySummary' });
    const privateSignal = signal({ id: 'signal_priv', field: 'websiteIssues' });

    const result = evaluateEntityPublicLookup([publicSignal, privateSignal], 'WEBSITE', now, {
      isFieldPublicEligible: (field) => eligibility.get(field) ?? false,
      isAuthorized: () => true, // even granting authorization, classification alone must still gate websiteIssues
    });

    expect(result.signals.map((sig) => sig.id)).toEqual(['signal_pub']);
  });

  it('11. historical data remains private — classification does not retroactively make an old row reusable without the (still-unimplemented) authorization check', async () => {
    const repo = fakeFieldClassificationRepository();
    const historical = signal({
      field: 'companySummary',
      observedAt: new Date('2020-01-01T00:00:00.000Z'), // predates the entire Entity/Q5 architecture
    });
    const eligible = await repo.isFieldPublicEligible('companySummary');
    const result = evaluateEntityPublicLookup([historical], 'WEBSITE', now, {
      isFieldPublicEligible: () => eligible,
      isAuthorized: () => false, // no authorization row exists, nor can this module create one
    });
    expect(result.outcome).toBe('none');
  });

  it('13. same-freelancer private reuse remains unaffected — lookupCachedSignalForOwner returns a PRIVATE-classified field’s own signal with no classification check at all', async () => {
    const privateSignal = signal({ id: 'signal_private', field: 'websiteIssues' });
    const signalCache = fakeResearchSignalCacheRepository((id) => (id === privateSignal.id ? privateSignal : undefined));
    await signalCache.record({
      userId: 'user_a',
      normalizedDomain: 'acme.example.com',
      signalKind: 'WEBSITE',
      signalId: privateSignal.id,
      observedAt: privateSignal.observedAt,
    });

    // Confirms (independently of the fixture above) that websiteIssues is
    // in fact classified PRIVATE — this test's whole point is that it
    // doesn't matter to this path either way.
    expect(await fakeFieldClassificationRepository().isFieldPublicEligible('websiteIssues')).toBe(false);

    const result = await lookupCachedSignalForOwner(signalCache, 'user_a', 'acme.example.com', 'WEBSITE', now);
    expect(result.outcome).toBe('hit');
    expect(result.signals[0]?.id).toBe('signal_private');
  });
});
