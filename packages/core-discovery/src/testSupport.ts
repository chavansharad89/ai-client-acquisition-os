import type { DiscoveryCandidate, DiscoveryProvider } from './provider';
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
): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}
