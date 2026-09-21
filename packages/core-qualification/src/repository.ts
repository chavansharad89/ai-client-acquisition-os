import type { QualificationEvaluation, StoredQualification } from './types';

/**
 * Persistence boundary for Qualification (R-38). Carries no `userId` on
 * the write side — like @acos/core-opportunity's OpportunityScoreRepository
 * and @acos/core-research's ResearchSignalRepository, ownership is
 * inherited (via `opportunityId` -> `opportunities.user_id`, DEC-008), so
 * the caller (./service's evaluateQualificationForOwner) has already
 * resolved and checked the owning Opportunity before `upsert` runs. The
 * read side (getByOpportunityId) still takes `userId` and enforces it
 * itself — via a join to `opportunities` in ./pgRepository — as a second,
 * independent check rather than trusting the caller alone.
 */
export interface QualificationRepository {
  /**
   * Writes this Opportunity's current qualification, replacing whatever
   * was there before (migration 0022's `UNIQUE(opportunity_id)` — one
   * current row per Opportunity, not an append-only history — R-38/R-39
   * Decision D4).
   */
  upsert(
    opportunityId: string,
    prospectId: string,
    evaluation: QualificationEvaluation,
    evaluatorVersion: string,
    evaluatedAt: Date,
  ): Promise<StoredQualification>;

  /** Only this user's own qualification, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredQualification | null>;

  /** Every current qualification belonging to this user's own Opportunities — reached the same way as getByOpportunityId. */
  listByUserId(userId: string): Promise<readonly StoredQualification[]>;
}
