import type {
  CompanyRepository,
  DiscoveryCandidate,
  DiscoveryProvider,
  ProspectRepository,
  StoredCompany,
  StoredProspect,
} from '@acos/core-discovery';
import type { OpportunityRepository, StoredOpportunity } from '@acos/core-opportunity';
import type {
  OutreachPreparationRepository,
  StoredOutreachPreparation,
} from '@acos/core-outreach-preparation';
import type { PersonalizationRepository, StoredPersonalization } from '@acos/core-personalization';
import type { QualificationRepository, StoredQualification } from '@acos/core-qualification';
import type {
  LeadResearch,
  ResearchProvider,
  ResearchProviderInput,
  ResearchSignalRepository,
  StoredResearchSignal,
} from '@acos/core-research';
import type { SearchRepository, SearchStatus, StoredSearch } from '@acos/core-search';
import { describe, expect, it, vi } from 'vitest';

import {
  claimAndProcessNextSearch,
  DEFAULT_SEARCH_LEASE_DURATION_MS,
  type SearchWorkerDeps,
} from './worker';

// UNIT tests (fakes only — mirrors the convention every core-* package's
// own service.test.ts already uses: a minimal LOCAL fake of another
// package's repository interface, not that package's own unexported
// testSupport.ts). See tests/integration/search-worker.integration.test.ts
// for the real-Postgres proof of claim concurrency, lease recovery, and
// cross-user isolation.

const NOW = new Date('2026-02-01T12:00:00.000Z');

// ---- Local fake: @acos/core-search's SearchRepository, with real
// claim/lease/retry behavior (this is exactly what these tests exercise,
// so — unlike other local fakes in this codebase — it cannot be a stub).
function fakeSearchRepository(
  seed: StoredSearch[] = [],
): SearchRepository & { rows: StoredSearch[] } {
  const rows = [...seed];
  return {
    rows,
    async create() {
      throw new Error('not used by these tests');
    },
    async findByIdempotencyKey() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },
    async transition(userId: string, id: string, from: SearchStatus, to: SearchStatus) {
      const index = rows.findIndex(
        (row) => row.id === id && row.userId === userId && row.status === from,
      );
      if (index === -1) return null;
      const updated = { ...rows[index]!, status: to };
      rows[index] = updated;
      return updated;
    },
    async claimNextPending({ workerId, now, leaseExpiresAt }) {
      const index = rows.findIndex((row) => row.status === 'PENDING');
      if (index === -1) return null;
      const updated: StoredSearch = {
        ...rows[index]!,
        status: 'RUNNING',
        leaseOwner: workerId,
        leaseExpiresAt,
        attempts: rows[index]!.attempts + 1,
        updatedAt: now,
      };
      rows[index] = updated;
      return updated;
    },
    async releaseExpiredLeases({ now }) {
      let count = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i]!;
        if (row.status === 'RUNNING' && row.leaseExpiresAt !== null && row.leaseExpiresAt <= now) {
          rows[i] = {
            ...row,
            status: 'PENDING',
            leaseOwner: null,
            leaseExpiresAt: null,
            updatedAt: now,
          };
          count += 1;
        }
      }
      return count;
    },
    async completeClaimed({ id, workerId, now }) {
      const index = rows.findIndex(
        (row) => row.id === id && row.status === 'RUNNING' && row.leaseOwner === workerId,
      );
      if (index === -1) return false;
      rows[index] = {
        ...rows[index]!,
        status: 'COMPLETE',
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: now,
      };
      return true;
    },
    async recordAttemptFailure({ id, workerId, now, error, maxAttempts }) {
      const index = rows.findIndex(
        (row) => row.id === id && row.status === 'RUNNING' && row.leaseOwner === workerId,
      );
      if (index === -1) return null;
      const existing = rows[index]!;
      const status: SearchStatus = existing.attempts >= maxAttempts ? 'FAILED' : 'PENDING';
      rows[index] = {
        ...existing,
        status,
        lastError: error,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: now,
      };
      return status;
    },
  };
}

function fakeCompanyRepository(seed: StoredCompany[] = []): CompanyRepository {
  const rows = [...seed];
  let counter = rows.length;
  return {
    async findOrCreateByDomain(userId, input, now) {
      const existing = rows.find(
        (r) => r.userId === userId && r.normalizedDomain === input.normalizedDomain,
      );
      if (existing) return existing;
      counter += 1;
      const created: StoredCompany = {
        id: `company_${counter}`,
        userId,
        name: input.name,
        normalizedDomain: input.normalizedDomain,
        createdAt: now,
      };
      rows.push(created);
      return created;
    },
    async getById(userId, id) {
      return rows.find((r) => r.id === id && r.userId === userId) ?? null;
    },
  };
}

function fakeProspectRepository(seed: StoredProspect[] = []): ProspectRepository {
  const rows = [...seed];
  let counter = rows.length;
  return {
    async findOrCreate(userId, input, now) {
      const existing = rows.find(
        (r) => r.searchId === input.searchId && r.companyId === input.companyId,
      );
      if (existing) return existing;
      counter += 1;
      const created: StoredProspect = {
        id: `prospect_${counter}`,
        userId,
        searchId: input.searchId,
        companyId: input.companyId,
        status: 'DISCOVERED',
        createdAt: now,
      };
      rows.push(created);
      return created;
    },
    async listBySearch(userId, searchId) {
      return rows.filter((r) => r.userId === userId && r.searchId === searchId);
    },
    async getById(userId, id) {
      return rows.find((r) => r.id === id && r.userId === userId) ?? null;
    },
  };
}

function fakeDiscoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}

function fakeResearchSignalRepository(): ResearchSignalRepository & {
  rows: StoredResearchSignal[];
} {
  const rows: StoredResearchSignal[] = [];
  let counter = 0;
  return {
    rows,
    async supersedePrevious(prospectId, at) {
      let count = 0;
      for (const row of rows) {
        if (row.prospectId === prospectId && row.supersededAt === null) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },
    async saveSignals(prospectId, signals, observedAt) {
      const created: StoredResearchSignal[] = [];
      for (const input of signals) {
        counter += 1;
        created.push({
          id: `signal_${counter}`,
          prospectId,
          field: input.field,
          kind: input.kind,
          classification: input.classification,
          signal: input.signal,
          confidence: input.confidence,
          basis: input.basis,
          observedAt,
          supersededAt: null,
          sources: input.sources.map((s, i) => ({ id: `source_${counter}_${i}`, ...s })),
        });
      }
      rows.push(...created);
      return created;
    },
    async listByProspect(_userId, prospectId) {
      return rows.filter((r) => r.prospectId === prospectId && r.supersededAt === null);
    },
  };
}

function fakeResearchProvider(
  result: LeadResearch | ((input: ResearchProviderInput) => LeadResearch) | (() => never),
): ResearchProvider {
  return {
    async research(input) {
      return typeof result === 'function'
        ? (result as (i: ResearchProviderInput) => LeadResearch)(input)
        : result;
    },
  };
}

function fakeOpportunityRepository(
  seed: StoredOpportunity[] = [],
): OpportunityRepository & { rows: StoredOpportunity[] } {
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async create(userId, input, now) {
      if (rows.some((r) => r.prospectId === input.prospectId)) {
        throw new Error(`duplicate opportunity for prospect ${input.prospectId}`);
      }
      counter += 1;
      const created: StoredOpportunity = {
        id: `opportunity_${counter}`,
        userId,
        prospectId: input.prospectId,
        state: 'NEW',
        needDetected: input.needDetected,
        offer: input.offer,
        staleness: 'FRESH',
        stalenessComputedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(created);
      return created;
    },
    async getById(userId, id) {
      return rows.find((r) => r.id === id && r.userId === userId) ?? null;
    },
    async findByProspectId(userId, prospectId) {
      return rows.find((r) => r.prospectId === prospectId && r.userId === userId) ?? null;
    },
    async list(userId) {
      return rows.filter((r) => r.userId === userId);
    },
    async updateStaleness() {
      throw new Error('not used by these tests');
    },
  };
}

function fakeQualificationRepository(): QualificationRepository & { rows: StoredQualification[] } {
  const rows: StoredQualification[] = [];
  let counter = 0;
  return {
    rows,
    async upsert(opportunityId, prospectId, evaluation, evaluatorVersion, evaluatedAt) {
      const index = rows.findIndex((r) => r.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredQualification = {
        id: existing?.id ?? `qualification_${(counter += 1)}`,
        opportunityId,
        prospectId,
        state: evaluation.state,
        criteria: evaluation.criteria,
        evidenceSignalIds: evaluation.evidenceSignalIds,
        evaluatorVersion,
        evaluatedAt,
        createdAt: existing?.createdAt ?? evaluatedAt,
        updatedAt: evaluatedAt,
      };
      if (index === -1) rows.push(stored);
      else rows[index] = stored;
      return stored;
    },
    async getByOpportunityId(_userId: string, opportunityId: string) {
      // Phase 21 (R-42): evaluatePersonalizationForOwner reads this back
      // immediately after Qualification's own upsert() call above, in the
      // same pipeline pass — this fake must actually serve what was just
      // written, not merely record it.
      return rows.find((r) => r.opportunityId === opportunityId) ?? null;
    },
    async listByUserId() {
      throw new Error('not used by these tests');
    },
  };
}

function fakePersonalizationRepository(): PersonalizationRepository & {
  rows: StoredPersonalization[];
} {
  const rows: StoredPersonalization[] = [];
  let counter = 0;
  return {
    rows,
    async upsert(opportunityId, prospectId, generation, generatorVersion, generatedAt) {
      const index = rows.findIndex((r) => r.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredPersonalization = {
        id: existing?.id ?? `personalization_${(counter += 1)}`,
        opportunityId,
        prospectId,
        state: 'GENERATED',
        offerService: generation.offerService,
        openingContext: generation.openingContext,
        valueProposition: generation.valueProposition,
        personalizationRationale: generation.personalizationRationale,
        evidence: generation.evidence,
        generatorVersion,
        generatedAt,
        createdAt: existing?.createdAt ?? generatedAt,
        updatedAt: generatedAt,
      };
      if (index === -1) rows.push(stored);
      else rows[index] = stored;
      return stored;
    },
    async getByOpportunityId(_userId: string, opportunityId: string) {
      // Phase 22 (R-59): prepareOutreachForOwner reads this back
      // immediately after Personalization's own upsert() call above, in
      // the same pipeline pass — this fake must actually serve what was
      // just written, mirroring fakeQualificationRepository's identical
      // getByOpportunityId above (needed for the same reason since
      // Phase 21). No Phase 21 test exercises this method.
      return rows.find((r) => r.opportunityId === opportunityId) ?? null;
    },
    async listByUserId() {
      throw new Error('not used by these tests');
    },
  };
}

function fakeOutreachPreparationRepository(): OutreachPreparationRepository & {
  rows: StoredOutreachPreparation[];
} {
  const rows: StoredOutreachPreparation[] = [];
  let counter = 0;
  return {
    rows,
    async upsert(opportunityId, prospectId, sourcePersonalizationId, generation, generatorVersion, generatedAt) {
      const index = rows.findIndex((r) => r.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredOutreachPreparation = {
        id: existing?.id ?? `outreach_preparation_${(counter += 1)}`,
        opportunityId,
        prospectId,
        sourcePersonalizationId,
        state: 'READY_FOR_REVIEW',
        subjectLine: generation.subjectLine,
        messageBody: generation.messageBody,
        callToAction: generation.callToAction,
        evidence: generation.evidence,
        generatorVersion,
        generatedAt,
        createdAt: existing?.createdAt ?? generatedAt,
        updatedAt: generatedAt,
      };
      if (index === -1) rows.push(stored);
      else rows[index] = stored;
      return stored;
    },
    async getByOpportunityId() {
      throw new Error('not used by these tests');
    },
    async listByUserId() {
      throw new Error('not used by these tests');
    },
  };
}

function seedSearch(overrides: Partial<StoredSearch> = {}): StoredSearch {
  return {
    id: 'search_1',
    userId: 'user_a',
    serviceProfileId: 'svcprofile_1',
    status: 'PENDING',
    parameters: {
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['JOB_POST'],
      keywords: ['website', 'redesign'],
      rationale: 'They lack a working website.',
    },
    attempts: 0,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

const observed = (value: string) => ({
  classification: 'OBSERVED' as const,
  value,
  evidence: [{ quote: value, sourceUrl: 'https://acme.test/about', sourceLabel: 'homepage' }],
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
  return {
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
  } as unknown as LeadResearch;
}

/**
 * Unlike sampleResearch() above, this actually matches seedSearch()'s
 * own default `triggers`/`keywords` (via an override, since sampleResearch's
 * signals never contain "website"/"redesign" and seedSearch's own default
 * `triggers: ['JOB_POST']` has no matching FIELD_KIND at all) — so
 * Opportunity.needDetected is true and Qualification reaches QUALIFIED,
 * which is what the R-51 Personalization tests below need to exercise the
 * actual generation path, not just its skip path.
 */
function qualifyingResearch(): LeadResearch {
  return {
    companySummary: observed('needs a website redesign'),
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
  } as unknown as LeadResearch;
}

function qualifyingSearchOverrides(): Partial<StoredSearch> {
  return {
    parameters: {
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['WEBSITE'],
      keywords: ['redesign'],
      rationale: 'They need a website refresh ({signal}).',
    },
  };
}

function buildDeps(overrides: Partial<SearchWorkerDeps> = {}): SearchWorkerDeps & {
  searches: ReturnType<typeof fakeSearchRepository>;
  opportunities: ReturnType<typeof fakeOpportunityRepository>;
  qualifications: ReturnType<typeof fakeQualificationRepository>;
} {
  return {
    searches: fakeSearchRepository(),
    companies: fakeCompanyRepository(),
    prospects: fakeProspectRepository(),
    discoveryProvider: fakeDiscoveryProvider([
      { name: 'Acme Co', website: 'https://acme.example.com' },
    ]),
    signals: fakeResearchSignalRepository(),
    researchProvider: () => fakeResearchProvider(sampleResearch()),
    opportunities: fakeOpportunityRepository(),
    qualifications: fakeQualificationRepository(),
    workerId: 'worker-a',
    now: () => NOW,
    ...overrides,
  } as SearchWorkerDeps & {
    searches: ReturnType<typeof fakeSearchRepository>;
    opportunities: ReturnType<typeof fakeOpportunityRepository>;
    qualifications: ReturnType<typeof fakeQualificationRepository>;
  };
}

describe('claiming', () => {
  it('claims an eligible PENDING Search', async () => {
    const searches = fakeSearchRepository([seedSearch()]);
    const deps = buildDeps({ searches });

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome.outcome).toBe('completed');
    expect(searches.rows[0]!.status).toBe('COMPLETE');
  });

  it('returns "empty" when nothing is PENDING', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([seedSearch({ status: 'RUNNING' })]) });

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome).toEqual({ outcome: 'empty' });
  });

  it('a second claim attempt cannot obtain the same (already-claimed) row', async () => {
    const searches = fakeSearchRepository([seedSearch()]);
    const claim = () =>
      searches.claimNextPending({
        workerId: 'worker-a',
        now: NOW,
        leaseExpiresAt: new Date(NOW.getTime() + 1000),
      });

    const first = await claim();
    const second = await claim();

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('assigns lease owner and lease expiry, and increments attempts', async () => {
    const searches = fakeSearchRepository([seedSearch({ attempts: 0 })]);
    const leaseExpiresAt = new Date(NOW.getTime() + DEFAULT_SEARCH_LEASE_DURATION_MS);

    const claimed = await searches.claimNextPending({
      workerId: 'worker-a',
      now: NOW,
      leaseExpiresAt,
    });

    expect(claimed?.leaseOwner).toBe('worker-a');
    expect(claimed?.leaseExpiresAt).toEqual(leaseExpiresAt);
    expect(claimed?.attempts).toBe(1);
    expect(claimed?.status).toBe('RUNNING');
  });
});

describe('lease / fencing', () => {
  it('the current lease owner can settle the claimed row', async () => {
    const searches = fakeSearchRepository([
      seedSearch({
        status: 'RUNNING',
        leaseOwner: 'worker-a',
        leaseExpiresAt: new Date(NOW.getTime() + 60_000),
      }),
    ]);

    const owned = await searches.completeClaimed({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
    });

    expect(owned).toBe(true);
    expect(searches.rows[0]!.status).toBe('COMPLETE');
  });

  it('a stale (fenced) worker cannot mutate a row it no longer owns', async () => {
    const searches = fakeSearchRepository([
      seedSearch({
        status: 'RUNNING',
        leaseOwner: 'worker-b',
        leaseExpiresAt: new Date(NOW.getTime() + 60_000),
      }),
    ]);

    const owned = await searches.completeClaimed({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
    });
    const failed = await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'boom',
      maxAttempts: 3,
    });

    expect(owned).toBe(false);
    expect(failed).toBeNull();
    expect(searches.rows[0]!.status).toBe('RUNNING');
    expect(searches.rows[0]!.leaseOwner).toBe('worker-b');
  });

  it('an expired lease is recoverable by another worker', async () => {
    const searches = fakeSearchRepository([
      seedSearch({
        status: 'RUNNING',
        attempts: 1,
        leaseOwner: 'worker-a',
        leaseExpiresAt: new Date(NOW.getTime() - 1000),
      }),
    ]);

    const recovered = await searches.releaseExpiredLeases({ now: NOW });
    const reclaimed = await searches.claimNextPending({
      workerId: 'worker-b',
      now: NOW,
      leaseExpiresAt: new Date(NOW.getTime() + 60_000),
    });

    expect(recovered).toBe(1);
    expect(reclaimed?.leaseOwner).toBe('worker-b');
  });
});

describe('crash recovery', () => {
  it('an expired RUNNING lease returns to PENDING, preserving attempts and last_error', async () => {
    const searches = fakeSearchRepository([
      seedSearch({
        status: 'RUNNING',
        attempts: 2,
        lastError: 'previous transient failure',
        leaseOwner: 'worker-a',
        leaseExpiresAt: new Date(NOW.getTime() - 1),
      }),
    ]);

    await searches.releaseExpiredLeases({ now: NOW });

    expect(searches.rows[0]!.status).toBe('PENDING');
    expect(searches.rows[0]!.attempts).toBe(2);
    expect(searches.rows[0]!.lastError).toBe('previous transient failure');
    expect(searches.rows[0]!.leaseOwner).toBeNull();
    expect(searches.rows[0]!.leaseExpiresAt).toBeNull();
  });

  it('does not touch a Search whose lease has not expired', async () => {
    const leaseExpiresAt = new Date(NOW.getTime() + 60_000);
    const searches = fakeSearchRepository([
      seedSearch({ status: 'RUNNING', leaseOwner: 'worker-a', leaseExpiresAt }),
    ]);

    const recovered = await searches.releaseExpiredLeases({ now: NOW });

    expect(recovered).toBe(0);
    expect(searches.rows[0]!.status).toBe('RUNNING');
    expect(searches.rows[0]!.leaseOwner).toBe('worker-a');
  });
});

describe('retry / failure exhaustion', () => {
  function claimedSearch(attempts: number): StoredSearch[] {
    return [
      seedSearch({
        status: 'RUNNING',
        attempts,
        leaseOwner: 'worker-a',
        leaseExpiresAt: new Date(NOW.getTime() + 60_000),
      }),
    ];
  }

  it('the first failed attempt returns the Search to PENDING', async () => {
    const searches = fakeSearchRepository(claimedSearch(1));

    const status = await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'e1',
      maxAttempts: 3,
    });

    expect(status).toBe('PENDING');
    expect(searches.rows[0]!.lastError).toBe('e1');
  });

  it('the second failed attempt also returns the Search to PENDING', async () => {
    const searches = fakeSearchRepository(claimedSearch(2));

    const status = await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'e2',
      maxAttempts: 3,
    });

    expect(status).toBe('PENDING');
  });

  it('the third failed attempt transitions the Search to FAILED and persists last_error', async () => {
    const searches = fakeSearchRepository(claimedSearch(3));

    const status = await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'e3 final',
      maxAttempts: 3,
    });

    expect(status).toBe('FAILED');
    expect(searches.rows[0]!.status).toBe('FAILED');
    expect(searches.rows[0]!.lastError).toBe('e3 final');
  });

  it('a FAILED Search is never claimed again', async () => {
    const searches = fakeSearchRepository(claimedSearch(3));
    await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'e3',
      maxAttempts: 3,
    });

    const claimed = await searches.claimNextPending({
      workerId: 'worker-b',
      now: NOW,
      leaseExpiresAt: new Date(NOW.getTime() + 1000),
    });

    expect(claimed).toBeNull();
  });

  it('claimAndProcessNextSearch drives a failing pipeline through retry then exhaustion', async () => {
    const searches = fakeSearchRepository([seedSearch()]);
    const failingDiscovery: DiscoveryProvider = {
      async discover() {
        throw new Error('provider unavailable');
      },
    };

    // Attempt 1: fails, returns to PENDING.
    let outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, discoveryProvider: failingDiscovery }),
    );
    expect(outcome).toMatchObject({ outcome: 'retry', attempts: 1 });
    expect(searches.rows[0]!.status).toBe('PENDING');

    // Attempt 2: fails again, still PENDING.
    outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, discoveryProvider: failingDiscovery }),
    );
    expect(outcome).toMatchObject({ outcome: 'retry', attempts: 2 });

    // Attempt 3: fails a third time, exhausted -> FAILED.
    outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, discoveryProvider: failingDiscovery }),
    );
    expect(outcome).toMatchObject({ outcome: 'failed', attempts: 3 });
    expect(searches.rows[0]!.status).toBe('FAILED');
    expect(searches.rows[0]!.lastError).toContain('provider unavailable');

    // No further automatic attempt.
    const fourth = await claimAndProcessNextSearch(
      buildDeps({ searches, discoveryProvider: failingDiscovery }),
    );
    expect(fourth).toEqual({ outcome: 'empty' });
  });
});

describe('canonical pipeline', () => {
  it('runs Discovery, then Research, then Opportunity, in order, and completes the Search', async () => {
    const calls: string[] = [];
    const discoveryProvider: DiscoveryProvider = {
      async discover() {
        calls.push('discovery');
        return [{ name: 'Acme Co', website: 'https://acme.example.com' }];
      },
    };
    const researchProvider: ResearchProvider = {
      async research() {
        calls.push('research');
        return sampleResearch();
      },
    };
    const opportunities = fakeOpportunityRepository();
    const realCreate = opportunities.create.bind(opportunities);
    opportunities.create = (async (...args: Parameters<typeof realCreate>) => {
      calls.push('opportunity');
      return realCreate(...args);
    }) as typeof opportunities.create;
    const qualifications = fakeQualificationRepository();
    const realUpsert = qualifications.upsert.bind(qualifications);
    qualifications.upsert = (async (...args: Parameters<typeof realUpsert>) => {
      calls.push('qualification');
      return realUpsert(...args);
    }) as typeof qualifications.upsert;

    const searches = fakeSearchRepository([seedSearch()]);
    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        discoveryProvider,
        researchProvider: () => researchProvider,
        opportunities,
        qualifications,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', prospectsProcessed: 1 });
    expect(calls).toEqual(['discovery', 'research', 'opportunity', 'qualification']);
    expect(searches.rows[0]!.status).toBe('COMPLETE');
    expect(opportunities.rows).toHaveLength(1);
    expect(qualifications.rows).toHaveLength(1);
    expect(qualifications.rows[0]!.opportunityId).toBe(opportunities.rows[0]!.id);
  });

  it('R-41: Qualification also runs for an already-existing Opportunity (retry path), not only a newly-created one', async () => {
    const opportunities = fakeOpportunityRepository();
    const qualifications = fakeQualificationRepository();
    const searches = fakeSearchRepository([seedSearch()]);

    // Attempt 1: creates the Opportunity and evaluates it.
    await claimAndProcessNextSearch(buildDeps({ searches, opportunities, qualifications }));
    expect(qualifications.rows).toHaveLength(1);
    const firstQualificationId = qualifications.rows[0]!.id;

    // Attempt 2, re-claimed against the same already-populated repositories
    // (mirrors the existing idempotency test below): Qualification must
    // run again (R-41/R-39), replacing the same row, not skip silently.
    searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
    await claimAndProcessNextSearch(buildDeps({ searches, opportunities, qualifications }));

    expect(opportunities.rows).toHaveLength(1); // still no duplicate Opportunity
    expect(qualifications.rows).toHaveLength(1); // still no duplicate Qualification row
    expect(qualifications.rows[0]!.id).toBe(firstQualificationId);
  });

  it('a Qualification-stage failure surfaces as a failed attempt, same as an Opportunity-stage failure', async () => {
    const qualifications = fakeQualificationRepository();
    qualifications.upsert = vi.fn().mockRejectedValue(new Error('qualification write failed'));
    const searches = fakeSearchRepository([seedSearch()]);

    const outcome = await claimAndProcessNextSearch(buildDeps({ searches, qualifications }));

    expect(outcome.outcome).toBe('retry');
    expect(searches.rows[0]!.status).toBe('PENDING');
  });

  it('a Research failure stops downstream execution — no Opportunity is created', async () => {
    const researchProvider: ResearchProvider = {
      async research() {
        throw new Error('research provider failed');
      },
    };
    const opportunities = fakeOpportunityRepository();
    const searches = fakeSearchRepository([seedSearch()]);

    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, researchProvider: () => researchProvider, opportunities }),
    );

    expect(outcome.outcome).toBe('retry');
    expect(opportunities.rows).toHaveLength(0);
  });

  it('an Opportunity-stage failure still leaves already-persisted Discovery/Research data intact', async () => {
    const opportunities = fakeOpportunityRepository();
    opportunities.create = vi.fn().mockRejectedValue(new Error('opportunity write failed'));
    const signals = fakeResearchSignalRepository();
    const searches = fakeSearchRepository([seedSearch()]);

    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, opportunities, signals }),
    );

    expect(outcome.outcome).toBe('retry');
    expect(signals.rows.length).toBeGreaterThan(0);
    expect(opportunities.rows).toHaveLength(0);
  });

  it('a Search with zero discovered Prospects still completes successfully', async () => {
    const searches = fakeSearchRepository([seedSearch()]);
    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, discoveryProvider: fakeDiscoveryProvider([]) }),
    );

    expect(outcome).toEqual({ outcome: 'completed', searchId: 'search_1', prospectsProcessed: 0 });
    expect(searches.rows[0]!.status).toBe('COMPLETE');
  });
});

describe('personalization (Phase 21, R-51/R-52)', () => {
  it('runs Personalization immediately after Qualification, in order, for a QUALIFIED Opportunity', async () => {
    const calls: string[] = [];
    const opportunities = fakeOpportunityRepository();
    const realCreate = opportunities.create.bind(opportunities);
    opportunities.create = (async (...args: Parameters<typeof realCreate>) => {
      calls.push('opportunity');
      return realCreate(...args);
    }) as typeof opportunities.create;
    const qualifications = fakeQualificationRepository();
    const realUpsertQ = qualifications.upsert.bind(qualifications);
    qualifications.upsert = (async (...args: Parameters<typeof realUpsertQ>) => {
      calls.push('qualification');
      return realUpsertQ(...args);
    }) as typeof qualifications.upsert;
    const personalizations = fakePersonalizationRepository();
    const realUpsertP = personalizations.upsert.bind(personalizations);
    personalizations.upsert = (async (...args: Parameters<typeof realUpsertP>) => {
      calls.push('personalization');
      return realUpsertP(...args);
    }) as typeof personalizations.upsert;

    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        opportunities,
        qualifications,
        personalizations,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', prospectsProcessed: 1 });
    expect(calls).toEqual(['opportunity', 'qualification', 'personalization']);
    expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    expect(personalizations.rows).toHaveLength(1);
    expect(personalizations.rows[0]!.opportunityId).toBe(opportunities.rows[0]!.id);
    expect(personalizations.rows[0]!.offerService).toBe('Website development');
  });

  it('R-42: creates no Personalization row when Qualification does not reach QUALIFIED', async () => {
    const personalizations = fakePersonalizationRepository();
    const qualifications = fakeQualificationRepository();
    const searches = fakeSearchRepository([seedSearch()]); // default seedSearch + sampleResearch() never match -> NOT_QUALIFIED

    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, qualifications, personalizations }),
    );

    expect(outcome.outcome).toBe('completed');
    expect(qualifications.rows[0]!.state).not.toBe('QUALIFIED');
    expect(personalizations.rows).toHaveLength(0);
  });

  it('never runs Personalization when Qualification did not itself run in this pass, even if deps.personalizations is configured', async () => {
    const personalizations = fakePersonalizationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    // Built without `buildDeps()` (rather than overriding `qualifications`
    // to `undefined`) so the field is genuinely absent, matching
    // `exactOptionalPropertyTypes` — the same "omit, don't set undefined"
    // shape a pre-Phase-20 caller's own SearchWorkerDeps object has.
    const deps: SearchWorkerDeps = {
      searches,
      companies: fakeCompanyRepository(),
      prospects: fakeProspectRepository(),
      discoveryProvider: fakeDiscoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
      signals: fakeResearchSignalRepository(),
      researchProvider: () => fakeResearchProvider(qualifyingResearch()),
      opportunities: fakeOpportunityRepository(),
      personalizations,
      workerId: 'worker-a',
      now: () => NOW,
    };

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome.outcome).toBe('completed');
    expect(personalizations.rows).toHaveLength(0);
  });

  it('R-52: a Personalization-stage failure surfaces as a failed attempt, without touching ResearchSignals/Opportunity/Qualification', async () => {
    const personalizations = fakePersonalizationRepository();
    personalizations.upsert = vi.fn().mockRejectedValue(new Error('personalization write failed'));
    const qualifications = fakeQualificationRepository();
    const opportunities = fakeOpportunityRepository();
    const signals = fakeResearchSignalRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        opportunities,
        qualifications,
        signals,
        personalizations,
      }),
    );

    expect(outcome.outcome).toBe('retry');
    expect(searches.rows[0]!.status).toBe('PENDING');
    // Upstream state, already committed to their own fakes before the
    // Personalization stage threw, is left exactly as it was.
    expect(qualifications.rows).toHaveLength(1);
    expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    expect(opportunities.rows).toHaveLength(1);
    expect(signals.rows.length).toBeGreaterThan(0);
  });

  it('R-49/R-50: idempotent on retry — re-running against unchanged evidence replaces the same row, no duplicates', async () => {
    const opportunities = fakeOpportunityRepository();
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const researchProvider = () => fakeResearchProvider(qualifyingResearch());

    await claimAndProcessNextSearch(
      buildDeps({ searches, researchProvider, opportunities, qualifications, personalizations }),
    );
    expect(personalizations.rows).toHaveLength(1);
    const firstId = personalizations.rows[0]!.id;

    searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
    await claimAndProcessNextSearch(
      buildDeps({ searches, researchProvider, opportunities, qualifications, personalizations }),
    );

    expect(opportunities.rows).toHaveLength(1);
    expect(personalizations.rows).toHaveLength(1); // still no duplicate row
    expect(personalizations.rows[0]!.id).toBe(firstId);
  });
});

describe('ownership', () => {
  it("worker identity for every downstream write derives from the claimed Search's own persisted userId", async () => {
    const searches = fakeSearchRepository([seedSearch({ id: 'search_b', userId: 'user_b' })]);
    const companies = fakeCompanyRepository();
    const prospects = fakeProspectRepository();
    const opportunities = fakeOpportunityRepository();

    await claimAndProcessNextSearch(buildDeps({ searches, companies, prospects, opportunities }));

    const company = await companies.getById('user_b', 'company_1');
    expect(company).not.toBeNull();
    expect(opportunities.rows.every((o) => o.userId === 'user_b')).toBe(true);
    // Never leaked to a different user.
    expect(await companies.getById('user_a', 'company_1')).toBeNull();
  });

  it('two Searches owned by different users are each processed under their own owner, never cross-attributed', async () => {
    const searches = fakeSearchRepository([
      seedSearch({ id: 'search_a', userId: 'user_a' }),
      seedSearch({ id: 'search_b', userId: 'user_b' }),
    ]);
    // Shared across both attempts — a real deployment has one Postgres
    // schema, so Company/Prospect ids are globally unique regardless of
    // which user's Search discovered them.
    const companies = fakeCompanyRepository();
    const prospects = fakeProspectRepository();
    const opportunities = fakeOpportunityRepository();

    await claimAndProcessNextSearch(
      buildDeps({ searches, companies, prospects, opportunities, workerId: 'worker-1' }),
    );
    await claimAndProcessNextSearch(
      buildDeps({ searches, companies, prospects, opportunities, workerId: 'worker-1' }),
    );

    expect(opportunities.rows.map((o) => o.userId).sort()).toEqual(['user_a', 'user_b']);
  });
});

describe('idempotency', () => {
  it('a retried Search does not create a duplicate Opportunity for a Prospect it already created one for', async () => {
    const searches = fakeSearchRepository([seedSearch()]);
    const companies = fakeCompanyRepository();
    const prospects = fakeProspectRepository();
    const opportunities = fakeOpportunityRepository();

    // Attempt 1: succeeds fully.
    await claimAndProcessNextSearch(buildDeps({ searches, companies, prospects, opportunities }));
    expect(opportunities.rows).toHaveLength(1);

    // Simulate the Search being re-claimed for a second attempt against
    // the SAME already-populated repositories (e.g. it crashed just
    // after Opportunity creation but before Search completion).
    searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
    await claimAndProcessNextSearch(buildDeps({ searches, companies, prospects, opportunities }));

    expect(opportunities.rows).toHaveLength(1);
  });
});

describe('outreach preparation (Phase 22, R-59)', () => {
  it('runs Outreach Preparation immediately after Personalization, in order, for a Personalized Opportunity', async () => {
    const calls: string[] = [];
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const realUpsertP = personalizations.upsert.bind(personalizations);
    personalizations.upsert = (async (...args: Parameters<typeof realUpsertP>) => {
      calls.push('personalization');
      return realUpsertP(...args);
    }) as typeof personalizations.upsert;
    const outreachPreparations = fakeOutreachPreparationRepository();
    const realUpsertO = outreachPreparations.upsert.bind(outreachPreparations);
    outreachPreparations.upsert = (async (...args: Parameters<typeof realUpsertO>) => {
      calls.push('outreachPreparation');
      return realUpsertO(...args);
    }) as typeof outreachPreparations.upsert;

    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        qualifications,
        personalizations,
        outreachPreparations,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', prospectsProcessed: 1 });
    expect(calls).toEqual(['personalization', 'outreachPreparation']);
    expect(outreachPreparations.rows).toHaveLength(1);
    expect(outreachPreparations.rows[0]!.opportunityId).toBe(personalizations.rows[0]!.opportunityId);
    expect(outreachPreparations.rows[0]!.sourcePersonalizationId).toBe(personalizations.rows[0]!.id);
    expect(outreachPreparations.rows[0]!.state).toBe('READY_FOR_REVIEW');
  });

  it('creates no Outreach Preparation row when Personalization itself produces no row', async () => {
    const outreachPreparations = fakeOutreachPreparationRepository();
    const personalizations = fakePersonalizationRepository();
    const searches = fakeSearchRepository([seedSearch()]); // default seedSearch + sampleResearch() never match -> NOT_QUALIFIED -> no Personalization

    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, personalizations, outreachPreparations }),
    );

    expect(outcome.outcome).toBe('completed');
    expect(personalizations.rows).toHaveLength(0);
    expect(outreachPreparations.rows).toHaveLength(0);
  });

  it('never runs Outreach Preparation when Personalization did not itself run in this pass, even if deps.outreachPreparations is configured', async () => {
    const outreachPreparations = fakeOutreachPreparationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    // Built without `buildDeps()` (rather than overriding `personalizations`
    // to `undefined`) so the field is genuinely absent, matching
    // `exactOptionalPropertyTypes` — mirrors the equivalent Phase 21 test
    // for `qualifications` above.
    const deps: SearchWorkerDeps = {
      searches,
      companies: fakeCompanyRepository(),
      prospects: fakeProspectRepository(),
      discoveryProvider: fakeDiscoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
      signals: fakeResearchSignalRepository(),
      researchProvider: () => fakeResearchProvider(qualifyingResearch()),
      opportunities: fakeOpportunityRepository(),
      qualifications: fakeQualificationRepository(),
      outreachPreparations,
      workerId: 'worker-a',
      now: () => NOW,
    };

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome.outcome).toBe('completed');
    expect(outreachPreparations.rows).toHaveLength(0);
  });

  it('an Outreach-Preparation-stage failure surfaces as a failed attempt, without touching ResearchSignals/Opportunity/Qualification/Personalization', async () => {
    const outreachPreparations = fakeOutreachPreparationRepository();
    outreachPreparations.upsert = vi.fn().mockRejectedValue(new Error('outreach preparation write failed'));
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const opportunities = fakeOpportunityRepository();
    const signals = fakeResearchSignalRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        opportunities,
        qualifications,
        signals,
        personalizations,
        outreachPreparations,
      }),
    );

    expect(outcome.outcome).toBe('retry');
    expect(searches.rows[0]!.status).toBe('PENDING');
    // Upstream state, already committed to their own fakes before the
    // Outreach Preparation stage threw, is left exactly as it was.
    expect(qualifications.rows).toHaveLength(1);
    expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    expect(personalizations.rows).toHaveLength(1);
    expect(opportunities.rows).toHaveLength(1);
    expect(signals.rows.length).toBeGreaterThan(0);
  });

  it('R-57: idempotent on retry — re-running against unchanged Personalization replaces the same row, no duplicates', async () => {
    const opportunities = fakeOpportunityRepository();
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const outreachPreparations = fakeOutreachPreparationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const researchProvider = () => fakeResearchProvider(qualifyingResearch());

    await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider,
        opportunities,
        qualifications,
        personalizations,
        outreachPreparations,
      }),
    );
    expect(outreachPreparations.rows).toHaveLength(1);
    const firstId = outreachPreparations.rows[0]!.id;

    searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
    await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider,
        opportunities,
        qualifications,
        personalizations,
        outreachPreparations,
      }),
    );

    expect(personalizations.rows).toHaveLength(1);
    expect(outreachPreparations.rows).toHaveLength(1); // still no duplicate row
    expect(outreachPreparations.rows[0]!.id).toBe(firstId);
  });
});
