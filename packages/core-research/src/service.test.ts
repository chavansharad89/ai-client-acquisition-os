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
import { describe, expect, it } from 'vitest';

import { toNewResearchSignals } from './mapping';
import { leadResearchSchema, type LeadResearch } from './schema';
import { listResearchSignals, runResearch } from './service';
import { ResearchProspectNotFoundError, RunResearchValidationError } from './signalErrors';
import { fakeResearchProvider, fakeResearchSignalRepository } from './testSupport';

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

function deps(companies: StoredCompany[], prospects: StoredProspect[]) {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
    ...sessionFor('entitlement-token', null as unknown as string),
  });
  return {
    identity,
    companies: fakeCompanyRepository(companies),
    prospects: fakeProspectRepository(prospects),
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
