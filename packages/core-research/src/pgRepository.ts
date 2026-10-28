import type { SqlExecutor } from '@acos/core-entitlements';

import type { FieldClassificationRepository } from './fieldClassification';
import { resolveFieldVisibility } from './fieldClassification';
import { INTENT_SIGNAL_KINDS } from './intentSignal';
import type { ResearchSourceKind } from './persist';
import type { ResearchSignalRepository, ResearchSignalTransaction } from './repository';
import type { Classification } from './schema';
import type {
  SignalAuthorizationRepository,
  SignalLookupRepository,
  StoredSignalAuthorization,
} from './signalAuthorization';
import type { NewSignalCacheEntryInput, ResearchSignalCacheRepository } from './signalCache';
import type {
  NewResearchSignalInput,
  StoredResearchSignal,
  StoredResearchSignalSource,
} from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching @acos/core-discovery's
// pgRepository.ts (migration 0016) — Prisma is not the query layer for
// acquisition-domain tables. research_signals carries no user_id
// (DEC-008); listByProspect enforces ownership itself by joining to
// prospects, rather than trusting the caller's already-checked Prospect
// alone (belt and suspenders with ./service's own check).
//
// research_signals is append-only: saveSignals always INSERTs fresh
// rows, never upserts, and supersedePrevious only ever sets
// superseded_at — no row is deleted or overwritten.
// -----------------------------------------------------------------------

interface SignalRow {
  id: string;
  prospect_id: string;
  field: string;
  kind: ResearchSourceKind;
  classification: Classification;
  signal: string | null;
  confidence: number;
  basis: string | null;
  observed_at: Date;
  superseded_at: Date | null;
  created_at: Date;
}

interface SourceRow {
  id: string;
  signal_id: string;
  source_url: string;
  source_quote: string;
  source_label: string;
}

const SIGNAL_COLUMNS = `id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at, superseded_at, created_at`;
const SOURCE_COLUMNS = `id, signal_id, source_url, source_quote, source_label`;

export function createPgResearchSignalRepository(sql: SqlExecutor): ResearchSignalRepository {
  return {
    async supersedePrevious(prospectId: string, at: Date): Promise<number> {
      const { rows } = await sql.query(
        `UPDATE research_signals SET superseded_at = $2
          WHERE prospect_id = $1 AND superseded_at IS NULL
            AND kind <> ALL($3::text[])
          RETURNING id`,
        [prospectId, at, [...INTENT_SIGNAL_KINDS]],
      );
      return rows.length;
    },

    async saveSignals(
      prospectId: string,
      signals: readonly NewResearchSignalInput[],
      observedAt: Date,
    ): Promise<readonly StoredResearchSignal[]> {
      const stored: StoredResearchSignal[] = [];

      for (const input of signals) {
        // Authorization evidence (migration 0030) is bound in this INSERT
        // only — the 0030 trigger refuses any later UPDATE of it (OD-8).
        // Absent evidence (every non-FIRST_PARTY row) stays NULL.
        const evidence = input.authorizationEvidence;
        const { rows } = await sql.query(
          `INSERT INTO research_signals
             (id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at,
              business_id, auth_status, auth_scope, auth_timestamp, integration_id)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING ${SIGNAL_COLUMNS}`,
          [
            prospectId,
            input.field,
            input.kind,
            input.classification,
            input.signal,
            input.confidence,
            input.basis,
            observedAt,
            evidence?.businessId ?? null,
            evidence?.status ?? null,
            evidence?.scope ?? null,
            evidence?.authorizedAt ?? null,
            evidence?.integrationId ?? null,
          ],
        );
        const signalRow = rows[0] as SignalRow;

        const sources: StoredResearchSignalSource[] = [];
        for (const source of input.sources) {
          const { rows: sourceRows } = await sql.query(
            `INSERT INTO research_signal_sources (id, signal_id, source_url, source_quote, source_label)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
             RETURNING ${SOURCE_COLUMNS}`,
            [signalRow.id, source.sourceUrl, source.sourceQuote, source.sourceLabel],
          );
          sources.push(mapSourceRow(sourceRows[0] as SourceRow));
        }

        stored.push(mapSignalRow(signalRow, sources));
      }

      return stored;
    },

    async listByProspect(
      userId: string,
      prospectId: string,
    ): Promise<readonly StoredResearchSignal[]> {
      const { rows } = await sql.query(
        `SELECT rs.id, rs.prospect_id, rs.field, rs.kind, rs.classification, rs.signal,
                rs.confidence, rs.basis, rs.observed_at, rs.superseded_at
           FROM research_signals rs
           JOIN prospects p ON p.id = rs.prospect_id
          WHERE p.id = $2 AND p.user_id = $1 AND rs.superseded_at IS NULL
          ORDER BY rs.created_at, rs.id`,
        [userId, prospectId],
      );
      const signalRows = rows as SignalRow[];
      if (signalRows.length === 0) return [];

      const { rows: sourceRows } = await sql.query(
        `SELECT ${SOURCE_COLUMNS} FROM research_signal_sources
          WHERE signal_id = ANY($1::text[])
          ORDER BY created_at, id`,
        [signalRows.map((row) => row.id)],
      );

      const sourcesBySignalId = new Map<string, StoredResearchSignalSource[]>();
      for (const row of sourceRows as SourceRow[]) {
        const list = sourcesBySignalId.get(row.signal_id) ?? [];
        list.push(mapSourceRow(row));
        sourcesBySignalId.set(row.signal_id, list);
      }

      return signalRows.map((row) => mapSignalRow(row, sourcesBySignalId.get(row.id) ?? []));
    },
  };
}

/**
 * Phase 4 (same-freelancer cache-first evidence reuse, migration 0045):
 * a pointer-only index — `findByKey` always re-reads the authoritative
 * research_signals/research_signal_sources rows (via the same
 * SIGNAL_COLUMNS/SOURCE_COLUMNS/mapSignalRow/mapSourceRow this file
 * already uses for listByProspect), so a cache hit can never diverge
 * from, or rewrite, the original evidence. `user_id` is denormalized onto
 * research_signal_cache_index itself (unlike research_signals, which has
 * none — DEC-008): every query below takes userId as a required
 * parameter and filters on it directly, so a cross-freelancer lookup is
 * not expressible through this implementation.
 */
export function createPgResearchSignalCacheRepository(
  sql: SqlExecutor,
): ResearchSignalCacheRepository {
  return {
    async record(entry: NewSignalCacheEntryInput): Promise<void> {
      // entity_id (migration 0060) is populated whenever the caller has
      // one — never inferred or defaulted here. ON CONFLICT still keys
      // on the original (user_id, normalized_domain, signal_kind,
      // signal_id) tuple only, so an existing row's entity_id is never
      // retroactively written by a later call (historical safety).
      await sql.query(
        `INSERT INTO research_signal_cache_index
           (id, user_id, normalized_domain, signal_kind, signal_id, observed_at, entity_id)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, normalized_domain, signal_kind, signal_id) DO NOTHING`,
        [
          entry.userId,
          entry.normalizedDomain,
          entry.signalKind,
          entry.signalId,
          entry.observedAt,
          entry.entityId ?? null,
        ],
      );
    },

    async findByKey(
      userId: string,
      normalizedDomain: string,
      signalKind: ResearchSourceKind,
    ): Promise<readonly StoredResearchSignal[]> {
      const { rows } = await sql.query(
        `SELECT rs.id, rs.prospect_id, rs.field, rs.kind, rs.classification, rs.signal,
                rs.confidence, rs.basis, rs.observed_at, rs.superseded_at
           FROM research_signal_cache_index idx
           JOIN research_signals rs ON rs.id = idx.signal_id
          WHERE idx.user_id = $1 AND idx.normalized_domain = $2 AND idx.signal_kind = $3
            AND rs.superseded_at IS NULL
          ORDER BY rs.observed_at DESC, rs.id`,
        [userId, normalizedDomain, signalKind],
      );
      return hydrateSignalRows(sql, rows as SignalRow[]);
    },

    // Entity/public dimension (Global Entity Architecture, Final
    // Architecture Rules §6 "Cache"; migration 0060). Deliberately has no
    // user_id filter at all — unlike findByKey, that is this method's
    // entire purpose. See ./signalCache's ResearchSignalCacheRepository
    // doc comment: this is a pointer-only lookup; no production caller
    // may read its result without then passing it through
    // evaluateEntityPublicLookup.
    async findByEntity(
      entityId: string,
      signalKind: ResearchSourceKind,
    ): Promise<readonly StoredResearchSignal[]> {
      const { rows } = await sql.query(
        `SELECT rs.id, rs.prospect_id, rs.field, rs.kind, rs.classification, rs.signal,
                rs.confidence, rs.basis, rs.observed_at, rs.superseded_at
           FROM research_signal_cache_index idx
           JOIN research_signals rs ON rs.id = idx.signal_id
          WHERE idx.entity_id = $1 AND idx.signal_kind = $2
            AND rs.superseded_at IS NULL
          ORDER BY rs.observed_at DESC, rs.id`,
        [entityId, signalKind],
      );
      return hydrateSignalRows(sql, rows as SignalRow[]);
    },
  };
}

/** Shared by findByKey/findByEntity — resolves pointer rows into full signal+sources content, newest-first order preserved. */
async function hydrateSignalRows(
  sql: SqlExecutor,
  signalRows: readonly SignalRow[],
): Promise<readonly StoredResearchSignal[]> {
  if (signalRows.length === 0) return [];

  const { rows: sourceRows } = await sql.query(
    `SELECT ${SOURCE_COLUMNS} FROM research_signal_sources
      WHERE signal_id = ANY($1::text[])
      ORDER BY created_at, id`,
    [signalRows.map((row) => row.id)],
  );

  const sourcesBySignalId = new Map<string, StoredResearchSignalSource[]>();
  for (const row of sourceRows as SourceRow[]) {
    const list = sourcesBySignalId.get(row.signal_id) ?? [];
    list.push(mapSourceRow(row));
    sourcesBySignalId.set(row.signal_id, list);
  }

  return signalRows.map((row) => mapSignalRow(row, sourcesBySignalId.get(row.id) ?? []));
}

/** A pool that can hand out one pinned connection (same shape as @acos/core-payments' SqlPool). */
export interface ResearchSignalSqlPool extends SqlExecutor {
  connect(): Promise<SqlExecutor & { release: () => void }>;
}

/**
 * ResearchSignalTransaction over PostgreSQL, following
 * @acos/core-payments' createWebhookTransactionRunner: the connection is
 * pinned so BEGIN, every INSERT and COMMIT / ROLLBACK run on the same one.
 */
export function createPgResearchSignalTransactionRunner(pool: ResearchSignalSqlPool): ResearchSignalTransaction {
  return async function researchSignalTransaction<T>(
    fn: (signals: ResearchSignalRepository) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(createPgResearchSignalRepository(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      // Best-effort rollback: the original error is the one worth surfacing.
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  };
}

function mapSourceRow(row: SourceRow): StoredResearchSignalSource {
  return {
    id: row.id,
    sourceUrl: row.source_url,
    sourceQuote: row.source_quote,
    sourceLabel: row.source_label,
  };
}

function mapSignalRow(
  row: SignalRow,
  sources: readonly StoredResearchSignalSource[],
): StoredResearchSignal {
  return {
    id: row.id,
    prospectId: row.prospect_id,
    field: row.field,
    kind: row.kind,
    classification: row.classification,
    signal: row.signal,
    confidence: row.confidence,
    basis: row.basis,
    observedAt: new Date(row.observed_at),
    supersededAt: row.superseded_at ? new Date(row.superseded_at) : null,
    createdAt: new Date(row.created_at),
    sources,
  };
}

/**
 * Phase H (migration 0058, already applied — this function never
 * modifies that migration or its seed data). A plain, single-row lookup
 * against the reference table — no join, no write, no caching of its
 * own. A field absent from the table (no row at all) resolves through
 * resolveFieldVisibility exactly like a row with an unrecognized value
 * would: PRIVATE. This repository has no method capable of writing to
 * research_signal_field_classification or research_signal_global_
 * authorizations — classification is read-only from here.
 */
export function createPgFieldClassificationRepository(sql: SqlExecutor): FieldClassificationRepository {
  return {
    async isFieldPublicEligible(field: string): Promise<boolean> {
      const { rows } = await sql.query(
        `SELECT visibility FROM research_signal_field_classification WHERE field = $1`,
        [field],
      );
      const row = rows[0] as { visibility: string } | undefined;
      return resolveFieldVisibility(row?.visibility) === 'PUBLIC_ELIGIBLE';
    },
  };
}

/**
 * Phase I — a narrow, read-only, single-row lookup used only by
 * ./signalAuthorization.ts's authorizeSignalForSharing. Deliberately not
 * the shared ResearchSignalRepository (no getById there, and that
 * interface is implemented in many other places that have no reason to
 * grow a single-row cross-user accessor).
 */
export function createPgSignalLookupRepository(sql: SqlExecutor): SignalLookupRepository {
  return {
    async getById(signalId: string): Promise<StoredResearchSignal | null> {
      const { rows } = await sql.query(`SELECT ${SIGNAL_COLUMNS} FROM research_signals WHERE id = $1`, [
        signalId,
      ]);
      const signalRow = rows[0] as SignalRow | undefined;
      if (!signalRow) return null;
      const [hydrated] = await hydrateSignalRows(sql, [signalRow]);
      return hydrated ?? null;
    },
  };
}

interface AuthorizationRow {
  id: string;
  signal_id: string;
  authorized_at: Date;
  authorized_by: string;
  revoked_at: Date | null;
}

function mapAuthorizationRow(row: AuthorizationRow): StoredSignalAuthorization {
  return {
    id: row.id,
    signalId: row.signal_id,
    authorizedAt: new Date(row.authorized_at),
    authorizedBy: row.authorized_by,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  };
}

/**
 * Phase I (migration 0059, already applied — never modified by this
 * function). `insertAuthorization` performs NO validation of its own —
 * see ./signalAuthorization.ts's authorizeSignalForSharing, the only
 * sanctioned caller, which validates every required condition first.
 * There is no update/revoke method here: this repository can create a
 * new authorization row, and read the latest one (revoked or not); it
 * has no method that could overwrite or delete an existing row, keeping
 * the append-only invariant structural, not merely conventional.
 */
export function createPgSignalAuthorizationRepository(sql: SqlExecutor): SignalAuthorizationRepository {
  return {
    async findLatestAuthorization(signalId: string): Promise<StoredSignalAuthorization | null> {
      const { rows } = await sql.query(
        `SELECT id, signal_id, authorized_at, authorized_by, revoked_at
           FROM research_signal_global_authorizations
          WHERE signal_id = $1
          ORDER BY authorized_at DESC, id DESC
          LIMIT 1`,
        [signalId],
      );
      const row = rows[0] as AuthorizationRow | undefined;
      return row ? mapAuthorizationRow(row) : null;
    },

    async insertAuthorization(
      input: { signalId: string; authorizedBy: string },
      now: Date,
    ): Promise<StoredSignalAuthorization> {
      const { rows } = await sql.query(
        `INSERT INTO research_signal_global_authorizations (id, signal_id, authorized_at, authorized_by)
         VALUES (gen_random_uuid()::text, $1, $2, $3)
         RETURNING id, signal_id, authorized_at, authorized_by, revoked_at`,
        [input.signalId, now, input.authorizedBy],
      );
      return mapAuthorizationRow(rows[0] as AuthorizationRow);
    },

    // Q5-C: derives "historical" from the actual recorded apply time of
    // migration 0059 — the same migration that created the table this
    // repository reads/writes above — never a hardcoded/invented date.
    // `_prisma_migrations` is Prisma CLI's own bookkeeping table; it is
    // present and populated in every environment where `prisma migrate
    // deploy`/`dev` actually ran (dev, staging, production). It is
    // ABSENT in throwaway databases built by applying each migration's
    // raw .sql file directly (this repo's own integration-test harness,
    // tests/integration/support/pgIndexHarness.ts, does exactly this —
    // verified by inspection, not assumed). In that one specific case —
    // relation "_prisma_migrations" does not exist (SQLSTATE 42P01) —
    // research_signals and research_signal_global_authorizations were
    // necessarily created together, in the same fresh database, with no
    // gap between them; nothing in that database can predate the gate's
    // introduction, so the correct cutoff is the earliest possible
    // instant (every row is "new"). This is not an invented production
    // boundary — it is the only value consistent with the specification's
    // own definition ("historical = existed before the gate's storage was
    // introduced") when both came into existence in the same instant.
    async getHistoricalCutoffAt(): Promise<Date> {
      try {
        const { rows } = await sql.query(
          `SELECT finished_at FROM _prisma_migrations
            WHERE migration_name = $1
            ORDER BY finished_at ASC
            LIMIT 1`,
          ['0059_research_signal_global_authorizations'],
        );
        const row = rows[0] as { finished_at: Date } | undefined;
        if (!row) {
          throw new Error(
            'Q5-C historical cutoff unavailable: migration 0059_research_signal_global_authorizations has no recorded apply time',
          );
        }
        return new Date(row.finished_at);
      } catch (error) {
        if ((error as { code?: string }).code === '42P01') {
          return new Date(0);
        }
        throw error;
      }
    },
  };
}
