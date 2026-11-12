import { z } from 'zod';

import { MIN_QUOTE_CHARS, normaliseForMatch, normaliseUrl, type SourceDocument } from './provenance';
import type { CategoryFit, CategorySegmentResult, LeadResearch } from './schema';

// Path 2 — Research-level Category Plausibility (D0-D11).
// -----------------------------------------------------------------------
// A dedicated Search + Prospect determination (D1), structurally outside
// FIELD_KIND/ResearchSignal (D7) — nothing here touches ./mapping.ts,
// ./persist.ts, or allObservations(). Two deterministic, provider-
// independent pieces (D9 §5: "parsing is code, not provider
// interpretation"):
//
//   parseTargetSegments()   — splits the participant's raw
//                              targetCustomer into segments BEFORE the
//                              model ever sees it.
//   aggregateCategoryFit()  — ANY-match (OR) aggregation over the
//                              model's per-segment verdicts AFTER the
//                              model call returns.
//
// The model's only job is the per-segment verdict itself (MATCH/
// MISMATCH/UNKNOWN + evidence) — see ./schema.ts's categorySegmentSchema
// and ./prompt.ts's rendering of targetSegments.
// -----------------------------------------------------------------------

/**
 * Deterministic segment parsing (D2, E8 — the delimiter rule is an
 * implementation detail with no locked document formalising it; this
 * follows the one worked example on record, "Restaurants, Cafes;
 * Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour
 * Operators": `;` separates distinct segments, `,` stays inside one).
 *
 * E9 (malformed/empty input): a blank, whitespace-only, or
 * all-delimiter targetCustomer yields `[]` rather than a fabricated
 * segment — callers (./service.ts, the evaluator) must treat an empty
 * result as "nothing to evaluate", producing UNKNOWN, never MISMATCH.
 */
export function parseTargetSegments(targetCustomer: string): readonly string[] {
  return targetCustomer
    .split(';')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

/**
 * ANY-match (OR) aggregation across segment verdicts (D2). MATCH if any
 * segment matches; MISMATCH only if every evaluated segment mismatches;
 * otherwise UNKNOWN — this is what keeps a mix of MISMATCH+UNKNOWN from
 * collapsing into a confident MISMATCH (D3: "insufficient evidence must
 * never become a default MISMATCH"). `[]` (no segments — E9) is UNKNOWN:
 * there is nothing to have matched or mismatched.
 */
export function aggregateCategoryFit(fits: readonly CategoryFit[]): CategoryFit {
  if (fits.length === 0) return 'UNKNOWN';
  if (fits.some((fit) => fit === 'MATCH')) return 'MATCH';
  if (fits.every((fit) => fit === 'MISMATCH')) return 'MISMATCH';
  return 'UNKNOWN';
}

/** Same shape provenance.ts's ProvenanceIssue uses — merged into the same repair loop by ./researcher.ts. */
export interface CategoryPlausibilityIssue {
  path: string;
  message: string;
}

/**
 * Verifies the model's `categoryPlausibility` output against what was
 * actually asked and actually supplied — the same two-part guarantee
 * ./provenance.ts's verifyProvenance() gives OBSERVED claims elsewhere in
 * the schema:
 *
 *   1. Count/order: exactly one verdict per supplied `targetSegments`, in
 *      the same order (position-based correspondence — the model is
 *      never trusted to echo the segment text itself; ./service.ts pairs
 *      `targetSegments[i]` with `categoryPlausibility[i]` deterministically
 *      once this passes).
 *   2. Evidence authenticity: every MATCH/MISMATCH entry's evidence must
 *      actually appear in the supplied source documents — schema.ts's
 *      superRefine only checks evidence is PRESENT, not that it is REAL.
 *
 * `targetSegments.length === 0` short-circuits to no issues: nothing was
 * asked, so an empty `categoryPlausibility` is correct, not a failure.
 * A completely EMPTY `categoryPlausibility` response (0 entries) when
 * segments WERE supplied is likewise not flagged as a failure requiring
 * repair — it is treated as "not evaluated", which
 * toSegmentDeterminations() below turns into UNKNOWN for every segment
 * (D3: absence must never be fabricated into a repair-forced guess),
 * labelled basis NO_MODEL_VERDICT — "not assessed", which F-1 §10 keeps
 * distinct from model-reported insufficient evidence. Only a NON-empty
 * response of the WRONG length is a
 * genuine mismatch worth a repair round.
 */
export function verifyCategoryPlausibility(
  research: LeadResearch,
  sources: readonly SourceDocument[],
  targetSegments: readonly string[],
): CategoryPlausibilityIssue[] {
  if (targetSegments.length === 0) return [];

  // Defensive against a LeadResearch value that bypassed
  // leadResearchSchema.parse() (some test fixtures construct one
  // directly) rather than trusting the schema's own `.default([])` to
  // have always applied.
  const results = research.categoryPlausibility ?? [];
  if (results.length === 0) return [];
  if (results.length !== targetSegments.length) {
    return [
      {
        path: 'categoryPlausibility',
        message:
          `expected exactly ${targetSegments.length} entries, one per supplied target-customer ` +
          `segment in this exact order (${targetSegments.map((s) => `"${s}"`).join(', ')}), but got ` +
          `${results.length}`,
      },
    ];
  }

  const prepared = sources.map((doc) => ({
    label: doc.label,
    url: normaliseUrl(doc.url),
    normalisedText: normaliseForMatch(doc.text),
  }));

  const issues: CategoryPlausibilityIssue[] = [];
  results.forEach((result: CategorySegmentResult, index: number) => {
    if (result.fit === 'UNKNOWN') return; // schema already forces evidence: [] here.

    if (result.evidence.length === 0) {
      // schema.ts's superRefine already rejects this — reaching here means the two checks disagree.
      issues.push({
        path: `categoryPlausibility.${index}.evidence`,
        message: `${result.fit} requires at least one quote with a source URL`,
      });
      return;
    }

    result.evidence.forEach((evidence, evidenceIndex) => {
      const at = `categoryPlausibility.${index}.evidence.${evidenceIndex}`;
      const quote = normaliseForMatch(evidence.quote);

      if (quote.length < MIN_QUOTE_CHARS) {
        issues.push({
          path: `${at}.quote`,
          message:
            `quote is too short to be evidence (${quote.length} characters, minimum ` +
            `${MIN_QUOTE_CHARS}) — quote a full phrase, or classify this segment UNKNOWN`,
        });
        return;
      }

      const citedUrl = normaliseUrl(evidence.sourceUrl);
      const cited = prepared.find((doc) => doc.url === citedUrl);

      if (!cited) {
        issues.push({
          path: `${at}.sourceUrl`,
          message:
            prepared.length === 0
              ? 'no source documents were supplied, so nothing can be MATCH/MISMATCH — classify this segment UNKNOWN'
              : `sourceUrl "${evidence.sourceUrl}" is not one of the supplied source documents — ` +
                `you may only cite documents you were given`,
        });
        return;
      }

      if (cited.normalisedText.includes(quote)) return;

      issues.push({
        path: `${at}.quote`,
        message:
          `this quote does not appear in "${cited.label}" (${cited.url}). Evidence must be text ` +
          `copied verbatim from a document you were given — if you cannot copy it, classify this ` +
          `segment UNKNOWN.`,
      });
    });
  });

  return issues;
}

/**
 * F-1 / F1-D: the feature-local segment classification. Deliberately NOT
 * schema.ts's `Classification` — that is the ResearchSignal meaning, which
 * includes INFERRED and is unchanged. Here `OBSERVED` means the segment's
 * MATCH/MISMATCH verdict is grounded in its cited, verbatim-verified,
 * first-party quotes, which state the verdict or contain every premise for
 * it (F1-D §5). Code derives it from the outcome; the stored label records
 * that claim, it does not prove it (D11 §6.3 checks that substantively).
 * `INFERRED` is not a member (F1-D §7). Never part of the model schema.
 */
export const SEGMENT_CLASSIFICATIONS = ['OBSERVED', 'UNKNOWN'] as const;
export const segmentClassificationSchema = z.enum(SEGMENT_CLASSIFICATIONS);
export type SegmentClassification = (typeof SEGMENT_CLASSIFICATIONS)[number];

/**
 * F-1 §7 (F1-B): what kind of grounds a segment outcome rests on — a
 * closed, code-assigned value, never model output. Not the ResearchSignal
 * `basis` (an INFERRED reasoning trail), which is unchanged.
 */
export const SEGMENT_BASES = [
  'CITED_SOURCE_EVIDENCE',
  'MODEL_REPORTED_INSUFFICIENT_EVIDENCE',
  'NO_MODEL_VERDICT',
] as const;
export const segmentBasisSchema = z.enum(SEGMENT_BASES);
export type SegmentBasis = (typeof SEGMENT_BASES)[number];

/**
 * One segment result as written from F-1 onward — the deterministic
 * segment text paired with the model's verdict for it, plus the
 * code-assigned basis/classification (F-1 §13). Every new row carries all
 * three of confidence/basis/classification.
 */
export interface SegmentDetermination {
  segment: string;
  fit: CategoryFit;
  /** Model reasoning; null only for a NO_MODEL_VERDICT fill (F1-C/F1-E). */
  rationale: string | null;
  evidence: readonly { quote: string; sourceUrl: string; sourceLabel: string }[];
  /** 1-100 for MATCH/MISMATCH, 0 for UNKNOWN (F1-A). */
  confidence: number;
  basis: SegmentBasis;
  classification: SegmentClassification;
}

/**
 * A segment result as read back from `segment_results` (F-1 §11): rows
 * written before F-1 lack confidence/basis/classification. Nothing is
 * backfilled or fabricated — readers render only the fields that exist,
 * and such rows are not D11-validation-valid (see isF1CompleteSegmentDetermination).
 */
export type StoredSegmentDetermination = Omit<SegmentDetermination, 'confidence' | 'basis' | 'classification'> &
  Partial<Pick<SegmentDetermination, 'confidence' | 'basis' | 'classification'>>;

/** Ready to persist (D1/D6) — produced by ./service.ts once verifyCategoryPlausibility() has passed. */
export interface NewCategoryPlausibilityDeterminationInput {
  searchId: string;
  prospectId: string;
  targetCustomer: string;
  targetSegments: readonly string[];
  aggregateResult: CategoryFit;
  segmentResults: readonly SegmentDetermination[];
}

export interface StoredCategoryPlausibilityDetermination
  extends Omit<NewCategoryPlausibilityDeterminationInput, 'segmentResults'> {
  segmentResults: readonly StoredSegmentDetermination[];
  id: string;
  observedAt: Date;
  /** Never deleted — a same-Search re-run supersedes prior rows instead (D6). */
  supersededAt: Date | null;
}

/**
 * Zips deterministically-parsed segments with the model's (already
 * count/order-verified) per-position verdicts, and assigns the F-1
 * code-derived fields (§7, §9, §10) identically for every provider (§16).
 * A position the model returned nothing for — the accepted empty-array
 * response — becomes a NO_MODEL_VERDICT UNKNOWN: no rationale, no
 * evidence, confidence 0. That is "not assessed", not insufficiency.
 */
export function toSegmentDeterminations(
  targetSegments: readonly string[],
  results: readonly CategorySegmentResult[] | undefined,
): readonly SegmentDetermination[] {
  return targetSegments.map((segment, index): SegmentDetermination => {
    const result = results?.[index];
    if (!result) {
      return {
        segment,
        fit: 'UNKNOWN',
        rationale: null,
        evidence: [],
        confidence: 0,
        basis: 'NO_MODEL_VERDICT',
        classification: 'UNKNOWN',
      };
    }
    const verdict = result.fit !== 'UNKNOWN';
    return {
      segment,
      fit: result.fit,
      rationale: result.rationale,
      evidence: result.evidence.map((e) => ({
        quote: e.quote,
        sourceUrl: e.sourceUrl,
        sourceLabel: e.sourceLabel,
      })),
      confidence: result.confidence,
      basis: verdict ? 'CITED_SOURCE_EVIDENCE' : 'MODEL_REPORTED_INSUFFICIENT_EVIDENCE',
      classification: verdict ? 'OBSERVED' : 'UNKNOWN',
    };
  });
}

/**
 * F-1 §11.5 / §14: whether a STORED segment result carries the complete
 * F-1 fields and satisfies the stored-row rules (rule 5 consistency plus
 * the per-outcome evidence/rationale/confidence shape). A legacy row
 * (missing any F-1 field) is never complete. This is structural only — it
 * says nothing about whether a verdict is OBSERVED in substance, which is
 * the D11 §6.3 facilitator check (F1-D §8), and it does not by itself make
 * a determination validation-eligible.
 */
export function isF1CompleteSegmentDetermination(result: StoredSegmentDetermination): boolean {
  const { fit, rationale, evidence, confidence, basis, classification } = result;
  if (confidence === undefined || basis === undefined || classification === undefined) return false;
  if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) return false;
  if (!segmentBasisSchema.safeParse(basis).success) return false;
  if (!segmentClassificationSchema.safeParse(classification).success) return false;

  if (fit === 'MATCH' || fit === 'MISMATCH') {
    return (
      classification === 'OBSERVED' &&
      basis === 'CITED_SOURCE_EVIDENCE' &&
      confidence >= 1 &&
      rationale !== null &&
      evidence.length >= 1 &&
      evidence.length <= 3
    );
  }
  if (classification !== 'UNKNOWN' || confidence !== 0 || evidence.length !== 0) return false;
  if (basis === 'MODEL_REPORTED_INSUFFICIENT_EVIDENCE') return rationale !== null;
  return basis === 'NO_MODEL_VERDICT' && rationale === null;
}
