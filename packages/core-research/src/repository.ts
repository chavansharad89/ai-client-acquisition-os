import type { NewResearchSignalInput, StoredResearchSignal } from './types';

/**
 * Persistence boundary for ResearchSignal. Carries no `userId` parameter
 * of its own on the write side — DEC-008 makes ResearchSignal an
 * ownership-INHERITING model (via `prospect_id` -> `prospects.user_id`),
 * so the caller (./service's runResearch) has already resolved and
 * checked the owning Prospect before these methods run. The read side
 * (listByProspect) still takes `userId` and enforces it itself — via a
 * join to prospects in ./pgRepository — as a second, independent check
 * rather than trusting the caller alone.
 */
export interface ResearchSignalRepository {
  /**
   * Marks every currently-active (superseded_at IS NULL) signal for this
   * Prospect as superseded, never deleted. Returns the count affected.
   */
  supersedePrevious(prospectId: string, at: Date): Promise<number>;

  /** Inserts fresh signal rows (with their evidence sources) for this Prospect. Always append, never upsert. */
  saveSignals(
    prospectId: string,
    signals: readonly NewResearchSignalInput[],
    observedAt: Date,
  ): Promise<readonly StoredResearchSignal[]>;

  /** Only this user's currently-active (non-superseded) signals, reached through Prospect ownership — never a global lookup. */
  listByProspect(userId: string, prospectId: string): Promise<readonly StoredResearchSignal[]>;
}
