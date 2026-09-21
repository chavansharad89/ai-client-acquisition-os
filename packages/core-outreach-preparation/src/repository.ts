import type { OutreachPreparationGeneration, StoredOutreachPreparation } from './types';

/**
 * Persistence boundary for Outreach Preparation (R-54/R-57). Carries no
 * `userId` on the write side — like @acos/core-personalization's
 * PersonalizationRepository, ownership is inherited (via `opportunityId`
 * -> `opportunities.user_id`, DEC-008), so the caller (./service's
 * prepareOutreachForOwner) has already resolved and checked the owning
 * Opportunity before `upsert` runs. The read side (getByOpportunityId)
 * still takes `userId` and enforces it itself — via a join to
 * `opportunities` in ./pgRepository — as a second, independent check
 * rather than trusting the caller alone (R-60).
 */
export interface OutreachPreparationRepository {
  /**
   * Writes this Opportunity's current outreach preparation, replacing
   * whatever was there before (migration 0024's `UNIQUE(opportunity_id)`
   * — one current row per Opportunity, not an append-only history —
   * R-57).
   */
  upsert(
    opportunityId: string,
    prospectId: string,
    sourcePersonalizationId: string,
    generation: OutreachPreparationGeneration,
    generatorVersion: string,
    generatedAt: Date,
  ): Promise<StoredOutreachPreparation>;

  /** Only this user's own outreach preparation, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredOutreachPreparation | null>;

  /** Every current outreach preparation belonging to this user's own Opportunities — reached the same way as getByOpportunityId. */
  listByUserId(userId: string): Promise<readonly StoredOutreachPreparation[]>;
}
