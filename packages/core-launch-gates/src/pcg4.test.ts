import { describe, expect, it } from 'vitest';

import { evaluatePcg4 } from './pcg4';
import type { SqlExecutor } from './types';
import type { GateWindow } from './window';

// PCG-4 — see requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md.
// -----------------------------------------------------------------------
// TARGET_CUSTOMER_MATCH has no authorized data source today (B-3 bars
// category-plausibility/research-signal substitution, and no
// Opportunity-level observed-target-customer field exists). The
// evaluator correctly resolves that criterion to 'UNKNOWN' (fail-soft,
// @acos/core-qualification-equivalence), and `anyUnknown` beats a false
// "true" in evaluateQualificationEquivalence's precedence rule — so
// `match` can be `false` or `'UNKNOWN'` here, but never a clean `true`.
// This is NOT a bug: PCG-4's numerator is NOT YET EVALUABLE-in-spirit
// (structurally zero) until a Product Owner decision resolves the
// target-customer-match data source. These tests prove that behavior
// deliberately, rather than papering over it — do not "fix" a test here
// by making match manufacture a pass.
// -----------------------------------------------------------------------

const NOW = new Date('2026-03-01T00:00:00.000Z');
const WINDOW: GateWindow = {
  start: new Date('2025-12-31T00:00:00.000Z'),
  end: new Date('2026-01-30T00:00:00.000Z'),
};

const SNAPSHOT_COLS = {
  search_service: 'AI content system',
  search_target_customer: 'Restaurants',
  search_geography: 'Mumbai',
  search_min_project_value_paise: 15_000_000,
};

function fakeSql(rows: unknown[]): SqlExecutor {
  return { query: async () => ({ rows, rowCount: rows.length }) };
}

describe('evaluatePcg4', () => {
  it('denominator counts distinct users with a completed Search, even with no Opportunity yet', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: null,
        recommended_service: null,
        offer_estimated_value_paise: null,
        reviewed: false,
        feedback_useful: null,
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ status: 'EVALUATED', denominator: 1, numerator: 0 });
  });

  it('a user whose Opportunity is reviewed + useful + service/value-matched STILL does not count, because TARGET_CUSTOMER_MATCH is UNKNOWN', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system', // matches
        offer_estimated_value_paise: 20_000_000, // matches
        reviewed: true,
        feedback_useful: true,
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    // Would be numerator: 1 if TARGET_CUSTOMER_MATCH had an authorized
    // source. It does not, so this is the documented, deliberate
    // "PCG-4 cannot yet report a positive match" state.
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('reviewed but not useful does not count (B-7 is conjunctive) — independent of the target-customer gap', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: false,
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('useful but a definite service/value mismatch does not count (a false criterion still outranks UNKNOWN — unaffected by the target-customer gap)', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'Website development', // mismatch
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('multiple Opportunity rows for one user: none counts, since every row is capped at UNKNOWN, not true', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'Website development',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
      },
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_2',
        recommended_service: 'AI content system', // service+value would match
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('PCG-4 denominator calculation is independent of the target-customer gap: multiple users with completed Searches are all counted', async () => {
    const sql = fakeSql([
      { user_id: 'user_a', ...SNAPSHOT_COLS, opportunity_id: null, recommended_service: null, offer_estimated_value_paise: null, reviewed: false, feedback_useful: null },
      { user_id: 'user_b', ...SNAPSHOT_COLS, opportunity_id: null, recommended_service: null, offer_estimated_value_paise: null, reviewed: false, feedback_useful: null },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ status: 'EVALUATED', denominator: 2, numerator: 0 });
  });

  it('never throws regardless of how many rows or which fields are null (fail-soft is preserved end-to-end)', async () => {
    const sql = fakeSql([
      { user_id: 'user_a', ...SNAPSHOT_COLS, opportunity_id: 'opp_1', recommended_service: null, offer_estimated_value_paise: null, reviewed: true, feedback_useful: true },
    ]);
    await expect(evaluatePcg4(sql, WINDOW, NOW)).resolves.toMatchObject({ numerator: 0, denominator: 1 });
  });
});

// TARGET_CUSTOMER_MATCH join/translation (TD-3/TD-13, migration 0036) —
// requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md.
// -----------------------------------------------------------------------
describe('evaluatePcg4 — target_customer_match_determinations join + translation', () => {
  it('a MATCH row completes the numerator: reviewed + useful + service/value match + MATCH -> counts', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
        target_customer_match_result: 'MATCH',
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 1, denominator: 1 });
  });

  it('a NO_MATCH row translates to the sentinel, not null — the user still does not count', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
        target_customer_match_result: 'NO_MATCH',
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('a NOT_YET_OBSERVED row behaves exactly like row-absence: UNKNOWN, never a clean true', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
        target_customer_match_result: 'NOT_YET_OBSERVED',
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('row-absence (field omitted/null, as every pre-migration-0036 row has) is unaffected — same behavior as before this join existed', async () => {
    const sql = fakeSql([
      {
        user_id: 'user_a',
        ...SNAPSHOT_COLS,
        opportunity_id: 'opp_1',
        recommended_service: 'AI content system',
        offer_estimated_value_paise: 20_000_000,
        reviewed: true,
        feedback_useful: true,
        // target_customer_match_result intentionally omitted.
      },
    ]);
    const result = await evaluatePcg4(sql, WINDOW, NOW);
    expect(result).toMatchObject({ numerator: 0, denominator: 1 });
  });
});
