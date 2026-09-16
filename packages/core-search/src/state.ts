import type { SearchStatus } from './types';

// Search lifecycle — PROVISIONAL, NOT FULLY AUTHORIZED BY V2.1.
// -----------------------------------------------------------------------
// What V2.1 actually specifies, and no more:
//   - R-05 fixes the status VOCABULARY: PENDING · RUNNING · COMPLETE ·
//     FAILED · CANCELLED. It does not specify a transition graph.
//   - R-05 "WORKER OWNERSHIP" narrates exactly one edge: PENDING -> RUNNING
//     (a worker claims the row).
//   - AC-05 narrates exactly one path end-to-end: PENDING -> RUNNING ->
//     COMPLETE.
//   - AC-25 requires that a provider/research failure or worker crash
//     "leaves the Search in a defined state with a recorded error" — it
//     does not name FAILED as that state, nor say which prior states may
//     reach it.
//   - CANCELLED appears ONLY in the R-05 vocabulary list. No requirement,
//     acceptance criterion, or scope-boundary line describes when or how a
//     Search becomes CANCELLED. MVP_SCOPE_BOUNDARY.md's own "Job lifecycle"
//     line (§5.7) names only "queued, running, complete, failed" — it does
//     not mention a cancelled state at all.
//
// Everything below RUNNING -> COMPLETE is therefore this implementation's
// OWN provisional foundation, not a requirement derived from the PRD:
//
//   PENDING   -> RUNNING    [V2.1 R-05 "WORKER OWNERSHIP" + AC-05]
//   RUNNING   -> COMPLETE   [V2.1 AC-05]
//   RUNNING   -> FAILED     [UNRESOLVED — no cited rule; consistent with AC-25's
//                            "defined state with a recorded error" but AC-25 does
//                            not name FAILED or its source state]
//   PENDING   -> CANCELLED  [UNRESOLVED — no cited rule anywhere in V2.1 or the
//                            Scope Boundary]
//   RUNNING   -> CANCELLED  [UNRESOLVED — no cited rule anywhere in V2.1 or the
//                            Scope Boundary]
//   COMPLETE, FAILED, CANCELLED treated as terminal — also UNRESOLVED; no
//   requirement says a Search may not be reopened or retried.
//
// Do NOT read this graph as canonical. It exists so Phase 5 has something
// concrete to test against and so a later phase does not have to invent
// vocabulary from nothing — but the FAILED/CANCELLED edges and the
// terminal-state closure are open product decisions, not requirements.
// Flagged in the Phase 5 completion report; not resolved here.
// -----------------------------------------------------------------------

export const SEARCH_VALID_TRANSITIONS: Readonly<Record<SearchStatus, readonly SearchStatus[]>> = {
  PENDING: ['RUNNING', 'CANCELLED'],
  RUNNING: ['COMPLETE', 'FAILED', 'CANCELLED'],
  COMPLETE: [],
  FAILED: [],
  CANCELLED: [],
};

export function isValidSearchTransition(from: SearchStatus, to: SearchStatus): boolean {
  return SEARCH_VALID_TRANSITIONS[from].includes(to);
}
