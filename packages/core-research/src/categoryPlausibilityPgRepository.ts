import { createHash } from 'node:crypto';

import type { SqlExecutor } from '@acos/core-entitlements';

import type {
  NewCategoryPlausibilityDeterminationInput,
  StoredSegmentDetermination,
  StoredCategoryPlausibilityDetermination,
} from './categoryPlausibility';
import {
  MODEL_SEEN_SOURCE,
  type CapturedSourceDocumentInput,
  type CategoryPlausibilityRepository,
  type CategoryPlausibilitySourceDocumentReader,
  type StoredCapturedSourceDocument,
} from './categoryPlausibilityRepository';
import type { CategoryFit } from './schema';

// PostgreSQL implementation (migration 0027) — raw SQL against a
// `pg`-style executor, mirroring ./pgRepository.ts's
// createPgResearchSignalRepository. Ownership is enforced on the read
// side via a join to `prospects` (DEC-008); the write side trusts the
// caller (./service.ts's runResearchForOwner), which has already
// resolved and checked the owning Prospect/Search.
// -----------------------------------------------------------------------

interface DeterminationRow {
  id: string;
  search_id: string;
  prospect_id: string;
  target_customer: string;
  target_segments: string[];
  aggregate_result: CategoryFit;
  /** Legacy (pre-F-1) rows lack confidence/basis/classification — F-1 §11. */
  segment_results: StoredSegmentDetermination[];
  observed_at: Date;
  superseded_at: Date | null;
}

const SELECT_COLUMNS = `d.id, d.search_id, d.prospect_id, d.target_customer, d.target_segments,
       d.aggregate_result, d.segment_results, d.observed_at, d.superseded_at`;

interface SourceDocumentRow {
  id: string;
  determination_id: string;
  search_id: string;
  prospect_id: string;
  document_index: number;
  source_label: string;
  source_url: string;
  source_text: string;
  content_sha256: string;
  capture_kind: typeof MODEL_SEEN_SOURCE;
  extraction_method: string;
  fetched_at: Date;
}

/**
 * A11-P1 M-2 content hash: lower-case hex SHA-256 of the exact persisted
 * text as UTF-8 — never of HTML or of a re-normalised variant.
 */
export function sourceContentSha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function createPgCategoryPlausibilityRepository(
  sql: SqlExecutor,
): CategoryPlausibilityRepository & CategoryPlausibilitySourceDocumentReader {
  return {
    async supersedePrevious(searchId: string, prospectId: string, at: Date): Promise<number> {
      const { rows } = await sql.query(
        `UPDATE category_plausibility_determinations SET superseded_at = $3
          WHERE search_id = $1 AND prospect_id = $2 AND superseded_at IS NULL
          RETURNING id`,
        [searchId, prospectId, at],
      );
      return rows.length;
    },

    async save(
      input: NewCategoryPlausibilityDeterminationInput,
      observedAt: Date,
      sourceDocuments: readonly CapturedSourceDocumentInput[] = [],
    ): Promise<StoredCategoryPlausibilityDetermination> {
      if (sourceDocuments.length > 0) {
        // A11-P1 M-2: determination and its model-seen sources in ONE
        // statement, so a determination is never stored without the
        // sources it was produced from (or vice versa). The text is
        // bound as-is; the hash is computed from that same value.
        const { rows } = await sql.query(
          `WITH d AS (
             INSERT INTO category_plausibility_determinations
               (id, search_id, prospect_id, target_customer, target_segments, aggregate_result, segment_results, observed_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
             RETURNING id, search_id, prospect_id, target_customer, target_segments, aggregate_result, segment_results, observed_at, superseded_at
           ), s AS (
             INSERT INTO category_plausibility_source_documents
               (id, determination_id, document_index, source_label, source_url, source_text,
                content_sha256, capture_kind, extraction_method, fetched_at)
             SELECT gen_random_uuid()::text, d.id, (src.ord - 1)::int, src.label, src.url, src.text,
                    src.sha, $14, src.method, src.fetched_at
               FROM d, unnest($8::text[], $9::text[], $10::text[], $11::text[], $12::text[], $13::timestamp(3)[])
                    WITH ORDINALITY AS src(label, url, text, sha, method, fetched_at, ord)
           )
           SELECT * FROM d`,
          [
            input.searchId,
            input.prospectId,
            input.targetCustomer,
            input.targetSegments,
            input.aggregateResult,
            JSON.stringify(input.segmentResults),
            observedAt,
            sourceDocuments.map((doc) => doc.label),
            sourceDocuments.map((doc) => doc.url),
            sourceDocuments.map((doc) => doc.text),
            sourceDocuments.map((doc) => sourceContentSha256(doc.text)),
            sourceDocuments.map((doc) => doc.extractionMethod),
            sourceDocuments.map((doc) => doc.fetchedAt),
            MODEL_SEEN_SOURCE,
          ],
        );
        return mapRow(rows[0] as DeterminationRow);
      }

      const { rows } = await sql.query(
        `INSERT INTO category_plausibility_determinations
           (id, search_id, prospect_id, target_customer, target_segments, aggregate_result, segment_results, observed_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7)
         RETURNING id, search_id, prospect_id, target_customer, target_segments, aggregate_result, segment_results, observed_at, superseded_at`,
        [
          input.searchId,
          input.prospectId,
          input.targetCustomer,
          input.targetSegments,
          input.aggregateResult,
          JSON.stringify(input.segmentResults),
          observedAt,
        ],
      );
      return mapRow(rows[0] as DeterminationRow);
    },

    async listBySearchAndProspect(
      userId: string,
      searchId: string,
      prospectId: string,
    ): Promise<readonly StoredCategoryPlausibilityDetermination[]> {
      const { rows } = await sql.query(
        `SELECT ${SELECT_COLUMNS}
           FROM category_plausibility_determinations d
           JOIN prospects p ON p.id = d.prospect_id
          WHERE d.search_id = $2 AND d.prospect_id = $3 AND p.user_id = $1
          ORDER BY d.created_at DESC, d.id DESC`,
        [userId, searchId, prospectId],
      );
      return (rows as DeterminationRow[]).map(mapRow);
    },

    async getCurrentByProspectId(
      userId: string,
      prospectId: string,
    ): Promise<StoredCategoryPlausibilityDetermination | null> {
      const { rows } = await sql.query(
        `SELECT ${SELECT_COLUMNS}
           FROM category_plausibility_determinations d
           JOIN prospects p ON p.id = d.prospect_id
          WHERE p.id = $2 AND p.user_id = $1 AND d.superseded_at IS NULL
          ORDER BY d.created_at DESC, d.id DESC
          LIMIT 1`,
        [userId, prospectId],
      );
      const row = rows[0] as DeterminationRow | undefined;
      return row ? mapRow(row) : null;
    },

    async listSourceDocumentsByDeterminationId(
      userId: string,
      determinationId: string,
    ): Promise<readonly StoredCapturedSourceDocument[]> {
      const { rows } = await sql.query(
        `SELECT s.id, s.determination_id, d.search_id, d.prospect_id, s.document_index,
                s.source_label, s.source_url, s.source_text, s.content_sha256,
                s.capture_kind, s.extraction_method, s.fetched_at
           FROM category_plausibility_source_documents s
           JOIN category_plausibility_determinations d ON d.id = s.determination_id
           JOIN prospects p ON p.id = d.prospect_id
          WHERE s.determination_id = $2 AND p.user_id = $1
          ORDER BY s.document_index ASC`,
        [userId, determinationId],
      );
      return (rows as SourceDocumentRow[]).map(mapSourceDocumentRow);
    },
  };
}

function mapSourceDocumentRow(row: SourceDocumentRow): StoredCapturedSourceDocument {
  return {
    id: row.id,
    determinationId: row.determination_id,
    searchId: row.search_id,
    prospectId: row.prospect_id,
    documentIndex: row.document_index,
    label: row.source_label,
    url: row.source_url,
    text: row.source_text,
    contentSha256: row.content_sha256,
    captureKind: row.capture_kind,
    extractionMethod: row.extraction_method,
    fetchedAt: new Date(row.fetched_at),
  };
}

function mapRow(row: DeterminationRow): StoredCategoryPlausibilityDetermination {
  return {
    id: row.id,
    searchId: row.search_id,
    prospectId: row.prospect_id,
    targetCustomer: row.target_customer,
    targetSegments: row.target_segments,
    aggregateResult: row.aggregate_result,
    segmentResults: row.segment_results,
    observedAt: new Date(row.observed_at),
    supersededAt: row.superseded_at ? new Date(row.superseded_at) : null,
  };
}
