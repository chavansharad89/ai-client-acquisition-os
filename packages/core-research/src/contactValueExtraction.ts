import { detectContactIdentifiers, type ContactIdentifierKind } from './contactIdentifiers';
import type { StoredResearchSignal } from './types';

// Contact-value capture (₹1,499 Client Finder subscription, Revision 5 of
// requirement/CLIENT_FINDER_1499_ENGINEERING_IMPLEMENTATION_PLAN.md; full
// design: requirement/CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md
// §7, §12-§13, Option C).
// -----------------------------------------------------------------------
// Additive, read-time only -- never touches Path A, Path B, or K1's own
// detection/classification logic. Lives in this package (not a
// consumer's) specifically so it can import contactIdentifiers.ts
// directly, the same "not exported from the package index" placement
// K1 itself uses (REV-005 §4.1) -- this module's own, narrower
// QualifyingContactKind/extractContactValues are exported instead,
// below and from ./index.
//
// Mechanism (capture spike §7): find a plain-regex candidate substring
// in already-persisted, un-normalized evidence text, then re-classify
// that small substring with K1's existing, UNMODIFIED
// detectContactIdentifiers() -- never K1's own obfuscation-defeating
// normalization, and never a new ContactIdentifierKind. A K1-confirmed
// PHONE presence that this plain regex cannot isolate as one clean
// literal substring (spelled-out digits, mask-character runs) is a
// known, documented edge case (capture spike §17.1): eligibility stays
// true, extraction may legitimately find nothing for it.
// -----------------------------------------------------------------------

/** The four K1 kinds that ever qualify an opportunity commercially. FRAGMENT never does (K1's own convention, unchanged). */
export type QualifyingContactKind = 'BUSINESS_EMAIL' | 'PERSONAL_EMAIL' | 'UNCERTAIN_EMAIL' | 'PHONE';

export interface ExtractedContactValue {
  kind: QualifyingContactKind;
  value: string;
}

// Local-part class deliberately includes '*' so a masked/obfuscated token
// (e.g. "jo**n@gmail.com") is captured as ONE whole candidate rather than
// letting the unmatched '*' run split it and expose a fabricated partial
// match (e.g. "n@gmail.com") starting after the mask. Candidates whose
// local part contains '*' are discarded below, never repaired or guessed.
const EMAIL_CANDIDATE_RE = /[A-Za-z0-9._%+*-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const MASKED_LOCAL_PART_RE = /\*/;
// Phone-shaped candidate: a run of digits (7-15 of them), optionally
// grouped with spaces/dashes/dots/parens and an optional leading '+'.
// Deliberately permissive at the candidate stage -- K1's own
// re-classification below, not this regex, is what actually decides
// PHONE vs. nothing.
const PHONE_CANDIDATE_RE = /\+?\d[\d\s().-]{6,18}\d/g;

function candidateSubstrings(text: string): readonly string[] {
  const found: string[] = [];
  for (const match of text.matchAll(EMAIL_CANDIDATE_RE)) {
    if (MASKED_LOCAL_PART_RE.test(match[0])) continue;
    found.push(match[0]);
  }
  for (const match of text.matchAll(PHONE_CANDIDATE_RE)) found.push(match[0].trim());
  return found;
}

function isQualifying(kind: ContactIdentifierKind): kind is QualifyingContactKind {
  return kind !== 'FRAGMENT';
}

/** Collapses formatting differences only -- never changes which value is shown, only which are treated as "the same" value for de-dup. */
function normalizeForDedup(kind: QualifyingContactKind, value: string): string {
  return kind === 'PHONE' ? value.replace(/[\s().-]/g, '') : value.trim().toLowerCase();
}

/**
 * Finds every qualifying contact value present across a Prospect's
 * currently-active research signals (plan §G/§8) -- `signals` is exactly
 * what `ResearchSignalRepository.listByProspect()` already returns,
 * unmodified and already ownership-checked; this function performs no
 * database access of its own.
 *
 * Scans each signal's own claim text (`signal.signal`) and each of its
 * sources' quotes (`source.sourceQuote`) for a candidate substring, then
 * re-classifies that substring with K1's own `detectContactIdentifiers`.
 * `website` is passed straight through to it, unchanged (the same
 * normalized-domain value K1's existing call sites already use to
 * distinguish BUSINESS_EMAIL from PERSONAL_EMAIL/UNCERTAIN_EMAIL).
 *
 * De-duplicates by `(kind, normalized value)` -- the same value appearing
 * in multiple evidence rows yields one entry (capture spike §8). Result
 * order carries no precedence meaning (no kind or value is "first" in
 * any way that matters to the caller).
 */
export function extractContactValues(
  signals: readonly StoredResearchSignal[],
  website: string | null,
): readonly ExtractedContactValue[] {
  const seen = new Set<string>();
  const results: ExtractedContactValue[] = [];

  const texts: string[] = [];
  for (const signal of signals) {
    if (signal.signal) texts.push(signal.signal);
    for (const source of signal.sources) {
      if (source.sourceQuote) texts.push(source.sourceQuote);
    }
  }

  for (const text of texts) {
    for (const candidate of candidateSubstrings(text)) {
      const kinds = detectContactIdentifiers(candidate, website);
      for (const kind of kinds) {
        if (!isQualifying(kind)) continue;
        const dedupeKey = `${kind}:${normalizeForDedup(kind, candidate)}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        results.push({ kind, value: candidate });
      }
    }
  }

  return results;
}
