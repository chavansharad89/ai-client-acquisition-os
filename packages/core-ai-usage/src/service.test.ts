import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import { ResearchProspectNotFoundError, type ModelInvocationUsage } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import { listAiUsageEvents, recordAiUsageEvent, type AiUsageDeps } from './service';
import { fakeAiUsageEventRepository } from './testSupport';

// UNIT tests (fakes only — see tests/integration/ai-usage.integration.test.ts
// for the real-Postgres proof of the same ownership/idempotency boundary
// and migration 0021's schema). Mirrors @acos/core-research's and
// @acos/core-opportunity's service.test.ts conventions.

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

/** A minimal local fake of @acos/core-discovery's ProspectRepository — same convention @acos/core-opportunity's tests use. */
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

function sampleUsage(overrides: Partial<ModelInvocationUsage> = {}): ModelInvocationUsage {
  return {
    provider: 'anthropic',
    model: 'claude-opus-5',
    providerMessageId: 'msg_01ABC',
    inputTokens: 1200,
    outputTokens: 340,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
    ...overrides,
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

describe('recordAiUsageEvent', () => {
  it('persists usage under the authenticated caller and the given Prospect (D2/D3)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });

    const stored = await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');

    expect(stored.userId).toBe('user_a');
    expect(stored.prospectId).toBe('prospect_1');
    expect(stored.provider).toBe('anthropic');
    expect(stored.model).toBe('claude-opus-5');
    expect(stored.requestKind).toBe('initial');
    expect(stored.providerMessageId).toBe('msg_01ABC');
    expect(stored.inputTokens).toBe(1200);
    expect(stored.outputTokens).toBe(340);
  });

  it('preserves cache-usage fields as NULL rather than defaulting them (D6)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });

    const stored = await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');

    expect(stored.cacheCreationInputTokens).toBeNull();
    expect(stored.cacheReadInputTokens).toBeNull();
  });

  it('rejects an unauthenticated caller before touching the repository (AC16-10)', async () => {
    const d = deps();
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;

    await expect(
      recordAiUsageEvent(d, null, 'prospect_1', sampleUsage(), 'initial'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(usageEvents.rows).toHaveLength(0);
  });

  it("rejects recording against another user's Prospect — treated as not found, never leaking existence (AC16-09/R-33)", async () => {
    const d = deps({
      sessions: { ...sessionFor('tok-a', 'user_a'), ...sessionFor('tok-b', 'user_b') },
      prospects: [seedProspect({ id: 'prospect_1', userId: 'user_a' })],
    });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;

    await expect(
      recordAiUsageEvent(d, 'tok-b', 'prospect_1', sampleUsage(), 'initial'),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
    expect(usageEvents.rows).toHaveLength(0);
  });

  it('does not create a duplicate row for the same (provider, providerMessageId) — idempotency (D8/AC16-09)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;

    const first = await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');
    const second = await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');

    expect(usageEvents.rows).toHaveLength(1);
    expect(second.id).toBe(first.id);
  });

  it('treats different providerMessageIds as separate events — retries are not duplicates (D1/AC16-03)', async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;

    await recordAiUsageEvent(
      d,
      'tok-a',
      'prospect_1',
      sampleUsage({ providerMessageId: 'msg_attempt_1' }),
      'initial',
    );
    await recordAiUsageEvent(
      d,
      'tok-a',
      'prospect_1',
      sampleUsage({ providerMessageId: 'msg_attempt_2' }),
      'repair',
    );

    expect(usageEvents.rows).toHaveLength(2);
  });

  it("persists requestKind = 'fallback' (migration 0026, Multi-Model Research Provider) with its own provider/model identity", async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });

    const stored = await recordAiUsageEvent(
      d,
      'tok-a',
      'prospect_1',
      sampleUsage({ provider: 'openai', model: 'gpt-test', providerMessageId: 'chatcmpl_fallback_1' }),
      'fallback',
    );

    expect(stored.requestKind).toBe('fallback');
    expect(stored.provider).toBe('openai');
    expect(stored.model).toBe('gpt-test');
  });

  it("distinguishes 'initial', 'repair' and 'fallback' as three separate, non-colliding events for the same prospect", async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    const usageEvents = d.usageEvents as ReturnType<typeof fakeAiUsageEventRepository>;

    await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage({ providerMessageId: 'm1' }), 'initial');
    await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage({ providerMessageId: 'm2' }), 'repair');
    await recordAiUsageEvent(
      d,
      'tok-a',
      'prospect_1',
      sampleUsage({ provider: 'openai', providerMessageId: 'm3' }),
      'fallback',
    );

    expect(usageEvents.rows.map((row) => row.requestKind).sort()).toEqual(['fallback', 'initial', 'repair']);
  });
});

describe('listAiUsageEvents', () => {
  it("returns only the caller's own events for the given Prospect", async () => {
    const d = deps({ sessions: sessionFor('tok-a', 'user_a') });
    await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');

    const events = await listAiUsageEvents(d, 'tok-a', 'prospect_1');

    expect(events).toHaveLength(1);
    expect(events[0]!.providerMessageId).toBe('msg_01ABC');
  });

  it("a different user cannot read another user's usage events — isolation via Prospect ownership (AC16-08/R-33)", async () => {
    const d = deps({
      sessions: { ...sessionFor('tok-a', 'user_a'), ...sessionFor('tok-b', 'user_b') },
      prospects: [seedProspect({ id: 'prospect_1', userId: 'user_a' })],
    });
    await recordAiUsageEvent(d, 'tok-a', 'prospect_1', sampleUsage(), 'initial');

    await expect(listAiUsageEvents(d, 'tok-b', 'prospect_1')).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });

  it('rejects an unauthenticated read', async () => {
    const d = deps();
    await expect(listAiUsageEvents(d, undefined, 'prospect_1')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});
