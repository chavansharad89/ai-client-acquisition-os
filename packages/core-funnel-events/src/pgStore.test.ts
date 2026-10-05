import { describe, expect, it } from 'vitest';

import { recordFunnelEvent } from './pgStore';
import type { FunnelEventInput, SqlClient } from './types';

/**
 * A fake that enforces the same two partial-unique-index semantics
 * migration 0031 defines in Postgres, so these tests prove the dedupe
 * contract without a real database.
 */
function fakeSql(): SqlClient & { rows: unknown[] } {
  const rows: Array<{ event_name: string; visitor_id: string | null; user_id: string | null; subject_id: string }> = [];
  return {
    rows,
    async query(_sql: string, params: readonly unknown[] = []) {
      const [eventName, visitorId, userId, , subjectId] = params as [
        string,
        string | null,
        string | null,
        string,
        string,
      ];
      const conflicts = rows.some(
        (row) =>
          row.event_name === eventName &&
          row.subject_id === subjectId &&
          ((visitorId !== null && row.visitor_id === visitorId) ||
            (userId !== null && row.user_id === userId)),
      );
      if (conflicts) return { rows: [], rowCount: 0 };
      rows.push({ event_name: eventName, visitor_id: visitorId, user_id: userId, subject_id: subjectId });
      return { rows: [], rowCount: 1 };
    },
  };
}

function input(overrides: Partial<FunnelEventInput> = {}): FunnelEventInput {
  return {
    eventName: 'upsell_viewed',
    visitorId: 'visitor_1',
    userId: null,
    subjectType: 'product',
    subjectId: 'product_1',
    payload: {},
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('recordFunnelEvent', () => {
  it('returns true on first insert for a visitor identity', async () => {
    const sql = fakeSql();
    const inserted = await recordFunnelEvent(sql, input());
    expect(inserted).toBe(true);
  });

  it('returns false for a repeat exposure by the same visitor', async () => {
    const sql = fakeSql();
    await recordFunnelEvent(sql, input());
    const second = await recordFunnelEvent(sql, input());
    expect(second).toBe(false);
  });

  it('a different visitor for the same subject is a distinct first exposure', async () => {
    const sql = fakeSql();
    await recordFunnelEvent(sql, input({ visitorId: 'visitor_1' }));
    const other = await recordFunnelEvent(sql, input({ visitorId: 'visitor_2' }));
    expect(other).toBe(true);
  });

  it('dedupes on user identity when visitorId is absent', async () => {
    const sql = fakeSql();
    const first = await recordFunnelEvent(
      sql,
      input({ visitorId: null, userId: 'user_1', eventName: 'opportunity_reviewed', subjectType: 'opportunity', subjectId: 'opp_1' }),
    );
    const second = await recordFunnelEvent(
      sql,
      input({ visitorId: null, userId: 'user_1', eventName: 'opportunity_reviewed', subjectType: 'opportunity', subjectId: 'opp_1' }),
    );
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('throws when neither visitorId nor userId is supplied', async () => {
    const sql = fakeSql();
    await expect(recordFunnelEvent(sql, input({ visitorId: null, userId: null }))).rejects.toThrow();
  });
});
