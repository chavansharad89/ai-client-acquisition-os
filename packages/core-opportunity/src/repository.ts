import type { DetectedOffer, StoredOpportunity } from './types';

/**
 * Persistence boundary for Opportunity. Every operation that touches a
 * specific row is constrained by `userId` in the query itself — mirrors
 * @acos/core-search's SearchRepository and @acos/core-discovery's
 * CompanyRepository/ProspectRepository. There is deliberately no
 * `getById(id)` that could return another user's row.
 */
export interface OpportunityRepository {
  /**
   * Inserts one Opportunity for `prospectId` at state 'NEW'. One
   * Opportunity per Prospect — a second call for the same `prospectId`
   * is a database-level unique-constraint violation (migration 0017),
   * left uncaught here, the same convention migration 0014's note on
   * `deleteServiceProfile()` documents for its own FK violation.
   */
  create(
    userId: string,
    input: { prospectId: string; needDetected: boolean; offer: DetectedOffer | undefined },
    now: Date,
  ): Promise<StoredOpportunity>;

  getById(userId: string, id: string): Promise<StoredOpportunity | null>;

  /** Only this user's Opportunities — never a global list. */
  list(userId: string): Promise<readonly StoredOpportunity[]>;
}
