import { hashAccessToken } from '@acos/core-entitlements';
import { UnauthenticatedError, type IdentityRepository, type StoredSessionToken } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository, type StoredOpportunity } from '@acos/core-opportunity';
import type { PersonalizationRepository, StoredPersonalization } from '@acos/core-personalization';
import { describe, expect, it } from 'vitest';

import { GENERATOR_VERSION } from './generator';
import {
  getOpportunityOutreachPreparation,
  prepareOpportunityOutreach,
  prepareOutreachForOwner,
  type OutreachPreparationDeps,
} from './service';
import { fakeOutreachPreparationRepository } from './testSupport';

// UNIT tests (fakes only — local fakes of other packages' repository
// interfaces, mirroring @acos/core-personalization's own service.test.ts
// convention: never that other package's unexported testSupport.ts). See
// tests/integration/outreach-preparation.integration.test.ts for the
// real-Postgres proof of the same ownership boundary and migration 0024
// schema.

const NOW = new Date('2026-09-01T00:00:00.000Z');

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

function fakePersonalizationRepository(seed: StoredPersonalization[] = []): PersonalizationRepository {
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

function seedOpportunity(overrides: Partial<StoredOpportunity> = {}): StoredOpportunity {
  return {
    id: 'opportunity_1',
    userId: 'user_a',
    prospectId: 'prospect_1',
    state: 'NEW',
    needDetected: true,
    offer: {
      service: 'Website development',
      rationale: 'They need a website refresh (needs a website redesign).',
      estimatedValuePaise: 15_000_000,
      fit: 80,
      basedOn: ['needs a website redesign'],
    },
    staleness: 'FRESH',
    stalenessComputedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function seedPersonalization(overrides: Partial<StoredPersonalization> = {}): StoredPersonalization {
  return {
    id: 'personalization_1',
    opportunityId: 'opportunity_1',
    prospectId: 'prospect_1',
    state: 'GENERATED',
    offerService: 'Website development',
    openingContext: 'Acme Co — your homepage shows needs a website redesign.',
    valueProposition: 'Website development is the recommended fit: they need a website refresh.',
    personalizationRationale: 'Generated from 1 qualifying research signal(s) (1 observed, 0 inferred).',
    evidence: [
      {
        signalId: 'signal_1',
        field: 'companySummary',
        kind: 'WEBSITE',
        classification: 'OBSERVED',
        signal: 'needs a website redesign',
        confidence: 88,
        basis: null,
      },
    ],
    generatorVersion: 'personalization-v1',
    generatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface Fixture {
  deps: OutreachPreparationDeps;
  outreachPreparations: ReturnType<typeof fakeOutreachPreparationRepository>;
}

function buildFixture(options: {
  opportunities?: StoredOpportunity[];
  personalizations?: StoredPersonalization[];
} = {}): Fixture {
  const opportunities = options.opportunities ?? [seedOpportunity()];
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const outreachPreparations = fakeOutreachPreparationRepository(opportunities);

  const deps: OutreachPreparationDeps = {
    identity,
    opportunities: fakeOpportunityRepository(opportunities),
    personalizations: fakePersonalizationRepository(options.personalizations ?? [seedPersonalization()]),
    outreachPreparations,
  };

  return { deps, outreachPreparations };
}

describe('prepareOpportunityOutreach / prepareOutreachForOwner', () => {
  it('R-55: generates and persists an Outreach Preparation draft for a Personalized Opportunity', async () => {
    const { deps } = buildFixture();

    const stored = await prepareOpportunityOutreach(deps, 'token-a', 'opportunity_1', NOW);

    expect(stored).not.toBeNull();
    expect(stored!.opportunityId).toBe('opportunity_1');
    expect(stored!.prospectId).toBe('prospect_1');
    expect(stored!.sourcePersonalizationId).toBe('personalization_1');
    expect(stored!.state).toBe('READY_FOR_REVIEW');
    expect(stored!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(stored!.generatedAt).toEqual(NOW);
    expect(stored!.subjectLine).toContain('Website development');
    expect(stored!.messageBody).toContain('Acme Co');
    expect(stored!.messageBody).toContain('needs a website redesign');
  });

  it('R-56: draft evidence is exactly the source Personalization\'s own evidence — no independent selection', async () => {
    const personalization = seedPersonalization();
    const { deps } = buildFixture({ personalizations: [personalization] });

    const stored = await prepareOutreachForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(stored!.evidence).toEqual(personalization.evidence);
  });

  it('R-59: no Personalization row yet produces no Outreach Preparation (must not run before Personalization)', async () => {
    const { deps, outreachPreparations } = buildFixture({ personalizations: [] });

    const result = await prepareOutreachForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(outreachPreparations.rows).toHaveLength(0);
  });

  it('never writes to Personalization or Opportunity — read-only consumer', async () => {
    const personalization = seedPersonalization();
    const { deps } = buildFixture({ personalizations: [personalization] });

    await prepareOutreachForOwner(deps, 'user_a', 'opportunity_1', NOW);

    const stillThere = await deps.personalizations.getByOpportunityId('user_a', 'opportunity_1');
    expect(stillThere).toEqual(personalization);
  });

  it('rejects an unauthenticated request before touching any repository', async () => {
    const { deps } = buildFixture();
    await expect(
      prepareOpportunityOutreach(deps, null, 'opportunity_1'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws OpportunityNotFoundError for an unknown opportunityId', async () => {
    const { deps } = buildFixture({ opportunities: [] });
    await expect(
      prepareOutreachForOwner(deps, 'user_a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different user's Opportunity is treated as not found — ownership isolation (R-60)", async () => {
    const { deps } = buildFixture({ opportunities: [seedOpportunity({ userId: 'user_a' })] });

    await expect(
      prepareOpportunityOutreach(deps, 'token-b', 'opportunity_1'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('R-57: idempotency — repeated preparation over an unchanged Personalization overwrites the same row, no duplicates', async () => {
    const { deps, outreachPreparations } = buildFixture();

    const first = await prepareOutreachForOwner(deps, 'user_a', 'opportunity_1', NOW);
    const later = new Date(NOW.getTime() + 60_000);
    const second = await prepareOutreachForOwner(deps, 'user_a', 'opportunity_1', later);

    expect(second!.id).toBe(first!.id);
    expect(second!.messageBody).toBe(first!.messageBody);
    expect(outreachPreparations.rows.filter((row) => row.opportunityId === 'opportunity_1')).toHaveLength(1);
  });
});

describe('getOpportunityOutreachPreparation', () => {
  it('returns the persisted draft for the caller', async () => {
    const { deps } = buildFixture();
    const stored = await prepareOpportunityOutreach(deps, 'token-a', 'opportunity_1', NOW);

    const fetched = await getOpportunityOutreachPreparation(deps, 'token-a', 'opportunity_1');
    expect(fetched).toEqual(stored);
  });

  it('returns null when the Opportunity has never had a draft prepared', async () => {
    const { deps } = buildFixture();
    await expect(
      getOpportunityOutreachPreparation(deps, 'token-a', 'opportunity_1'),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's draft — ownership isolation (R-60)", async () => {
    const { deps } = buildFixture();
    await prepareOpportunityOutreach(deps, 'token-a', 'opportunity_1', NOW);

    await expect(
      getOpportunityOutreachPreparation(deps, 'token-b', 'opportunity_1'),
    ).resolves.toBeNull();
  });
});
