import type {
  NewCategoryPlausibilityDeterminationInput,
  StoredCategoryPlausibilityDetermination,
} from './categoryPlausibility';

/**
 * Persistence boundary for the Path 2 category-plausibility determination
 * (D1/D6/D7 — migration 0027). Carries no `userId` on the write side —
 * the same DEC-008 ownership-inheritance convention
 * ResearchSignalRepository/QualificationRepository already use, via
 * `prospect_id -> prospects.user_id`. The read side still takes `userId`
 * and enforces it via a join to `prospects`, the same belt-and-suspenders
 * convention.
 */
export interface CategoryPlausibilityRepository {
  /**
   * Marks every currently-active (superseded_at IS NULL) determination
   * for this Search + Prospect as superseded, never deleted (D6: a
   * same-Search re-run supersedes its own prior row; a DIFFERENT Search's
   * row for the same Prospect is never touched — this is scoped to
   * searchId + prospectId together, not prospectId alone).
   */
  supersedePrevious(searchId: string, prospectId: string, at: Date): Promise<number>;

  /**
   * Inserts a fresh determination row. Always append, never upsert.
   * `sourceDocuments` (A11-P1 M-2, migration 0028) are the model-seen
   * source documents for this run, persisted in the same statement and
   * linked to the new row; omitted or empty persists none.
   */
  save(
    input: NewCategoryPlausibilityDeterminationInput,
    observedAt: Date,
    sourceDocuments?: readonly CapturedSourceDocumentInput[],
  ): Promise<StoredCategoryPlausibilityDetermination>;

  /**
   * Every determination ever recorded for this exact Search + Prospect
   * pair, most recent first (D6 historical attribution) — reached
   * through Prospect ownership, never a global lookup.
   */
  listBySearchAndProspect(
    userId: string,
    searchId: string,
    prospectId: string,
  ): Promise<readonly StoredCategoryPlausibilityDetermination[]>;

  /**
   * The current (non-superseded) determination for this Prospect,
   * regardless of which Search produced it — this is "the CURRENT Search
   * + Prospect determination" D6 requires Qualification to read. Correct
   * without needing the caller to resolve `searchId` itself: a Prospect's
   * `search_id` is immutable and unique per Prospect (migration 0015's
   * UNIQUE(search_id, company_id)), so at most one row is ever
   * non-superseded for a given `prospectId` at a time. Mirrors
   * ResearchSignalRepository.listByProspect's own internal-join
   * ownership check — no `searches`/`prospects` dependency needed by a
   * caller (Qualification, the UI) that already holds a `prospectId`.
   */
  getCurrentByProspectId(
    userId: string,
    prospectId: string,
  ): Promise<StoredCategoryPlausibilityDetermination | null>;
}

// A11-P1 M-2 source capture (requirement/
// PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_SOURCE_CAPTURE_PRODUCT_DECISION.md,
// authorization A11-P1-IMPL-AUTH-001) — migration 0028.
// -----------------------------------------------------------------------

/** The only capture kind M-2 produces: the text exactly as supplied to the model. */
export const MODEL_SEEN_SOURCE = 'MODEL_SEEN_SOURCE' as const;

/** One model-seen source document, as handed to the model (researchLead()'s post-parse value). */
export interface CapturedSourceDocumentInput {
  label: string;
  url: string;
  /** Exactly the text the model received — never re-fetched, re-extracted or re-normalised. */
  text: string;
  fetchedAt: Date;
  extractionMethod: string;
}

export interface StoredCapturedSourceDocument {
  id: string;
  /** Traceability: capture -> determination -> Search + Prospect (no duplicated columns; joined). */
  determinationId: string;
  searchId: string;
  prospectId: string;
  /** Position in the supplied document list (0-based); unique per determination. */
  documentIndex: number;
  label: string;
  url: string;
  text: string;
  /** Lower-case hex SHA-256 of `text` as UTF-8. */
  contentSha256: string;
  captureKind: typeof MODEL_SEEN_SOURCE;
  extractionMethod: string;
  fetchedAt: Date;
}

/**
 * Read side for captured sources — a separate interface so existing
 * CategoryPlausibilityRepository implementations/fakes are unaffected.
 * Ownership is enforced the same way (join to prospects).
 */
export interface CategoryPlausibilitySourceDocumentReader {
  listSourceDocumentsByDeterminationId(
    userId: string,
    determinationId: string,
  ): Promise<readonly StoredCapturedSourceDocument[]>;
}
