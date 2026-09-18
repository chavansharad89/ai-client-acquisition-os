import type { SqlExecutor } from '@acos/core-entitlements';

import type { AiUsageEventRepository } from './repository';
import type { AiUsageRequestKind, NewAiUsageEventInput, StoredAiUsageEvent } from './types';

// PostgreSQL implementation.
// -----------------------------------------------------------------------
// Raw SQL against a `pg`-style executor, matching every other domain
// package's pgRepository.ts (migration 0021) — Prisma is not the query
// layer for these tables. recordEvent() uses INSERT ... ON CONFLICT DO
// NOTHING plus a follow-up read rather than DO UPDATE, the same
// convention @acos/core-entitlements' grant() and
// @acos/core-payments' webhook dedupe use: a duplicate provider response
// must return the ORIGINAL row, never overwrite it.
// -----------------------------------------------------------------------

interface Row {
  id: string;
  user_id: string;
  prospect_id: string;
  provider: string;
  model: string;
  request_kind: AiUsageRequestKind;
  provider_message_id: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number | null;
  cache_read_input_tokens: number | null;
  created_at: Date;
}

const COLUMNS = `id, user_id, prospect_id, provider, model, request_kind, provider_message_id,
                  input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens,
                  created_at`;

export function createPgAiUsageEventRepository(sql: SqlExecutor): AiUsageEventRepository {
  return {
    async recordEvent(
      userId: string,
      prospectId: string,
      input: NewAiUsageEventInput,
      now: Date,
    ): Promise<StoredAiUsageEvent> {
      const inserted = await sql.query(
        `INSERT INTO ai_usage_events
           (id, user_id, prospect_id, provider, model, request_kind, provider_message_id,
            input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens,
            created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (provider, provider_message_id) DO NOTHING
         RETURNING ${COLUMNS}`,
        [
          userId,
          prospectId,
          input.provider,
          input.model,
          input.requestKind,
          input.providerMessageId,
          input.inputTokens,
          input.outputTokens,
          input.cacheCreationInputTokens,
          input.cacheReadInputTokens,
          now,
        ],
      );

      if (inserted.rows[0]) {
        return mapRow(inserted.rows[0] as Row);
      }

      const existing = await sql.query(
        `SELECT ${COLUMNS} FROM ai_usage_events
          WHERE provider = $1 AND provider_message_id = $2`,
        [input.provider, input.providerMessageId],
      );
      if (!existing.rows[0]) {
        throw new Error(
          `ai usage event for ${input.provider}:${input.providerMessageId} neither inserted ` +
            'nor found — the unique index and this query disagree',
        );
      }
      return mapRow(existing.rows[0] as Row);
    },

    async listByProspect(
      userId: string,
      prospectId: string,
    ): Promise<readonly StoredAiUsageEvent[]> {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM ai_usage_events
          WHERE user_id = $1 AND prospect_id = $2
          ORDER BY created_at, id`,
        [userId, prospectId],
      );
      return (rows as Row[]).map(mapRow);
    },
  };
}

function mapRow(row: Row): StoredAiUsageEvent {
  return {
    id: row.id,
    userId: row.user_id,
    prospectId: row.prospect_id,
    provider: row.provider,
    model: row.model,
    requestKind: row.request_kind,
    providerMessageId: row.provider_message_id,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    cacheCreationInputTokens: row.cache_creation_input_tokens,
    cacheReadInputTokens: row.cache_read_input_tokens,
    createdAt: new Date(row.created_at),
  };
}
