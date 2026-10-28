import type {
  DiscoveryEventRecord,
  EntityRepository,
  EntityStatusObservation,
  IdentityAnchorInput,
  RecordFailedAttemptInput,
  ResolveAndPersistCandidateInput,
  ResolveAndPersistCandidateResult,
} from './entityRepository';
import type { DiscoveryCandidate, DiscoveryProvider, DiscoveryResult } from './provider';
import type { CompanyRepository, ProspectRepository } from './repository';
import type { StoredCompany, StoredProspect } from './types';

/** In-memory repository enforcing the same per-user find-or-create-by-domain boundary the database does. */
export function fakeCompanyRepository(
  seed: StoredCompany[] = [],
): CompanyRepository & { rows: StoredCompany[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async findOrCreateByDomain(
      userId: string,
      input: { name: string; normalizedDomain: string },
      now: Date,
    ) {
      const existing = rows.find(
        (row) => row.userId === userId && row.normalizedDomain === input.normalizedDomain,
      );
      if (existing) return existing;

      counter += 1;
      const created: StoredCompany = {
        id: `company_${counter}`,
        userId,
        name: input.name,
        normalizedDomain: input.normalizedDomain,
        entityId: null,
        createdAt: now,
      };
      rows.push(created);
      return created;
    },

    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

/** In-memory repository enforcing the same (search_id, company_id) dedup boundary the database does. */
export function fakeProspectRepository(
  seed: StoredProspect[] = [],
): ProspectRepository & { rows: StoredProspect[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async findOrCreate(userId: string, input: { searchId: string; companyId: string }, now: Date) {
      const existing = rows.find(
        (row) => row.searchId === input.searchId && row.companyId === input.companyId,
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

    async listBySearch(userId: string, searchId: string) {
      return rows.filter((row) => row.userId === userId && row.searchId === searchId);
    },

    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

/** A provider that always returns the same fixed candidates — deterministic, no external call. */
export function fakeDiscoveryProvider(
  candidates: readonly DiscoveryCandidate[],
  options: { provider?: string; actualQuery?: string } = {},
): DiscoveryProvider {
  return {
    async discover() {
      return {
        candidates,
        actualQuery: options.actualQuery ?? 'fake query',
        provider: options.provider ?? 'FAKE_PROVIDER',
      } satisfies DiscoveryResult;
    },
  };
}

/**
 * In-memory EntityRepository — mirrors the real resolver's OQ-1/OQ-2/OQ-3
 * outcomes and the real transaction wrapper's Company/Prospect dedup
 * (unique on (userId, normalizedDomain) when present; unique on
 * (searchId, companyId)) without a database. Exposes `companies`/
 * `prospects`/`identityEvidence`/`failedAttempts` for test assertions,
 * mirroring fakeCompanyRepository/fakeProspectRepository's own `.rows`
 * convention.
 */
export function fakeEntityRepository(): EntityRepository & {
  companies: StoredCompany[];
  prospects: StoredProspect[];
  identityEvidence: Array<{ entityId: string; anchor: IdentityAnchorInput; conflicted: boolean }>;
  failedAttempts: RecordFailedAttemptInput[];
  statusObservations: Array<{ entityId: string; status: EntityStatusObservation; observedAt: Date }>;
  discoveryEvents: Array<{ searchId: string; entityId: string } & DiscoveryEventRecord>;
} {
  const companies: StoredCompany[] = [];
  const prospects: StoredProspect[] = [];
  const identityEvidence: Array<{ entityId: string; anchor: IdentityAnchorInput; conflicted: boolean }> = [];
  const failedAttempts: RecordFailedAttemptInput[] = [];
  const statusObservations: Array<{ entityId: string; status: EntityStatusObservation; observedAt: Date }> =
    [];
  const discoveryEvents: Array<{ searchId: string; entityId: string } & DiscoveryEventRecord> = [];
  let counter = 0;

  function resolve(anchors: readonly IdentityAnchorInput[]): {
    entityId: string;
    outcome: ResolveAndPersistCandidateResult['resolution'];
  } {
    if (anchors.length === 0) {
      counter += 1;
      return { entityId: `entity_${counter}`, outcome: 'NO_MATCH_NEW_ENTITY' };
    }

    const matchesByEntity = new Map<string, Set<IdentityAnchorInput['category']>>();
    for (const anchor of anchors) {
      for (const row of identityEvidence) {
        if (
          !row.conflicted &&
          row.anchor.category === anchor.category &&
          row.anchor.sourceProvider === anchor.sourceProvider &&
          row.anchor.normalizedValue === anchor.normalizedValue
        ) {
          const set = matchesByEntity.get(row.entityId) ?? new Set();
          set.add(row.anchor.category);
          matchesByEntity.set(row.entityId, set);
        }
      }
    }

    const aloneResolved = [...matchesByEntity.entries()]
      .filter(([, cats]) => cats.has('PROVIDER_STABLE_ID'))
      .map(([id]) => id);
    const corroborated = [...matchesByEntity.entries()]
      .filter(([, cats]) => cats.size >= 2)
      .map(([id]) => id);
    const resolved = new Set([...aloneResolved, ...corroborated]);

    if (resolved.size === 0) {
      counter += 1;
      return { entityId: `entity_${counter}`, outcome: 'NO_MATCH_NEW_ENTITY' };
    }
    if (resolved.size === 1) {
      return { entityId: [...resolved][0]!, outcome: 'DEFINITE_MATCH' };
    }
    for (const row of identityEvidence) {
      if (resolved.has(row.entityId)) row.conflicted = true;
    }
    counter += 1;
    return { entityId: `entity_${counter}`, outcome: 'CONFLICT_NEW_ENTITY' };
  }

  return {
    companies,
    prospects,
    identityEvidence,
    failedAttempts,
    statusObservations,
    discoveryEvents,

    async recordFailedAttempt(input) {
      failedAttempts.push(input);
    },

    async recordStatusObservation(input, now) {
      statusObservations.push({ entityId: input.entityId, status: input.status, observedAt: now });
    },

    async getStatusObservations(entityId) {
      return statusObservations
        .filter((row) => row.entityId === entityId)
        .map((row) => ({ status: row.status, observedAt: row.observedAt }));
    },

    async getDiscoveryEvent(searchId, entityId) {
      const matches = discoveryEvents.filter((row) => row.searchId === searchId && row.entityId === entityId);
      if (matches.length === 0) return null;
      const earliest = matches.reduce((a, b) => (a.discoveredAt.getTime() <= b.discoveredAt.getTime() ? a : b));
      return { provider: earliest.provider, query: earliest.query, discoveredAt: earliest.discoveredAt };
    },

    async resolveAndPersistCandidate(input: ResolveAndPersistCandidateInput, now: Date) {
      const { entityId, outcome } = resolve(input.anchors);
      for (const anchor of input.anchors) {
        identityEvidence.push({ entityId, anchor, conflicted: false });
      }
      discoveryEvents.push({
        searchId: input.searchId,
        entityId,
        provider: input.provider,
        query: input.actualQuery,
        discoveredAt: now,
      });

      let company = companies.find(
        (row) =>
          row.userId === input.userId &&
          input.normalizedDomain !== null &&
          row.normalizedDomain === input.normalizedDomain,
      );
      if (!company) {
        counter += 1;
        company = {
          id: `company_${counter}`,
          userId: input.userId,
          name: input.name,
          normalizedDomain: input.normalizedDomain,
          entityId,
          createdAt: now,
        };
        companies.push(company);
      }

      let prospect = prospects.find(
        (row) => row.searchId === input.searchId && row.companyId === company!.id,
      );
      if (!prospect) {
        counter += 1;
        prospect = {
          id: `prospect_${counter}`,
          userId: input.userId,
          searchId: input.searchId,
          companyId: company.id,
          status: 'DISCOVERED',
          createdAt: now,
        };
        prospects.push(prospect);
      }

      return { company, prospect, entityId, resolution: outcome };
    },
  };
}
