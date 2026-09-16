import type { StoredCompany, StoredProspect } from './types';

/**
 * Persistence boundary for Company. Every operation is constrained by
 * `userId` in the query itself — mirrors @acos/core-search's
 * SearchRepository. There is deliberately no `getById(id)` that could
 * return another user's row.
 */
export interface CompanyRepository {
  /**
   * Finds the caller's existing Company for this normalized_domain, or
   * creates one — atomically, so concurrent discovery runs for the same
   * user cannot create two rows for the same domain (DEC-005's per-user
   * UNIQUE(user_id, normalized_domain), migration 0015).
   */
  findOrCreateByDomain(
    userId: string,
    input: { name: string; normalizedDomain: string },
    now: Date,
  ): Promise<StoredCompany>;

  getById(userId: string, id: string): Promise<StoredCompany | null>;
}

/**
 * Persistence boundary for Prospect — the join between a Search and a
 * Company. Every operation is constrained by `userId` in the query
 * itself, same convention as CompanyRepository.
 */
export interface ProspectRepository {
  /**
   * Finds the existing Prospect for this (searchId, companyId) pair, or
   * creates one — atomically, so a retried or repeated discovery run
   * never creates a second row for the same pair (R-08's
   * UNIQUE(search_id, company_id), migration 0015).
   */
  findOrCreate(
    userId: string,
    input: { searchId: string; companyId: string },
    now: Date,
  ): Promise<StoredProspect>;

  /** Only this user's prospects for this Search — never a global lookup. */
  listBySearch(userId: string, searchId: string): Promise<readonly StoredProspect[]>;
}
