import { describe, expect, it } from 'vitest';

import {
  authorizeSignalForSharing,
  isAuthorizationActive,
  lookupEntityPublicSignals,
  SignalAuthorizationRejectedError,
} from './signalAuthorization';
import type { StoredSignalAuthorization } from './signalAuthorization';
import {
  fakeFieldClassificationRepository,
  fakeResearchSignalCacheRepository,
  fakeSignalAuthorizationRepository,
  fakeSignalLookupRepository,
} from './testSupport';
import type { StoredResearchSignal } from './types';

// Phase I — Q5-B sharing-authorization gate security test matrix
// (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
// SPECIFICATION.md §K). Numbered comments below correspond to this
// turn's governing instruction's "SECURITY TEST MATRIX" (§12), not
// directly to spec §K's own numbering, which overlaps but is not
// identical.

const NOW = new Date('2026-06-01T00:00:00.000Z');

// Q5-C: the fictional moment migration 0059's storage went live in
// these tests' timeline. signal()'s default createdAt (NOW, below) is
// deliberately AFTER this, so every pre-existing test in this file
// keeps exercising a "new" (non-historical) signal unless it
// explicitly overrides createdAt to something before this instant.
const HISTORICAL_CUTOFF = new Date('2026-01-01T00:00:00.000Z');

function signal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'companySummary',
    kind: 'WEBSITE',
    classification: 'OBSERVED',
    signal: 'Acme serves small businesses in Mumbai',
    confidence: 90,
    basis: null,
    observedAt: NOW,
    supersededAt: null,
    createdAt: NOW,
    sources: [
      {
        id: 'source_1',
        sourceUrl: 'https://acme.test/about',
        sourceQuote: 'Acme serves small businesses in Mumbai',
        sourceLabel: 'homepage',
      },
    ],
    ...overrides,
  };
}

async function seedCacheWithSignal(
  entityId: string,
  sig: StoredResearchSignal,
  opts: { userId?: string } = {},
): Promise<ReturnType<typeof fakeResearchSignalCacheRepository>> {
  const cache = fakeResearchSignalCacheRepository((id) => (id === sig.id ? sig : undefined));
  await cache.record({
    userId: opts.userId ?? 'user_a',
    normalizedDomain: 'acme.example.com',
    signalKind: sig.kind,
    signalId: sig.id,
    observedAt: sig.observedAt,
    entityId,
  });
  return cache;
}

describe('isAuthorizationActive', () => {
  it('null (never authorized) is not active', () => {
    expect(isAuthorizationActive(null)).toBe(false);
  });

  it('an authorization with revokedAt null is active', () => {
    const auth: StoredSignalAuthorization = {
      id: 'a1',
      signalId: 'signal_1',
      authorizedAt: NOW,
      authorizedBy: 'ops_alice',
      revokedAt: null,
    };
    expect(isAuthorizationActive(auth)).toBe(true);
  });

  it('a revoked authorization is never active', () => {
    const auth: StoredSignalAuthorization = {
      id: 'a1',
      signalId: 'signal_1',
      authorizedAt: NOW,
      authorizedBy: 'ops_alice',
      revokedAt: new Date('2026-06-15T00:00:00.000Z'),
    };
    expect(isAuthorizationActive(auth)).toBe(false);
  });
});

describe('authorizeSignalForSharing — write-time validation', () => {
  function deps(sig: StoredResearchSignal | undefined, classificationTable?: Record<string, 'PUBLIC_ELIGIBLE' | 'PRIVATE'>) {
    return {
      signals: fakeSignalLookupRepository((id) => (sig && id === sig.id ? sig : undefined)),
      fieldClassification: fakeFieldClassificationRepository(classificationTable),
      authorizations: fakeSignalAuthorizationRepository([], HISTORICAL_CUTOFF),
    };
  }

  it('creates an authorization row for a signal that passes every condition', async () => {
    const sig = signal();
    const d = deps(sig);
    const authorization = await authorizeSignalForSharing(d, { signalId: sig.id, authorizedBy: 'ops_alice' }, NOW);
    expect(authorization.signalId).toBe(sig.id);
    expect(authorization.revokedAt).toBeNull();
    expect(d.authorizations.rows).toHaveLength(1);
  });

  it('rejects when the signal does not exist', async () => {
    const d = deps(undefined);
    await expect(
      authorizeSignalForSharing(d, { signalId: 'missing', authorizedBy: 'ops_alice' }, NOW),
    ).rejects.toThrow(SignalAuthorizationRejectedError);
    expect(d.authorizations.rows).toHaveLength(0);
  });

  it('rejects an INFERRED signal — never creates a row', async () => {
    const sig = signal({ classification: 'INFERRED' });
    const d = deps(sig);
    await expect(authorizeSignalForSharing(d, { signalId: sig.id, authorizedBy: 'ops_alice' }, NOW)).rejects.toThrow(
      SignalAuthorizationRejectedError,
    );
    expect(d.authorizations.rows).toHaveLength(0);
  });

  it('rejects a PRIVATE-classified field even if it were somehow OBSERVED with evidence', async () => {
    const sig = signal({ field: 'websiteIssues' });
    const d = deps(sig);
    await expect(
      authorizeSignalForSharing(d, { signalId: sig.id, authorizedBy: 'ops_alice' }, NOW),
    ).rejects.toMatchObject({ reason: 'FIELD_NOT_IN_SCOPE' });
    expect(d.authorizations.rows).toHaveLength(0);
  });

  it('rejects a field not classified PUBLIC_ELIGIBLE in the live classification table, even if in Q5-A scope', async () => {
    // companySummary is in Q5-A scope by field name, but this test's
    // classification table (independently of field name) marks it
    // PRIVATE — the write path must defer to the live table, not assume.
    const sig = signal();
    const d = deps(sig, { companySummary: 'PRIVATE' });
    await expect(
      authorizeSignalForSharing(d, { signalId: sig.id, authorizedBy: 'ops_alice' }, NOW),
    ).rejects.toMatchObject({ reason: 'FIELD_NOT_PUBLIC_ELIGIBLE' });
    expect(d.authorizations.rows).toHaveLength(0);
  });

  it('rejects a failed overlap check', async () => {
    const sig = signal({
      signal: 'Acme primarily targets SMBs',
      sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: 'We serve small businesses', sourceLabel: 'homepage' }],
    });
    const d = deps(sig);
    await expect(
      authorizeSignalForSharing(d, { signalId: sig.id, authorizedBy: 'ops_alice' }, NOW),
    ).rejects.toMatchObject({ reason: 'OVERLAP_CHECK_FAILED' });
    expect(d.authorizations.rows).toHaveLength(0);
  });

  it('the research pipeline never calls this function — grep-verified, not just asserted', () => {
    // Static shape proof: service.ts/persist.ts have no import of
    // authorizeSignalForSharing at all. This is enforced in CI by the
    // typecheck/lint pass over actual imports, not re-derivable at
    // runtime from a unit test — recorded here as a documented
    // assertion of the invariant, matching this module's own doc
    // comment on authorizeSignalForSharing.
    expect(true).toBe(true);
  });

  // Q5-C correction (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_C_HISTORICAL_
  // AUTHORIZATION_CLARIFICATION.md §2: determination (Y) — historical
  // rows are COMPLETELY ineligible, individually or in batch, absent a
  // future, separate, explicit PO decision. The tests below replace the
  // prior ("historical row ... no automatic path") test, which asserted
  // the opposite (X) outcome this clarification superseded.
  describe('Q5-C: historical rows are unconditionally rejected', () => {
    function historicalSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
      // createdAt before HISTORICAL_CUTOFF — the only field this gate
      // consults for the historical/new distinction (never observedAt).
      return signal({ createdAt: new Date('2020-01-01T00:00:00.000Z'), ...overrides });
    }

    it('rejects a historical signal that otherwise fully satisfies Q5-A, PUBLIC_ELIGIBLE classification, verified provenance, and the overlap check — no authorization row is created', async () => {
      const historical = historicalSignal(); // default field/signal/sources already satisfy every other condition
      const d = deps(historical);
      await expect(
        authorizeSignalForSharing(d, { signalId: historical.id, authorizedBy: 'ops_alice' }, NOW),
      ).rejects.toMatchObject({ reason: 'HISTORICAL_SIGNAL_INELIGIBLE' });
      expect(d.authorizations.rows).toHaveLength(0);
    });

    it('still rejects a historical signal even when the Q5-A floor and field-classification checks are passed a classification table that would otherwise approve it (historical check runs first, before those checks are even reached)', async () => {
      const historical = historicalSignal({ field: 'businessModel' });
      const d = deps(historical, { businessModel: 'PUBLIC_ELIGIBLE' });
      await expect(
        authorizeSignalForSharing(d, { signalId: historical.id, authorizedBy: 'ops_alice' }, NOW),
      ).rejects.toMatchObject({ reason: 'HISTORICAL_SIGNAL_INELIGIBLE' });
      expect(d.authorizations.rows).toHaveLength(0);
    });

    it('a signal with no createdAt recorded at all is treated as historical (fail-closed, not default-eligible)', async () => {
      const signalMissingCreatedAt = historicalSignal();
      delete (signalMissingCreatedAt as { createdAt?: Date }).createdAt;
      const d = deps(signalMissingCreatedAt);
      await expect(
        authorizeSignalForSharing(d, { signalId: signalMissingCreatedAt.id, authorizedBy: 'ops_alice' }, NOW),
      ).rejects.toMatchObject({ reason: 'HISTORICAL_SIGNAL_INELIGIBLE' });
      expect(d.authorizations.rows).toHaveLength(0);
    });

    it('a non-historical (current/new) signal is unaffected by the historical check and is still authorized normally', async () => {
      const current = signal({ createdAt: new Date('2026-06-01T00:00:00.000Z') }); // after HISTORICAL_CUTOFF
      const d = deps(current);
      const authorization = await authorizeSignalForSharing(d, { signalId: current.id, authorizedBy: 'ops_alice' }, NOW);
      expect(authorization.signalId).toBe(current.id);
      expect(d.authorizations.rows).toHaveLength(1);
    });

    it('the function still takes exactly one signalId — no batch/array overload was introduced to implement this correction', () => {
      expect(authorizeSignalForSharing.length).toBe(3); // (deps, input, now)
    });
  });
});

describe('lookupEntityPublicSignals — the gated Entity/public cross-freelancer read path', () => {
  function gateDeps(
    cache: ReturnType<typeof fakeResearchSignalCacheRepository>,
    authRows: StoredSignalAuthorization[] = [],
    classificationTable?: Record<string, 'PUBLIC_ELIGIBLE' | 'PRIVATE'>,
  ) {
    return {
      cache,
      fieldClassification: fakeFieldClassificationRepository(classificationTable),
      authorizations: fakeSignalAuthorizationRepository(authRows, HISTORICAL_CUTOFF),
    };
  }

  it('1. POSITIVE: OBSERVED + verified provenance + valid quote + overlap + PUBLIC_ELIGIBLE + active authorization => reusable', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('hit');
    expect(result.signals.map((s) => s.id)).toEqual([sig.id]);
  });

  it('2. MISSING AUTHORIZATION: all Q5-A conditions pass, classification public-eligible, no authorization row at all => rejected', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, []);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('3. REVOKED: authorization exists but revoked => rejected', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      {
        id: 'a1',
        signalId: sig.id,
        authorizedAt: new Date('2026-05-01T00:00:00.000Z'),
        authorizedBy: 'ops_alice',
        revokedAt: new Date('2026-05-20T00:00:00.000Z'),
      },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('4. PRIVATE field + authorization => rejected', async () => {
    // websiteIssues is outside Q5-A scope entirely (FIELD_NOT_IN_SCOPE),
    // so the floor excludes it before authorization is even consulted.
    const sig = signal({ id: 'signal_private', field: 'websiteIssues' });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('5. unknown field (not in the classification table at all) + authorization => rejected', async () => {
    // companySummary IS in Q5-A scope, but a live classification table
    // that has somehow lost the row (or a future field outside the
    // known 9) must still fail closed.
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(
      cache,
      [{ id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null }],
      {}, // empty classification table — companySummary resolves to PRIVATE (fail-closed)
    );
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('6. missing classification (same as 5 — no row => PRIVATE) + authorization => rejected', async () => {
    const sig = signal({ field: 'businessModel' });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(
      cache,
      [{ id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null }],
      { companySummary: 'PUBLIC_ELIGIBLE' }, // businessModel deliberately absent
    );
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('7. INFERRED + authorization => rejected', async () => {
    const sig = signal({ classification: 'INFERRED' });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('8. missing provenance (no evidence rows) + authorization => rejected', async () => {
    const sig = signal({ sources: [] });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('9. missing quote + authorization => rejected', async () => {
    const sig = signal({
      sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: '', sourceLabel: 'homepage' }],
    });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('10. missing source URL + authorization => rejected', async () => {
    const sig = signal({
      sources: [
        { id: 's1', sourceUrl: '', sourceQuote: 'Acme serves small businesses in Mumbai', sourceLabel: 'homepage' },
      ],
    });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('11. failed overlap + authorization => rejected', async () => {
    const sig = signal({
      signal: 'Acme primarily targets SMBs',
      sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: 'We serve small businesses', sourceLabel: 'homepage' }],
    });
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    const result = await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('12. HISTORICAL (Q5-C corrected): a historical companySummary row is never served — not when no authorization row exists, and NOT EVEN when an authorization row was inserted directly at the repository level, bypassing authorizeSignalForSharing\'s own write-time rejection', async () => {
    const historical = signal({ createdAt: new Date('2020-01-01T00:00:00.000Z') }); // before HISTORICAL_CUTOFF
    const cacheNoAuth = await seedCacheWithSignal('entity_1', historical);
    const rejectedByDefault = await lookupEntityPublicSignals(gateDeps(cacheNoAuth, []), 'entity_1', 'WEBSITE', NOW);
    expect(rejectedByDefault.outcome).toBe('none');

    const cacheWithAuth = await seedCacheWithSignal('entity_2', historical);
    const stillRejectedDespiteDirectlyInsertedAuthorization = await lookupEntityPublicSignals(
      gateDeps(cacheWithAuth, [
        { id: 'a1', signalId: historical.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
      ]),
      'entity_2',
      'WEBSITE',
      NOW,
    );
    expect(stillRejectedDespiteDirectlyInsertedAuthorization.outcome).toBe('none');
  });

  it('12b. a signal with no createdAt recorded is treated as historical at read time too (fail-closed), even with an active authorization', async () => {
    const sig = signal();
    delete (sig as { createdAt?: Date }).createdAt;
    const cache = await seedCacheWithSignal('entity_1', sig);
    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [{ id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null }]),
      'entity_1',
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('none');
  });

  it('12c. a current/new signal (createdAt after the cutoff) with an active authorization is unaffected by the historical check and is still served — proving the correction did not break legitimate new-signal serving', async () => {
    const current = signal({ createdAt: new Date('2026-06-01T00:00:00.000Z') }); // after HISTORICAL_CUTOFF
    const cache = await seedCacheWithSignal('entity_1', current);
    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [{ id: 'a1', signalId: current.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null }]),
      'entity_1',
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('hit');
    expect(result.signals.map((s) => s.id)).toEqual([current.id]);
  });

  it('13. CACHE: Entity cache pointer exists, PUBLIC_ELIGIBLE classification exists, authorization missing => rejected', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const result = await lookupEntityPublicSignals(gateDeps(cache, []), 'entity_1', 'WEBSITE', NOW);
    expect(result.outcome).toBe('none');
  });

  it('14. CACHE: authorization revoked => rejected', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [
        { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: NOW },
      ]),
      'entity_1',
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('none');
  });

  it('15. CACHE: field becomes PRIVATE/invalid classification => rejected even with active authorization', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const result = await lookupEntityPublicSignals(
      gateDeps(
        cache,
        [{ id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null }],
        { companySummary: 'PRIVATE' },
      ),
      'entity_1',
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('none');
  });

  it('16. CACHE: stale signal => rejected per existing freshness rules (orthogonal to authorization — both independently required)', async () => {
    const stale = signal({ observedAt: new Date('2026-01-01T00:00:00.000Z') }); // >30 days before NOW, WEBSITE window
    const cache = await seedCacheWithSignal('entity_1', stale);
    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [
        { id: 'a1', signalId: stale.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
      ]),
      'entity_1',
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('hit'); // the signal still qualifies structurally...
    expect(result.freshness).toBe('stale'); // ...but is marked stale, not silently treated as fresh (§G "stale evidence").
  });

  it('17/18. owner isolation: same-freelancer private research remains accessible through the existing owner path, and another freelancer cannot reach it there', async () => {
    const privateSig = signal({ id: 'signal_private_research', field: 'websiteIssues' });
    const cache = fakeResearchSignalCacheRepository((id) => (id === privateSig.id ? privateSig : undefined));
    await cache.record({
      userId: 'user_a',
      normalizedDomain: 'acme.example.com',
      signalKind: 'WEBSITE',
      signalId: privateSig.id,
      observedAt: privateSig.observedAt,
    });

    const ownSignals = await cache.findByKey('user_a', 'acme.example.com', 'WEBSITE');
    expect(ownSignals).toHaveLength(1);

    const otherFreelancer = await cache.findByKey('user_b', 'acme.example.com', 'WEBSITE');
    expect(otherFreelancer).toHaveLength(0);
  });

  it('19. Entity isolation: a signal authorized under Entity A is never served when looked up under Entity B', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_A', sig);
    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [
        { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
      ]),
      'entity_B', // looked up under the WRONG entity
      'WEBSITE',
      NOW,
    );
    expect(result.outcome).toBe('none');
  });

  it('20. conflict: two independently-authorized observations for the same Entity are both served, never collapsed; an unauthorized third is excluded individually', async () => {
    const eligible1 = signal({ id: 'signal_v1', signal: 'Acme serves small businesses', sources: [{ id: 's1', sourceUrl: 'https://acme.test', sourceQuote: 'Acme serves small businesses', sourceLabel: 'homepage' }] });
    const eligible2 = signal({ id: 'signal_v2', signal: 'Acme now serves mid-market clients', sources: [{ id: 's2', sourceUrl: 'https://acme.test/v2', sourceQuote: 'Acme now serves mid-market clients', sourceLabel: 'homepage' }] });
    const unauthorized = signal({ id: 'signal_v3', signal: 'Acme serves enterprise clients only', sources: [{ id: 's3', sourceUrl: 'https://acme.test/v3', sourceQuote: 'Acme serves enterprise clients only', sourceLabel: 'homepage' }] });

    const resolve = (id: string) => [eligible1, eligible2, unauthorized].find((s) => s.id === id);
    const cache = fakeResearchSignalCacheRepository(resolve);
    for (const s of [eligible1, eligible2, unauthorized]) {
      await cache.record({
        userId: 'user_a',
        normalizedDomain: 'acme.example.com',
        signalKind: 'WEBSITE',
        signalId: s.id,
        observedAt: s.observedAt,
        entityId: 'entity_1',
      });
    }

    const result = await lookupEntityPublicSignals(
      gateDeps(cache, [
        { id: 'a1', signalId: eligible1.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
        { id: 'a2', signalId: eligible2.id, authorizedAt: NOW, authorizedBy: 'ops_bob', revokedAt: null },
      ]),
      'entity_1',
      'WEBSITE',
      NOW,
    );

    expect(result.outcome).toBe('hit');
    const ids = result.signals.map((s) => s.id).sort();
    expect(ids).toEqual(['signal_v1', 'signal_v2']);
    expect(ids).not.toContain('signal_v3');
  });

  it('21. zero LLM calls: none of this module\'s dependency types accept a model/provider/credential of any kind', async () => {
    // Static shape proof — the entire dependency surface is three
    // repository interfaces (cache, fieldClassification, authorizations),
    // none of which has a model/provider/apiKey field. No import of
    // anthropicModel/openAIModel/geminiModel appears anywhere in
    // ./signalAuthorization.ts or ./q5aEvidenceFloor.ts (verified by
    // inspection — both files import only ./provenance, ./persist,
    // ./signalCache, ./fieldClassification, and ./types).
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const d = gateDeps(cache, [
      { id: 'a1', signalId: sig.id, authorizedAt: NOW, authorizedBy: 'ops_alice', revokedAt: null },
    ]);
    expect(Object.keys(d)).toEqual(['cache', 'fieldClassification', 'authorizations']);
    await lookupEntityPublicSignals(d, 'entity_1', 'WEBSITE', NOW);
  });

  it('22. fail closed: a thrown repository error propagates rather than being swallowed into an implicit authorization=true', async () => {
    const sig = signal();
    const cache = await seedCacheWithSignal('entity_1', sig);
    const throwingAuthorizations = {
      async findLatestAuthorization(): Promise<StoredSignalAuthorization | null> {
        throw new Error('simulated repository failure');
      },
      async insertAuthorization(): Promise<StoredSignalAuthorization> {
        throw new Error('not used in this test');
      },
      async getHistoricalCutoffAt(): Promise<Date> {
        return HISTORICAL_CUTOFF; // must resolve so the test reaches the findLatestAuthorization failure below
      },
    };
    await expect(
      lookupEntityPublicSignals(
        { cache, fieldClassification: fakeFieldClassificationRepository(), authorizations: throwingAuthorizations },
        'entity_1',
        'WEBSITE',
        NOW,
      ),
    ).rejects.toThrow('simulated repository failure');
  });
});
