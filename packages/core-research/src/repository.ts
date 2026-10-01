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
   * Marks every currently-active (superseded_at IS NULL) research-produced
   * signal for this Prospect as superseded, never deleted. Returns the
   * count affected. Intent intake kinds (./intentSignal's
   * INTENT_SIGNAL_KINDS) are excluded: they are captured events, not
   * research findings, so a research re-run must not retire them
   * (INTENT-INTAKE-PO-DEC-001 C2).
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

/**
 * Runs `fn` inside ONE database transaction on ONE pinned connection and
 * hands it a repository bound to that connection. Commits when `fn`
 * resolves; rolls back every write when it throws, then rethrows. Used by
 * intent intake so all signal and source rows of one event commit or roll
 * back together (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 OD-8). No retry
 * (OD-12).
 */
export type ResearchSignalTransaction = <T>(
  fn: (signals: ResearchSignalRepository) => Promise<T>,
) => Promise<T>;
