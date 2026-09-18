import type { RecordFeedbackInput, StoredFeedback } from './types';

/**
 * Persistence boundary for Feedback (PRD V2.1 R-21/AC-22, Stage R,
 * migration 0020). Unlike OpportunityScore/ResearchSignal, Feedback
 * carries its own `userId` — it is a top-level owned model, not one of
 * DEC-008's two named ownership-inheritance exceptions. The caller
 * (./service's recordFeedback) has already resolved and checked the
 * owning Opportunity via OpportunityRepository.getById before `upsert`
 * runs; `getByOpportunityId` still re-checks ownership itself, the same
 * belt-and-suspenders convention this package's other repositories use.
 */
export interface FeedbackRepository {
  /**
   * Writes this Opportunity's current feedback verdict, replacing
   * whatever was there before (migration 0020's `UNIQUE(opportunity_id)`
   * — one current verdict per Opportunity, not an append-only history,
   * the same convention as OpportunityScoreRepository.upsert).
   */
  upsert(
    userId: string,
    opportunityId: string,
    input: RecordFeedbackInput,
    now: Date,
  ): Promise<StoredFeedback>;

  /** Only this user's own Feedback, reached through Opportunity ownership — never a global lookup. */
  getByOpportunityId(userId: string, opportunityId: string): Promise<StoredFeedback | null>;

  /**
   * All of this user's own Feedback (Phase 15, R-27 "basic outcome
   * tracking"). Filters on Feedback's own `user_id` at the query itself
   * — the same direct-ownership boundary `getByOpportunityId` uses —
   * never a global list, never retrieve-then-filter.
   */
  list(userId: string): Promise<readonly StoredFeedback[]>;
}
