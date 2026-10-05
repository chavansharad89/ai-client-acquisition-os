import { evaluateQualificationEquivalence } from '@acos/core-qualification-equivalence';

import { buildRatioResult } from './ratio';
import type { GateResult, SqlExecutor } from './types';
import type { GateWindow } from './window';

// PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.1 — the exact, fixed literal,
// restated here rather than imported from @acos/core-research, to avoid
// adding a new cross-package dependency for one constant (this module
// otherwise depends only on @acos/core-qualification-equivalence).
const NO_MATCH_SENTINEL = '\u0000__PCG4_NO_MATCH_SENTINEL__\u0000';

type TargetCustomerMatchResult = 'MATCH' | 'NO_MATCH' | 'NOT_YET_OBSERVED';

/**
 * TD-3/TD-13 — the pcg4.ts-boundary translation. `MATCH` maps to the
 * Search's own `targetCustomer` string (the existing equality check in
 * evaluateTargetCustomerMatch then trivially passes); `NO_MATCH` maps to
 * the sentinel (guaranteed to normalise differently from any real
 * targetCustomer value); `NOT_YET_OBSERVED`/row-absent maps to `null`
 * (the existing UNKNOWN branch, unchanged).
 * @acos/core-qualification-equivalence is not modified.
 */
function toObservedTargetCustomer(
  result: TargetCustomerMatchResult | null,
  targetCustomer: string,
): string | null {
  if (result === 'MATCH') return targetCustomer;
  if (result === 'NO_MATCH') return NO_MATCH_SENTINEL;
  return null;
}

// PCG-4 — activation-to-useful-and-qualified conversion.
// -----------------------------------------------------------------------
// Denominator (ED-8): users with >=1 Search whose status is COMPLETE in
// the window — queried directly against `searches`, never derived from
// another gate's population.
//
// Numerator (B-7, conjunctive): of those users, how many have at least
// one reviewed Opportunity (ED-9's funnel_events 'opportunity_reviewed')
// that is BOTH feedback.useful AND a qualification-equivalence match
// (@acos/core-qualification-equivalence, called here with real data —
// the evaluator itself stays pure and knows nothing about SQL).
//
// ED-11: one single joined query gathers every raw fact this needs;
// the per-row evaluator call and user-level aggregation happen in
// application code, because the evaluator is a pure TS function, not
// SQL — "single joined query" is about the DATA FETCH, not about
// expressing the evaluator itself as SQL.
//
// TARGET_CUSTOMER_MATCH (requirement/
// CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision chain):
// observedTargetCustomer is now read from target_customer_match_
// determinations (migration 0036), via the LEFT JOIN above and the
// toObservedTargetCustomer() translation. A row's tri-state `result`
// (MATCH/NO_MATCH/NOT_YET_OBSERVED) translates to a value/sentinel/null
// respectively; row-absence (no Research-time observation has run for
// this Search+Prospect yet) also translates to null, exactly as the
// hardcoded-null behavior this replaces did — so until that signal's
// own, separately-authorized production wiring actually populates rows
// (this record authorizes the table/evaluator/pipeline-integration code,
// not deployment — see PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §9),
// observedTargetCustomer remains `null` and PCG-4's numerator remains
// exactly as constrained as before. @acos/core-qualification-equivalence
// itself is unmodified (TD-3/TD-12).
// -----------------------------------------------------------------------

interface Pcg4Row {
  user_id: string;
  search_service: string;
  search_target_customer: string;
  search_geography: string;
  search_min_project_value_paise: number;
  opportunity_id: string | null;
  recommended_service: string | null;
  offer_estimated_value_paise: number | null;
  reviewed: boolean;
  feedback_useful: boolean | null;
  target_customer_match_result: TargetCustomerMatchResult | null;
}

export async function evaluatePcg4(
  sql: SqlExecutor,
  window: GateWindow,
  now: Date,
): Promise<GateResult> {
  const { rows } = await sql.query(
    `SELECT
        s.user_id                       AS user_id,
        s.service                       AS search_service,
        s.target_customer               AS search_target_customer,
        s.geography                     AS search_geography,
        s.min_project_value_paise       AS search_min_project_value_paise,
        o.id                            AS opportunity_id,
        o.recommended_service           AS recommended_service,
        o.offer_estimated_value_paise   AS offer_estimated_value_paise,
        (fe.id IS NOT NULL)              AS reviewed,
        f.useful                        AS feedback_useful,
        tcm.result                      AS target_customer_match_result
      FROM searches s
      LEFT JOIN prospects p ON p.search_id = s.id
      LEFT JOIN opportunities o ON o.prospect_id = p.id
      LEFT JOIN funnel_events fe
        ON fe.event_name = 'opportunity_reviewed'
       AND fe.subject_id = o.id
       AND fe.user_id = s.user_id
      LEFT JOIN feedback f
        ON f.opportunity_id = o.id
      LEFT JOIN target_customer_match_determinations tcm
        ON tcm.search_id = s.id
       AND tcm.prospect_id = p.id
       AND tcm.superseded_at IS NULL
     WHERE s.status = 'COMPLETE'
       AND s.completed_at >= $1 AND s.completed_at < $2`,
    [window.start, window.end],
  );

  const byUser = new Map<string, Pcg4Row[]>();
  for (const row of rows as Pcg4Row[]) {
    const bucket = byUser.get(row.user_id) ?? [];
    bucket.push(row);
    byUser.set(row.user_id, bucket);
  }

  const denominator = byUser.size;
  let numerator = 0;
  for (const userRows of byUser.values()) {
    const userIsUsefulAndQualified = userRows.some((row) => {
      if (!row.reviewed || row.feedback_useful !== true) return false;
      const result = evaluateQualificationEquivalence(
        {
          service: row.search_service,
          targetCustomer: row.search_target_customer,
          geography: row.search_geography,
          minProjectValuePaise: row.search_min_project_value_paise,
        },
        {
          offerService: row.recommended_service,
          offerEstimatedValuePaise: row.offer_estimated_value_paise,
          observedTargetCustomer: toObservedTargetCustomer(
            row.target_customer_match_result,
            row.search_target_customer,
          ),
        },
      );
      return result.match === true;
    });
    if (userIsUsefulAndQualified) numerator += 1;
  }

  return buildRatioResult('PCG-4', window, now, numerator, denominator);
}
