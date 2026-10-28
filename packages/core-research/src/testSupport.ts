import type {
  NewCategoryPlausibilityDeterminationInput,
  StoredCategoryPlausibilityDetermination,
} from './categoryPlausibility';
import type {
  CapturedSourceDocumentInput,
  CategoryPlausibilityRepository,
} from './categoryPlausibilityRepository';
import { resolveFieldVisibility } from './fieldClassification';
import type { FieldClassificationRepository, FieldVisibility } from './fieldClassification';
import { isIntentSignalKind } from './intentSignal';
import type {
  SignalAuthorizationRepository,
  SignalLookupRepository,
  StoredSignalAuthorization,
} from './signalAuthorization';
import type { ResearchSourceKind } from './persist';
import type { ResearchProvider, ResearchProviderInput } from './provider';
import type { ResearchSignalRepository } from './repository';
import type { LeadResearch } from './schema';
import type { NewSignalCacheEntryInput, ResearchSignalCacheRepository } from './signalCache';
import type {
  NewTargetCustomerMatchDeterminationInput,
  StoredTargetCustomerMatchDetermination,
} from './targetCustomerMatch';
import type {
  TargetCustomerMatchRepository,
  TargetCustomerMatchSourceDocumentInput,
} from './targetCustomerMatchRepository';
import type {
  NewResearchSignalInput,
  StoredResearchSignal,
  StoredResearchSignalSource,
} from './types';

/** A provider that always returns the same fixed result — deterministic, no external call. */
export function fakeResearchProvider(
  result: LeadResearch | ((input: ResearchProviderInput) => LeadResearch),
): ResearchProvider {
  return {
    async research(input: ResearchProviderInput) {
      return typeof result === 'function' ? result(input) : result;
    },
  };
}

/**
 * In-memory repository mirroring the database's append-only,
 * supersede-then-insert behaviour. Does not itself enforce Prospect
 * ownership (ResearchSignal carries no user_id — see ./repository) —
 * ownership isolation is exercised through ./service's own
 * `deps.prospects.getById` check in unit tests, and proven at the
 * database level in tests/integration/research.integration.test.ts.
 */
export function fakeResearchSignalRepository(
  seed: StoredResearchSignal[] = [],
): ResearchSignalRepository & { rows: StoredResearchSignal[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async supersedePrevious(prospectId: string, at: Date) {
      let count = 0;
      for (const row of rows) {
        if (
          row.prospectId === prospectId &&
          row.supersededAt === null &&
          !isIntentSignalKind(row.kind)
        ) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },

    async saveSignals(
      prospectId: string,
      signals: readonly NewResearchSignalInput[],
      observedAt: Date,
    ) {
      const created: StoredResearchSignal[] = [];
      for (const input of signals) {
        counter += 1;
        const sources: StoredResearchSignalSource[] = input.sources.map((source, index) => ({
          id: `signal_source_${counter}_${index}`,
          ...source,
        }));
        const row: StoredResearchSignal = {
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
          sources,
        };
        rows.push(row);
        created.push(row);
      }
      return created;
    },

    async listByProspect(_userId: string, prospectId: string) {
      return rows.filter((row) => row.prospectId === prospectId && row.supersededAt === null);
    },
  };
}

/**
 * In-memory ResearchSignalCacheRepository (Phase 4, migration 0045) —
 * same pointer-only shape as the real one: `record()` stores only the
 * cache key + a pointer, `findByKey()` re-resolves each pointer through
 * `resolveSignal` (typically `fakeResearchSignalRepository`'s own `rows`
 * array, e.g. `(id) => rows.find((r) => r.id === id)`) — always the SAME
 * StoredResearchSignal object the caller already holds, so a cache hit
 * can never diverge from, or rewrite, the original evidence.
 */
export function fakeResearchSignalCacheRepository(
  resolveSignal: (signalId: string) => StoredResearchSignal | undefined,
): ResearchSignalCacheRepository & {
  entries: NewSignalCacheEntryInput[];
} {
  const entries: NewSignalCacheEntryInput[] = [];

  return {
    entries,

    async record(entry: NewSignalCacheEntryInput) {
      entries.push(entry);
    },

    async findByKey(userId: string, normalizedDomain: string, signalKind: ResearchSourceKind) {
      return entries
        .filter(
          (entry) =>
            entry.userId === userId &&
            entry.normalizedDomain === normalizedDomain &&
            entry.signalKind === signalKind,
        )
        .map((entry) => resolveSignal(entry.signalId))
        .filter((signal): signal is StoredResearchSignal => signal !== undefined && signal.supersededAt === null)
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
    },

    // Mirrors createPgResearchSignalCacheRepository's findByEntity: a row
    // with no entityId recorded (undefined/null) never matches any real
    // entityId argument here either — no special-casing needed, the same
    // way SQL's `entity_id = $1` never matches a NULL column.
    async findByEntity(entityId: string, signalKind: ResearchSourceKind) {
      return entries
        .filter((entry) => entry.entityId === entityId && entry.signalKind === signalKind)
        .map((entry) => resolveSignal(entry.signalId))
        .filter((signal): signal is StoredResearchSignal => signal !== undefined && signal.supersededAt === null)
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
    },
  };
}

/**
 * In-memory FieldClassificationRepository (Phase H) mirroring
 * createPgFieldClassificationRepository's exact fail-closed contract —
 * `table` holds only what migration 0058 actually seeds (or whatever a
 * test explicitly supplies); any field not present in it resolves
 * through resolveFieldVisibility to PRIVATE, identical to a missing row
 * in Postgres.
 */
export function fakeFieldClassificationRepository(
  table: Readonly<Record<string, FieldVisibility>> = {
    companySummary: 'PUBLIC_ELIGIBLE',
    businessModel: 'PUBLIC_ELIGIBLE',
    websiteIssues: 'PRIVATE',
    contentOpportunities: 'PRIVATE',
    aiOpportunities: 'PRIVATE',
    growthOpportunities: 'PRIVATE',
    targetCustomers: 'PRIVATE',
    visibleProblems: 'PRIVATE',
    automationOpportunities: 'PRIVATE',
  },
): FieldClassificationRepository {
  return {
    async isFieldPublicEligible(field: string) {
      return resolveFieldVisibility(table[field]) === 'PUBLIC_ELIGIBLE';
    },
  };
}

/**
 * In-memory SignalLookupRepository (Phase I) — a plain id -> signal map
 * lookup, used only by authorizeSignalForSharing's tests.
 */
export function fakeSignalLookupRepository(
  resolveSignal: (signalId: string) => StoredResearchSignal | undefined,
): SignalLookupRepository {
  return {
    async getById(signalId: string) {
      return resolveSignal(signalId) ?? null;
    },
  };
}

/**
 * In-memory SignalAuthorizationRepository (Phase I) mirroring
 * createPgSignalAuthorizationRepository's exact append-only contract:
 * `rows` may be pre-seeded with already-revoked entries (to exercise
 * revocation without needing a revoke-writer method, which production
 * deliberately has none of either — see ./signalAuthorization.ts).
 * `findLatestAuthorization` returns the most recently authorized row for
 * a signalId, revoked or not — callers must route it through
 * isAuthorizationActive, exactly like the real repository.
 */
export function fakeSignalAuthorizationRepository(
  seed: StoredSignalAuthorization[] = [],
  // Q5-C: mirrors createPgSignalAuthorizationRepository's
  // getHistoricalCutoffAt — in production this is derived from
  // migration 0059's actual recorded apply time, never invented; here
  // a test supplies whatever fixed instant its scenario needs. Defaults
  // far enough in the past that every existing test's signal() default
  // createdAt (recent) is "new" unless a test deliberately overrides it.
  historicalCutoffAt: Date = new Date('2000-01-01T00:00:00.000Z'),
): SignalAuthorizationRepository & { rows: StoredSignalAuthorization[] } {
  const rows = [...seed];
  let counter = rows.length;
  return {
    rows,
    async findLatestAuthorization(signalId: string) {
      const matches = rows
        .filter((row) => row.signalId === signalId)
        .sort((a, b) => b.authorizedAt.getTime() - a.authorizedAt.getTime());
      return matches[0] ?? null;
    },
    async insertAuthorization(input: { signalId: string; authorizedBy: string }, now: Date) {
      counter += 1;
      const row: StoredSignalAuthorization = {
        id: `authorization_${counter}`,
        signalId: input.signalId,
        authorizedAt: now,
        authorizedBy: input.authorizedBy,
        revokedAt: null,
      };
      rows.push(row);
      return row;
    },
    async getHistoricalCutoffAt() {
      return historicalCutoffAt;
    },
  };
}

/**
 * In-memory CategoryPlausibilityRepository (Path 2, D1/D6/D7) mirroring
 * the same append-only, supersede-then-insert convention as
 * fakeResearchSignalRepository above. Does not itself enforce Prospect
 * ownership — exercised through ./service.ts's own `deps.prospects`
 * check in unit tests, and proven at the database level in an
 * integration test.
 */
export function fakeCategoryPlausibilityRepository(
  seed: StoredCategoryPlausibilityDetermination[] = [],
): CategoryPlausibilityRepository & {
  rows: StoredCategoryPlausibilityDetermination[];
  /** A11-P1 M-2: the sourceDocuments argument of each save(), keyed by the saved row's id. */
  sourceDocumentsByDeterminationId: Map<string, readonly CapturedSourceDocumentInput[]>;
} {
  const rows = [...seed];
  const sourceDocumentsByDeterminationId = new Map<string, readonly CapturedSourceDocumentInput[]>();
  let counter = rows.length;

  return {
    rows,
    sourceDocumentsByDeterminationId,

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

    async save(
      input: NewCategoryPlausibilityDeterminationInput,
      observedAt: Date,
      sourceDocuments: readonly CapturedSourceDocumentInput[] = [],
    ) {
      counter += 1;
      const row: StoredCategoryPlausibilityDetermination = {
        id: `category_plausibility_${counter}`,
        ...input,
        observedAt,
        supersededAt: null,
      };
      rows.push(row);
      sourceDocumentsByDeterminationId.set(row.id, sourceDocuments);
      return row;
    },

    async listBySearchAndProspect(_userId: string, searchId: string, prospectId: string) {
      return rows
        .filter((row) => row.searchId === searchId && row.prospectId === prospectId)
        .sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
    },

    async getCurrentByProspectId(_userId: string, prospectId: string) {
      return rows.find((row) => row.prospectId === prospectId && row.supersededAt === null) ?? null;
    },

    // Not exercised by this package's own tests (applicability is a
    // Qualification-side concern, CF-QUALIFICATION-WITHOUT-CATEGORY-
    // PLAUSIBILITY-PO-DEC-001) — always `true` here.
    async isCategoryPlausibilityApplicableForProspectId() {
      return true;
    },
  };
}

/**
 * In-memory TargetCustomerMatchRepository (migrations 0036/0037),
 * mirroring fakeCategoryPlausibilityRepository's own append-only,
 * supersede-then-insert convention and ownership-agnostic shape (real
 * ownership is proven at the database level in an integration test).
 */
export function fakeTargetCustomerMatchRepository(
  seed: StoredTargetCustomerMatchDetermination[] = [],
): TargetCustomerMatchRepository & {
  rows: StoredTargetCustomerMatchDetermination[];
  sourceDocumentsByDeterminationId: Map<string, readonly TargetCustomerMatchSourceDocumentInput[]>;
} {
  const rows = [...seed];
  const sourceDocumentsByDeterminationId = new Map<string, readonly TargetCustomerMatchSourceDocumentInput[]>();
  let counter = rows.length;

  return {
    rows,
    sourceDocumentsByDeterminationId,

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

    async save(
      input: NewTargetCustomerMatchDeterminationInput,
      observedAt: Date,
      sourceDocuments: readonly TargetCustomerMatchSourceDocumentInput[] = [],
    ) {
      counter += 1;
      const row: StoredTargetCustomerMatchDetermination = {
        id: `target_customer_match_${counter}`,
        ...input,
        observedAt,
        supersededAt: null,
      };
      rows.push(row);
      sourceDocumentsByDeterminationId.set(row.id, sourceDocuments);
      return row;
    },

    async getCurrent(_userId: string, searchId: string, prospectId: string) {
      return (
        rows.find(
          (row) => row.searchId === searchId && row.prospectId === prospectId && row.supersededAt === null,
        ) ?? null
      );
    },
  };
}
