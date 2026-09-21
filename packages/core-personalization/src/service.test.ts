import { hashAccessToken } from '@acos/core-entitlements';
import type { CompanyRepository, ProspectRepository, StoredCompany, StoredProspect } from '@acos/core-discovery';
import { UnauthenticatedError, type IdentityRepository, type StoredSessionToken } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository, type StoredOpportunity } from '@acos/core-opportunity';
import type { QualificationRepository, StoredQualification } from '@acos/core-qualification';
import type { ResearchSignalRepository, StoredResearchSignal } from '@acos/core-research';
import type { SearchRepository, StoredSearch } from '@acos/core-search';
import { describe, expect, it } from 'vitest';

import { GENERATOR_VERSION } from './generator';
import {
  evaluateOpportunityPersonalization,
  evaluatePersonalizationForOwner,
  getOpportunityPersonalization,
  type PersonalizationDeps,
} from './service';
import { fakePersonalizationRepository } from './testSupport';

// UNIT tests (fakes only — local fakes of other packages' repository
// interfaces, mirroring @acos/core-qualification's own service.test.ts
// convention: never that other package's unexported testSupport.ts). See
// tests/integration/personalization.integration.test.ts for the
// real-Postgres proof of the same ownership boundary and migration 0023
// schema.

const NOW = new Date('2026-08-01T00:00:00.000Z');

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

function fakeOpportunityRepository(seed: StoredOpportunity[] = []): OpportunityRepository {
  const rows = [...seed];
  return {
    async create() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async findByProspectId() {
      throw new Error('not used by these tests');
    },
    async list() {
      throw new Error('not used by these tests');
    },
    async updateStaleness() {
      throw new Error('not used by these tests');
    },
  };
}

function fakeQualificationRepository(seed: StoredQualification[] = []): QualificationRepository {
  const rows = [...seed];
  return {
    async upsert() {
      throw new Error('not used by these tests');
    },
    async getByOpportunityId(_userId: string, opportunityId: string) {
      return rows.find((row) => row.opportunityId === opportunityId) ?? null;
    },
    async listByUserId() {
      throw new Error('not used by these tests');
    },
  };
}

function fakeResearchSignalRepository(seed: StoredResearchSignal[] = []): ResearchSignalRepository {
  const rows = seed;
  return {
    async supersedePrevious() {
      throw new Error('not used by these tests');
    },
    async saveSignals() {
      throw new Error('not used by these tests');
    },
    async listByProspect(_userId: string, prospectId: string) {
      return rows.filter((row) => row.prospectId === prospectId && row.supersededAt === null);
    },
  };
}

function fakeProspectRepository(seed: StoredProspect[] = []): ProspectRepository {
  const rows = seed;
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

function fakeCompanyRepository(seed: StoredCompany[] = []): CompanyRepository {
  const rows = seed;
  return {
    async findOrCreateByDomain() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

function fakeSearchRepository(seed: StoredSearch[] = []): SearchRepository {
  const rows = seed;
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

function seedOpportunity(overrides: Partial<StoredOpportunity> = {}): StoredOpportunity {
  return {
    id: 'opportunity_1',
    userId: 'user_a',
    prospectId: 'prospect_1',
    state: 'NEW',
    needDetected: true,
    offer: {
      service: 'AI content system',
      rationale: 'They are hiring for content (hiring a content writer) — a system delivers it without a headcount.',
      estimatedValuePaise: 15_000_000,
      fit: 80,
      basedOn: ['hiring a content writer'],
    },
    staleness: 'FRESH',
    stalenessComputedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function seedQualification(overrides: Partial<StoredQualification> = {}): StoredQualification {
  return {
    id: 'qualification_1',
    opportunityId: 'opportunity_1',
    prospectId: 'prospect_1',
    state: 'QUALIFIED',
    criteria: [],
    evidenceSignalIds: ['signal_1'],
    evaluatorVersion: 'qualification-v1',
    evaluatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function seedSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    observedAt: NOW,
    supersededAt: null,
    sources: [],
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
    createdAt: NOW,
    ...overrides,
  };
}

function seedCompany(overrides: Partial<StoredCompany> = {}): StoredCompany {
  return {
    id: 'company_1',
    userId: 'user_a',
    name: 'Acme Co',
    normalizedDomain: 'acme.example.com',
    createdAt: NOW,
    ...overrides,
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
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 15_000_000,
      triggers: ['JOB_POST'],
      keywords: ['content', 'writer'],
      rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
    },
    attempts: 0,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface Fixture {
  deps: PersonalizationDeps;
  personalizations: ReturnType<typeof fakePersonalizationRepository>;
}

function buildFixture(options: {
  opportunities?: StoredOpportunity[];
  qualifications?: StoredQualification[];
  signals?: StoredResearchSignal[];
  prospects?: StoredProspect[];
  companies?: StoredCompany[];
  searches?: StoredSearch[];
} = {}): Fixture {
  const opportunities = options.opportunities ?? [seedOpportunity()];
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const personalizations = fakePersonalizationRepository(opportunities);

  const deps: PersonalizationDeps = {
    identity,
    opportunities: fakeOpportunityRepository(opportunities),
    qualifications: fakeQualificationRepository(options.qualifications ?? [seedQualification()]),
    signals: fakeResearchSignalRepository(options.signals ?? [seedSignal()]),
    prospects: fakeProspectRepository(options.prospects ?? [seedProspect()]),
    companies: fakeCompanyRepository(options.companies ?? [seedCompany()]),
    searches: fakeSearchRepository(options.searches ?? [seedSearch()]),
    personalizations,
  };

  return { deps, personalizations };
}

describe('evaluateOpportunityPersonalization / evaluatePersonalizationForOwner', () => {
  it('R-45: generates and persists a Personalization for a QUALIFIED Opportunity', async () => {
    const { deps } = buildFixture();

    const stored = await evaluateOpportunityPersonalization(deps, 'token-a', 'opportunity_1', NOW);

    expect(stored).not.toBeNull();
    expect(stored!.opportunityId).toBe('opportunity_1');
    expect(stored!.prospectId).toBe('prospect_1');
    expect(stored!.state).toBe('GENERATED');
    expect(stored!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(stored!.generatedAt).toEqual(NOW);
    expect(stored!.offerService).toBe('AI content system');
    expect(stored!.evidence.length).toBeGreaterThan(0);
    expect(stored!.openingContext).toContain('Acme Co');
  });

  it('R-42: NOT_QUALIFIED produces no personalization', async () => {
    const { deps, personalizations } = buildFixture({
      qualifications: [seedQualification({ state: 'NOT_QUALIFIED', criteria: [], evidenceSignalIds: [] })],
    });

    const result = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(personalizations.rows).toHaveLength(0);
  });

  it('R-42: INSUFFICIENT_EVIDENCE produces no personalization', async () => {
    const { deps, personalizations } = buildFixture({
      qualifications: [seedQualification({ state: 'INSUFFICIENT_EVIDENCE', evidenceSignalIds: [] })],
    });

    const result = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(personalizations.rows).toHaveLength(0);
  });

  it('R-42: a missing Qualification row produces no personalization', async () => {
    const { deps, personalizations } = buildFixture({ qualifications: [] });

    const result = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(personalizations.rows).toHaveLength(0);
  });

  it('R-42: never modifies Qualification — the qualification row is untouched after evaluation', async () => {
    const qualification = seedQualification();
    const { deps } = buildFixture({ qualifications: [qualification] });

    await evaluateOpportunityPersonalization(deps, 'token-a', 'opportunity_1', NOW);

    const stillThere = await deps.qualifications.getByOpportunityId('user_a', 'opportunity_1');
    expect(stillThere).toEqual(qualification);
  });

  it('rejects an unauthenticated request before touching any repository', async () => {
    const { deps } = buildFixture();
    await expect(
      evaluateOpportunityPersonalization(deps, null, 'opportunity_1'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws OpportunityNotFoundError for an unknown opportunityId', async () => {
    const { deps } = buildFixture({ opportunities: [] });
    await expect(
      evaluatePersonalizationForOwner(deps, 'user_a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different user's Opportunity is treated as not found — ownership isolation", async () => {
    const { deps } = buildFixture({ opportunities: [seedOpportunity({ userId: 'user_a' })] });

    await expect(
      evaluateOpportunityPersonalization(deps, 'token-b', 'opportunity_1'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('R-47: reuses the Opportunity\'s own offer — never a different service', async () => {
    const { deps } = buildFixture({
      opportunities: [
        seedOpportunity({
          offer: {
            service: 'Workflow automation',
            rationale: 'A recurring operational drag is exactly what automation removes.',
            estimatedValuePaise: 12_000_000,
            fit: 70,
            basedOn: ['hiring a content writer'],
          },
        }),
      ],
    });

    const stored = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(stored!.offerService).toBe('Workflow automation');
    expect(stored!.valueProposition).toContain('Workflow automation');
  });

  it('R-44: a defensive race guard — evidence superseded after Qualification ran yields no personalization', async () => {
    const { deps, personalizations } = buildFixture({
      signals: [seedSignal({ supersededAt: NOW })],
    });

    const result = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(personalizations.rows).toHaveLength(0);
  });

  it('R-49/R-50: idempotency — repeated evaluation of unchanged inputs overwrites the same row, no duplicates', async () => {
    const { deps, personalizations } = buildFixture();

    const first = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', NOW);
    const later = new Date(NOW.getTime() + 60_000);
    const second = await evaluatePersonalizationForOwner(deps, 'user_a', 'opportunity_1', later);

    expect(second!.id).toBe(first!.id);
    expect(second!.openingContext).toBe(first!.openingContext);
    expect(second!.valueProposition).toBe(first!.valueProposition);
    expect(personalizations.rows.filter((row) => row.opportunityId === 'opportunity_1')).toHaveLength(1);
  });
});

describe('getOpportunityPersonalization', () => {
  it('returns the persisted personalization for the caller', async () => {
    const { deps } = buildFixture();
    const stored = await evaluateOpportunityPersonalization(deps, 'token-a', 'opportunity_1', NOW);

    const fetched = await getOpportunityPersonalization(deps, 'token-a', 'opportunity_1');
    expect(fetched).toEqual(stored);
  });

  it('returns null when the Opportunity has never been personalized', async () => {
    const { deps } = buildFixture();
    await expect(
      getOpportunityPersonalization(deps, 'token-a', 'opportunity_1'),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's personalization result", async () => {
    const { deps } = buildFixture();
    await evaluateOpportunityPersonalization(deps, 'token-a', 'opportunity_1', NOW);

    await expect(
      getOpportunityPersonalization(deps, 'token-b', 'opportunity_1'),
    ).resolves.toBeNull();
  });
});
