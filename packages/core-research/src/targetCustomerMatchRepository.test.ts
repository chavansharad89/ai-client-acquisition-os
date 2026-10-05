import type { SqlExecutor } from '@acos/core-entitlements';
import { describe, expect, it } from 'vitest';

import {
  createPgTargetCustomerMatchRepository,
  CURRENT_ROW_UNIQUE_CONSTRAINT,
  isPostgresUniqueViolation,
  targetCustomerMatchSourceContentSha256,
} from './targetCustomerMatchRepository';

// PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2 — the exact concurrency
// contract. A real Postgres instance enforces the TD-8 partial unique
// index itself (see tests/integration for the real-database proof); this
// file proves the repository's error-handling branch using a fake
// SqlExecutor that simulates the SQLSTATE 23505 error raw `pg` raises for
// that index.
// -----------------------------------------------------------------------

interface FakeRow {
  id: string;
  search_id: string;
  prospect_id: string;
  target_customer: string;
  result: string;
  evidence: unknown[];
  model: string;
  provider: string;
  prompt_version: string;
  observed_at: Date;
  superseded_at: Date | null;
}

/** Simulates exactly one table's worth of rows, enforcing the TD-8 partial unique index in application logic. */
function fakeSql(options: { failNextInsertWithConflict?: boolean } = {}): SqlExecutor & { rows: FakeRow[] } {
  const rows: FakeRow[] = [];
  let counter = 0;
  let failNextInsert = options.failNextInsertWithConflict ?? false;

  return {
    rows,
    async query(sql: string, params: readonly unknown[] = []) {
      if (sql.includes('UPDATE target_customer_match_determinations')) {
        const [searchId, prospectId, at] = params as [string, string, Date];
        const updated = rows.filter(
          (r) => r.search_id === searchId && r.prospect_id === prospectId && r.superseded_at === null,
        );
        for (const r of updated) r.superseded_at = at;
        return { rows: updated.map((r) => ({ id: r.id })), rowCount: updated.length };
      }

      if (sql.includes('INSERT INTO target_customer_match_determinations') && sql.includes('WITH d AS')) {
        return insertDetermination(params as unknown[]);
      }
      if (sql.startsWith('INSERT INTO target_customer_match_determinations')) {
        return insertDetermination(params as unknown[]);
      }

      if (sql.includes('FROM target_customer_match_determinations d') && sql.includes('p.user_id')) {
        const [userId, searchId, prospectId] = params as [string, string, string];
        void userId;
        const row = rows.find(
          (r) => r.search_id === searchId && r.prospect_id === prospectId && r.superseded_at === null,
        );
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      if (sql.includes('FROM target_customer_match_determinations d') && sql.includes('WHERE d.search_id')) {
        const [searchId, prospectId] = params as [string, string];
        const row = rows.find(
          (r) => r.search_id === searchId && r.prospect_id === prospectId && r.superseded_at === null,
        );
        return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      }

      throw new Error(`fakeSql: unrecognised query: ${sql}`);
    },
  };

  function insertDetermination(params: unknown[]) {
    const [searchId, prospectId, targetCustomer, result, evidence, model, provider, promptVersion, observedAt] =
      params as [string, string, string, string, string, string, string, string, Date];

    if (failNextInsert) {
      failNextInsert = false;
      const err = new Error('duplicate key value violates unique constraint') as Error & {
        code: string;
        constraint: string;
      };
      err.code = '23505';
      err.constraint = CURRENT_ROW_UNIQUE_CONSTRAINT;
      throw err;
    }

    counter += 1;
    const row: FakeRow = {
      id: `det_${counter}`,
      search_id: searchId,
      prospect_id: prospectId,
      target_customer: targetCustomer,
      result,
      evidence: JSON.parse(evidence),
      model,
      provider,
      prompt_version: promptVersion,
      observed_at: observedAt,
      superseded_at: null,
    };
    rows.push(row);
    return { rows: [row], rowCount: 1 };
  }
}

const NOW = new Date('2026-03-01T00:00:00.000Z');

const INPUT = {
  searchId: 'search_1',
  prospectId: 'prospect_1',
  targetCustomer: 'Restaurants',
  result: 'MATCH' as const,
  evidence: [],
  model: 'test-model',
  provider: 'test-provider',
  promptVersion: 'v1',
};

describe('createPgTargetCustomerMatchRepository', () => {
  it('save() inserts a fresh row', async () => {
    const sql = fakeSql();
    const repo = createPgTargetCustomerMatchRepository(sql);
    const row = await repo.save(INPUT, NOW);
    expect(row).toMatchObject({ searchId: 'search_1', prospectId: 'prospect_1', result: 'MATCH' });
    expect(row.supersededAt).toBeNull();
  });

  it('supersedePrevious marks every current row for the pair as superseded, scoped to that exact pair', async () => {
    const sql = fakeSql();
    const repo = createPgTargetCustomerMatchRepository(sql);
    await repo.save(INPUT, NOW);
    await repo.save({ ...INPUT, searchId: 'search_other' }, NOW);

    const count = await repo.supersedePrevious('search_1', 'prospect_1', new Date('2026-03-02T00:00:00.000Z'));
    expect(count).toBe(1);
    expect(sql.rows.find((r) => r.search_id === 'search_other')!.superseded_at).toBeNull();
  });

  describe('PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2 — concurrent unique-index violation', () => {
    it('(b): resolves as a no-op success, returning the already-current row, instead of throwing', async () => {
      const sql = fakeSql();
      const repo = createPgTargetCustomerMatchRepository(sql);
      // Simulate: another concurrent call already landed the current row...
      const winner = await repo.save(INPUT, NOW);
      // ...and THIS call's own insert now hits the partial unique index.
      const losingSql = sql as SqlExecutor & { rows: FakeRow[] };
      const loserRepo = createPgTargetCustomerMatchRepository({
        async query(text: string, params?: readonly unknown[]) {
          if (text.startsWith('INSERT INTO target_customer_match_determinations')) {
            const err = new Error('duplicate key value violates unique constraint') as Error & {
              code: string;
              constraint: string;
            };
            err.code = '23505';
            err.constraint = CURRENT_ROW_UNIQUE_CONSTRAINT;
            throw err;
          }
          return losingSql.query(text, params);
        },
      });

      await expect(loserRepo.save({ ...INPUT, result: 'NO_MATCH' }, NOW)).resolves.toMatchObject({
        id: winner.id,
        result: 'MATCH',
      });
      // Exactly one current row for the pair — the loser never inserted a second one.
      expect(sql.rows.filter((r) => r.superseded_at === null)).toHaveLength(1);
    });

    it('does not reclassify an unrelated error as a concurrency conflict', async () => {
      const sql: SqlExecutor = {
        async query() {
          throw new Error('connection terminated unexpectedly');
        },
      };
      const repo = createPgTargetCustomerMatchRepository(sql);
      await expect(repo.save(INPUT, NOW)).rejects.toThrow('connection terminated unexpectedly');
    });

    it('does not reclassify a 23505 on a DIFFERENT constraint as this index\'s conflict', async () => {
      const sql: SqlExecutor = {
        async query() {
          const err = new Error('duplicate key') as Error & { code: string; constraint: string };
          err.code = '23505';
          err.constraint = 'some_other_unrelated_constraint';
          throw err;
        },
      };
      const repo = createPgTargetCustomerMatchRepository(sql);
      await expect(repo.save(INPUT, NOW)).rejects.toMatchObject({ code: '23505' });
    });
  });

  describe('isPostgresUniqueViolation', () => {
    it('matches the TD-8 index error shape', () => {
      expect(
        isPostgresUniqueViolation({ code: '23505', constraint: CURRENT_ROW_UNIQUE_CONSTRAINT }, CURRENT_ROW_UNIQUE_CONSTRAINT),
      ).toBe(true);
    });
    it('rejects a non-23505 error', () => {
      expect(isPostgresUniqueViolation({ code: '42601' }, CURRENT_ROW_UNIQUE_CONSTRAINT)).toBe(false);
    });
  });

  it('targetCustomerMatchSourceContentSha256 is the SHA-256 hex of the exact text', () => {
    expect(targetCustomerMatchSourceContentSha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });
});
