import type { NewAiUsageEventInput, StoredAiUsageEvent } from './types';

/**
 * Persistence boundary for AI usage metering (R-29). Ownership is a
 * top-level user_id (Phase 16 scope lock D3) supplied by the caller —
 * never inherited through a join, unlike @acos/core-research's
 * ResearchSignalRepository.
 */
export interface AiUsageEventRepository {
  /**
   * Idempotent on (provider, providerMessageId) (D8): recording the same
   * provider response twice returns the ORIGINAL row rather than
   * inserting a second one — mirrors
   * @acos/core-entitlements' grant()/@acos/core-payments' webhook-event
   * dedupe convention (ON CONFLICT DO NOTHING + a follow-up read).
   */
  recordEvent(
    userId: string,
    prospectId: string,
    input: NewAiUsageEventInput,
    now: Date,
  ): Promise<StoredAiUsageEvent>;

  /** Only this user's usage events for this Prospect — never a global lookup. */
  listByProspect(userId: string, prospectId: string): Promise<readonly StoredAiUsageEvent[]>;
}
