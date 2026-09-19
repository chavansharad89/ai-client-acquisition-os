import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import {
  leadResearchSchema,
  ResearchProspectNotFoundError,
  type LeadResearch,
  type ModelResult,
  type ResearchInput,
} from '@acos/core-research';
import { describe, expect, it, vi } from 'vitest';

import { runMeteredResearch } from './meteredResearch';
import type { AiUsageDeps } from './service';
import { fakeAiUsageEventRepository } from './testSupport';

// UNIT tests (fakes only — see tests/integration/ai-usage.integration.test.ts
// for the real-Postgres proof).

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

const HOMEPAGE = {
  label: 'homepage',
  url: 'https://acme.test/about',
  text: 'Acme sells robotics.',
};

const researchInput: ResearchInput = {
  companyName: 'Acme Robotics',
  websiteUrl: 'https://acme.test',
  sourceDocuments: [HOMEPAGE],
};

function validResearch(): LeadResearch {
  const claim = {
    classification: 'OBSERVED' as const,
    value: 'Acme sells robotics',
    evidence: [
      { quote: 'Acme sells robotics.', sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label },
    ],
    basis: null,
    confidence: 90,
  };
  const unknown = {
    classification: 'UNKNOWN' as const,
    value: null,
    evidence: [],
    basis: null,
    confidence: 0,
  };
  return leadResearchSchema.parse({
    companySummary: claim,
    businessModel: unknown,
    targetCustomers: unknown,
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'AI content system', rationale: 'x', basedOn: [] },
    confidence: 70,
    gaps: [],
  });
}

function okResult(providerMessageId: string): ModelResult {
  return {
    kind: 'json',
    value: validResearch(),
    usage: {
      provider: 'anthropic',
      model: 'claude-opus-5',
      providerMessageId,
      inputTokens: 100,
      outputTokens: 50,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    },
  };
}

function deps(
  overrides: Partial<{
    sessions: Record<string, StoredSessionToken>;
    prospects: StoredProspect[];
  }> = {},
): AiUsageDeps {
  return {
    identity: fakeIdentity(overrides.sessions ?? {}),
    prospects: fakeProspectRepository(overrides.prospects ?? [seedProspect()]),
    usageEvents: fakeAiUsageEventRepository(),
  };
}

describe('runMeteredResearch', () => {
  it('meters the single invocation and returns the research outcome unchanged (AC16-01/AC16-02)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;
    const model = vi.fn().mockResolvedValue(okResult('msg_1'));

    const outcome = await runMeteredResearch(d, 'tok-a', 'prospect_1', model, researchInput);

    expect(outcome.attempts).toBe(1);
    expect(usageEvents.rows).toHaveLength(1);
    expect(usageEvents.rows[0]).toMatchObject({
      userId: 'user_a',
      prospectId: 'prospect_1',
      providerMessageId: 'msg_1',
      requestKind: 'initial',
    });
  });

  it('meters a repair round as its own event (AC16-03)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;
    const broken = {
      ...validResearch(),
      companySummary: { ...validResearch().companySummary, evidence: [] },
    };
    const model = vi
      .fn()
      .mockResolvedValueOnce({
        kind: 'json',
        value: broken,
        usage: {
          provider: 'anthropic',
          model: 'claude-opus-5',
          providerMessageId: 'msg_initial',
          inputTokens: 10,
          outputTokens: 5,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
        },
      })
      .mockResolvedValueOnce(okResult('msg_repair'));

    await runMeteredResearch(d, 'tok-a', 'prospect_1', model, researchInput, {
      sleep: async () => {},
    });

    expect(usageEvents.rows).toHaveLength(2);
    expect(usageEvents.rows.map((r) => r.requestKind)).toEqual(['initial', 'repair']);
  });

  it('checks Prospect ownership before spending a provider call (AC16-09) — the model is never invoked', async () => {
    const d = deps({
      sessions: { ...sessionFor('tok-a', 'user_a'), ...sessionFor('tok-b', 'user_b') },
      prospects: [seedProspect({ id: 'prospect_1', userId: 'user_a' })],
    });
    const model = vi.fn().mockResolvedValue(okResult('msg_1'));

    await expect(
      runMeteredResearch(d, 'tok-b', 'prospect_1', model, researchInput),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
    expect(model).not.toHaveBeenCalled();
  });

  it('rejects an unauthenticated caller before any provider call (AC16-10)', async () => {
    const d = deps();
    const model = vi.fn().mockResolvedValue(okResult('msg_1'));

    await expect(
      runMeteredResearch(d, null, 'prospect_1', model, researchInput),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(model).not.toHaveBeenCalled();
  });

  it('creates no metering record for a provider call that throws (AC16-07/D7)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;
    const model = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('rate limited'), { status: 429 }))
      .mockResolvedValueOnce(okResult('msg_after_retry'));

    await runMeteredResearch(d, 'tok-a', 'prospect_1', model, researchInput, {
      sleep: async () => {},
      random: () => 0.5,
    });

    expect(model).toHaveBeenCalledTimes(2);
    expect(usageEvents.rows).toHaveLength(1);
    expect(usageEvents.rows[0]!.providerMessageId).toBe('msg_after_retry');
  });

  it('still invokes a caller-supplied onInvocation alongside metering', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const model = vi.fn().mockResolvedValue(okResult('msg_1'));
    const onInvocation = vi.fn();

    await runMeteredResearch(d, 'tok-a', 'prospect_1', model, researchInput, { onInvocation });

    expect(onInvocation).toHaveBeenCalledTimes(1);
  });
});
