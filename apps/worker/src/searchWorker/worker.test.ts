import { createPrivateKey, createPublicKey, sign } from 'node:crypto';

import type {
  CompanyRepository,
  DiscoveryCandidate,
  DiscoveryProvider,
  ProspectRepository,
  StoredCompany,
  StoredProspect,
} from '@acos/core-discovery';
import type {
  FollowUpPreparationRepository,
  StoredFollowUpPreparation,
} from '@acos/core-followup-preparation';
import type {
  OpportunityRepository,
  OpportunityScoreRepository,
  StoredOpportunity,
  StoredOpportunityScore,
} from '@acos/core-opportunity';
import type {
  OutreachPreparationRepository,
  StoredOutreachPreparation,
} from '@acos/core-outreach-preparation';
import type { PersonalizationRepository, StoredPersonalization } from '@acos/core-personalization';
import type { QualificationRepository, StoredQualification } from '@acos/core-qualification';
import {
  createProviderPublicKeyRegistry,
  isIntentSignalKind,
  IntentSignalValidationError,
  normalizeProviderBatch,
  normalizeVerifiedProviderResult,
  researchLead,
  verifyProviderEnvelope,
} from '@acos/core-research';
import type {
  AuthorizationEvidence,
  CategoryPlausibilityRepository,
  LeadResearch,
  ModelResult,
  NewCategoryPlausibilityDeterminationInput,
  NewResearchSignalInput,
  NewTargetCustomerMatchDeterminationInput,
  ResearchInput,
  ResearchModel,
  ResearchProvider,
  ResearchProviderInput,
  ResearchSignalRepository,
  ResearchSignalTransaction,
  StoredCategoryPlausibilityDetermination,
  StoredResearchSignal,
  StoredTargetCustomerMatchDetermination,
  TargetCustomerMatchRepository,
} from '@acos/core-research';
import type { SearchRepository, SearchStatus, StoredSearch } from '@acos/core-search';
import { describe, expect, it, vi } from 'vitest';

import {
  IntentIntakeSearchNotFoundError,
  recordIntentIntakeForOwner,
  recordIntentSignalForOwner,
} from './intentIntake';
import {
  claimAndProcessNextSearch,
  DEFAULT_SEARCH_LEASE_DURATION_MS,
  researchProspectForOwner,
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
        completedAt: now,
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
  /** Every input handed to saveSignals, in order — the authorization evidence lives only here. */
  inputs: NewResearchSignalInput[];
} {
  const rows: StoredResearchSignal[] = [];
  const inputs: NewResearchSignalInput[] = [];
  let counter = 0;
  return {
    rows,
    inputs,
    async supersedePrevious(prospectId, at) {
      let count = 0;
      for (const row of rows) {
        // Mirrors pgRepository: intent intake kinds are never research-superseded (C2).
        if (row.prospectId === prospectId && row.supersededAt === null && !isIntentSignalKind(row.kind)) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },
    async saveSignals(prospectId, signals, observedAt) {
      const created: StoredResearchSignal[] = [];
      for (const input of signals) {
        inputs.push(input);
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

/**
 * Mirrors createPgResearchSignalTransactionRunner: `fn` gets the repository;
 * a throw removes every row / input written inside it, then rethrows (OD-8).
 */
function fakeSignalTransaction(signals: ResearchSignalRepository): ResearchSignalTransaction {
  return async <T,>(fn: (tx: ResearchSignalRepository) => Promise<T>): Promise<T> => {
    const store = signals as Partial<{ rows: StoredResearchSignal[]; inputs: NewResearchSignalInput[] }>;
    const rowCount = store.rows?.length ?? 0;
    const inputCount = store.inputs?.length ?? 0;
    try {
      return await fn(signals);
    } catch (error) {
      store.rows?.splice(rowCount);
      store.inputs?.splice(inputCount);
      throw error;
    }
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

function fakeOpportunityScoreRepository(): OpportunityScoreRepository & {
  rows: StoredOpportunityScore[];
} {
  const rows: StoredOpportunityScore[] = [];
  let counter = 0;
  return {
    rows,
    async upsert(opportunityId, score, scorerVersion, scoredAt) {
      const index = rows.findIndex((r) => r.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredOpportunityScore = {
        id: existing?.id ?? `score_${(counter += 1)}`,
        opportunityId,
        total: score.score,
        band: score.band,
        factors: score.factors,
        reasons: score.reasons,
        observedShare: score.observedShare,
        cap: score.cap,
        scorerVersion,
        scoredAt,
        createdAt: existing?.createdAt ?? scoredAt,
      };
      if (index === -1) rows.push(stored);
      else rows[index] = stored;
      return stored;
    },
    async getByOpportunityId(_userId: string, opportunityId: string) {
      return rows.find((r) => r.opportunityId === opportunityId) ?? null;
    },
    async listByUserId(userId: string) {
      // Mirrors the real repository's ownership join loosely enough for
      // these fakes' purposes — every row here was written for the single
      // userId these tests operate under.
      void userId;
      return rows;
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

// Path 2 — Category Plausibility (D1/D6/D7). Local fake, same convention
// as fakeQualificationRepository above: real append-only/supersede
// behavior for the methods these tests actually exercise
// (supersedePrevious/save/getCurrentByProspectId, mirroring
// @acos/core-research's own testSupport.ts fakeCategoryPlausibilityRepository
// without importing it).
function fakeCategoryPlausibilityRepository(
  seed: StoredCategoryPlausibilityDetermination[] = [],
): CategoryPlausibilityRepository & { rows: StoredCategoryPlausibilityDetermination[] } {
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async supersedePrevious(searchId: string, prospectId: string, at: Date) {
      let count = 0;
      for (const row of rows) {
        if (row.searchId === searchId && row.prospectId === prospectId && row.supersededAt === null) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },
    async save(input: NewCategoryPlausibilityDeterminationInput, observedAt: Date) {
      counter += 1;
      const row: StoredCategoryPlausibilityDetermination = {
        id: `category_plausibility_${counter}`,
        ...input,
        observedAt,
        supersededAt: null,
      };
      rows.push(row);
      return row;
    },
    async listBySearchAndProspect() {
      throw new Error('not used by these tests');
    },
    async getCurrentByProspectId(_userId: string, prospectId: string) {
      return rows.find((row) => row.prospectId === prospectId && row.supersededAt === null) ?? null;
    },
  };
}

// PCG-4 TARGET_CUSTOMER_MATCH production wiring (PDEF4-PCG4-TCMATCH-
// PRODWIRING-DEC-001). Local fake, same convention as
// fakeCategoryPlausibilityRepository above — not @acos/core-research's
// own unexported testSupport.ts fakeTargetCustomerMatchRepository.
function fakeTargetCustomerMatchRepository(
  seed: StoredTargetCustomerMatchDetermination[] = [],
): TargetCustomerMatchRepository & { rows: StoredTargetCustomerMatchDetermination[] } {
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async supersedePrevious(searchId: string, prospectId: string, at: Date) {
      let count = 0;
      for (const row of rows) {
        if (row.searchId === searchId && row.prospectId === prospectId && row.supersededAt === null) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },
    async save(input: NewTargetCustomerMatchDeterminationInput, observedAt: Date) {
      counter += 1;
      const row: StoredTargetCustomerMatchDetermination = {
        id: `target_customer_match_${counter}`,
        ...input,
        observedAt,
        supersededAt: null,
      };
      rows.push(row);
      return row;
    },
    async getCurrent(_userId: string, searchId: string, prospectId: string) {
      return rows.find((row) => row.searchId === searchId && row.prospectId === prospectId && row.supersededAt === null) ?? null;
    },
  };
}

/** No findings — callTargetCustomerMatchModel's own schema-valid-empty-array path, aggregating to NOT_YET_OBSERVED. */
function fakeTargetCustomerMatchModel(): ResearchModel {
  return async (): Promise<ModelResult> => ({ kind: 'json', value: { findings: [] } });
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
    async getByOpportunityId(_userId: string, opportunityId: string) {
      // Phase 23 (R-62): prepareFollowUpForOwner reads this back
      // immediately after Outreach Preparation's own upsert() call above,
      // in the same pipeline pass — this fake must actually serve what
      // was just written, mirroring fakePersonalizationRepository's
      // identical getByOpportunityId above (needed for the same reason
      // since Phase 22). No Phase 22 test exercises this method.
      return rows.find((r) => r.opportunityId === opportunityId) ?? null;
    },
    async listByUserId() {
      throw new Error('not used by these tests');
    },
  };
}

function fakeFollowUpPreparationRepository(): FollowUpPreparationRepository & {
  rows: StoredFollowUpPreparation[];
} {
  const rows: StoredFollowUpPreparation[] = [];
  let counter = 0;
  return {
    rows,
    async upsert(
      opportunityId,
      prospectId,
      sourceOutreachPreparationId,
      generation,
      generatorVersion,
      generatedAt,
    ) {
      const index = rows.findIndex((r) => r.opportunityId === opportunityId);
      const existing = index === -1 ? undefined : rows[index];
      const stored: StoredFollowUpPreparation = {
        id: existing?.id ?? `followup_preparation_${(counter += 1)}`,
        opportunityId,
        prospectId,
        sourceOutreachPreparationId,
        state: 'READY_FOR_REVIEW',
        followUpContext: generation.followUpContext,
        followUpContent: generation.followUpContent,
        rationale: generation.rationale,
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
    completedAt: null,
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
    // Path 2 — one entry, since seedSearch()'s default `targetCustomer:
    // 'Restaurants'` parses to exactly one segment (no `;`). This fixture
    // is only ever consumed through a stub ResearchProvider (never the
    // real researchLead()/provenance engine), so the evidence below needs
    // no real source-document backing.
    categoryPlausibility: [
      {
        fit: 'MATCH',
        rationale: 'fixture',
        evidence: [
          { quote: 'Acme sells warehouse robotics', sourceUrl: 'https://acme.test/about', sourceLabel: 'homepage' },
        ],
      },
    ],
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
 *
 * Phase 24 (R-71): the matched claim lives under `websiteIssues` — a
 * problem/opportunity field — rather than `companySummary`, which R-71
 * now excludes from offer-eligibility (a topical field can never
 * establish a need on its own; see ./adapters.ts's TOPICAL_FIELDS). This
 * is not a weaker fixture than before: "needs a website redesign" always
 * described a problem, not a topic — it is now filed under the field
 * that actually represents that.
 */
function qualifyingResearch(): LeadResearch {
  return {
    companySummary: unknown(),
    businessModel: unknown(),
    targetCustomers: unknown(),
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [observed('needs a website redesign')],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 60,
    gaps: [],
    // Path 2 — one entry: every caller of qualifyingResearch() also uses
    // qualifyingSearchOverrides() or websiteKeywordSearchOverrides(),
    // both still `targetCustomer: 'Restaurants'` (one segment). Consumed
    // only through a stub ResearchProvider, so no real source-document
    // backing is needed.
    categoryPlausibility: [
      {
        fit: 'MATCH',
        rationale: 'fixture',
        evidence: [
          { quote: 'needs a website redesign', sourceUrl: 'https://acme.test/about', sourceLabel: 'homepage' },
        ],
      },
    ],
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

function buildDeps(
  overrides: Partial<SearchWorkerDeps & { signalTransaction: ResearchSignalTransaction }> = {},
): SearchWorkerDeps & {
  searches: ReturnType<typeof fakeSearchRepository>;
  opportunities: ReturnType<typeof fakeOpportunityRepository>;
  qualifications: ReturnType<typeof fakeQualificationRepository>;
  signalTransaction: ResearchSignalTransaction;
} {
  const deps = {
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
    categoryPlausibility: fakeCategoryPlausibilityRepository(),
    workerId: 'worker-a',
    now: () => NOW,
    ...overrides,
  } as SearchWorkerDeps & {
    searches: ReturnType<typeof fakeSearchRepository>;
    opportunities: ReturnType<typeof fakeOpportunityRepository>;
    qualifications: ReturnType<typeof fakeQualificationRepository>;
  };
  return { ...deps, signalTransaction: overrides.signalTransaction ?? fakeSignalTransaction(deps.signals) };
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
    expect(searches.rows[0]!.completedAt).toEqual(NOW);
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
    expect(searches.rows[0]!.completedAt).toBeNull();
  });

  it('a failed attempt never sets completedAt', async () => {
    const searches = fakeSearchRepository([
      seedSearch({
        status: 'RUNNING',
        attempts: 0,
        leaseOwner: 'worker-a',
        leaseExpiresAt: new Date(NOW.getTime() + 60_000),
      }),
    ]);

    await searches.recordAttemptFailure({
      id: 'search_1',
      workerId: 'worker-a',
      now: NOW,
      error: 'boom',
      maxAttempts: 3,
    });

    expect(searches.rows[0]!.status).toBe('PENDING');
    expect(searches.rows[0]!.completedAt).toBeNull();
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

  describe('R-14/R-15/R-17: production scoring wiring', () => {
    it('runs Scoring after Opportunity creation, before Qualification, and persists an OpportunityScore', async () => {
      const calls: string[] = [];
      const opportunities = fakeOpportunityRepository();
      const realCreate = opportunities.create.bind(opportunities);
      opportunities.create = (async (...args: Parameters<typeof realCreate>) => {
        calls.push('opportunity');
        return realCreate(...args);
      }) as typeof opportunities.create;
      const scores = fakeOpportunityScoreRepository();
      const realUpsert = scores.upsert.bind(scores);
      scores.upsert = (async (...args: Parameters<typeof realUpsert>) => {
        calls.push('scoring');
        return realUpsert(...args);
      }) as typeof scores.upsert;
      const qualifications = fakeQualificationRepository();
      const realQualUpsert = qualifications.upsert.bind(qualifications);
      qualifications.upsert = (async (...args: Parameters<typeof realQualUpsert>) => {
        calls.push('qualification');
        return realQualUpsert(...args);
      }) as typeof qualifications.upsert;

      const searches = fakeSearchRepository([seedSearch()]);
      const outcome = await claimAndProcessNextSearch(
        buildDeps({ searches, opportunities, scores, qualifications }),
      );

      expect(outcome).toMatchObject({ outcome: 'completed', prospectsProcessed: 1 });
      expect(calls).toEqual(['opportunity', 'scoring', 'qualification']);
      expect(scores.rows).toHaveLength(1);
      expect(scores.rows[0]!.opportunityId).toBe(opportunities.rows[0]!.id);
      // The row this fake persisted is exactly the shape rankOpportunities()
      // (unmodified, not exercised by this unit test) reads via
      // deps.scores.listByUserId — proving the worker writes a
      // ranking-consumable row, without re-testing ranking's own,
      // pre-existing, untouched behavior here.
      expect(scores.rows[0]).toMatchObject({
        total: expect.any(Number),
        band: expect.any(String),
        factors: expect.any(Array),
        observedShare: expect.any(Number),
      });
    });

    it('does not require Qualification/Personalization/Outreach-Prep/Follow-up-Prep to be configured', async () => {
      const scores = fakeOpportunityScoreRepository();
      const searches = fakeSearchRepository([seedSearch()]);

      // No qualifications/personalizations/outreachPreparations/
      // followUpPreparations passed — scoring has no data dependency on
      // any of them and must still run and persist.
      const outcome = await claimAndProcessNextSearch(buildDeps({ searches, scores }));

      expect(outcome.outcome).toBe('completed');
      expect(scores.rows).toHaveLength(1);
    });

    it('R-14/R-15/R-17: Scoring also runs for an already-existing Opportunity (retry path), replacing the same row', async () => {
      const opportunities = fakeOpportunityRepository();
      const scores = fakeOpportunityScoreRepository();
      const searches = fakeSearchRepository([seedSearch()]);

      // Attempt 1: creates the Opportunity and scores it.
      await claimAndProcessNextSearch(buildDeps({ searches, opportunities, scores }));
      expect(scores.rows).toHaveLength(1);
      const firstScoreId = scores.rows[0]!.id;

      // Attempt 2, re-claimed against the same already-populated
      // repositories: scoring must run again (scoreOpportunityForOwner's
      // own upsert idempotency), replacing the same row, not skip silently
      // and not append a second row.
      searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
      await claimAndProcessNextSearch(buildDeps({ searches, opportunities, scores }));

      expect(opportunities.rows).toHaveLength(1); // still no duplicate Opportunity
      expect(scores.rows).toHaveLength(1); // still no duplicate OpportunityScore row
      expect(scores.rows[0]!.id).toBe(firstScoreId);
    });

    it('a Scoring-stage failure surfaces as a failed attempt, using the existing worker retry/failure model — no soft-failure path', async () => {
      const scores = fakeOpportunityScoreRepository();
      scores.upsert = vi.fn().mockRejectedValue(new Error('score write failed'));
      const searches = fakeSearchRepository([seedSearch()]);

      const outcome = await claimAndProcessNextSearch(buildDeps({ searches, scores }));

      expect(outcome.outcome).toBe('retry');
      expect(searches.rows[0]!.status).toBe('PENDING');
    });

    it('leaves the four neutral scoring factors at zero weighted points — this wiring changes no scoring input', async () => {
      const scores = fakeOpportunityScoreRepository();
      const searches = fakeSearchRepository([seedSearch()]);

      await claimAndProcessNextSearch(buildDeps({ searches, scores }));

      const neutralFactors = ['icpFit', 'abilityToPay', 'urgency'] as const;
      for (const factorName of neutralFactors) {
        const factor = scores.rows[0]!.factors.find((f) => f.factor === factorName);
        expect(factor?.basis).toBe('UNKNOWN');
        expect(factor?.points).toBe(0);
      }
      const contactability = scores.rows[0]!.factors.find((f) => f.factor === 'contactability');
      expect(contactability?.points).toBe(0);
    });

    it('coexists with Qualification without changing Qualification’s own evaluation (R-70/R-71/Scenario E unaffected)', async () => {
      const scores = fakeOpportunityScoreRepository();
      const qualifications = fakeQualificationRepository();
      const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
      const researchProvider: ResearchProvider = {
        async research() {
          return qualifyingResearch();
        },
      };

      await claimAndProcessNextSearch(
        buildDeps({ searches, researchProvider: () => researchProvider, scores, qualifications }),
      );

      expect(scores.rows).toHaveLength(1);
      expect(qualifications.rows).toHaveLength(1);
      expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    });
  });

  it('logs discovery.completed with raw/accepted/skipped counts (Discovery-Query Audit — observability only)', async () => {
    // 3 raw candidates: 2 valid (distinct domains), 1 unusable (no website) —
    // proves candidatesReceived, accepted and skipped are all reported
    // correctly, not just the all-valid default fixture's 1/1/0 case.
    const discoveryProvider = fakeDiscoveryProvider([
      { name: 'Acme Co', website: 'https://acme.example.com' },
      { name: 'Beta Co', website: 'https://beta.example.com' },
      { name: 'No Website Co', website: null },
    ]);
    const searches = fakeSearchRepository([seedSearch()]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await claimAndProcessNextSearch(buildDeps({ searches, discoveryProvider }));
    // Read calls BEFORE mockRestore() — it resets call history as well as
    // restoring the original implementation.
    const calls = [...logSpy.mock.calls];
    logSpy.mockRestore();

    const discoveryLogCall = calls.find((call) =>
      String(call[0]).includes('"event":"discovery.completed"'),
    );
    expect(discoveryLogCall).toBeDefined();
    const logged = JSON.parse(discoveryLogCall![0] as string) as {
      event: string;
      searchId: string;
      candidatesReceived: number;
      accepted: number;
      skipped: number;
    };
    expect(logged).toMatchObject({
      event: 'discovery.completed',
      searchId: searches.rows[0]!.id,
      candidatesReceived: 3,
      accepted: 2,
      skipped: 1,
    });
    // The observability contract's own invariant, checked end to end through the worker.
    expect(logged.candidatesReceived).toBe(logged.accepted + logged.skipped);
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

// ---- Phase 24 regression suite (see
// requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md and
// requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md, Scenarios B/D/E).
// B and D below now assert POST-FIX behavior (R-70/R-71 are implemented —
// see packages/core-opportunity/src/adapters.ts's toOfferSignals()). E now
// asserts the settled Scenario E product contract — Option C, OBSERVED
// REQUIRED (requirement/PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md):
// INFERRED-only evidence can still produce needDetected=true (R-70/R-71's
// need-detection layer is classification-blind beyond excluding UNKNOWN,
// unchanged by this decision), but no longer satisfies the qualification
// layer's EVIDENCE_PRESENT criterion
// (packages/core-qualification/src/rules.ts's isEvidentiary()), so the
// Opportunity now reaches INSUFFICIENT_EVIDENCE rather than QUALIFIED.
describe('phase24: B/D/E — evidence relevance & qualification (R-70/R-71/E all settled)', () => {
  /**
   * Wraps the real, unmodified researchLead()/verifyProvenance() path
   * (@acos/core-research) instead of a stub ResearchProvider, so Scenario
   * B/D genuinely exercise the provenance gate against a directly-supplied
   * source document — deterministic, no network, no SourceDocumentProvider
   * HTTP fetch, no external API. This composes an already-exported
   * production function (researchLead) the same way
   * anthropicResearchProvider.ts does; it is not a new provider
   * abstraction.
   */
  function realProvenanceResearchProvider(
    model: ResearchModel,
    sourceDocuments: ResearchInput['sourceDocuments'],
  ): ResearchProvider {
    return {
      async research(input) {
        const outcome = await researchLead(model, {
          companyName: input.companyName,
          websiteUrl: `https://${input.normalizedDomain}`,
          // Path 2: mirrors anthropicResearchProvider.ts's own
          // `targetSegments: [...(input.targetSegments ?? [])]` — the real
          // pipeline (runResearchForOwner) now supplies this on every
          // ResearchProviderInput.
          targetSegments: [...(input.targetSegments ?? [])],
          sourceDocuments,
        });
        return outcome.research;
      },
    };
  }

  /** A ResearchModel that always returns the same fixed, schema-shaped JSON value. */
  function fakeModel(value: unknown): ResearchModel {
    return async () => ({ kind: 'json', value });
  }

  const websiteKeywordSearchOverrides = (): Partial<StoredSearch> => ({
    parameters: {
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['WEBSITE'],
      keywords: ['website', 'outdated', 'redesign', 'mobile'],
      rationale: 'They need a website refresh ({signal}).',
    },
  });

  const TARGET_NAME = 'Meridian Fitness Club';
  const TARGET_URL = 'https://meridian.example';

  /** OBSERVED-claim helper: `value` doubles as the cited quote, exactly as the audit's real transcript did. */
  const observedClaim = (value: string, sourceUrl: string, confidence = 80) => ({
    classification: 'OBSERVED' as const,
    value,
    evidence: [{ quote: value, sourceUrl, sourceLabel: 'Homepage' }],
    basis: null,
    confidence,
  });

  describe('R-70: source-to-business attribution', () => {
    it('B1: correct-business source with genuine evidence remains usable', async () => {
      // The fetched homepage genuinely belongs to the target business, and
      // says so — the same shape a real homepage's own byline takes. This
      // must NOT be penalized by R-70's mismatch check.
      const problemQuote = 'Meridian Fitness Club. Our website is outdated and hard to navigate on mobile.';
      const sourceDocuments = [{ label: 'Homepage', url: TARGET_URL, text: problemQuote }];
      const model = fakeModel({
        companySummary: unknown(),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [observedClaim(problemQuote, TARGET_URL)],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 75,
        gaps: [],
        // Path 2: this test asserts QUALIFIED, so the Prospect's target
        // segment ('Restaurants', from websiteKeywordSearchOverrides())
        // needs a MATCH determination — reuse the test's own genuine
        // quote/URL so provenance stays real.
        categoryPlausibility: [
          {
            fit: 'MATCH',
            rationale: 'fixture',
            evidence: [{ quote: problemQuote, sourceUrl: TARGET_URL, sourceLabel: 'Homepage' }],
            confidence: 90,
          },
        ],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: TARGET_NAME, website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          opportunities,
          qualifications,
        }),
      );

      expect(outcome.outcome).toBe('completed');
      expect(opportunities.rows[0]!.needDetected).toBe(true);
      expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    });

    it('B2: wrong-business source (genuine evidence, but for a different business) MUST NOT qualify the target', async () => {
      // The Goregaon Sports Club / heydrop.me shape from
      // MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md §1: the fetched homepage is
      // genuinely, verifiably for "HeyDrop" — a different business — and
      // the research output says so (a companySummary-shaped claim, the
      // natural place a model records what a site IS), while a SEPARATE
      // claim happens to contain a service keyword ("website"). Every
      // quote below is copied verbatim from its source, so provenance
      // (fidelity — "did you misquote the page") genuinely passes; R-70 is
      // a different guarantee (whose page is it) that this test proves is
      // now enforced.
      const identityQuote = 'HeyDrop. A simple way to share your digital business card.';
      const problemQuote = 'Our website is outdated and difficult to use on mobile devices.';
      const sourceDocuments = [
        {
          label: 'Homepage',
          url: TARGET_URL,
          text: `${identityQuote} ${problemQuote} We are proud of our support quality.`,
        },
      ];
      const model = fakeModel({
        companySummary: observedClaim(identityQuote, TARGET_URL),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [observedClaim(problemQuote, TARGET_URL)],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 70,
        gaps: [],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const signals = fakeResearchSignalRepository();
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: TARGET_NAME, website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          signals,
          opportunities,
          qualifications,
        }),
      );

      // Sanity: the pipeline still ran to completion and genuinely
      // persisted the OBSERVED evidence (provenance unaffected by R-70).
      expect(outcome.outcome).toBe('completed');
      expect(signals.rows.some((r) => r.classification === 'OBSERVED')).toBe(true);

      // R-70: MUST NOT result in needDetected=true -> QUALIFIED, even
      // though the "website" keyword genuinely matched a genuinely-cited
      // quote — because that quote's source does not correspond to this
      // business.
      expect(opportunities.rows).toHaveLength(1);
      expect(opportunities.rows[0]!.needDetected).toBe(false);
      expect(opportunities.rows[0]!.offer).toBeUndefined();
      expect(qualifications.rows[0]!.state).not.toBe('QUALIFIED');
    });

    it('B3: a source that cannot be attributed to any real business MUST NOT become qualifying evidence', async () => {
      // A parked/placeholder page — the source identity cannot be
      // established as the target business (or as any real business);
      // R-70 fails closed rather than defaulting to accepted.
      const placeholderQuote = 'Page Not Found. This domain is not configured.';
      const problemQuote = 'Our website is outdated and difficult to use on mobile devices.';
      const sourceDocuments = [
        { label: 'Homepage', url: TARGET_URL, text: `${placeholderQuote} ${problemQuote}` },
      ];
      const model = fakeModel({
        companySummary: observedClaim(placeholderQuote, TARGET_URL),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [observedClaim(problemQuote, TARGET_URL)],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 60,
        gaps: [],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: TARGET_NAME, website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          opportunities,
          qualifications,
        }),
      );

      expect(outcome.outcome).toBe('completed');
      expect(opportunities.rows[0]!.needDetected).toBe(false);
      expect(qualifications.rows[0]!.state).not.toBe('QUALIFIED');
    });
  });

  describe('R-71: topic-vs-problem relevance', () => {
    it('D1: a generic topic mention does not create a need', async () => {
      // Business A's own, genuinely-fetched homepage — but the only claim
      // ever made about it is a bare topical mention ("has a website"),
      // with no described defect anywhere.
      const topicQuote = 'Business A has a website.';
      const sourceDocuments = [
        {
          label: 'Homepage',
          url: TARGET_URL,
          text: `${topicQuote} Visit our website to learn more about our services.`,
        },
      ];
      const model = fakeModel({
        companySummary: observedClaim(topicQuote, TARGET_URL, 75),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 65,
        gaps: [],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const signals = fakeResearchSignalRepository();
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: 'Business A', website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          signals,
          opportunities,
          qualifications,
        }),
      );

      expect(outcome.outcome).toBe('completed');
      const observedSignal = signals.rows.find((r) => r.classification === 'OBSERVED');
      expect(observedSignal?.field).toBe('companySummary'); // a topical field, not visibleProblems/websiteIssues/...

      // R-71: a bare topic mention in a topical field MUST NOT establish a need.
      expect(opportunities.rows[0]!.needDetected).toBe(false);
      expect(qualifications.rows[0]!.state).not.toBe('QUALIFIED');
    });

    it('D2: a genuine, service-relevant problem survives the relevance gate', async () => {
      const problemQuote = 'Meridian Fitness Club. Our website navigation is broken on mobile.';
      const sourceDocuments = [{ label: 'Homepage', url: TARGET_URL, text: problemQuote }];
      const model = fakeModel({
        companySummary: unknown(),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [observedClaim(problemQuote, TARGET_URL)],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 78,
        gaps: [],
        // Path 2: this test asserts QUALIFIED, so the Prospect's target
        // segment ('Restaurants', from websiteKeywordSearchOverrides())
        // needs a MATCH determination — reuse the test's own genuine
        // quote/URL so provenance stays real.
        categoryPlausibility: [
          {
            fit: 'MATCH',
            rationale: 'fixture',
            evidence: [{ quote: problemQuote, sourceUrl: TARGET_URL, sourceLabel: 'Homepage' }],
            confidence: 90,
          },
        ],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const signals = fakeResearchSignalRepository();
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: TARGET_NAME, website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          signals,
          opportunities,
          qualifications,
        }),
      );

      expect(outcome.outcome).toBe('completed');
      const observedSignal = signals.rows.find((r) => r.classification === 'OBSERVED');
      expect(observedSignal?.field).toBe('websiteIssues'); // a problem/opportunity field

      // A genuine, service-relevant problem is still eligible — R-71 must
      // not make the system detect FEWER genuine needs than it does today.
      expect(opportunities.rows[0]!.needDetected).toBe(true);
      expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    });

    it('D3: a genuine but service-UNRELATED problem does not create a need', async () => {
      // A real, specific problem (visibleProblems — not topical) that has
      // nothing to do with the offered service (website development).
      // This already worked correctly via keyword mismatch before Phase
      // 24; R-71 must not disturb it.
      const problemQuote = 'Meridian Fitness Club has parking difficulties for members.';
      const sourceDocuments = [{ label: 'Homepage', url: TARGET_URL, text: problemQuote }];
      const model = fakeModel({
        companySummary: unknown(),
        businessModel: unknown(),
        targetCustomers: unknown(),
        visibleProblems: [observedClaim(problemQuote, TARGET_URL)],
        growthOpportunities: [],
        aiOpportunities: [],
        websiteIssues: [],
        contentOpportunities: [],
        automationOpportunities: [],
        recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
        confidence: 72,
        gaps: [],
      });

      const searches = fakeSearchRepository([seedSearch(websiteKeywordSearchOverrides())]);
      const opportunities = fakeOpportunityRepository();
      const qualifications = fakeQualificationRepository();

      const outcome = await claimAndProcessNextSearch(
        buildDeps({
          searches,
          discoveryProvider: fakeDiscoveryProvider([{ name: TARGET_NAME, website: TARGET_URL }]),
          researchProvider: () => realProvenanceResearchProvider(model, sourceDocuments),
          opportunities,
          qualifications,
        }),
      );

      expect(outcome.outcome).toBe('completed');
      expect(opportunities.rows[0]!.needDetected).toBe(false);
      expect(qualifications.rows[0]!.state).not.toBe('QUALIFIED');
    });
  });

  it('E1: phase24 Scenario E (Option C) — inferred-only evidence produces needDetected but is INSUFFICIENT_EVIDENCE, not QUALIFIED', async () => {
    // INFERRED claims carry no evidence/sources by schema (schema.ts's
    // superRefine forbids it), so verifyProvenance() never inspects them —
    // there is no provenance path to exercise here, unlike B/D above. A
    // fixed-LeadResearch fake ResearchProvider (the same convention this
    // file already uses elsewhere, e.g. sampleResearch()/
    // qualifyingResearch()) is the correct, sufficient boundary.
    const inferred = (value: string) => ({
      classification: 'INFERRED' as const,
      value,
      evidence: [],
      basis: 'reasoned from the sparse homepage content',
      confidence: 60,
    });

    const research = {
      companySummary: inferred('Likely a small local business with a modest online presence'),
      businessModel: inferred('Likely a single-location service business'),
      targetCustomers: inferred('Likely local residents'),
      visibleProblems: [],
      growthOpportunities: [],
      aiOpportunities: [],
      websiteIssues: [
        inferred(
          'Business A may need a website redesign because its online presence appears outdated',
        ),
      ],
      contentOpportunities: [],
      automationOpportunities: [],
      recommendedService: { service: 'NONE', rationale: 'n/a', basedOn: [] },
      confidence: 55,
      gaps: [],
    } as unknown as LeadResearch;

    // Reuses the existing qualifyingSearchOverrides() fixture (triggers:
    // ['WEBSITE'], keywords: ['redesign']) — it already matches the
    // INFERRED websiteIssues claim's "redesign" text.
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const signals = fakeResearchSignalRepository();
    const opportunities = fakeOpportunityRepository();
    const qualifications = fakeQualificationRepository();

    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        discoveryProvider: fakeDiscoveryProvider([
          { name: 'Business A', website: 'https://business-a.example' },
        ]),
        researchProvider: () => fakeResearchProvider(research),
        signals,
        opportunities,
        qualifications,
      }),
    );

    expect(outcome.outcome).toBe('completed');

    const byClassification = (c: string) => signals.rows.filter((r) => r.classification === c);
    expect(byClassification('OBSERVED')).toHaveLength(0);
    expect(byClassification('UNKNOWN')).toHaveLength(0);
    expect(byClassification('INFERRED').length).toBeGreaterThanOrEqual(1);

    // toOfferSignals() (core-opportunity/adapters.ts) still excludes only
    // UNKNOWN rows — OBSERVED and INFERRED remain indistinguishable to
    // suggestOffers() (the adapted ResearchSignal contract carries no
    // classification field at all), so needDetected is UNCHANGED by
    // Scenario E: it is computed at the need-detection layer, which this
    // decision does not touch.
    expect(opportunities.rows).toHaveLength(1);
    expect(opportunities.rows[0]!.needDetected).toBe(true);

    // Scenario E (Option C — OBSERVED REQUIRED,
    // requirement/PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md):
    // evaluateEvidencePresent() (core-qualification/rules.ts) now requires
    // at least one live OBSERVED signal. This Prospect has only INFERRED
    // evidence, so EVIDENCE_PRESENT fails and the Opportunity reaches
    // INSUFFICIENT_EVIDENCE rather than QUALIFIED, even though a need was
    // detected.
    expect(qualifications.rows).toHaveLength(1);
    expect(qualifications.rows[0]!.state).toBe('INSUFFICIENT_EVIDENCE');
    const evidencePresent = qualifications.rows[0]!.criteria.find(
      (c) => c.criterion === 'EVIDENCE_PRESENT',
    )!;
    expect(evidencePresent.satisfied).toBe(false);
    expect(evidencePresent.evidenceSignalIds).toEqual([]);
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
      categoryPlausibility: fakeCategoryPlausibilityRepository(),
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

describe('target customer match (PCG-4 production wiring, PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001)', () => {
  it('forwards deps.targetCustomerMatch into runResearchForOwner, reaching the write path end-to-end', async () => {
    const targetCustomerMatch = {
      repository: fakeTargetCustomerMatchRepository(),
      model: { model: fakeTargetCustomerMatchModel(), modelId: 'test-model', providerId: 'test-provider' },
    };
    const searches = fakeSearchRepository([seedSearch()]);

    const outcome = await claimAndProcessNextSearch(buildDeps({ searches, targetCustomerMatch }));

    expect(outcome).toMatchObject({ outcome: 'completed' });
    expect(targetCustomerMatch.repository.rows).toHaveLength(1);
    expect(targetCustomerMatch.repository.rows[0]!.searchId).toBe('search_1');
    expect(targetCustomerMatch.repository.rows[0]!.model).toBe('test-model');
    expect(targetCustomerMatch.repository.rows[0]!.provider).toBe('test-provider');
  });

  it('omitting deps.targetCustomerMatch changes nothing — existing pipeline compiles and completes unchanged', async () => {
    // Built without `buildDeps()` (rather than overriding to `undefined`)
    // so the field is genuinely absent, matching `exactOptionalPropertyTypes`
    // — mirrors the equivalent tests for `qualifications`/`personalizations`/
    // `outreachPreparations` above.
    const deps: SearchWorkerDeps = {
      searches: fakeSearchRepository([seedSearch()]),
      companies: fakeCompanyRepository(),
      prospects: fakeProspectRepository(),
      discoveryProvider: fakeDiscoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
      signals: fakeResearchSignalRepository(),
      researchProvider: () => fakeResearchProvider(sampleResearch()),
      opportunities: fakeOpportunityRepository(),
      categoryPlausibility: fakeCategoryPlausibilityRepository(),
      workerId: 'worker-a',
      now: () => NOW,
    };

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome).toMatchObject({ outcome: 'completed' });
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
      categoryPlausibility: fakeCategoryPlausibilityRepository(),
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

describe('follow-up preparation (Phase 23, R-66)', () => {
  it('runs Follow-Up Preparation immediately after Outreach Preparation, in order, for a Prepared Opportunity', async () => {
    const calls: string[] = [];
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const outreachPreparations = fakeOutreachPreparationRepository();
    const realUpsertO = outreachPreparations.upsert.bind(outreachPreparations);
    outreachPreparations.upsert = (async (...args: Parameters<typeof realUpsertO>) => {
      calls.push('outreachPreparation');
      return realUpsertO(...args);
    }) as typeof outreachPreparations.upsert;
    const followUpPreparations = fakeFollowUpPreparationRepository();
    const realUpsertF = followUpPreparations.upsert.bind(followUpPreparations);
    followUpPreparations.upsert = (async (...args: Parameters<typeof realUpsertF>) => {
      calls.push('followUpPreparation');
      return realUpsertF(...args);
    }) as typeof followUpPreparations.upsert;

    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);
    const outcome = await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        qualifications,
        personalizations,
        outreachPreparations,
        followUpPreparations,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', prospectsProcessed: 1 });
    expect(calls).toEqual(['outreachPreparation', 'followUpPreparation']);
    expect(followUpPreparations.rows).toHaveLength(1);
    expect(followUpPreparations.rows[0]!.opportunityId).toBe(outreachPreparations.rows[0]!.opportunityId);
    expect(followUpPreparations.rows[0]!.sourceOutreachPreparationId).toBe(outreachPreparations.rows[0]!.id);
    expect(followUpPreparations.rows[0]!.state).toBe('READY_FOR_REVIEW');
  });

  it('creates no Follow-Up Preparation row when Outreach Preparation itself produces no row', async () => {
    const followUpPreparations = fakeFollowUpPreparationRepository();
    const outreachPreparations = fakeOutreachPreparationRepository();
    const personalizations = fakePersonalizationRepository();
    const searches = fakeSearchRepository([seedSearch()]); // default seedSearch + sampleResearch() never match -> NOT_QUALIFIED -> no Personalization -> no Outreach Preparation

    const outcome = await claimAndProcessNextSearch(
      buildDeps({ searches, personalizations, outreachPreparations, followUpPreparations }),
    );

    expect(outcome.outcome).toBe('completed');
    expect(outreachPreparations.rows).toHaveLength(0);
    expect(followUpPreparations.rows).toHaveLength(0);
  });

  it('never runs Follow-Up Preparation when Outreach Preparation did not itself run in this pass, even if deps.followUpPreparations is configured', async () => {
    const followUpPreparations = fakeFollowUpPreparationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    // Built without `buildDeps()` (rather than overriding
    // `outreachPreparations` to `undefined`) so the field is genuinely
    // absent, matching `exactOptionalPropertyTypes` — mirrors the
    // equivalent Phase 22 test for `personalizations` above.
    const deps: SearchWorkerDeps = {
      searches,
      companies: fakeCompanyRepository(),
      prospects: fakeProspectRepository(),
      discoveryProvider: fakeDiscoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
      signals: fakeResearchSignalRepository(),
      researchProvider: () => fakeResearchProvider(qualifyingResearch()),
      opportunities: fakeOpportunityRepository(),
      qualifications: fakeQualificationRepository(),
      categoryPlausibility: fakeCategoryPlausibilityRepository(),
      personalizations: fakePersonalizationRepository(),
      followUpPreparations,
      workerId: 'worker-a',
      now: () => NOW,
    };

    const outcome = await claimAndProcessNextSearch(deps);

    expect(outcome.outcome).toBe('completed');
    expect(followUpPreparations.rows).toHaveLength(0);
  });

  it('a Follow-Up-Preparation-stage failure surfaces as a failed attempt, without touching ResearchSignals/Opportunity/Qualification/Personalization/OutreachPreparation', async () => {
    const followUpPreparations = fakeFollowUpPreparationRepository();
    followUpPreparations.upsert = vi.fn().mockRejectedValue(new Error('follow-up preparation write failed'));
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const outreachPreparations = fakeOutreachPreparationRepository();
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
        followUpPreparations,
      }),
    );

    expect(outcome.outcome).toBe('retry');
    expect(searches.rows[0]!.status).toBe('PENDING');
    // Upstream state, already committed to their own fakes before the
    // Follow-Up Preparation stage threw, is left exactly as it was.
    expect(qualifications.rows).toHaveLength(1);
    expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
    expect(personalizations.rows).toHaveLength(1);
    expect(outreachPreparations.rows).toHaveLength(1);
    expect(opportunities.rows).toHaveLength(1);
    expect(signals.rows.length).toBeGreaterThan(0);
  });

  it('R-69: idempotent on retry — re-running against unchanged Outreach Preparation replaces the same row, no duplicates', async () => {
    const opportunities = fakeOpportunityRepository();
    const qualifications = fakeQualificationRepository();
    const personalizations = fakePersonalizationRepository();
    const outreachPreparations = fakeOutreachPreparationRepository();
    const followUpPreparations = fakeFollowUpPreparationRepository();
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
        followUpPreparations,
      }),
    );
    expect(followUpPreparations.rows).toHaveLength(1);
    const firstId = followUpPreparations.rows[0]!.id;

    searches.rows[0] = { ...searches.rows[0]!, status: 'PENDING' };
    await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider,
        opportunities,
        qualifications,
        personalizations,
        outreachPreparations,
        followUpPreparations,
      }),
    );

    expect(outreachPreparations.rows).toHaveLength(1);
    expect(followUpPreparations.rows).toHaveLength(1); // still no duplicate row
    expect(followUpPreparations.rows[0]!.id).toBe(firstId);
  });

  it('R-68: no field, state, or exported function in this stage implies send/schedule/delivery', async () => {
    const outreachPreparations = fakeOutreachPreparationRepository();
    const followUpPreparations = fakeFollowUpPreparationRepository();
    const searches = fakeSearchRepository([seedSearch(qualifyingSearchOverrides())]);

    await claimAndProcessNextSearch(
      buildDeps({
        searches,
        researchProvider: () => fakeResearchProvider(qualifyingResearch()),
        personalizations: fakePersonalizationRepository(),
        qualifications: fakeQualificationRepository(),
        outreachPreparations,
        followUpPreparations,
      }),
    );

    expect(followUpPreparations.rows[0]!.state).toBe('READY_FOR_REVIEW');
    expect(followUpPreparations.rows[0]).not.toHaveProperty('sentAt');
    expect(followUpPreparations.rows[0]).not.toHaveProperty('deliveredAt');
    expect(followUpPreparations.rows[0]).not.toHaveProperty('scheduledAt');
  });
});

// ---- Intent intake (INTENT-INTAKE-PO-DEC-001) -----------------------------
// recordIntentSignalForOwner feeds ONE PUBLIC_INTENT/FIRST_PARTY signal into
// the existing pipeline (D4: existing Research, then the same post-research
// code runCanonicalPipeline runs). Fakes only — no provider is ever called.

describe('intent intake (INTENT-INTAKE-PO-DEC-001)', () => {
  const OBSERVED_AT = new Date('2026-01-30T09:15:00.000Z');
  /** Complete integration evidence (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 OD-1..OD-5); fixture values only. */
  const AUTHORIZATION_EVIDENCE: AuthorizationEvidence = {
    businessId: 'integration-business-0001',
    status: 'GRANTED',
    scope: 'ACQUISITION',
    authorizedAt: new Date('2026-01-15T00:00:00.000Z'),
    integrationId: 'integration-0001',
  };

  // OD-13 Option B (IA-OD13-B): FIRST_PARTY intake needs the proof the
  // verifier issued. Test-only Ed25519 key (fixed seed) and test-only ids.
  const TEST_SIGNING_KEY = createPrivateKey({
    key: Buffer.from(`302e020100300506032b657004220420${'33'.repeat(32)}`, 'hex'),
    format: 'der',
    type: 'pkcs8',
  });
  /** Signs `result` as `integrationId` and verifies it (P1), received at NOW. */
  function signedProof(result: unknown, integrationId = AUTHORIZATION_EVIDENCE.integrationId) {
    const registry = createProviderPublicKeyRegistry([
      { integrationId, keyId: 'test-key-1', publicKey: createPublicKey(TEST_SIGNING_KEY), validFrom: new Date(0), validUntil: null },
    ]);
    const rawBody = Buffer.from(
      JSON.stringify({ version: 1, integrationId, keyId: 'test-key-1', signedAt: NOW.toISOString(), result }),
    );
    const verification = verifyProviderEnvelope(
      { rawBody, integrationId, keyId: 'test-key-1', signature: sign(null, rawBody, TEST_SIGNING_KEY).toString('base64') },
      { registry, receivedAt: NOW },
    );
    if (!verification.ok) throw new Error('test proof failed verification');
    return verification.verified;
  }
  /**
   * OD-13 X1: the proof must carry the exact result the FIRST_PARTY signals
   * derive from. Signs an AI-platform result (AI_REFERRAL) whose
   * SUPPLIED_TO_US items are `event`'s FIRST_PARTY entries, in order, for
   * `event`'s company. PUBLIC_INTENT entries are outside the binding.
   */
  function providerProof(
    event: { companyName: string; website: string; signals: readonly Record<string, unknown>[] },
    integrationId = AUTHORIZATION_EVIDENCE.integrationId,
  ) {
    const firstParty = event.signals.filter((entry) => entry.kind === 'FIRST_PARTY');
    return signedProof(
      {
        sourceFamily: 'AI_PLATFORM_ACQUISITION',
        acquisitionType: 'AI_REFERRAL',
        externalId: 'aiad-evt-0001',
        business: { name: event.companyName, website: event.website },
        sourceReference: (firstParty[0]?.sourceUrl as string | undefined) ?? 'https://landing.example.com/forms/7',
        evidence: firstParty.map((entry) => ({
          origin: 'SUPPLIED_TO_US',
          derivation: 'STATED_BY_BUSINESS',
          requirement: entry.field,
          statement: entry.quote,
          referenceUrl: entry.sourceUrl,
          observedAt: entry.observedAt,
        })),
        capturedAt: NOW,
        provenance: { integration: integrationId, retrieval: 'AUTHORIZED_INTEGRATION' },
        authorization: { ...AUTHORIZATION_EVIDENCE, integrationId, basis: 'fixture: basis as stated by the integration', reference: null },
      },
      integrationId,
    );
  }

  function intakeInput(overrides: Record<string, unknown> = {}) {
    return {
      searchId: 'search_1',
      companyName: 'Acme Co',
      website: 'https://acme.example.com',
      kind: 'PUBLIC_INTENT' as const,
      field: 'requestedMobileApp' as const,
      quote: 'Looking for someone to build an app for our restaurant',
      sourceUrl: 'https://forum.example.org/t/123',
      sourceLabel: 'Public forum post',
      observedAt: OBSERVED_AT,
      ...overrides,
    } as Parameters<typeof recordIntentSignalForOwner>[2];
  }

  function intakeSearch(parameters: Partial<StoredSearch['parameters']> = {}): StoredSearch {
    const base = seedSearch({ status: 'COMPLETE' });
    return { ...base, parameters: { ...base.parameters, ...parameters } };
  }

  function mismatchResearch(): LeadResearch {
    return {
      ...sampleResearch(),
      categoryPlausibility: [
        {
          fit: 'MISMATCH',
          rationale: 'fixture',
          evidence: [
            { quote: 'Acme sells warehouse robotics', sourceUrl: 'https://acme.test/about', sourceLabel: 'homepage' },
          ],
        },
      ],
    } as unknown as LeadResearch;
  }

  it('intake → Prospect → OBSERVED signal → existing Research → determination → Opportunity → Score → Qualification, in order', async () => {
    const calls: string[] = [];
    const signals = fakeResearchSignalRepository();
    const realSave = signals.saveSignals.bind(signals);
    signals.saveSignals = (async (...args: Parameters<typeof realSave>) => {
      calls.push(`signals:${args[1][0]!.kind}`);
      return realSave(...args);
    }) as typeof signals.saveSignals;
    const scores = fakeOpportunityScoreRepository();
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch()]),
      signals,
      scores,
      researchProvider: () => ({
        async research() {
          calls.push('research');
          return sampleResearch();
        },
      }),
    });

    const result = await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);

    expect(calls[0]).toBe('signals:PUBLIC_INTENT');
    expect(calls[1]).toBe('research');
    expect(result.researched).toBe(true);
    expect(result.prospect.searchId).toBe('search_1');
    expect(result.company.normalizedDomain).toBe('acme.example.com');
    expect(result.signal).toMatchObject({
      kind: 'PUBLIC_INTENT',
      classification: 'OBSERVED',
      confidence: 70,
      field: 'requestedMobileApp',
      signal: 'Looking for someone to build an app for our restaurant',
      basis: null,
      observedAt: OBSERVED_AT,
      supersededAt: null,
    });
    expect(result.signal.sources).toEqual([
      expect.objectContaining({
        sourceUrl: 'https://forum.example.org/t/123',
        sourceQuote: 'Looking for someone to build an app for our restaurant',
        sourceLabel: 'Public forum post',
      }),
    ]);
    // Research ran through the existing path and persisted its determination.
    const categoryPlausibility = deps.categoryPlausibility as ReturnType<
      typeof fakeCategoryPlausibilityRepository
    >;
    expect(categoryPlausibility.rows).toHaveLength(1);
    expect(categoryPlausibility.rows[0]!.prospectId).toBe(result.prospect.id);
    // The intake signal survives the Research run it triggered (C2).
    const active = await signals.listByProspect('user_a', result.prospect.id);
    expect(active.map((row) => row.kind)).toContain('PUBLIC_INTENT');
    // Existing post-research pipeline ran once, for this Prospect.
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(deps.opportunities.rows[0]!.id).toBe(result.opportunityId);
    expect(scores.rows).toHaveLength(1);
    expect(deps.qualifications.rows).toHaveLength(1);
  });

  it('D5: FIRST_PARTY is stored OBSERVED at confidence 90 with its observedAt, distinct from the capture clock', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    const result = await recordIntentIntakeForOwner(
      deps,
      'user_a',
      intakeEvent([{ ...FIRST_PARTY_ENTRY, quote: 'I need an app for my coaching institute', observedAt: OBSERVED_AT }]),
      NOW,
    );
    expect(result.signals[0]).toMatchObject({ kind: 'FIRST_PARTY', classification: 'OBSERVED', confidence: 90 });
    expect(result.signals[0]!.observedAt).toEqual(OBSERVED_AT);
    expect(result.signals[0]!.observedAt).not.toEqual(NOW);
  });

  it('OD-7: the single-signal form rejects FIRST_PARTY, even with evidence — nothing is created', async () => {
    const companies = fakeCompanyRepository();
    const findOrCreate = vi.spyOn(companies, 'findOrCreateByDomain');
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), companies });
    await expect(
      recordIntentSignalForOwner(
        deps,
        'user_a',
        intakeInput({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: AUTHORIZATION_EVIDENCE }),
        NOW,
      ),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field: 'kind', reason: 'not-allowed' });
    expect((deps.signals as ReturnType<typeof fakeResearchSignalRepository>).rows).toHaveLength(0);
    expect(findOrCreate).not.toHaveBeenCalled();
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it('D5: a caller-supplied confidence is rejected and nothing is persisted', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentSignalForOwner(deps, 'user_a', intakeInput({ confidence: 100 }), NOW),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field: 'confidence', reason: 'not-allowed' });
    expect((deps.signals as ReturnType<typeof fakeResearchSignalRepository>).rows).toHaveLength(0);
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it('rejects a kind outside PUBLIC_INTENT/FIRST_PARTY', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentSignalForOwner(deps, 'user_a', intakeInput({ kind: 'JOB_POST' }), NOW),
    ).rejects.toBeInstanceOf(IntentSignalValidationError);
  });

  it('G1: an unusable website is rejected — no Company, Prospect or Signal is invented', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentSignalForOwner(deps, 'user_a', intakeInput({ website: 'http://' }), NOW),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field: 'website' });
    expect((deps.signals as ReturnType<typeof fakeResearchSignalRepository>).rows).toHaveLength(0);
  });

  it("G2: requires the caller's own existing Search — unknown or another user's Search is not found", async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentSignalForOwner(deps, 'user_a', intakeInput({ searchId: 'search_missing' }), NOW),
    ).rejects.toBeInstanceOf(IntentIntakeSearchNotFoundError);
    await expect(
      recordIntentSignalForOwner(deps, 'user_b', intakeInput(), NOW),
    ).rejects.toBeInstanceOf(IntentIntakeSearchNotFoundError);
    expect(deps.searches.rows).toHaveLength(1); // no intake Search created
  });

  it('dedup within one Search: two signals for the same company → one Company, one Prospect, one Opportunity, two Signals; research runs once (D4)', async () => {
    const researchCalls = vi.fn();
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch()]),
      researchProvider: () => ({
        async research() {
          researchCalls();
          return sampleResearch();
        },
      }),
    });

    const first = await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    const second = await recordIntentIntakeForOwner(
      deps,
      'user_a',
      intakeEvent([FIRST_PARTY_ENTRY], { website: 'www.ACME.example.com/contact' }),
      NOW,
    );

    expect(second.company.id).toBe(first.company.id);
    expect(second.prospect.id).toBe(first.prospect.id);
    expect(second.opportunityId).toBe(first.opportunityId);
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(second.researched).toBe(false); // determination already existed
    expect(researchCalls).toHaveBeenCalledTimes(1);
    const active = await deps.signals.listByProspect('user_a', first.prospect.id);
    expect(active.filter((row) => row.kind === 'PUBLIC_INTENT')).toHaveLength(1);
    expect(active.filter((row) => row.kind === 'FIRST_PARTY')).toHaveLength(1);
  });

  it('C2: re-running Research supersedes and replaces research signals only — PUBLIC_INTENT and FIRST_PARTY stay active', async () => {
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), signals });
    const first = await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    await recordIntentIntakeForOwner(
      deps,
      'user_a',
      intakeEvent([{ ...FIRST_PARTY_ENTRY, quote: 'Need an app, 3 lakh' }]),
      NOW,
    );
    const isResearchRow = (row: StoredResearchSignal) => !isIntentSignalKind(row.kind);
    const researchBefore = signals.rows.filter((row) => isResearchRow(row) && row.supersededAt === null);
    expect(researchBefore.length).toBeGreaterThan(0);

    await researchProspectForOwner(deps, 'user_a', first.prospect.id);

    // Existing research semantics unchanged: every prior research row is superseded, fresh rows replace them.
    expect(researchBefore.every((row) => row.supersededAt !== null)).toBe(true);
    const active = await signals.listByProspect('user_a', first.prospect.id);
    const researchAfter = active.filter(isResearchRow);
    expect(researchAfter).toHaveLength(researchBefore.length);
    expect(researchAfter.some((row) => researchBefore.some((before) => before.id === row.id))).toBe(false);
    expect(active.filter((row) => row.kind === 'PUBLIC_INTENT')).toHaveLength(1);
    expect(active.filter((row) => row.kind === 'FIRST_PARTY')).toHaveLength(1);
  });

  it('D3: a ServiceProfile that does not list the intake kind gets no offer from it', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['WEBSITE'], keywords: ['app'] })]),
    });
    await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    expect(deps.opportunities.rows[0]!.needDetected).toBe(false);
    expect(deps.qualifications.rows[0]!.state).toBe('NOT_QUALIFIED');
  });

  it('D3: a ServiceProfile opting into PUBLIC_INTENT can consume the signal through the existing offer engine', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] })]),
    });
    await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    const opportunity = deps.opportunities.rows[0]!;
    expect(opportunity.needDetected).toBe(true);
    expect(opportunity.offer!.basedOn).toEqual(['Looking for someone to build an app for our restaurant']);
    expect(opportunity.offer!.fit).toBe(70);
    expect(deps.qualifications.rows[0]!.state).toBe('QUALIFIED');
  });

  it('D3: a ServiceProfile opting into FIRST_PARTY consumes FIRST_PARTY but not PUBLIC_INTENT', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['FIRST_PARTY'], keywords: ['app'] })]),
    });
    await recordIntentIntakeForOwner(
      deps,
      'user_a',
      intakeEvent([{ ...FIRST_PARTY_ENTRY, quote: 'I need an app for my institute' }]),
      NOW,
    );
    expect(deps.opportunities.rows[0]!.needDetected).toBe(true);
    expect(deps.opportunities.rows[0]!.offer!.fit).toBe(90);

    const other = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['FIRST_PARTY'], keywords: ['app'] })]),
    });
    await recordIntentSignalForOwner(other, 'user_a', intakeInput(), NOW); // PUBLIC_INTENT
    expect(other.opportunities.rows[0]!.needDetected).toBe(false);
  });

  it('D4: CATEGORY_PLAUSIBLE stays enforced — an opted-in intent need with a MISMATCH determination is NOT_QUALIFIED', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] })]),
      researchProvider: () => fakeResearchProvider(mismatchResearch()),
    });
    await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    expect(deps.opportunities.rows[0]!.needDetected).toBe(true);
    const qualification = deps.qualifications.rows[0]!;
    expect(qualification.state).toBe('NOT_QUALIFIED');
    expect(qualification.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!.satisfied).toBe(false);
  });

  // ---- Multi-signal intake event ------------------------------------------

  function intakeEvent(signals: Record<string, unknown>[], overrides: Record<string, unknown> = {}) {
    const event = {
      searchId: 'search_1',
      companyName: 'Acme Co',
      website: 'https://acme.example.com',
      signals: signals.map((entry) => ({
        kind: 'PUBLIC_INTENT',
        field: 'requestedMobileApp',
        quote: 'Looking for someone to build an app for our restaurant',
        sourceUrl: 'https://forum.example.org/t/123',
        sourceLabel: 'Public forum post',
        observedAt: OBSERVED_AT,
        ...entry,
      })),
      ...overrides,
    };
    return {
      ...(signals.some((entry) => entry.kind === 'FIRST_PARTY') ? { providerAuthenticity: providerProof(event) } : {}),
      ...event,
    } as Parameters<typeof recordIntentIntakeForOwner>[2];
  }

  const FIRST_PARTY_ENTRY = {
    kind: 'FIRST_PARTY',
    field: 'statedRequirement',
    quote: 'We want an ordering app, budget 3 lakh',
    sourceUrl: 'https://landing.example.com/forms/7',
    sourceLabel: 'AI-platform acquisition · ai referral',
    observedAt: new Date('2026-01-31T10:00:00.000Z'),
    authorizationEvidence: AUTHORIZATION_EVIDENCE,
  };

  // ---- FIRST_PARTY authorization evidence (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001) ----

  it('OD-7 / OD-8: evidence reaches saveSignals on the FIRST_PARTY row only; PUBLIC_INTENT carries none', async () => {
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), signals });
    await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW);
    const intakeInputs = signals.inputs.filter((input) => isIntentSignalKind(input.kind));
    expect(intakeInputs.map((input) => input.kind)).toEqual(['PUBLIC_INTENT', 'FIRST_PARTY']);
    expect(intakeInputs[0]).not.toHaveProperty('authorizationEvidence');
    expect(intakeInputs[1]!.authorizationEvidence).toEqual(AUTHORIZATION_EVIDENCE);
    // Research-produced rows never carry evidence.
    expect(signals.inputs.filter((input) => !isIntentSignalKind(input.kind)).every((input) => input.authorizationEvidence === undefined)).toBe(true);
  });

  it.each([
    ['no evidence', { authorizationEvidence: undefined }, 'signals[1].authorizationEvidence', 'required'],
    ['REVOKED', { authorizationEvidence: { ...AUTHORIZATION_EVIDENCE, status: 'REVOKED' } }, 'signals[1].authorizationEvidence.status', 'not-allowed'],
    [
      'expired (> 90 days before receipt)',
      { authorizationEvidence: { ...AUTHORIZATION_EVIDENCE, authorizedAt: new Date('2025-11-01T00:00:00.000Z') } },
      'signals[1].authorizationEvidence.authorizedAt',
      'not-allowed',
    ],
  ])('OD-6 / OD-7: FIRST_PARTY with %s rejects the whole event before any write', async (_name, patch, field, reason) => {
    const signals = fakeResearchSignalRepository();
    const companies = fakeCompanyRepository();
    const findOrCreate = vi.spyOn(companies, 'findOrCreateByDomain');
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), signals, companies });
    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, { ...FIRST_PARTY_ENTRY, ...patch }]), NOW),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field, reason });
    expect(signals.rows).toHaveLength(0);
    expect(findOrCreate).not.toHaveBeenCalled();
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it.each([
    ['no proof', { providerAuthenticity: undefined }, 'providerAuthenticity', 'required'],
    ['a forged proof', { providerAuthenticity: { integrationId: 'integration-0001', keyId: 'test-key-1' } }, 'providerAuthenticity', 'required'],
    ['a proof for another integration', { providerAuthenticity: 'OTHER' }, 'signals[1].authorizationEvidence.integrationId', 'invalid'],
  ])('OD-13 P3: FIRST_PARTY with %s is refused at the save boundary before any lookup or write', async (_name, patch, field, reason) => {
    const signals = fakeResearchSignalRepository();
    const companies = fakeCompanyRepository();
    const findOrCreate = vi.spyOn(companies, 'findOrCreateByDomain');
    const searches = fakeSearchRepository([intakeSearch()]);
    const getById = vi.spyOn(searches, 'getById');
    const deps = buildDeps({ searches, signals, companies });
    const proof =
      patch.providerAuthenticity === 'OTHER'
        ? providerProof(intakeEvent([{}, FIRST_PARTY_ENTRY]), 'integration-9999')
        : patch.providerAuthenticity;
    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', { ...intakeEvent([{}, FIRST_PARTY_ENTRY]), providerAuthenticity: proof as never }, NOW),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field, reason });
    expect(getById).not.toHaveBeenCalled();
    expect(findOrCreate).not.toHaveBeenCalled();
    expect(signals.rows).toHaveLength(0);
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it.each([
    ['a changed quote', (event: Record<string, unknown>) => ({ ...event, signals: [(event.signals as unknown[])[0], { ...FIRST_PARTY_ENTRY, quote: 'We want a different app' }] }), 'signals[1]'],
    ['an extra FIRST_PARTY entry', (event: Record<string, unknown>) => ({ ...event, signals: [...(event.signals as unknown[]), FIRST_PARTY_ENTRY] }), 'signals[3]'],
    ['a missing FIRST_PARTY entry', (event: Record<string, unknown>) => ({ ...event, signals: (event.signals as unknown[]).slice(0, 2) }), 'signals'],
    ['a changed companyName', (event: Record<string, unknown>) => ({ ...event, companyName: 'Other Co' }), 'companyName'],
    ['a changed website', (event: Record<string, unknown>) => ({ ...event, website: 'https://other.example.com' }), 'website'],
  ])('OD-13 X1: FIRST_PARTY with %s is refused as result-mismatch before any lookup or write', async (_name, alter, field) => {
    const signals = fakeResearchSignalRepository();
    const companies = fakeCompanyRepository();
    const findOrCreate = vi.spyOn(companies, 'findOrCreateByDomain');
    const searches = fakeSearchRepository([intakeSearch()]);
    const getById = vi.spyOn(searches, 'getById');
    const deps = buildDeps({ searches, signals, companies });
    const genuine = intakeEvent([{}, FIRST_PARTY_ENTRY, { ...FIRST_PARTY_ENTRY, quote: 'Delivery tracking is a must' }]);
    const presented = { ...alter(genuine as unknown as Record<string, unknown>), providerAuthenticity: genuine.providerAuthenticity };
    const error = await recordIntentIntakeForOwner(deps, 'user_a', presented as never, NOW).catch((e: unknown) => e);
    expect(error).toMatchObject({ name: 'IntentSignalValidationError', field, reason: 'result-mismatch' });
    expect(JSON.stringify(error) + (error as Error).message).not.toMatch(/Other Co|other\.example|different app|ordering app|Delivery tracking|Acme|integration-/);
    expect(getById).not.toHaveBeenCalled();
    expect(findOrCreate).not.toHaveBeenCalled();
    expect(signals.rows).toHaveLength(0);
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it('OD-13 X1: a genuine proof whose result carries no SUPPLIED_TO_US item cannot authorize hand-built FIRST_PARTY signals', async () => {
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), signals });
    const event = { ...intakeEvent([{}, FIRST_PARTY_ENTRY]), providerAuthenticity: signedProof({ fixture: true }) };
    await expect(recordIntentIntakeForOwner(deps, 'user_a', event, NOW)).rejects.toMatchObject({
      name: 'IntentSignalValidationError',
      field: 'signals[1]',
      reason: 'result-mismatch',
    });
    expect(signals.rows).toHaveLength(0);
  });

  it('OD-13 X1: PUBLIC_INTENT entries and searchId are outside the binding; the same proof is accepted again (not single-use)', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch(), { ...intakeSearch(), id: 'search_2' }]) });
    const genuine = intakeEvent([{}, FIRST_PARTY_ENTRY]);
    const extraPublic = { ...genuine.signals[0]!, quote: 'Also want a loyalty app' };
    const first = await recordIntentIntakeForOwner(deps, 'user_a', { ...genuine, signals: [extraPublic, ...genuine.signals, extraPublic] }, NOW);
    const second = await recordIntentIntakeForOwner(deps, 'user_a', { ...genuine, searchId: 'search_2' }, NOW);
    expect(first.signals.map((row) => row.kind)).toEqual(['PUBLIC_INTENT', 'PUBLIC_INTENT', 'FIRST_PARTY', 'PUBLIC_INTENT']);
    expect(second.signals.map((row) => row.kind)).toEqual(['PUBLIC_INTENT', 'FIRST_PARTY']);
  });

  it('OD-13 Q12: an event with no FIRST_PARTY signal needs no proof', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    const result = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}]), NOW);
    expect(result.signals.map((row) => row.kind)).toEqual(['PUBLIC_INTENT']);
  });

  it('OD-7: evidence on a PUBLIC_INTENT entry rejects the whole event', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{ authorizationEvidence: AUTHORIZATION_EVIDENCE }]), NOW),
    ).rejects.toMatchObject({ field: 'signals[0].authorizationEvidence', reason: 'not-allowed' });
    expect((deps.signals as ReturnType<typeof fakeResearchSignalRepository>).rows).toHaveLength(0);
  });

  it('OD-8 / OD-12: a failed signal write rolls back every signal of the event, is thrown, and is not retried; nothing downstream runs', async () => {
    const signals = fakeResearchSignalRepository();
    const realSave = signals.saveSignals.bind(signals);
    let calls = 0;
    signals.saveSignals = (async (...args: Parameters<typeof realSave>) => {
      calls += 1;
      if (calls === 2) throw new Error('simulated source INSERT failure');
      return realSave(...args);
    }) as typeof signals.saveSignals;
    const researchCalls = vi.fn();
    const companies = fakeCompanyRepository();
    const findOrCreate = vi.spyOn(companies, 'findOrCreateByDomain');
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch()]),
      signals,
      companies,
      researchProvider: () => ({
        async research() {
          researchCalls();
          return sampleResearch();
        },
      }),
    });

    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW),
    ).rejects.toThrow('simulated source INSERT failure');

    expect(calls).toBe(2); // no automatic retry
    expect(signals.rows).toHaveLength(0);
    expect(signals.inputs).toHaveLength(0);
    expect(researchCalls).not.toHaveBeenCalled();
    expect(deps.opportunities.rows).toHaveLength(0);
    // Company / Prospect find-or-create stay outside the transaction (OD-8 item 2).
    expect(findOrCreate).toHaveBeenCalledTimes(1);
  });

  it('OD-8: every signal write of one event runs inside one signalTransaction call', async () => {
    const signals = fakeResearchSignalRepository();
    let transactions = 0;
    let writesOutside = 0;
    let inside = false;
    const realSave = signals.saveSignals.bind(signals);
    signals.saveSignals = (async (...args: Parameters<typeof realSave>) => {
      if (!inside && isIntentSignalKind(args[1][0]!.kind)) writesOutside += 1;
      return realSave(...args);
    }) as typeof signals.saveSignals;
    const base = fakeSignalTransaction(signals);
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch()]),
      signals,
      signalTransaction: async (fn) => {
        transactions += 1;
        inside = true;
        try {
          return await base(fn);
        } finally {
          inside = false;
        }
      },
    });
    await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY, {}]), NOW);
    expect(transactions).toBe(1);
    expect(writesOutside).toBe(0);
  });

  it('multi-signal: one event with PUBLIC_INTENT + FIRST_PARTY persists both — OBSERVED, 70 / 90, each with its own observedAt, neither superseded', async () => {
    const researchCalls = vi.fn();
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch()]),
      signals,
      researchProvider: () => ({
        async research() {
          researchCalls();
          return sampleResearch();
        },
      }),
    });

    const result = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW);

    expect(result.signals).toHaveLength(2);
    expect(result.signals[0]).toMatchObject({
      kind: 'PUBLIC_INTENT',
      classification: 'OBSERVED',
      confidence: 70,
      observedAt: OBSERVED_AT,
      supersededAt: null,
    });
    expect(result.signals[1]).toMatchObject({
      kind: 'FIRST_PARTY',
      classification: 'OBSERVED',
      confidence: 90,
      observedAt: FIRST_PARTY_ENTRY.observedAt,
      supersededAt: null,
    });
    // Research ran after both signals were stored, and neither was superseded by it.
    const active = await signals.listByProspect('user_a', result.prospect.id);
    expect(active.filter((row) => row.kind === 'PUBLIC_INTENT')).toHaveLength(1);
    expect(active.filter((row) => row.kind === 'FIRST_PARTY')).toHaveLength(1);
    expect(researchCalls).toHaveBeenCalledTimes(1);
    expect(result.researched).toBe(true);
    // The existing pipeline ran once for the one Prospect.
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(deps.opportunities.rows[0]!.id).toBe(result.opportunityId);
    expect(deps.qualifications.rows).toHaveLength(1);
  });

  it('multi-signal: a one-signal event behaves exactly like the single-signal form', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    const result = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}]), NOW);
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0]).toMatchObject({ kind: 'PUBLIC_INTENT', classification: 'OBSERVED', confidence: 70 });
    expect(deps.opportunities.rows).toHaveLength(1);
  });

  it('multi-signal: a caller-supplied confidence on any entry rejects the whole event — nothing is persisted', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]) });
    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, { ...FIRST_PARTY_ENTRY, confidence: 100 }]), NOW),
    ).rejects.toMatchObject({ name: 'IntentSignalValidationError', field: 'signals[1].confidence', reason: 'not-allowed' });
    await expect(
      recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}], { confidence: 100 }), NOW),
    ).rejects.toMatchObject({ field: 'confidence', reason: 'not-allowed' });
    await expect(recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([]), NOW)).rejects.toMatchObject({
      field: 'signals',
      reason: 'required',
    });
    expect((deps.signals as ReturnType<typeof fakeResearchSignalRepository>).rows).toHaveLength(0);
    expect(deps.opportunities.rows).toHaveLength(0);
  });

  it('supersession: repeated multi-signal intake and a later Research run keep every intake signal active; research rows are still superseded same-kind', async () => {
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch()]), signals });
    const first = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW);
    const second = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW);
    expect(second.prospect.id).toBe(first.prospect.id);
    expect(second.researched).toBe(false);

    const isResearchRow = (row: StoredResearchSignal) => !isIntentSignalKind(row.kind);
    const researchBefore = signals.rows.filter((row) => isResearchRow(row) && row.supersededAt === null);
    expect(researchBefore.length).toBeGreaterThan(0);

    await researchProspectForOwner(deps, 'user_a', first.prospect.id);

    expect(researchBefore.every((row) => row.supersededAt !== null)).toBe(true);
    const active = await signals.listByProspect('user_a', first.prospect.id);
    expect(active.filter(isResearchRow)).toHaveLength(researchBefore.length);
    expect(active.filter((row) => row.kind === 'PUBLIC_INTENT')).toHaveLength(2);
    expect(active.filter((row) => row.kind === 'FIRST_PARTY')).toHaveLength(2);
  });

  it('E1: intake on a Prospect with an existing Opportunity creates no second Opportunity and leaves its offer / next action untouched', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] })]),
    });
    // FIRST_PARTY is not opted in, so the Opportunity is created with no offer.
    const first = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([FIRST_PARTY_ENTRY]), NOW);
    expect(deps.opportunities.rows).toHaveLength(1);
    const before = structuredClone(deps.opportunities.rows[0]!);
    expect(before.needDetected).toBe(false);

    // An opted-in PUBLIC_INTENT signal arrives later — it is persisted, but the offer is not re-evaluated.
    const later = new Date(NOW.getTime() + 60_000);
    const second = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), later);

    expect(second.opportunityId).toBe(first.opportunityId);
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(deps.opportunities.rows[0]).toEqual(before);
    const active = await deps.signals.listByProspect('user_a', first.prospect.id);
    expect(active.filter((row) => row.kind === 'PUBLIC_INTENT')).toHaveLength(1);
  });

  it.each(['PENDING', 'RUNNING', 'COMPLETE', 'FAILED', 'CANCELLED'] as const)(
    'E2: a %s Search is accepted — status is neither gated nor changed, and never stands in for research evidence',
    async (status) => {
      const search = { ...intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] }), status };
      const deps = buildDeps({
        searches: fakeSearchRepository([search]),
        researchProvider: () => fakeResearchProvider(mismatchResearch()),
      });

      const result = await recordIntentIntakeForOwner(deps, 'user_a', intakeEvent([{}, FIRST_PARTY_ENTRY]), NOW);

      expect(result.signals).toHaveLength(2);
      expect(deps.searches.rows).toHaveLength(1);
      expect(deps.searches.rows[0]!.status).toBe(status);
      // The only determination is the one the existing Research run produced (MISMATCH);
      // the Search's status never yields CATEGORY_PLAUSIBLE.
      const categoryPlausibility = deps.categoryPlausibility as ReturnType<
        typeof fakeCategoryPlausibilityRepository
      >;
      expect(categoryPlausibility.rows).toHaveLength(1);
      const qualification = deps.qualifications.rows[0]!;
      expect(qualification.state).toBe('NOT_QUALIFIED');
      expect(qualification.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!.satisfied).toBe(false);
    },
  );

  // ---- Acquisition-source adapters → canonical intake -----------------------

  /** A signed AI-platform result through P1 + P2 (normalizeVerifiedProviderResult): the intake carries its proof. */
  function aiPlatformEvent() {
    const outcome = normalizeVerifiedProviderResult(
      signedProof({
        sourceFamily: 'AI_PLATFORM_ACQUISITION',
        acquisitionType: 'AI_REFERRAL',
        externalId: 'aiad-evt-0042',
        business: { name: 'Acme Co', website: 'https://acme.example.com' },
        sourceReference: 'https://landing.example.com/forms/ai-referral',
        evidence: [
          {
            origin: 'SUPPLIED_TO_US',
            derivation: 'STATED_BY_BUSINESS',
            requirement: 'statedRequirement',
            statement: 'We want an ordering app, budget 3 lakh',
            observedAt: new Date('2026-01-31T10:00:00.000Z'),
          },
          {
            origin: 'PUBLISHED',
            derivation: 'STATED_BY_BUSINESS',
            requirement: 'requestedMobileApp',
            statement: 'Looking for someone to build an app for our restaurant',
            referenceUrl: 'https://forum.example.org/t/123',
            observedAt: OBSERVED_AT,
          },
        ],
        capturedAt: NOW,
        provenance: { integration: AUTHORIZATION_EVIDENCE.integrationId, retrieval: 'AUTHORIZED_INTEGRATION' },
        authorization: { ...AUTHORIZATION_EVIDENCE, basis: 'fixture: basis as stated by the integration', reference: null },
      }),
      { searchId: 'search_1', now: NOW },
    );
    if (outcome.status !== 'NORMALIZED') throw new Error(`expected NORMALIZED, got ${JSON.stringify(outcome)}`);
    return outcome.event;
  }

  it('source adapter: a normalized PUBLIC_INTENT + FIRST_PARTY event goes through the unchanged intake — provenance persisted, research then qualification', async () => {
    const signals = fakeResearchSignalRepository();
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['WEBSITE'], keywords: ['app'] })]),
      signals,
      researchProvider: () => fakeResearchProvider(mismatchResearch()),
    });

    const result = await recordIntentIntakeForOwner(deps, 'user_a', aiPlatformEvent().intake, NOW);

    expect(result.signals.map((row) => [row.kind, row.classification, row.confidence])).toEqual([
      ['FIRST_PARTY', 'OBSERVED', 90],
      ['PUBLIC_INTENT', 'OBSERVED', 70],
    ]);
    expect(result.signals.map((row) => row.sources[0]!.sourceLabel)).toEqual([
      'AI-platform acquisition · ai referral',
      'AI-platform acquisition · ai referral',
    ]);
    expect(result.signals[1]!.sources[0]!.sourceUrl).toBe('https://forum.example.org/t/123');
    expect(result.researched).toBe(true);
    // Opt-in unchanged (profile lists neither intake kind) and no category-plausibility shortcut.
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(deps.opportunities.rows[0]!.needDetected).toBe(false);
    expect(deps.qualifications.rows[0]!.state).toBe('NOT_QUALIFIED');
    expect(
      deps.qualifications.rows[0]!.criteria.find((c) => c.criterion === 'CATEGORY_PLAUSIBLE')!.satisfied,
    ).toBe(false);
  });

  it('source adapter: replaying the same normalized event reuses the Opportunity unchanged (E1); persistence is append-only, not deduplicated', async () => {
    const deps = buildDeps({
      searches: fakeSearchRepository([intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] })]),
    });
    const first = aiPlatformEvent();
    const replay = aiPlatformEvent();
    expect(replay.eventId).toBe(first.eventId);

    const a = await recordIntentIntakeForOwner(deps, 'user_a', first.intake, NOW);
    const before = structuredClone(deps.opportunities.rows[0]!);
    const b = await recordIntentIntakeForOwner(deps, 'user_a', replay.intake, NOW);

    expect(b.opportunityId).toBe(a.opportunityId);
    expect(deps.opportunities.rows).toHaveLength(1);
    expect(deps.opportunities.rows[0]).toEqual(before);
    const active = await deps.signals.listByProspect('user_a', a.prospect.id);
    expect(active.filter((row) => isIntentSignalKind(row.kind))).toHaveLength(4);
  });

  it('provider contract: mock provider batch → adapter → normalizeIntentEvent → unchanged multi-signal intake → Prospect / Research / Qualification; no I/O', async () => {
    const fetchSpy = vi.fn(() => {
      throw new Error('network access is not allowed');
    });
    vi.stubGlobal('fetch', fetchSpy);
    try {
      const provenance = { integration: 'fixture', retrieval: 'PUBLIC_NOTICE_FEED' } as const;
      const notice = {
        sourceFamily: 'PUBLIC_INTENT_NOTICE',
        noticeType: 'TECHNOLOGY_MIGRATION',
        externalId: 'notice-migr-0042',
        title: 'Acme Co platform migration',
        url: 'https://notices.example.org/acme/migration',
        body: 'Acme Co will migrate its ordering website to a new platform and needs a native mobile app.',
        observedAt: OBSERVED_AT,
        capturedAt: NOW,
        business: { name: 'Acme Co', website: 'https://acme.example.com' },
        publication: { publisher: 'Example Notices', publishedAt: OBSERVED_AT },
        provenance,
        intentEvidence: [
          { requirement: 'requestedRedesign', evidence: 'will migrate its ordering website to a new platform' },
          { requirement: 'requestedMobileApp', evidence: 'needs a native mobile app' },
        ],
      } as const;
      const outcomes = normalizeProviderBatch(
        [notice, notice, { ...notice, externalId: 'notice-anon', business: null }],
        { searchId: 'search_1', now: NOW },
      );
      expect(outcomes.map((o) => o.status)).toEqual(['NORMALIZED', 'DUPLICATE_IN_BATCH', 'UNATTRIBUTED']);
      const event = outcomes[0]!.status === 'NORMALIZED' ? outcomes[0]!.event : undefined;

      const deps = buildDeps({
        searches: fakeSearchRepository([intakeSearch({ triggers: ['WEBSITE'], keywords: ['app'] })]),
        researchProvider: () => fakeResearchProvider(mismatchResearch()),
      });
      const result = await recordIntentIntakeForOwner(deps, 'user_a', event!.intake, NOW);

      expect(result.prospect.id).toBeDefined();
      expect(result.signals.map((row) => [row.kind, row.classification, row.confidence])).toEqual([
        ['PUBLIC_INTENT', 'OBSERVED', 70],
        ['PUBLIC_INTENT', 'OBSERVED', 70],
      ]);
      expect(result.signals.map((row) => row.sources[0]!.sourceLabel)).toEqual([
        'Public intent notice · technology migration',
        'Public intent notice · technology migration',
      ]);
      expect(result.signals[0]!.sources[0]!.sourceUrl).toBe('https://notices.example.org/acme/migration');
      expect(result.researched).toBe(true);
      // Existing semantics unchanged: opt-in (profile lists no intake kind), D4, no category-plausibility shortcut.
      expect(deps.opportunities.rows).toHaveLength(1);
      expect(deps.opportunities.rows[0]!.needDetected).toBe(false);
      expect(deps.qualifications.rows[0]!.state).toBe('NOT_QUALIFIED');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('D4: without any determination repository there is no Qualification — intake never bypasses CATEGORY_PLAUSIBLE', async () => {
    const deps = buildDeps({ searches: fakeSearchRepository([intakeSearch({ triggers: ['PUBLIC_INTENT'], keywords: ['app'] })]) });
    delete (deps as Partial<SearchWorkerDeps>).categoryPlausibility;
    const result = await recordIntentSignalForOwner(deps, 'user_a', intakeInput(), NOW);
    expect(result.researched).toBe(true);
    expect(deps.qualifications.rows).toHaveLength(0);
  });
});
