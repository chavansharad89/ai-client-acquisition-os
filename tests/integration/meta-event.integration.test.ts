import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildPurchaseEventId } from '@acos/core-capi';
import {
  claimMetaEvent,
  claimMetaEvents,
  createPgMetaEventRepository,
  processMetaEvent,
  releaseExpiredLeases,
  type MetaEventWorkerDeps,
} from '@acos/worker/metaEvents';

import { seedOrder, seedCapturedPayment } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// META — real PostgreSQL.
// -----------------------------------------------------------------------
// The worker's claiming, leasing and fencing are exercised against real
// `FOR UPDATE SKIP LOCKED` here. The unit suite in apps/worker proves the
// decision logic on a single-threaded fake; only this file can show that
// two genuinely parallel transactions never hand out the same row.
// -----------------------------------------------------------------------

const suite = suiteDatabase('meta', { dropTargetIndexes: true });

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const config = { pixelId: '123', apiVersion: 'v20.0', accessToken: 'secret' };

function deps(workerId: string, over: Partial<MetaEventWorkerDeps> = {}): MetaEventWorkerDeps {
  const { db } = suite.require();
  return {
    repository: createPgMetaEventRepository(db.client),
    config,
    workerId,
    loadContext: async () => ({
      eventTime: new Date(),
      productId: 'ai_freelancing_499',
      productName: 'AI Freelancing Launch Kit',
      clientIp: '203.0.113.8',
      userAgent: 'integration',
    }),
    sender: async () => undefined,
    ...over,
  };
}

/** Inserts one PENDING meta event and returns its id and stable event id. */
async function seedMetaEvent(
  suffix: string,
  overrides: { attempts?: number; nextAttemptAt?: Date; metaEventId?: string } = {},
): Promise<{ id: string; metaEventId: string; orderId: string }> {
  const { db, context } = suite.require();
  const orderId = await seedOrder(db.client, context, suffix);
  // Migration 0003's meta_event_requires_captured_payment trigger: a Meta
  // event may not reference an order that was never paid. The fixture has
  // to create the precondition the schema requires — it cannot assert
  // around it.
  await seedCapturedPayment(db.client, context, orderId, suffix);
  const id = context.id('metaevent', suffix);
  const metaEventId = overrides.metaEventId ?? buildPurchaseEventId({ paymentId: `pay_${suffix}` });
  await db.client.query(
    `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                              value_paise, currency, attempts, next_attempt_at, updated_at)
     VALUES ($1, $2, $3, 'Purchase', 'ai_freelancing_499', 49900, 'INR', $4, $5, now())`,
    [id, metaEventId, orderId, overrides.attempts ?? 0, overrides.nextAttemptAt ?? new Date()],
  );
  context.trackMetaEvent(id);
  return { id, metaEventId, orderId };
}

async function statusOf(id: string) {
  const { db } = suite.require();
  const { rows } = await db.client.query(
    `SELECT status, attempts, lease_owner, next_attempt_at, last_error
       FROM meta_events WHERE id = $1`,
    [id],
  );
  return rows[0];
}

describe('META — MetaEvent creation', () => {
  it('a PENDING event is immediately claimable', async () => {
    const seeded = await seedMetaEvent('create');
    const claimed = await claimMetaEvent(deps('w1'));
    expect(claimed?.id).toBe(seeded.id);
    expect((await statusOf(seeded.id)).status).toBe('PROCESSING');
  });

  it('an event scheduled in the future is not claimed', async () => {
    await seedMetaEvent('future', { nextAttemptAt: new Date(Date.now() + 600_000) });
    expect(await claimMetaEvent(deps('w1'))).toBeNull();
  });
});

describe('META — stable event ID', () => {
  it('the persisted id is reused verbatim on every send', async () => {
    const seeded = await seedMetaEvent('stable');
    const sent: string[] = [];
    const sender = vi.fn(async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
      if (sent.length === 1) throw new Error('transient Meta failure');
    });

    const d = deps('w1', { sender: sender as never });
    await processMetaEvent(d, (await claimMetaEvent(d))!);

    // Make the retry due, then send again.
    await suite
      .require()
      .db.client.query(
        `UPDATE meta_events SET next_attempt_at = now() - interval '1 second' WHERE id = $1`,
        [seeded.id],
      );
    await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(sent).toEqual([seeded.metaEventId, seeded.metaEventId]);
    expect(new Set(sent).size).toBe(1);
  });

  it('buildPurchaseEventId is deterministic for a payment id', () => {
    expect(buildPurchaseEventId({ paymentId: 'pay_x' })).toBe(
      buildPurchaseEventId({ paymentId: 'pay_x' }),
    );
  });
});

describe('META — retry', () => {
  it('a failure returns the row to PENDING with attempts incremented and a future schedule', async () => {
    const seeded = await seedMetaEvent('retry');
    const d = deps('w1', {
      sender: async () => {
        throw new Error('Meta timeout');
      },
    });

    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(result.outcome).toBe('retry');
    const row = await statusOf(seeded.id);
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(1);
    expect(row.lease_owner).toBeNull();
    expect(new Date(row.next_attempt_at).getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
  });

  it('a retry is invisible to claimers until it is due', async () => {
    await seedMetaEvent('notdue');
    const d = deps('w1', {
      sender: async () => {
        throw new Error('Meta timeout');
      },
      random: () => 1, // push the delay to the top of the window
    });
    await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(await claimMetaEvent(deps('w2'))).toBeNull();
  });
});

describe('META — failure', () => {
  it('dead-letters once the attempt budget is spent', async () => {
    const seeded = await seedMetaEvent('dead', { attempts: 4 });
    const d = deps('w1', {
      sender: async () => {
        throw new Error('Meta down');
      },
    });

    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(result.outcome).toBe('dead_letter');
    const row = await statusOf(seeded.id);
    expect(row.status).toBe('DEAD_LETTER');
    expect(row.attempts).toBe(5);
    expect(row.last_error).toBeTruthy();
  });

  it('a DEAD_LETTER row is never claimed again', async () => {
    await seedMetaEvent('deadagain', { attempts: 4 });
    const d = deps('w1', {
      sender: async () => {
        throw new Error('Meta down');
      },
    });
    await processMetaEvent(d, (await claimMetaEvent(d))!);
    expect(await claimMetaEvent(deps('w2'))).toBeNull();
  });

  it('a SENT row is never claimed again', async () => {
    const seeded = await seedMetaEvent('sent');
    const d = deps('w1');
    expect(await processMetaEvent(d, (await claimMetaEvent(d))!)).toEqual({ outcome: 'sent' });
    expect((await statusOf(seeded.id)).status).toBe('SENT');
    expect(await claimMetaEvent(deps('w2'))).toBeNull();
  });
});

/**
 * Ages a claimed lease past its expiry.
 *
 * Tests used to fake this with `leaseDurationMs: -1000`, which
 * assertWorkerConfig now rejects as the configuration error it is. A
 * lease in production expires because the clock passed it, so that is
 * what this reproduces — and it exercises releaseExpiredLeases' real
 * `lease_expires_at < now()` predicate instead of a value no running
 * worker could produce.
 */
async function expireLease(id: string): Promise<void> {
  const { db } = suite.require();
  await db.client.query(
    `UPDATE meta_events SET lease_expires_at = now() - interval '1 minute' WHERE id = $1`,
    [id],
  );
}

describe('META — lease reclaim', () => {
  it('an expired lease returns to PENDING without charging an attempt', async () => {
    const seeded = await seedMetaEvent('lease', { attempts: 2 });
    await claimMetaEvent(deps('dead-worker', { leaseDurationMs: 600_000 }));
    expect((await statusOf(seeded.id)).status).toBe('PROCESSING');
    await expireLease(seeded.id);

    expect(await releaseExpiredLeases(deps('janitor'))).toBe(1);

    const row = await statusOf(seeded.id);
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(2);
    expect(row.lease_owner).toBeNull();
  });

  it('a live lease is left alone', async () => {
    await seedMetaEvent('livelease');
    await claimMetaEvent(deps('w1', { leaseDurationMs: 600_000 }));
    expect(await releaseExpiredLeases(deps('janitor'))).toBe(0);
  });

  it('fences the stale worker: its late completion does not land', async () => {
    const seeded = await seedMetaEvent('fence');
    const stale = deps('stale', { leaseDurationMs: 600_000 });
    const claimed = await claimMetaEvent(stale);

    // The stale worker is still holding `claimed` when its lease lapses —
    // which is the whole scenario: it believes it owns the row, and it
    // does not.
    await expireLease(seeded.id);
    await releaseExpiredLeases(deps('janitor'));
    const fresh = deps('fresh');
    const retaken = await claimMetaEvent(fresh);
    expect(retaken!.id).toBe(claimed!.id);

    const late = await processMetaEvent(stale, claimed!);

    // NOT 'fenced'. The stale worker's send to Meta SUCCEEDED — it only
    // discovered it had been fenced when the markSent write was refused.
    // Reporting a plain fence would throw away the fact that an external
    // delivery happened, which is the one thing that must not be lost.
    expect(late.outcome).toBe('delivered_unconfirmed');

    // The fencing invariant itself: the stale worker did not overwrite
    // the row, and the new owner still holds it.
    const row = await statusOf(seeded.id);
    expect(row.status).toBe('PROCESSING');
    expect(row.lease_owner).toBe('fresh');

    // And the ambiguity is recorded where an operator will find it,
    // rather than inferred from a missing SENT.
    expect(row.last_error).toContain('DELIVERED_UNCONFIRMED');
  });
});

describe('META — concurrent workers', () => {
  it('eight parallel workers never claim the same event twice', async () => {
    for (let i = 0; i < 24; i += 1) await seedMetaEvent(`conc${i}`);

    const batches = await Promise.all(
      Array.from({ length: 8 }, (_, i) => claimMetaEvents(deps(`w${i}`), 5)),
    );

    const ids = batches.flat().map((e) => e.id);
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(24);
  });

  it('parallel dispatch sends each event exactly once', async () => {
    for (let i = 0; i < 12; i += 1) await seedMetaEvent(`disp${i}`);
    const sent: string[] = [];
    const sender = async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
    };

    await Promise.all(
      Array.from({ length: 4 }, async (_, i) => {
        const d = deps(`w${i}`, { sender: sender as never });
        for (const event of await claimMetaEvents(d, 5)) await processMetaEvent(d, event);
      }),
    );

    expect(sent).toHaveLength(12);
    expect(new Set(sent).size).toBe(12);
  });

  it('a contested single event goes to exactly one worker', async () => {
    await seedMetaEvent(`solo_${randomUUID().slice(0, 6)}`);
    const claims = await Promise.all(
      ['a', 'b', 'c', 'd'].map((w) => claimMetaEvent(deps(`w-${w}`))),
    );
    expect(claims.filter((c) => c !== null)).toHaveLength(1);
  });
});
