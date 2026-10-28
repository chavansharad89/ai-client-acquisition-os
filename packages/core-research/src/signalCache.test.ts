import { describe, expect, it } from 'vitest';

import { evaluateEntityPublicLookup, evaluateSignalFreshness, toSignalCacheLookupResult } from './signalCache';
import type { EntityPublicLookupDeps } from './signalCache';
import type { ResearchSourceKind } from './persist';
import type { StoredResearchSignal } from './types';

// Phase 4 pure-function unit tests (CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-
// DEC-001). See ./service.test.ts for the (user, domain, kind) cache-key
// isolation tests (hit/miss across users/domains, provenance preservation,
// no-LLM-call), and tests/integration/research-signal-cache-index.
// integration.test.ts for the real-Postgres proof of migration 0045.

function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'companySummary',
    kind: 'WEBSITE',
    classification: 'OBSERVED',
    signal: 'Acme sells warehouse robotics',
    confidence: 92,
    basis: null,
    observedAt: new Date('2026-01-01T00:00:00.000Z'),
    supersededAt: null,
    sources: [{ id: 'source_1', sourceUrl: 'https://acme.test', sourceQuote: 'q', sourceLabel: 'homepage' }],
    ...overrides,
  };
}

describe('evaluateSignalFreshness', () => {
  // CF-SIGNAL-FRESHNESS-PO-DEC-001's approved initial freshness windows.
  const approvedWindowDays: Record<string, number> = {
    WEBSITE: 30,
    JOB_POST: 14,
    LINKEDIN: 14,
    NEWS: 7,
    FUNDING: 90,
    TECH_STACK: 30,
    REVIEW: 90,
    // CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001 D12.
    GOOGLE_PLACES_STATUS: 30,
  };

  it.each(Object.entries(approvedWindowDays))(
    '%s: fresh immediately inside its window, stale immediately outside it',
    (kind, days) => {
      const now = new Date('2026-06-01T00:00:00.000Z');
      const windowMs = days * 24 * 60 * 60 * 1000;
      const justInside = new Date(now.getTime() - windowMs);
      const justOutside = new Date(now.getTime() - windowMs - 1);
      expect(evaluateSignalFreshness(kind as ResearchSourceKind, justInside, now)).toBe('fresh');
      expect(evaluateSignalFreshness(kind as ResearchSourceKind, justOutside, now)).toBe('stale');
    },
  );

  it('MANUAL is always stale — no elapsed-time window applies; remains stale unless explicitly refreshed with a new observation', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(evaluateSignalFreshness('MANUAL', now, now)).toBe('stale');
  });

  it('PUBLIC_INTENT and FIRST_PARTY are not reusable public-evidence cache kinds — never fresh', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(evaluateSignalFreshness('PUBLIC_INTENT', now, now)).toBe('stale');
    expect(evaluateSignalFreshness('FIRST_PARTY', now, now)).toBe('stale');
  });

  it('a signal kind with no approved freshness policy is stale', () => {
    const now = new Date('2026-06-01T00:00:00.000Z');
    expect(evaluateSignalFreshness('UNRECOGNIZED_KIND' as ResearchSourceKind, now, now)).toBe('stale');
  });
});

describe('toSignalCacheLookupResult', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('no indexed evidence => outcome none, freshness null, empty signals', () => {
    const result = toSignalCacheLookupResult([], 'WEBSITE', now);
    expect(result).toEqual({ outcome: 'none', freshness: null, signals: [] });
  });

  it('indexed evidence exists but is outside its window => outcome hit, freshness stale', () => {
    const s = signal({ observedAt: new Date('2026-01-01T00:00:00.000Z') });
    const result = toSignalCacheLookupResult([s], 'WEBSITE', now);
    expect(result.outcome).toBe('hit');
    expect(result.freshness).toBe('stale');
  });

  it('indexed evidence exists and is inside its window => outcome hit, freshness fresh', () => {
    const s = signal({ observedAt: new Date('2026-05-15T00:00:00.000Z') });
    const result = toSignalCacheLookupResult([s], 'WEBSITE', now);
    expect(result.outcome).toBe('hit');
    expect(result.freshness).toBe('fresh');
  });

  it('a signal kind with no approved freshness policy is never silently treated as fresh', () => {
    const s = signal({ kind: 'MANUAL', observedAt: now });
    const result = toSignalCacheLookupResult([s], 'MANUAL', now);
    expect(result.outcome).toBe('hit');
    expect(result.freshness).toBe('stale');
  });

  it('cache hit returns the original signal objects verbatim — provenance, observedAt, confidence untouched', () => {
    const s = signal({ observedAt: new Date('2026-03-01T00:00:00.000Z'), confidence: 77 });
    const result = toSignalCacheLookupResult([s], 'WEBSITE', now);
    expect(result.signals).toEqual([s]);
    expect(result.signals[0]?.observedAt).toEqual(new Date('2026-03-01T00:00:00.000Z'));
    expect(result.signals[0]?.confidence).toBe(77);
    expect(result.signals[0]?.sources).toEqual(s.sources);
  });
});

// ===== Phase G — Entity/public lookup gate (evaluateEntityPublicLookup) =
// Final Architecture Rules §6 "Cache"; Q5-B sharing gate engineering
// specification §I. This gate is the ONLY sanctioned way to turn
// findByEntity's raw, cross-freelancer pointer result into something
// eligible for reuse — it requires BOTH a field-classification check
// (Phase H) and a Q5-B authorization check (Phase I) to be supplied by
// the caller; neither exists in production yet, so every test here
// injects its own fakes to prove the gate's shape, not real policy.

describe('evaluateEntityPublicLookup', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  const denyAll: EntityPublicLookupDeps = {
    isFieldPublicEligible: () => false,
    isAuthorized: () => false,
  };
  const allowAll: EntityPublicLookupDeps = {
    isFieldPublicEligible: () => true,
    isAuthorized: () => true,
  };

  it('5/9. with no live classification/authorization source, every signal is excluded — fails closed, never open', () => {
    const s = signal({ observedAt: now });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, denyAll);
    expect(result).toEqual({ outcome: 'none', freshness: null, signals: [] });
  });

  it('6. a field classified PUBLIC_ELIGIBLE but lacking Q5-B authorization is excluded', () => {
    const s = signal({ field: 'companySummary' });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, {
      isFieldPublicEligible: (field) => field === 'companySummary',
      isAuthorized: () => false,
    });
    expect(result.outcome).toBe('none');
  });

  it('7/10. authorized but not classified public-eligible is excluded — Q5-B authorization alone never bypasses field classification', () => {
    const s = signal({ field: 'websiteIssues' });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, {
      isFieldPublicEligible: (field) => field === 'companySummary',
      isAuthorized: () => true,
    });
    expect(result.outcome).toBe('none');
  });

  it('5/7. public-eligible AND authorized AND fresh => reusable', () => {
    const s = signal({ field: 'companySummary', observedAt: now });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, allowAll);
    expect(result.outcome).toBe('hit');
    expect(result.freshness).toBe('fresh');
    expect(result.signals).toEqual([s]);
  });

  it('11. stale public evidence is not reused as fresh, even when eligible and authorized', () => {
    const s = signal({ field: 'companySummary', observedAt: new Date('2026-01-01T00:00:00.000Z') });
    const result = evaluateEntityPublicLookup([s], 'WEBSITE', now, allowAll);
    expect(result.outcome).toBe('hit');
    expect(result.freshness).toBe('stale');
  });

  it('12. GOOGLE_PLACES_STATUS retains its existing 30-day freshness window through this gate too', () => {
    const fresh = signal({
      field: 'businessStatus',
      kind: 'GOOGLE_PLACES_STATUS',
      observedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
    });
    const stale = signal({
      id: 'signal_2',
      field: 'businessStatus',
      kind: 'GOOGLE_PLACES_STATUS',
      observedAt: new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000),
    });
    expect(evaluateEntityPublicLookup([fresh], 'GOOGLE_PLACES_STATUS', now, allowAll).freshness).toBe(
      'fresh',
    );
    expect(evaluateEntityPublicLookup([stale], 'GOOGLE_PLACES_STATUS', now, allowAll).freshness).toBe(
      'stale',
    );
  });

  it('13. two conflicting signals for the same Entity are each evaluated independently, never collapsed', () => {
    const eligible = signal({ id: 'signal_1', field: 'companySummary', signal: 'Version A' });
    const ineligible = signal({ id: 'signal_2', field: 'websiteIssues', signal: 'Version B' });
    const result = evaluateEntityPublicLookup([eligible, ineligible], 'WEBSITE', now, {
      isFieldPublicEligible: (field) => field === 'companySummary',
      isAuthorized: () => true,
    });
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]?.id).toBe('signal_1');
  });

  it('16/17. the gate never returns a private field even when every signal passed in is otherwise eligible-shaped', () => {
    const publicField = signal({ id: 'signal_1', field: 'companySummary' });
    const privateField = signal({ id: 'signal_2', field: 'targetCustomers' });
    const result = evaluateEntityPublicLookup([publicField, privateField], 'WEBSITE', now, {
      isFieldPublicEligible: (field) => field === 'companySummary',
      isAuthorized: () => true,
    });
    expect(result.signals.map((s) => s.field)).toEqual(['companySummary']);
  });
});
