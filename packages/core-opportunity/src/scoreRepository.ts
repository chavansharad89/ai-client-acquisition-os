import type { ProspectScore } from '@acos/core-acquisition';

import type { StoredOpportunityScore } from './types';

/**
 * Persistence boundary for OpportunityScore. Carries no `userId`
 * parameter on the write side — like @acos/core-research's
 * ResearchSignalRepository, ownership is inherited (via `opportunityId`
 * -> `opportunities.user_id`, DEC-008), so the caller (./service's
 * scoreOpportunity) has already resolved and checked the owning
 * Opportunity before `upsert` runs. The read side (getByOpportunityId)
 * still takes `userId` and enforces it itself — via a join to
 * `opportunities` in ./scorePgRepository — as a second, independent
 * check rather than trusting the caller alone.
 */
export interface OpportunityScoreRepository {
  /**
   * Writes this Opportunity's current score, replacing whatever was
   * there before (migration 0018's `UNIQUE(opportunity_id)` — one
   * current score per Opportunity, not an append-only history).
   */
  upsert(
    opportunityId: string,
    score: ProspectScore,
    scorerVersion: string,
    scoredAt: Date,
  ): Promise<StoredOpportunityScore>;

  /** Only this user's own score, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredOpportunityScore | null>;
}
