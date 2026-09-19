import type { SqlExecutor } from '@acos/core-entitlements';

import type { ResearchSourceKind } from './persist';
import type { ResearchSignalRepository } from './repository';
import type { Classification } from './schema';
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
}

interface SourceRow {
  id: string;
  signal_id: string;
  source_url: string;
  source_quote: string;
  source_label: string;
}

const SIGNAL_COLUMNS = `id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at, superseded_at`;
const SOURCE_COLUMNS = `id, signal_id, source_url, source_quote, source_label`;

export function createPgResearchSignalRepository(sql: SqlExecutor): ResearchSignalRepository {
  return {
    async supersedePrevious(prospectId: string, at: Date): Promise<number> {
      const { rows } = await sql.query(
        `UPDATE research_signals SET superseded_at = $2
          WHERE prospect_id = $1 AND superseded_at IS NULL
          RETURNING id`,
        [prospectId, at],
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
        const { rows } = await sql.query(
          `INSERT INTO research_signals
             (id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at)
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8)
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
    sources,
  };
}
