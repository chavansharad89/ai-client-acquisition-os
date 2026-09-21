import type { PersonalizationGeneration, StoredPersonalization } from './types';

/**
 * Persistence boundary for Personalization (R-45/R-49). Carries no
 * `userId` on the write side — like @acos/core-qualification's
 * QualificationRepository, ownership is inherited (via `opportunityId` ->
 * `opportunities.user_id`, DEC-008), so the caller (./service's
 * evaluatePersonalizationForOwner) has already resolved and checked the
 * owning Opportunity before `upsert` runs. The read side
 * (getByOpportunityId) still takes `userId` and enforces it itself — via
 * a join to `opportunities` in ./pgRepository — as a second, independent
 * check rather than trusting the caller alone.
 */
export interface PersonalizationRepository {
  /**
   * Writes this Opportunity's current personalization, replacing
   * whatever was there before (migration 0023's
   * `UNIQUE(opportunity_id)` — one current row per Opportunity, not an
   * append-only history — R-49).
   */
  upsert(
    opportunityId: string,
    prospectId: string,
    generation: PersonalizationGeneration,
    generatorVersion: string,
    generatedAt: Date,
  ): Promise<StoredPersonalization>;

  /** Only this user's own personalization, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredPersonalization | null>;

  /** Every current personalization belonging to this user's own Opportunities — reached the same way as getByOpportunityId. */
  listByUserId(userId: string): Promise<readonly StoredPersonalization[]>;
}
