import { createHash } from 'node:crypto';

import type { SqlExecutor } from '@acos/core-entitlements';

import type {
  NewTargetCustomerMatchDeterminationInput,
  StoredTargetCustomerMatchDetermination,
  TargetCustomerMatchEvidenceItem,
  TargetCustomerMatchResult,
} from './targetCustomerMatch';

// Persistence boundary for the PCG-4 target-customer-match determination
// (migrations 0036/0037). Mirrors ./categoryPlausibilityRepository.ts +
// ./categoryPlausibilityPgRepository.ts's shape and ownership convention
// (DEC-008: no user_id column, inherited through prospect_id ->
// prospects.user_id), combined into one file per
// PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §3's authorized file list.
// -----------------------------------------------------------------------

/** One model-seen source document, as handed to the model — same shape as CapturedSourceDocumentInput. */
export interface TargetCustomerMatchSourceDocumentInput {
  label: string;
  url: string;
  /** Exactly the text the model received — never re-fetched, re-extracted or re-normalised. */
  text: string;
  fetchedAt: Date;
}

export interface TargetCustomerMatchRepository {
  /**
   * Marks every currently-active (superseded_at IS NULL) determination
   * for this Search + Prospect as superseded, never deleted (ED-TC-8). A
   * DIFFERENT Search's row for the same Prospect is never touched.
   */
  supersedePrevious(searchId: string, prospectId: string, at: Date): Promise<number>;

  /**
   * Inserts a fresh determination row. Always append, never upsert.
   *
   * PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2: if the insert would
   * violate the TD-8 partial unique index (another concurrent caller's
   * supersede-then-insert already landed a newer current row for this
   * exact (search_id, prospect_id) pair), this resolves as a no-op
   * success — it returns that already-current row rather than throwing
   * or inserting a second one. Any other database error propagates.
   */
  save(
    input: NewTargetCustomerMatchDeterminationInput,
    observedAt: Date,
    sourceDocuments?: readonly TargetCustomerMatchSourceDocumentInput[],
  ): Promise<StoredTargetCustomerMatchDetermination>;

  /** The current (non-superseded) determination for this exact Search + Prospect pair, or null. */
  getCurrent(
    userId: string,
    searchId: string,
    prospectId: string,
  ): Promise<StoredTargetCustomerMatchDetermination | null>;
}

/** Lower-case hex SHA-256 of `text` as UTF-8 — same convention as ./categoryPlausibilityPgRepository.ts. */
export function targetCustomerMatchSourceContentSha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

interface DeterminationRow {
  id: string;
  search_id: string;
  prospect_id: string;
  target_customer: string;
  result: TargetCustomerMatchResult;
  evidence: TargetCustomerMatchEvidenceItem[];
  model: string;
  provider: string;
  prompt_version: string;
  observed_at: Date;
  superseded_at: Date | null;
}

const SELECT_COLUMNS = `d.id, d.search_id, d.prospect_id, d.target_customer, d.result, d.evidence,
       d.model, d.provider, d.prompt_version, d.observed_at, d.superseded_at`;

const RETURNING_COLUMNS = `id, search_id, prospect_id, target_customer, result, evidence,
       model, provider, prompt_version, observed_at, superseded_at`;

/**
 * True when `err` is Postgres' native unique-violation (SQLSTATE 23505),
 * checked structurally (no hard dependency on any driver's error class) —
 * the same convention @acos/core-payments/orderRepository.ts's
 * isPrismaUniqueConstraintError applies to Prisma's P2002, adapted to
 * this repository's actual runtime: raw SQL via SqlExecutor/`pg`
 * (mirroring ./categoryPlausibilityPgRepository.ts), not a Prisma
 * client — this table has no Prisma model (ED-DEC-001 §9), so there is
 * no P2002 to catch here. `pg` surfaces a unique violation as
 * `err.code === '23505'` with `err.constraint` naming the index, which
 * is what the TD-8 partial unique index
 * (`target_customer_match_determinations_current_idx`) actually raises.
 */
export function isPostgresUniqueViolation(
  err: unknown,
  constraintName: string,
): err is { code: '23505'; constraint?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === '23505' &&
    (!('constraint' in err) || (err as { constraint?: unknown }).constraint === constraintName)
  );
}

/** Name of the TD-8 partial unique index — see migration 0036. */
export const CURRENT_ROW_UNIQUE_CONSTRAINT = 'target_customer_match_determinations_current_idx';

export function createPgTargetCustomerMatchRepository(sql: SqlExecutor): TargetCustomerMatchRepository {
  return {
    async supersedePrevious(searchId: string, prospectId: string, at: Date): Promise<number> {
      const { rows } = await sql.query(
        `UPDATE target_customer_match_determinations SET superseded_at = $3
          WHERE search_id = $1 AND prospect_id = $2 AND superseded_at IS NULL
          RETURNING id`,
        [searchId, prospectId, at],
      );
      return rows.length;
    },

    async save(
      input: NewTargetCustomerMatchDeterminationInput,
      observedAt: Date,
      sourceDocuments: readonly TargetCustomerMatchSourceDocumentInput[] = [],
    ): Promise<StoredTargetCustomerMatchDetermination> {
      try {
        if (sourceDocuments.length > 0) {
          const { rows } = await sql.query(
            `WITH d AS (
               INSERT INTO target_customer_match_determinations
                 (id, search_id, prospect_id, target_customer, result, evidence, model, provider, prompt_version, observed_at)
               VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9)
               RETURNING ${RETURNING_COLUMNS}
             ), s AS (
               INSERT INTO target_customer_match_source_documents
                 (id, determination_id, document_index, source_label, source_url, source_text, content_sha256, fetched_at)
               SELECT gen_random_uuid()::text, d.id, (src.ord - 1)::int, src.label, src.url, src.text, src.sha, src.fetched_at
                 FROM d, unnest($10::text[], $11::text[], $12::text[], $13::text[], $14::timestamp(3)[])
                      WITH ORDINALITY AS src(label, url, text, sha, fetched_at, ord)
             )
             SELECT * FROM d`,
            [
              input.searchId,
              input.prospectId,
              input.targetCustomer,
              input.result,
              JSON.stringify(input.evidence),
              input.model,
              input.provider,
              input.promptVersion,
              observedAt,
              sourceDocuments.map((doc) => doc.label),
              sourceDocuments.map((doc) => doc.url),
              sourceDocuments.map((doc) => doc.text),
              sourceDocuments.map((doc) => targetCustomerMatchSourceContentSha256(doc.text)),
              sourceDocuments.map((doc) => doc.fetchedAt),
            ],
          );
          return mapRow(rows[0] as DeterminationRow);
        }

        const { rows } = await sql.query(
          `INSERT INTO target_customer_match_determinations
             (id, search_id, prospect_id, target_customer, result, evidence, model, provider, prompt_version, observed_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING ${RETURNING_COLUMNS}`,
          [
            input.searchId,
            input.prospectId,
            input.targetCustomer,
            input.result,
            JSON.stringify(input.evidence),
            input.model,
            input.provider,
            input.promptVersion,
            observedAt,
          ],
        );
        return mapRow(rows[0] as DeterminationRow);
      } catch (err) {
        // PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2(b): the conflict IS
        // the desired outcome. Another concurrent caller already
        // superseded-and-inserted a newer current row for this exact
        // pair — this call's own write is moot. Read and return that row
        // rather than retrying or throwing.
        if (isPostgresUniqueViolation(err, CURRENT_ROW_UNIQUE_CONSTRAINT)) {
          const { rows } = await sql.query(
            `SELECT ${SELECT_COLUMNS}
               FROM target_customer_match_determinations d
              WHERE d.search_id = $1 AND d.prospect_id = $2 AND d.superseded_at IS NULL`,
            [input.searchId, input.prospectId],
          );
          const row = rows[0] as DeterminationRow | undefined;
          if (row) return mapRow(row);
        }
        throw err;
      }
    },

    async getCurrent(
      userId: string,
      searchId: string,
      prospectId: string,
    ): Promise<StoredTargetCustomerMatchDetermination | null> {
      const { rows } = await sql.query(
        `SELECT ${SELECT_COLUMNS}
           FROM target_customer_match_determinations d
           JOIN prospects p ON p.id = d.prospect_id
          WHERE d.search_id = $2 AND d.prospect_id = $3 AND p.user_id = $1 AND d.superseded_at IS NULL
          ORDER BY d.created_at DESC, d.id DESC
          LIMIT 1`,
        [userId, searchId, prospectId],
      );
      const row = rows[0] as DeterminationRow | undefined;
      return row ? mapRow(row) : null;
    },
  };
}

function mapRow(row: DeterminationRow): StoredTargetCustomerMatchDetermination {
  return {
    id: row.id,
    searchId: row.search_id,
    prospectId: row.prospect_id,
    targetCustomer: row.target_customer,
    result: row.result,
    evidence: row.evidence,
    model: row.model,
    provider: row.provider,
    promptVersion: row.prompt_version,
    observedAt: new Date(row.observed_at),
    supersededAt: row.superseded_at ? new Date(row.superseded_at) : null,
  };
}
