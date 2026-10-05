import {
  evaluateCombinedTierConversion,
  evaluatePcg1,
  evaluatePcg2,
  evaluatePcg3a,
  evaluatePcg3b,
  evaluatePcg4,
  evaluatePcg5,
  evaluatePcg6,
  mostRecentClosedWindow,
  writeProductionSnapshot,
} from '@acos/core-launch-gates';
import {
  diffGateResults,
  recomputeBlockerGates,
  writeValidationSnapshot,
} from '@acos/core-launch-gates-validation';
import { insertRefundEvent } from '@acos/core-payments';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { runGateEvaluationTick } from '../../apps/worker/src/gateEvaluation';
import {
  createGatesTracker,
  cleanupGatesFixtures,
  seedCapturedPaymentAt,
  seedCompany,
  seedFeedback,
  seedFunnelEvent,
  seedOpportunity,
  seedOrderAt,
  seedProspect,
  seedSearch,
  seedServiceProfile,
  seedUser,
} from '../fixtures/launch-gates-fixtures';

import { suiteDatabase } from './support/suiteDb';

// PDEF-4 Phase 9 — deterministic real-Postgres validation fixture suite
// (ED-12), authorized under CLIENT-FINDER-PDEF-4-IMPLEMENTATION-
// AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// Closes the gap the Implementation Conformance Record §4/§6 flagged:
// "the full fixture suite exercising recomputeBlockerGates end-to-end
// against seeded real-Postgres data ... was not written." Every expected
// number below is hand-derived from what this file seeds, not from
// calling a gate evaluator and asserting its own output back at itself —
// the point is to catch a gate query that is INTERNALLY consistent but
// WRONG, which a self-referential assertion structurally cannot do.
//
// Each `describe` uses its own fixed, closed window (`windowFor(now)`)
// so scenarios never interact through a shared window boundary.
//
// Coverage against the 16-scenario list in the conformance record §4,
// two of which are deliberately NOT exercised here because the
// underlying mechanism does not exist in production code (not a Phase 9
// gap — see CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md
// §6 for the ED-3 disposition, and ED-2 in the engineering design
// decision, both: "reserved, not built"):
//   - "anonymous -> identified visitor" (ED-2's merge logic is deferred
//     by design; funnel_events' visitor_id/user_id are never reconciled
//     by any code this suite could exercise)
//   - "bot/internal exclusion" (ED-3's allowlist mechanism is not
//     implemented; no gate query filters by identifier today)
// -----------------------------------------------------------------------

const suite = suiteDatabase('gates_phase9');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

/** A fixed `now` 40 days after `end`, comfortably past window close, paired with its most-recent-closed window. */
function windowFor(nowIso: string) {
  const now = new Date(nowIso);
  const window = mostRecentClosedWindow(now);
  return { now, window };
}

describe('PCG-1 — demonstrated-intent population', () => {
  it('counts orders by created_at, independent of status, and matches the independent recomputation', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-01T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'p1a', { createdAt: window.start });
    await seedOrderAt(db.client, context, 'p1b', { createdAt: new Date(window.start.getTime() + 1) });
    await seedOrderAt(db.client, context, 'p1c', { createdAt: new Date(window.end.getTime() - 1) });

    const result = await evaluatePcg1(db.client, window, now);
    expect(result.status).toBe('EVALUATED');
    expect(result.numerator).toBe(3);

    const validation = await recomputeBlockerGates(db.client, now);
    const pcg1Validation = validation.find((r) => r.gate === 'PCG-1')!;
    expect(pcg1Validation.numerator).toBe(3);

    const [diff] = diffGateResults([result], [pcg1Validation]);
    expect(diff!.matches).toBe(true);
  });

  it('rolling-window boundary: window.start is inclusive, window.end is exclusive', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-02T00:00:00.000Z');

    // Exactly on the inclusive start boundary -> counted.
    await seedOrderAt(db.client, context, 'b1', { createdAt: window.start });
    // 1ms before start -> belongs to the PREVIOUS window, not this one.
    await seedOrderAt(db.client, context, 'b2', { createdAt: new Date(window.start.getTime() - 1) });
    // Exactly on the exclusive end boundary -> belongs to the NEXT window.
    await seedOrderAt(db.client, context, 'b3', { createdAt: window.end });
    // 1ms after end -> also next window.
    await seedOrderAt(db.client, context, 'b4', { createdAt: new Date(window.end.getTime() + 1) });

    const result = await evaluatePcg1(db.client, window, now);
    expect(result.numerator).toBe(1);
  });

  it('NOT_YET_EVALUABLE when the window has not closed yet', async () => {
    const { db } = suite.require();
    const now = new Date('2026-03-03T00:00:00.000Z');
    // A window whose end has not yet elapsed as of `now` (isClosed is
    // `window.end <= now`, so end must be strictly in the future).
    const openWindow = { start: new Date(now.getTime() - 30 * 86_400_000), end: new Date(now.getTime() + 1) };

    const result = await evaluatePcg1(db.client, openWindow, now);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
  });
});

describe('PCG-2 — payment-capture population, immutable after refund', () => {
  it('counts CAPTURED payments by created_at and is unaffected by a later refund', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-04T00:00:00.000Z');

    const order1 = await seedOrderAt(db.client, context, 'p2a', { createdAt: window.start });
    await seedCapturedPaymentAt(db.client, context, order1, 'p2a', { createdAt: window.start });
    const order2 = await seedOrderAt(db.client, context, 'p2b', { createdAt: window.start });
    const payment2 = await seedCapturedPaymentAt(db.client, context, order2, 'p2b', {
      createdAt: window.start,
    });

    const before = await evaluatePcg2(db.client, window, now);
    expect(before.numerator).toBe(2);

    // Refund processed well AFTER window close must not change this closed
    // window's PCG-2 count — the query only ever reads payments.created_at.
    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${context.id('grefund', 'p2b')}`,
      orderId: order2,
      paymentId: payment2,
      amountPaise: 49_900,
      currency: 'INR',
      refundType: 'FULL',
      status: 'processed',
      occurredAt: new Date(window.end.getTime() + 86_400_000),
    });

    const after = await evaluatePcg2(db.client, window, now);
    expect(after.numerator).toBe(2);

    const validation = await recomputeBlockerGates(db.client, now);
    const pcg2Validation = validation.find((r) => r.gate === 'PCG-2')!;
    expect(pcg2Validation.numerator).toBe(2);
  });
});

describe('PCG-3A / PCG-3B — tier exposure-to-purchase conversion', () => {
  it('computes the ratio per tier and matches the independently-recomputed value', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-05T00:00:00.000Z');

    // Tier A: 3 first-exposures, 1 purchase.
    for (const n of [1, 2, 3]) {
      await seedFunnelEvent(db.client, context, createGatesTracker(), `a${n}`, {
        eventName: 'upsell_viewed',
        subjectType: 'product',
        subjectId: 'ai_freelancing_499',
        occurredAt: window.start,
        visitorId: context.id('visitor', `a${n}`),
      });
    }
    const orderA = await seedOrderAt(db.client, context, 'a1', {
      createdAt: window.start,
      productId: 'ai_freelancing_499',
      amountPaise: 49_900,
    });
    await seedCapturedPaymentAt(db.client, context, orderA, 'a1', {
      createdAt: window.start,
      amountPaise: 49_900,
    });

    const pcg3a = await evaluatePcg3a(db.client, window, now);
    expect(pcg3a.status).toBe('EVALUATED');
    expect(pcg3a.denominator).toBe(3);
    expect(pcg3a.numerator).toBe(1);
    expect(pcg3a.value).toBeCloseTo(1 / 3);

    const pcg3b = await evaluatePcg3b(db.client, window, now);
    expect(pcg3b.status).toBe('NOT_YET_EVALUABLE'); // zero exposures seeded for tier B here
  });

  it('a dual-tier user (exposed to and purchasing both tiers) counts independently in each tier AND once in the combined figure', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-06T00:00:00.000Z');
    const sharedVisitor = context.id('visitor', 'dual');
    const sharedEmail = `${context.id('dual', 'buyer')}@fixture.example.com`;

    await seedFunnelEvent(db.client, context, createGatesTracker(), 'duala', {
      eventName: 'upsell_viewed',
      subjectType: 'product',
      subjectId: 'ai_freelancing_499',
      occurredAt: window.start,
      visitorId: sharedVisitor,
    });
    await seedFunnelEvent(db.client, context, createGatesTracker(), 'dualb', {
      eventName: 'upsell_viewed',
      subjectType: 'product',
      subjectId: 'ai_client_acquisition_1499',
      occurredAt: window.start,
      visitorId: sharedVisitor,
    });

    const orderA = await seedOrderAt(db.client, context, 'duala', {
      createdAt: window.start,
      productId: 'ai_freelancing_499',
      amountPaise: 49_900,
      customerEmail: sharedEmail,
    });
    await seedCapturedPaymentAt(db.client, context, orderA, 'duala', {
      createdAt: window.start,
      amountPaise: 49_900,
    });
    const orderB = await seedOrderAt(db.client, context, 'dualb', {
      createdAt: window.start,
      productId: 'ai_client_acquisition_1499',
      amountPaise: 149_900,
      customerEmail: sharedEmail,
    });
    await seedCapturedPaymentAt(db.client, context, orderB, 'dualb', {
      createdAt: window.start,
      amountPaise: 149_900,
    });

    const pcg3a = await evaluatePcg3a(db.client, window, now);
    const pcg3b = await evaluatePcg3b(db.client, window, now);
    expect(pcg3a.numerator).toBe(1);
    expect(pcg3a.denominator).toBe(1);
    expect(pcg3b.numerator).toBe(1);
    expect(pcg3b.denominator).toBe(1);

    // Combined: one visitor exposed to either tier, one purchaser (by
    // distinct customer email) — counted ONCE, not twice, per the
    // governance instruction ("combined population counts a person once").
    const combined = await evaluateCombinedTierConversion(db.client, window, now);
    expect(combined.status).toBe('EVALUATED');
    expect(combined.denominator).toBe(1);
    expect(combined.numerator).toBe(1);
    expect(combined.perTier['PCG-3A'].numerator).toBe(1);
    expect(combined.perTier['PCG-3B'].numerator).toBe(1);
  });

  it('duplicate upsell_viewed events for the same (visitor, product) dedupe to a single first-exposure row', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-07T00:00:00.000Z');
    const visitor = context.id('visitor', 'dup');
    const tracker = createGatesTracker();

    const first = await seedFunnelEvent(db.client, context, tracker, 'dup1', {
      eventName: 'upsell_viewed',
      subjectType: 'product',
      subjectId: 'ai_freelancing_499',
      occurredAt: window.start,
      visitorId: visitor,
    });
    const second = await seedFunnelEvent(db.client, context, tracker, 'dup2', {
      eventName: 'upsell_viewed',
      subjectType: 'product',
      subjectId: 'ai_freelancing_499',
      occurredAt: new Date(window.start.getTime() + 60_000),
      visitorId: visitor,
    });

    expect(first.inserted).toBe(true);
    expect(second.inserted).toBe(false); // ON CONFLICT DO NOTHING — the unique index did its job

    const pcg3a = await evaluatePcg3a(db.client, window, now);
    expect(pcg3a.denominator).toBe(1); // not 2 — the duplicate was never actually stored

    await cleanupGatesFixtures(db.client, tracker);
  });

  it('NOT_YET_EVALUABLE on zero denominator (no exposures at all in a closed window)', async () => {
    const { db } = suite.require();
    const { now, window } = windowFor('2026-03-08T00:00:00.000Z');
    const result = await evaluatePcg3a(db.client, window, now);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
    expect(result.denominator).toBe(0);
  });
});

describe('PCG-4 — activation-to-useful-and-qualified conversion (NOT YET EVALUABLE by design)', () => {
  it('denominator counts COMPLETE searches in-window; numerator stays 0 even for a reviewed+useful opportunity, because TARGET_CUSTOMER_MATCH is structurally UNKNOWN', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-09T00:00:00.000Z');
    const tracker = createGatesTracker();

    const userId = await seedUser(db.client, context, tracker, 'p4');
    const profileId = await seedServiceProfile(db.client, context, tracker, userId, 'p4', {
      service: 'ai_automation',
      targetCustomer: 'smb_saas',
      geography: 'IN',
      minProjectValuePaise: 100_000,
    });
    const searchId = await seedSearch(db.client, context, tracker, userId, profileId, 'p4', {
      status: 'COMPLETE',
      completedAt: window.start,
      service: 'ai_automation',
      targetCustomer: 'smb_saas',
      geography: 'IN',
      minProjectValuePaise: 100_000,
    });
    const companyId = await seedCompany(db.client, context, tracker, userId, 'p4');
    const prospectId = await seedProspect(db.client, context, tracker, userId, searchId, companyId, 'p4');
    const opportunityId = await seedOpportunity(db.client, context, tracker, userId, prospectId, 'p4', {
      needDetected: true,
      recommendedService: 'ai_automation', // matches search.service — SERVICE_MATCH satisfied
      offerRationale: 'fixture',
      offerEstimatedValuePaise: 200_000, // >= minProjectValuePaise — MINIMUM_VALUE_MATCH satisfied
      offerFit: 80,
    });
    await seedFeedback(db.client, context, tracker, userId, opportunityId, 'p4', true); // useful
    await seedFunnelEvent(db.client, context, tracker, 'p4', {
      eventName: 'opportunity_reviewed',
      subjectType: 'opportunity',
      subjectId: opportunityId,
      occurredAt: window.start,
      userId,
    });

    const result = await evaluatePcg4(db.client, window, now);
    expect(result.status).toBe('EVALUATED');
    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(0); // deliberate — see pcg4.ts's own header and §3 of the conformance record
    expect(result.value).toBe(0);

    await cleanupGatesFixtures(db.client, tracker);
  });

  it('NOT_YET_EVALUABLE on zero denominator (no COMPLETE searches in the window)', async () => {
    const { db } = suite.require();
    const { now, window } = windowFor('2026-03-10T00:00:00.000Z');
    const result = await evaluatePcg4(db.client, window, now);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
  });

  it('a search outside the window, or not COMPLETE, is excluded from the denominator', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-11T00:00:00.000Z');
    const tracker = createGatesTracker();

    const userId = await seedUser(db.client, context, tracker, 'p4b');
    const profileId = await seedServiceProfile(db.client, context, tracker, userId, 'p4b', {
      service: 'ai_automation',
      targetCustomer: 'smb_saas',
      geography: 'IN',
      minProjectValuePaise: 100_000,
    });
    // RUNNING, not COMPLETE — excluded regardless of completed_at.
    await seedSearch(db.client, context, tracker, userId, profileId, 'p4b-running', {
      status: 'RUNNING',
      completedAt: null,
      service: 'ai_automation',
      targetCustomer: 'smb_saas',
      geography: 'IN',
      minProjectValuePaise: 100_000,
    });
    // COMPLETE but completed_at is OUTSIDE the window (before start) — excluded.
    await seedSearch(db.client, context, tracker, userId, profileId, 'p4b-outside', {
      status: 'COMPLETE',
      completedAt: new Date(window.start.getTime() - 86_400_000),
      service: 'ai_automation',
      targetCustomer: 'smb_saas',
      geography: 'IN',
      minProjectValuePaise: 100_000,
    });

    const result = await evaluatePcg4(db.client, window, now);
    expect(result.status).toBe('NOT_YET_EVALUABLE');
    expect(result.denominator).toBe(0);

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('PCG-5 — refund rate (monitoring), reversal/binary treatment', () => {
  it('counts a transaction once regardless of how many refund_events rows reference its payment (partial-then-full is NOT double-counted)', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-12T00:00:00.000Z');

    const refundedOrder = await seedOrderAt(db.client, context, 'p5a', { createdAt: window.start });
    const refundedPayment = await seedCapturedPaymentAt(db.client, context, refundedOrder, 'p5a', {
      createdAt: window.start,
    });
    const cleanOrder = await seedOrderAt(db.client, context, 'p5b', { createdAt: window.start });
    await seedCapturedPaymentAt(db.client, context, cleanOrder, 'p5b', { createdAt: window.start });

    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${context.id('grefund', 'p5a-partial')}`,
      orderId: refundedOrder,
      paymentId: refundedPayment,
      amountPaise: 10_000,
      currency: 'INR',
      refundType: 'PARTIAL',
      status: 'processed',
      occurredAt: new Date(window.start.getTime() + 60_000),
    });
    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${context.id('grefund', 'p5a-full')}`,
      orderId: refundedOrder,
      paymentId: refundedPayment,
      amountPaise: 39_900,
      currency: 'INR',
      refundType: 'PARTIAL',
      status: 'processed',
      occurredAt: new Date(window.start.getTime() + 120_000),
    });

    const result = await evaluatePcg5(db.client, window, now);
    expect(result.status).toBe('EVALUATED');
    expect(result.denominator).toBe(2); // two captured payments
    expect(result.numerator).toBe(1); // only one of them has any refund — counted once, not twice
    expect(result.value).toBe(0.5);
  });

  it('a refund occurring after window close is invisible to that closed window (immutability)', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-13T00:00:00.000Z');

    const order = await seedOrderAt(db.client, context, 'p5c', { createdAt: window.start });
    const payment = await seedCapturedPaymentAt(db.client, context, order, 'p5c', { createdAt: window.start });

    const before = await evaluatePcg5(db.client, window, now);
    expect(before.numerator).toBe(0);

    await insertRefundEvent(db.client, {
      razorpayRefundId: `rfnd_${context.id('grefund', 'p5c-late')}`,
      orderId: order,
      paymentId: payment,
      amountPaise: 49_900,
      currency: 'INR',
      refundType: 'FULL',
      status: 'processed',
      occurredAt: new Date(window.end.getTime() + 86_400_000), // after this window's close
    });

    const after = await evaluatePcg5(db.client, window, now);
    expect(after.numerator).toBe(0); // unchanged — the refund belongs to a later window
  });
});

describe('PCG-6 — reviewed rate (monitoring), denominator = PCG-1 population', () => {
  it('numerator = opportunity_reviewed count, denominator = PCG-1 (not an exposure count)', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-14T00:00:00.000Z');
    const tracker = createGatesTracker();

    // Three PCG-1-counted orders (demonstrated intent)...
    await seedOrderAt(db.client, context, 'p6a', { createdAt: window.start });
    await seedOrderAt(db.client, context, 'p6b', { createdAt: window.start });
    await seedOrderAt(db.client, context, 'p6c', { createdAt: window.start });

    // ...but only one opportunity_reviewed event.
    await seedFunnelEvent(db.client, context, tracker, 'p6', {
      eventName: 'opportunity_reviewed',
      subjectType: 'opportunity',
      subjectId: context.id('gopp', 'p6-subject'),
      occurredAt: window.start,
      userId: context.id('guser', 'p6-reviewer'),
    });

    const result = await evaluatePcg6(db.client, window, now);
    expect(result.status).toBe('EVALUATED');
    expect(result.denominator).toBe(3); // PCG-1's population, not an exposure count
    expect(result.numerator).toBe(1);
    expect(result.value).toBeCloseTo(1 / 3);

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('Evidence persistence (ED-13) — production and validation snapshots for the same window', () => {
  it('writes both computation_path rows and they can be re-read back out', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-15T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'eva', { createdAt: window.start });

    const production = await evaluatePcg1(db.client, window, now);
    await writeProductionSnapshot(db.client, production);

    const [validationPcg1] = (await recomputeBlockerGates(db.client, now)).filter((r) => r.gate === 'PCG-1');
    await writeValidationSnapshot(db.client, validationPcg1!);

    const { rows } = await db.client.query(
      `SELECT computation_path, result FROM gate_evaluation_snapshots
        WHERE gate = 'PCG-1' AND window_start = $1 AND window_end = $2
        ORDER BY computation_path`,
      [window.start, window.end],
    );
    expect(rows).toHaveLength(2);
    expect((rows[0] as { computation_path: string }).computation_path).toBe('PRODUCTION');
    expect((rows[1] as { computation_path: string }).computation_path).toBe('VALIDATION');

    // Re-running the same (gate, window, path) is idempotent (migration
    // 0035's unique index + ON CONFLICT ... DO UPDATE), not a duplicate row.
    await writeProductionSnapshot(db.client, production);
    const { rows: afterRerun } = await db.client.query(
      `SELECT count(*)::int AS n FROM gate_evaluation_snapshots
        WHERE gate = 'PCG-1' AND window_start = $1 AND window_end = $2`,
      [window.start, window.end],
    );
    expect((afterRerun[0] as { n: number }).n).toBe(2);

    await db.client.query(
      `DELETE FROM gate_evaluation_snapshots WHERE gate = 'PCG-1' AND window_start = $1 AND window_end = $2`,
      [window.start, window.end],
    );
  });
});

describe('All four blocker gates together — production vs. independent recomputation, same seeded data', () => {
  it('diffGateResults reports a full match across PCG-1/2/3A/3B for a populated window', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-16T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'alla', { createdAt: window.start });
    await seedOrderAt(db.client, context, 'allb', { createdAt: window.start });
    const paidOrder = await seedOrderAt(db.client, context, 'allc', {
      createdAt: window.start,
      productId: 'ai_freelancing_499',
    });
    await seedCapturedPaymentAt(db.client, context, paidOrder, 'allc', { createdAt: window.start });
    await seedFunnelEvent(db.client, context, createGatesTracker(), 'alla', {
      eventName: 'upsell_viewed',
      subjectType: 'product',
      subjectId: 'ai_freelancing_499',
      occurredAt: window.start,
      visitorId: context.id('visitor', 'alla'),
    });

    const production = [
      await evaluatePcg1(db.client, window, now),
      await evaluatePcg2(db.client, window, now),
      await evaluatePcg3a(db.client, window, now),
      await evaluatePcg3b(db.client, window, now),
    ];
    const validation = await recomputeBlockerGates(db.client, now);

    const diffs = diffGateResults(production, validation);
    for (const diff of diffs) {
      expect(diff.matches, `${diff.gate} mismatch: ${JSON.stringify(diff)}`).toBe(true);
    }
  });
});

describe('Gate-evaluation worker wiring (PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001) — the actual tick function, not evaluateAllGates called directly', () => {
  it('a tick evaluates all gates and persists a PRODUCTION snapshot per gate for the current closed window', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-20T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'tick-a', { createdAt: window.start });

    const outcome = await runGateEvaluationTick({ sql: db.client, now: () => now });

    expect(outcome.evaluated).toEqual(['PCG-1', 'PCG-2', 'PCG-3A', 'PCG-3B', 'PCG-4', 'PCG-5', 'PCG-6']);

    const { rows } = await db.client.query(
      `SELECT gate, computation_path FROM gate_evaluation_snapshots
        WHERE window_start = $1 AND window_end = $2 AND computation_path = 'PRODUCTION'
        ORDER BY gate`,
      [window.start, window.end],
    );
    expect(rows).toHaveLength(7);

    await db.client.query(
      `DELETE FROM gate_evaluation_snapshots WHERE window_start = $1 AND window_end = $2`,
      [window.start, window.end],
    );
  });

  it('a repeat tick for the same already-evaluated window is a no-op, not a duplicate row and not a thrown error', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-21T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'tick-b', { createdAt: window.start });

    await runGateEvaluationTick({ sql: db.client, now: () => now });
    await expect(runGateEvaluationTick({ sql: db.client, now: () => now })).resolves.not.toThrow;

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM gate_evaluation_snapshots
        WHERE window_start = $1 AND window_end = $2 AND computation_path = 'PRODUCTION'`,
      [window.start, window.end],
    );
    expect((rows[0] as { n: number }).n).toBe(7);

    await db.client.query(
      `DELETE FROM gate_evaluation_snapshots WHERE window_start = $1 AND window_end = $2`,
      [window.start, window.end],
    );
  });

  it('a failed tick (simulated) does not persist a partial snapshot, and a subsequent tick succeeds normally', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-22T00:00:00.000Z');

    await seedOrderAt(db.client, context, 'tick-c', { createdAt: window.start });

    await expect(
      runGateEvaluationTick({
        sql: db.client,
        now: () => now,
        evaluateAllGates: async () => {
          throw new Error('simulated evaluation failure');
        },
      }),
    ).rejects.toThrow('simulated evaluation failure');

    const { rows: afterFailure } = await db.client.query(
      `SELECT count(*)::int AS n FROM gate_evaluation_snapshots
        WHERE window_start = $1 AND window_end = $2 AND computation_path = 'PRODUCTION'`,
      [window.start, window.end],
    );
    expect((afterFailure[0] as { n: number }).n).toBe(0);

    // The next (simulated) tick, with no injected failure, succeeds normally — retry-on-next-tick.
    const outcome = await runGateEvaluationTick({ sql: db.client, now: () => now });
    expect(outcome.evaluated).toHaveLength(7);

    await db.client.query(
      `DELETE FROM gate_evaluation_snapshots WHERE window_start = $1 AND window_end = $2`,
      [window.start, window.end],
    );
  });
});
