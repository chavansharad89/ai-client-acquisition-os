import { normaliseForMatch } from './provenance';
import type { StoredResearchSignal } from './types';

// Phase I — Q5-A evidence-integrity floor
// (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION.md Q5-A = B;
// CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
// SPECIFICATION.md §E.3 conditions 1-4). This is a PRECONDITION FLOOR
// for the Q5-B authorization gate (./signalAuthorization.ts) — passing
// it is NEVER sufficient for cross-freelancer eligibility on its own
// (§F "OBSERVED + quote + overlap-check-pass ≠ globally shareable").
// -----------------------------------------------------------------------

/** The only two fields this entire Q5-A/Q5-B mechanism ever applies to (§B scope). Every other field is excluded upstream by ./fieldClassification, before this module is ever consulted. */
const Q5_SCOPED_FIELDS: ReadonlySet<string> = new Set(['companySummary', 'businessModel']);

export type Q5AFloorFailureReason =
  | 'FIELD_NOT_IN_SCOPE'
  | 'NOT_OBSERVED'
  | 'MISSING_EVIDENCE'
  | 'MISSING_QUOTE'
  | 'MISSING_SOURCE_URL'
  | 'OVERLAP_CHECK_FAILED';

export interface Q5AFloorResult {
  readonly passes: boolean;
  /** null only when passes is true. */
  readonly failureReason: Q5AFloorFailureReason | null;
}

function fail(reason: Q5AFloorFailureReason): Q5AFloorResult {
  return { passes: false, failureReason: reason };
}

const PASS: Q5AFloorResult = { passes: true, failureReason: null };

/** >=3 chars, after the same normalisation provenance.ts already applies, with simple stopwords dropped — deliberately crude, matching the overlap check's own stated scope (a defensive heuristic, not an NLP pipeline). */
const STOPWORDS: ReadonlySet<string> = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'is', 'are', 'was',
  'were', 'it', 'its', 'this', 'that', 'by', 'as', 'at', 'from', 'has', 'have', 'be', 'been',
]);

function significantTokens(text: string): string[] {
  return normaliseForMatch(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

/**
 * The Q5-A deterministic overlap check (PO decision §2, "binding
 * constraint on all downstream interpretation"): every significant token
 * in `value` must also appear somewhere in `value`'s own cited quotes.
 *
 * THIS IS A HEURISTIC ONLY. It is NOT semantic entailment proof, NOT
 * factuality proof, and NOT an LLM-verification substitute (binding
 * constraint, restated here because every caller of this function must
 * carry the same understanding forward — never describe a `true` result
 * as "verified accurate" in any downstream code, log, or UI copy). It
 * narrows exactly one repository-confirmed risk — an unverified
 * qualifier riding on a real quote (the "primarily targets SMBs" ⊄ "we
 * serve small businesses" pattern) — and addresses nothing else. A value
 * with no significant tokens of its own (e.g. empty) trivially passes —
 * there is nothing for it to have overreached.
 */
export function passesOverlapCheck(value: string, quotes: readonly string[]): boolean {
  const valueTokens = significantTokens(value);
  if (valueTokens.length === 0) return true;
  const quoteTokens = new Set(quotes.flatMap(significantTokens));
  return valueTokens.every((token) => quoteTokens.has(token));
}

/**
 * §E.3 conditions 1-4, re-checked defensively against the already-
 * persisted row (never re-running research-time verifyProvenance against
 * original source documents, which are not retained past persistence —
 * see §C's input table). Fails closed on every branch: a condition this
 * function cannot evaluate (missing data, unrecognized classification)
 * is never treated as passing.
 */
export function evaluateQ5AFloor(signal: StoredResearchSignal): Q5AFloorResult {
  if (!Q5_SCOPED_FIELDS.has(signal.field)) return fail('FIELD_NOT_IN_SCOPE');
  if (signal.classification !== 'OBSERVED') return fail('NOT_OBSERVED');
  if (signal.sources.length === 0) return fail('MISSING_EVIDENCE');

  const quotes = signal.sources.map((source) => source.sourceQuote).filter((quote) => quote.trim().length > 0);
  if (quotes.length === 0) return fail('MISSING_QUOTE');

  const hasUrl = signal.sources.some((source) => source.sourceUrl.trim().length > 0);
  if (!hasUrl) return fail('MISSING_SOURCE_URL');

  if (signal.signal === null || !passesOverlapCheck(signal.signal, quotes)) return fail('OVERLAP_CHECK_FAILED');

  return PASS;
}
