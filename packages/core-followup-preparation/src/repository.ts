import type { FollowUpPreparationGeneration, StoredFollowUpPreparation } from './types';

/**
 * Persistence boundary for Follow-Up Preparation (R-65). Carries no
 * `userId` on the write side — like
 * @acos/core-outreach-preparation's OutreachPreparationRepository,
 * ownership is inherited (via `opportunityId` -> `opportunities.user_id`,
 * DEC-008), so the caller (./service's prepareFollowUpForOwner) has
 * already resolved and checked the owning Opportunity before `upsert`
 * runs. The read side (getByOpportunityId) still takes `userId` and
 * enforces it itself — via a join to `opportunities` in ./pgRepository —
 * as a second, independent check rather than trusting the caller alone
 * (R-60 convention, carried forward).
 */
export interface FollowUpPreparationRepository {
  /**
   * Writes this Opportunity's current follow-up preparation, replacing
   * whatever was there before (migration 0025's `UNIQUE(opportunity_id)`
   * — one current row per Opportunity, not an append-only history —
   * R-65/R-69).
   */
  upsert(
    opportunityId: string,
    prospectId: string,
    sourceOutreachPreparationId: string,
    generation: FollowUpPreparationGeneration,
    generatorVersion: string,
    generatedAt: Date,
  ): Promise<StoredFollowUpPreparation>;

  /** Only this user's own follow-up preparation, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredFollowUpPreparation | null>;

  /** Every current follow-up preparation belonging to this user's own Opportunities — reached the same way as getByOpportunityId. */
  listByUserId(userId: string): Promise<readonly StoredFollowUpPreparation[]>;
}
