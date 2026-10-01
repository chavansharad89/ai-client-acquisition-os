import type { ProspectInput } from '@acos/core-acquisition';
import type {
  CompanyRepository,
  ProspectRepository,
  StoredCompany,
  StoredProspect,
} from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import type { SearchRepository, StoredSearch } from '@acos/core-search';
import { describe, expect, it } from 'vitest';

import { isF1CompleteSegmentDetermination } from './categoryPlausibility';
import { toNewResearchSignals } from './mapping';
import type { ResearchProviderInput } from './provider';
import { leadResearchSchema, type LeadResearch } from './schema';
import { listResearchSignals, runResearch, scoreResearchedProspect } from './service';
import { ResearchProspectNotFoundError, RunResearchValidationError } from './signalErrors';
import {
  fakeCategoryPlausibilityRepository,
  fakeResearchProvider,
  fakeResearchSignalRepository,
} from './testSupport';

/**
 * A minimal local fake of @acos/core-search's SearchRepository — same
 * "just enough for these tests" convention as fakeCompanyRepository/
 * fakeProspectRepository below. Only `getById` is exercised: Research
 * resolves the owning Search purely to read its immutable
 * `parameters.targetCustomer` (Path 2, D8 Candidate 2).
 */
function fakeSearchRepository(seed: StoredSearch[] = []): SearchRepository {
  const rows = [...seed];
  return {
    async create() {
      throw new Error('not used by these tests');
    },
    async findByIdempotencyKey() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async list() {
      throw new Error('not used by these tests');
    },
    async transition() {
      throw new Error('not used by these tests');
    },
    async claimNextPending() {
      throw new Error('not used by these tests');
    },
    async releaseExpiredLeases() {
      throw new Error('not used by these tests');
    },
    async completeClaimed() {
      throw new Error('not used by these tests');
    },
    async recordAttemptFailure() {
      throw new Error('not used by these tests');
    },
  };
}

function seedSearch(overrides: Partial<StoredSearch> = {}): StoredSearch {
  return {
    id: 'search_1',
    userId: 'user_a',
    serviceProfileId: 'profile_1',
    status: 'RUNNING',
    parameters: {
      service: 'AI content system',
      targetCustomer: 'Restaurants, Cafes; Boutique Retailers & E-commerce Brands',
      geography: 'Bengaluru',
      minProjectValuePaise: 5_000_00,
      triggers: [],
      keywords: [],
      rationale: '',
    },
    attempts: 1,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

// UNIT tests (fakes only — see
// tests/integration/research.integration.test.ts for the real-Postgres
// proof of the same ownership boundary and the migration 0016 schema).

function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
  return {
    async createUser() {
      throw new Error('not used by these tests');
    },
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
  };
}

function sessionFor(rawToken: string, userId: string): Record<string, StoredSessionToken> {
  return {
    [hashAccessToken(rawToken)]: {
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  };
}

/**
 * A minimal local fake of @acos/core-discovery's CompanyRepository — not
 * that package's own fake (unexported, internal to its src/), just
 * enough behaviour for this package's tests, mirroring the same
 * convention @acos/core-discovery's own service.test.ts uses for
 * @acos/core-search's SearchRepository.
 */
function fakeCompanyRepository(seed: StoredCompany[] = []): CompanyRepository {
  const rows = [...seed];
  return {
    async findOrCreateByDomain() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

/** A minimal local fake of @acos/core-discovery's ProspectRepository — same convention as above. */
function fakeProspectRepository(seed: StoredProspect[] = []): ProspectRepository {
  const rows = [...seed];
  return {
    async findOrCreate() {
      throw new Error('not used by these tests');
    },
    async listBySearch() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

function seedCompany(overrides: Partial<StoredCompany> = {}): StoredCompany {
  return {
    id: 'company_1',
    userId: 'user_a',
    name: 'Acme Co',
    normalizedDomain: 'acme.example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function seedProspect(overrides: Partial<StoredProspect> = {}): StoredProspect {
  return {
    id: 'prospect_1',
    userId: 'user_a',
    searchId: 'search_1',
    companyId: 'company_1',
    status: 'DISCOVERED',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const HOMEPAGE = { url: 'https://acme.test/about', label: 'homepage' };

const observed = (value: string) => ({
  classification: 'OBSERVED' as const,
  value,
  evidence: [{ quote: value, sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label }],
  basis: null,
  confidence: 90,
});
const unknown = () => ({
  classification: 'UNKNOWN' as const,
  value: null,
  evidence: [],
  basis: null,
  confidence: 0,
});

function sampleResearch(): LeadResearch {
  return leadResearchSchema.parse({
    companySummary: observed('Acme sells warehouse robotics'),
    businessModel: unknown(),
    targetCustomers: unknown(),
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 60,
    gaps: [],
  });
}

function deps(
  companies: StoredCompany[],
  prospects: StoredProspect[],
  searches: StoredSearch[] = [seedSearch()],
) {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
    ...sessionFor('entitlement-token', null as unknown as string),
  });
  return {
    identity,
    companies: fakeCompanyRepository(companies),
    prospects: fakeProspectRepository(prospects),
    searches: fakeSearchRepository(searches),
    signals: fakeResearchSignalRepository(),
    provider: fakeResearchProvider(sampleResearch()),
  };
}

describe('runResearch', () => {
  it("persists ResearchSignal rows for the caller's own Prospect, preserving classification and UNKNOWN", async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    const result = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    expect(result.prospectId).toBe('prospect_1');
    expect(result.superseded).toBe(0);
    expect(result.signals.length).toBe(toNewResearchSignals(sampleResearch()).length);
    const classifications = result.signals.map((s) => s.classification).sort();
    expect(classifications).toEqual(['OBSERVED', 'UNKNOWN', 'UNKNOWN'].sort());
  });

  it('a re-run supersedes the prior signals instead of deleting them', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    const first = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });
    const second = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    expect(second.superseded).toBe(first.signals.length);
    expect(d.signals.rows).toHaveLength(first.signals.length + second.signals.length);
    for (const row of d.signals.rows.filter((r) => first.signals.some((s) => s.id === r.id))) {
      expect(row.supersededAt).not.toBeNull();
    }
  });

  it('rejects an unauthenticated call before touching any repository', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    await expect(runResearch(d, null, { prospectId: 'prospect_1' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(d.signals.rows).toHaveLength(0);
  });

  it('an entitlement-only token (user_id IS NULL) is rejected, not authenticated as a session', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    await expect(
      runResearch(d, 'entitlement-token', { prospectId: 'prospect_1' }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('a Prospect owned by another user is treated as not found', async () => {
    const d = deps([seedCompany({ userId: 'user_b' })], [seedProspect({ userId: 'user_b' })]);

    await expect(runResearch(d, 'token-a', { prospectId: 'prospect_1' })).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });

  it("an unknown prospectId is rejected the same way as another user's prospect", async () => {
    const d = deps([], []);

    await expect(
      runResearch(d, 'token-a', { prospectId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
  });

  it('rejects a missing prospectId before any repository call', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    await expect(runResearch(d, 'token-a', { prospectId: '' })).rejects.toBeInstanceOf(
      RunResearchValidationError,
    );
  });

  it('the fake provider is deterministic — same input, same result, no external call', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    const a = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });
    const b = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const shape = (signals: typeof a.signals) =>
      signals.map((s) => ({ field: s.field, classification: s.classification, signal: s.signal }));
    expect(shape(a.signals)).toEqual(shape(b.signals));
  });
});

describe('runResearch — A11-P1 M-2 source capture', () => {
  const FETCHED_AT = new Date('2026-09-26T00:00:00.000Z');
  const SUPPLIED = [
    { label: 'Homepage', url: 'https://acme.example.com', text: 'first exact  model-seen text' },
    { label: 'About', url: 'https://acme.example.com/about', text: 'second exact model-seen text' },
  ];

  function capturingProvider(calls: number) {
    return {
      async research(input: ResearchProviderInput) {
        for (let i = 0; i < calls; i += 1) {
          await input.onSourceDocumentsSupplied?.({
            documents: SUPPLIED,
            fetchedAt: FETCHED_AT,
            extractionMethod: 'test-method',
          });
        }
        return sampleResearch();
      },
    };
  }

  it('T1/T3/T5: persists every supplied document, unchanged and in order, with the saved determination', async () => {
    const categoryPlausibility = fakeCategoryPlausibilityRepository();
    const d = { ...deps([seedCompany()], [seedProspect()]), provider: capturingProvider(1), categoryPlausibility };

    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const [row] = categoryPlausibility.rows;
    expect(row).toMatchObject({ searchId: 'search_1', prospectId: 'prospect_1' });
    expect(categoryPlausibility.sourceDocumentsByDeterminationId.get(row!.id)).toEqual(
      SUPPLIED.map((doc) => ({ ...doc, fetchedAt: FETCHED_AT, extractionMethod: 'test-method' })),
    );
  });

  it('a fallback chain reporting the same documents twice still persists each document once', async () => {
    const categoryPlausibility = fakeCategoryPlausibilityRepository();
    const d = { ...deps([seedCompany()], [seedProspect()]), provider: capturingProvider(2), categoryPlausibility };

    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const saved = categoryPlausibility.sourceDocumentsByDeterminationId.get(categoryPlausibility.rows[0]!.id);
    expect(saved?.map((doc) => doc.text)).toEqual(SUPPLIED.map((doc) => doc.text));
  });

  it('T7: a provider that supplies no capture still persists the determination exactly as before, with no sources', async () => {
    const categoryPlausibility = fakeCategoryPlausibilityRepository();
    const d = { ...deps([seedCompany()], [seedProspect()]), categoryPlausibility };

    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    expect(categoryPlausibility.rows).toHaveLength(1);
    expect(categoryPlausibility.sourceDocumentsByDeterminationId.get(categoryPlausibility.rows[0]!.id)).toEqual([]);
  });
});

describe('runResearch — F-1 segment evidence fields', () => {
  it('persists confidence, basis and classification on every segment of a new determination', async () => {
    const categoryPlausibility = fakeCategoryPlausibilityRepository();
    const research = leadResearchSchema.parse({
      ...sampleResearch(),
      categoryPlausibility: [
        {
          fit: 'MATCH',
          rationale: 'the homepage says they serve restaurants',
          evidence: [{ quote: 'Acme sells warehouse robotics', sourceUrl: 'https://acme.test', sourceLabel: 'Homepage' }],
          confidence: 85,
        },
        { fit: 'UNKNOWN', rationale: 'no page names retail customers', evidence: [], confidence: 0 },
      ],
    });
    const d = {
      ...deps([seedCompany()], [seedProspect()]),
      provider: { research: async () => research },
      categoryPlausibility,
    };

    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const [row] = categoryPlausibility.rows;
    expect(row!.segmentResults).toMatchObject([
      { fit: 'MATCH', confidence: 85, basis: 'CITED_SOURCE_EVIDENCE', classification: 'OBSERVED' },
      { fit: 'UNKNOWN', confidence: 0, basis: 'MODEL_REPORTED_INSUFFICIENT_EVIDENCE', classification: 'UNKNOWN', rationale: 'no page names retail customers' },
    ]);
    expect(row!.segmentResults.every(isF1CompleteSegmentDetermination)).toBe(true);
    expect(row!.aggregateResult).toBe('MATCH');
  });

  it('labels an empty model response NO_MODEL_VERDICT for every segment', async () => {
    const categoryPlausibility = fakeCategoryPlausibilityRepository();
    const d = { ...deps([seedCompany()], [seedProspect()]), categoryPlausibility };

    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const [row] = categoryPlausibility.rows;
    expect(row!.segmentResults.length).toBeGreaterThan(0);
    for (const segment of row!.segmentResults) {
      expect(segment).toMatchObject({ fit: 'UNKNOWN', rationale: null, confidence: 0, basis: 'NO_MODEL_VERDICT', classification: 'UNKNOWN' });
    }
    expect(row!.aggregateResult).toBe('UNKNOWN');
  });
});

describe('listResearchSignals', () => {
  it("returns only the caller's own currently-active signals", async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const signals = await listResearchSignals(d, 'token-a', 'prospect_1');
    expect(signals.length).toBeGreaterThan(0);
    for (const s of signals) expect(s.supersededAt).toBeNull();
  });

  it("a different authenticated user cannot list another user's signals — treated as not found", async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    await expect(listResearchSignals(d, 'token-b', 'prospect_1')).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });

  it('rejects an unauthenticated call', async () => {
    const d = deps([seedCompany()], [seedProspect()]);

    await expect(listResearchSignals(d, null, 'prospect_1')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});

// ============================== scoreResearchedProspect ================
// Phase 8 — scoring foundation: adapts persisted ResearchSignal rows onto
// @acos/core-acquisition's unmodified scoreProspect().

const unestablished = (): ProspectInput['icp'] => ({
  industryMatch: { value: null, basis: 'UNKNOWN' },
  sizeMatch: { value: null, basis: 'UNKNOWN' },
  geoMatch: { value: null, basis: 'UNKNOWN' },
});

function restOfInput(overrides: Partial<Omit<ProspectInput, 'signals'>> = {}) {
  return {
    icp: unestablished(),
    abilityToPay: { value: null, basis: 'UNKNOWN' as const },
    urgency: { value: null, basis: 'UNKNOWN' as const },
    serviceFit: { value: null, basis: 'UNKNOWN' as const },
    contact: { hasEmail: true, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
    ...overrides,
  };
}

describe('scoreResearchedProspect', () => {
  it("scores the caller's own Prospect from its persisted signals, unchanged shape", async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const result = await scoreResearchedProspect(d, 'token-a', 'prospect_1', restOfInput());

    expect(result.score.factors.map((f) => f.factor)).toEqual([
      'icpFit',
      'visibleProblem',
      'abilityToPay',
      'urgency',
      'serviceFit',
      'evidenceQuality',
      'contactability',
    ]);
    expect(result.score.score).toBeGreaterThanOrEqual(0);
    expect(result.score.score).toBeLessThanOrEqual(100);
  });

  it('counts UNKNOWN persisted signals rather than silently discarding them', async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    const research = await runResearch(d, 'token-a', { prospectId: 'prospect_1' });
    const expectedUnknown = research.signals.filter((s) => s.classification === 'UNKNOWN').length;
    expect(expectedUnknown).toBeGreaterThan(0);

    const result = await scoreResearchedProspect(d, 'token-a', 'prospect_1', restOfInput());

    expect(result.unknownSignalCount).toBe(expectedUnknown);
  });

  it('is deterministic — repeated calls score the same', async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await scoreResearchedProspect(d, 'token-a', 'prospect_1', restOfInput(), now);
    const second = await scoreResearchedProspect(d, 'token-a', 'prospect_1', restOfInput(), now);

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
  });

  it('a Prospect owned by another user is treated as not found', async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    await expect(
      scoreResearchedProspect(d, 'token-b', 'prospect_1', restOfInput()),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
  });

  it('rejects an unauthenticated call', async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    await expect(
      scoreResearchedProspect(d, null, 'prospect_1', restOfInput()),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('a representative multi-signal Prospect scores using every live signal', async () => {
    const d = deps([seedCompany()], [seedProspect()]);
    await runResearch(d, 'token-a', { prospectId: 'prospect_1' });

    const result = await scoreResearchedProspect(
      d,
      'token-a',
      'prospect_1',
      restOfInput({
        icp: {
          industryMatch: { value: true, basis: 'OBSERVED', note: 'stated on their site' },
          sizeMatch: { value: true, basis: 'INFERRED' },
          geoMatch: { value: null, basis: 'UNKNOWN' },
        },
        abilityToPay: { value: 'moderate', basis: 'INFERRED' },
        urgency: { value: 'this-quarter', basis: 'OBSERVED' },
        serviceFit: { value: 70, basis: 'OBSERVED' },
      }),
    );

    const visibleProblem = result.score.factors.find((f) => f.factor === 'visibleProblem')!;
    // companySummary was OBSERVED confidence 90 -> feeds visibleProblem as
    // a live signal via ./scoringAdapter, unchanged from raw confidence.
    expect(visibleProblem.basis).toBe('OBSERVED');
    expect(visibleProblem.points).toBeGreaterThan(0);
  });
});
