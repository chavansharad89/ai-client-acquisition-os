import { hashAccessToken } from '@acos/core-entitlements';
import { UnauthenticatedError, type IdentityRepository, type StoredSessionToken } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository, type StoredOpportunity } from '@acos/core-opportunity';
import type { OutreachPreparationRepository, StoredOutreachPreparation } from '@acos/core-outreach-preparation';
import { describe, expect, it } from 'vitest';

import { GENERATOR_VERSION } from './generator';
import {
  getOpportunityFollowUpPreparation,
  prepareFollowUpForOwner,
  prepareOpportunityFollowUp,
  type FollowUpPreparationDeps,
} from './service';
import { fakeFollowUpPreparationRepository } from './testSupport';

// UNIT tests (fakes only — local fakes of other packages' repository
// interfaces, mirroring @acos/core-outreach-preparation's own
// service.test.ts convention: never that other package's unexported
// testSupport.ts). See
// tests/integration/followup-preparation.integration.test.ts for the
// real-Postgres proof of the same ownership boundary and migration 0025
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

function fakeOutreachPreparationRepository(
  seed: StoredOutreachPreparation[] = [],
): OutreachPreparationRepository {
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

function seedOutreachPreparation(
  overrides: Partial<StoredOutreachPreparation> = {},
): StoredOutreachPreparation {
  return {
    id: 'outreach_preparation_1',
    opportunityId: 'opportunity_1',
    prospectId: 'prospect_1',
    sourcePersonalizationId: 'personalization_1',
    state: 'READY_FOR_REVIEW',
    subjectLine: 'Website development — a quick note',
    messageBody: 'Acme Co — your homepage shows needs a website redesign. Would you be open to a short conversation about Website development?',
    callToAction: 'Would you be open to a short conversation about Website development?',
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
    generatorVersion: 'outreach-preparation-v1',
    generatedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface Fixture {
  deps: FollowUpPreparationDeps;
  followUpPreparations: ReturnType<typeof fakeFollowUpPreparationRepository>;
}

function buildFixture(options: {
  opportunities?: StoredOpportunity[];
  outreachPreparations?: StoredOutreachPreparation[];
} = {}): Fixture {
  const opportunities = options.opportunities ?? [seedOpportunity()];
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const followUpPreparations = fakeFollowUpPreparationRepository(opportunities);

  const deps: FollowUpPreparationDeps = {
    identity,
    opportunities: fakeOpportunityRepository(opportunities),
    outreachPreparations: fakeOutreachPreparationRepository(
      options.outreachPreparations ?? [seedOutreachPreparation()],
    ),
    followUpPreparations,
  };

  return { deps, followUpPreparations };
}

describe('prepareOpportunityFollowUp / prepareFollowUpForOwner', () => {
  it('R-64: generates and persists a Follow-Up Preparation draft for an Opportunity with an existing Outreach Preparation', async () => {
    const { deps } = buildFixture();

    const stored = await prepareOpportunityFollowUp(deps, 'token-a', 'opportunity_1', NOW);

    expect(stored).not.toBeNull();
    expect(stored!.opportunityId).toBe('opportunity_1');
    expect(stored!.prospectId).toBe('prospect_1');
    expect(stored!.sourceOutreachPreparationId).toBe('outreach_preparation_1');
    expect(stored!.state).toBe('READY_FOR_REVIEW');
    expect(stored!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(stored!.generatedAt).toEqual(NOW);
    expect(stored!.followUpContext).toContain('Website development');
    expect(stored!.followUpContent).toContain('Website development');
  });

  it('R-63: draft evidence is exactly the source Outreach Preparation\'s own evidence — no independent selection', async () => {
    const outreachPreparation = seedOutreachPreparation();
    const { deps } = buildFixture({ outreachPreparations: [outreachPreparation] });

    const stored = await prepareFollowUpForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(stored!.evidence).toEqual(outreachPreparation.evidence);
  });

  it('R-62: no Outreach Preparation row yet produces no Follow-Up Preparation (must not run before Outreach Preparation)', async () => {
    const { deps, followUpPreparations } = buildFixture({ outreachPreparations: [] });

    const result = await prepareFollowUpForOwner(deps, 'user_a', 'opportunity_1', NOW);

    expect(result).toBeNull();
    expect(followUpPreparations.rows).toHaveLength(0);
  });

  it('R-61/R-69: never writes to Outreach Preparation or Opportunity — read-only consumer', async () => {
    const outreachPreparation = seedOutreachPreparation();
    const { deps } = buildFixture({ outreachPreparations: [outreachPreparation] });

    await prepareFollowUpForOwner(deps, 'user_a', 'opportunity_1', NOW);

    const stillThere = await deps.outreachPreparations.getByOpportunityId('user_a', 'opportunity_1');
    expect(stillThere).toEqual(outreachPreparation);
  });

  it('rejects an unauthenticated request before touching any repository', async () => {
    const { deps } = buildFixture();
    await expect(
      prepareOpportunityFollowUp(deps, null, 'opportunity_1'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws OpportunityNotFoundError for an unknown opportunityId', async () => {
    const { deps } = buildFixture({ opportunities: [] });
    await expect(
      prepareFollowUpForOwner(deps, 'user_a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different user's Opportunity is treated as not found — ownership isolation", async () => {
    const { deps } = buildFixture({ opportunities: [seedOpportunity({ userId: 'user_a' })] });

    await expect(
      prepareOpportunityFollowUp(deps, 'token-b', 'opportunity_1'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('R-69: idempotency — repeated preparation over an unchanged Outreach Preparation overwrites the same row, no duplicates', async () => {
    const { deps, followUpPreparations } = buildFixture();

    const first = await prepareFollowUpForOwner(deps, 'user_a', 'opportunity_1', NOW);
    const later = new Date(NOW.getTime() + 60_000);
    const second = await prepareFollowUpForOwner(deps, 'user_a', 'opportunity_1', later);

    expect(second!.id).toBe(first!.id);
    expect(second!.followUpContent).toBe(first!.followUpContent);
    expect(
      followUpPreparations.rows.filter((row) => row.opportunityId === 'opportunity_1'),
    ).toHaveLength(1);
  });
});

describe('getOpportunityFollowUpPreparation', () => {
  it('returns the persisted draft for the caller', async () => {
    const { deps } = buildFixture();
    const stored = await prepareOpportunityFollowUp(deps, 'token-a', 'opportunity_1', NOW);

    const fetched = await getOpportunityFollowUpPreparation(deps, 'token-a', 'opportunity_1');
    expect(fetched).toEqual(stored);
  });

  it('returns null when the Opportunity has never had a draft prepared', async () => {
    const { deps } = buildFixture();
    await expect(
      getOpportunityFollowUpPreparation(deps, 'token-a', 'opportunity_1'),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's draft — ownership isolation", async () => {
    const { deps } = buildFixture();
    await prepareOpportunityFollowUp(deps, 'token-a', 'opportunity_1', NOW);

    await expect(
      getOpportunityFollowUpPreparation(deps, 'token-b', 'opportunity_1'),
    ).resolves.toBeNull();
  });
});
