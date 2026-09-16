import { describe, expect, it, vi } from 'vitest';

import { MetaCapiValidationError, MetaCapiTimeoutError } from '@acos/core-capi';

import {
  computeRetryDelayMs,
  DEFAULT_MAX_ATTEMPTS,
  hasExhaustedAttempts,
  MAX_CONFIGURABLE_ATTEMPTS,
  RETRY_CAP_MS,
} from './backoff';
import { createFakeRepository, makeRow, type FakeRepository } from './testSupport';
import {
  assertWorkerConfig,
  claimMetaEvent,
  isSupportedMetaEvent,
  resolveMaxAttempts,
  SUPPORTED_META_EVENTS,
  claimMetaEvents,
  MetaEventWorkerConfigError,
  processMetaEvent,
  releaseExpiredLeases,
  scheduleRetry,
  type MetaEventWorkerDeps,
} from './worker';
import { AMBIGUOUS_SEND_PREFIX } from './pgRepository';
import { DEFAULT_CAPI_TIMEOUT_MS } from '@acos/core-capi';
import { LEASE_DURATION_MS } from './backoff';

const NOW = new Date('2026-01-01T12:00:00.000Z');
const config = { pixelId: '123', apiVersion: 'v20.0', accessToken: 'secret' };

function deps(
  repository: FakeRepository,
  over: Partial<MetaEventWorkerDeps> = {},
): MetaEventWorkerDeps {
  return {
    repository,
    config,
    workerId: 'worker-a',
    now: () => NOW,
    random: () => 0.5,
    loadContext: async () => ({
      eventTime: new Date('2026-01-01T11:00:00.000Z'),
      productId: 'ai_freelancing_499',
      productName: 'AI Freelancing Launch Kit',
      clientIp: '203.0.113.8',
      userAgent: 'agent',
    }),
    sender: async () => undefined,
    ...over,
  };
}

describe('retry schedule', () => {
  it('sends the first attempt immediately', () => {
    expect(computeRetryDelayMs(0, () => 0.99)).toBe(0);
  });

  it.each([
    [1, 60_000],
    [2, 300_000],
    [3, 900_000],
    [4, 3_600_000],
  ])('caps attempt %i at %ims', (attempts, cap) => {
    expect(RETRY_CAP_MS[attempts]).toBe(cap);
    expect(computeRetryDelayMs(attempts, () => 0.999_999_999)).toBeLessThan(cap);
    expect(computeRetryDelayMs(attempts, () => 0)).toBe(0);
  });

  it('uses full jitter — the delay spreads across the whole window', () => {
    const draws = Array.from({ length: 400 }, () => computeRetryDelayMs(2, Math.random));
    expect(Math.min(...draws)).toBeLessThan(300_000 * 0.2);
    expect(Math.max(...draws)).toBeGreaterThan(300_000 * 0.8);
    expect(draws.every((d) => d >= 0 && d < 300_000)).toBe(true);
  });

  it('clamps a misbehaving random source to below the cap', () => {
    expect(computeRetryDelayMs(1, () => 5)).toBeLessThan(60_000);
    expect(computeRetryDelayMs(1, () => -3)).toBe(0);
  });

  it('rejects a negative attempt count', () => {
    expect(() => computeRetryDelayMs(-1)).toThrow(RangeError);
  });
});

describe('claimMetaEvent', () => {
  it('moves a due PENDING row to PROCESSING under this worker lease', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const claimed = await claimMetaEvent(deps(repo));
    expect(claimed?.id).toBe('e1');
    const row = repo.get('e1');
    expect(row.status).toBe('PROCESSING');
    expect(row.leaseOwner).toBe('worker-a');
    expect(row.leaseExpiresAt).toEqual(new Date(NOW.getTime() + 5 * 60 * 1000));
  });

  it('never claims a row that is not yet due', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'later', nextAttemptAt: new Date(NOW.getTime() + 60_000) }),
    ]);
    expect(await claimMetaEvent(deps(repo))).toBeNull();
    expect(repo.get('later').status).toBe('PENDING');
  });

  it.each(['SENT', 'DEAD_LETTER', 'FAILED', 'PROCESSING'] as const)(
    'never re-claims a %s row',
    async (status) => {
      const repo = createFakeRepository([makeRow({ id: 'x', status })]);
      expect(await claimMetaEvent(deps(repo))).toBeNull();
      expect(repo.get('x').status).toBe(status);
    },
  );

  it('rejects a non-positive batch limit', async () => {
    await expect(claimMetaEvents(deps(createFakeRepository()), 0)).rejects.toThrow(RangeError);
  });
});

describe('concurrent claiming', () => {
  it('gives two workers disjoint sets — no event is claimed twice', async () => {
    const rows = Array.from({ length: 20 }, (_, i) => makeRow({ id: `e${i}` }));
    const repo = createFakeRepository(rows);

    const [a, b] = await Promise.all([
      claimMetaEvents(deps(repo, { workerId: 'worker-a' }), 10),
      claimMetaEvents(deps(repo, { workerId: 'worker-b' }), 10),
    ]);

    const ids = [...a, ...b].map((e) => e.id);
    expect(ids).toHaveLength(20);
    expect(new Set(ids).size).toBe(20); // no overlap
    expect(a.every((e) => repo.get(e.id).leaseOwner === 'worker-a')).toBe(true);
    expect(b.every((e) => repo.get(e.id).leaseOwner === 'worker-b')).toBe(true);
  });

  it('leaves nothing double-claimed when more workers than work', async () => {
    const repo = createFakeRepository([makeRow({ id: 'only' })]);
    const claims = await Promise.all(
      ['w1', 'w2', 'w3', 'w4'].map((workerId) => claimMetaEvent(deps(repo, { workerId }))),
    );
    expect(claims.filter((c) => c !== null)).toHaveLength(1);
  });
});

describe('processMetaEvent — success path', () => {
  it('marks the row SENT and reuses the persisted event id verbatim', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });
    const claimed = await claimMetaEvent(d);

    const result = await processMetaEvent(d, claimed!);

    expect(result).toEqual({ outcome: 'sent' });
    expect(repo.get('e1').status).toBe('SENT');
    expect(repo.get('e1').leaseOwner).toBeNull();
    expect(sender).toHaveBeenCalledWith(
      config,
      expect.objectContaining({
        eventId: 'purchase_stable_e1',
        value: 499,
        currency: 'INR',
      }),
    );
  });

  it('does not increment attempts on success', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 2 })]);
    const d = deps(repo);
    await processMetaEvent(d, (await claimMetaEvent(d))!);
    expect(repo.get('e1').attempts).toBe(2);
  });

  it('keeps the same event id across a failure and the following retry', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi
      .fn()
      .mockRejectedValueOnce(new MetaCapiTimeoutError(10_000))
      .mockResolvedValueOnce(undefined);
    const d = deps(repo, { sender, now: () => NOW, random: () => 0 });

    await processMetaEvent(d, (await claimMetaEvent(d))!);
    await processMetaEvent(d, (await claimMetaEvent(d))!);

    const ids = sender.mock.calls.map((c) => c[1].eventId);
    expect(ids).toEqual(['purchase_stable_e1', 'purchase_stable_e1']);
  });
});

describe('processMetaEvent — failure path', () => {
  it('returns the row to PENDING with an incremented attempt and a jittered delay', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      sender: async () => {
        throw new MetaCapiTimeoutError(10_000);
      },
      random: () => 0.5,
    });

    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(result.outcome).toBe('retry');
    const row = repo.get('e1');
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(1);
    expect(row.leaseOwner).toBeNull();
    expect(row.nextAttemptAt.getTime()).toBe(NOW.getTime() + 30_000); // 0.5 * 60s cap
    expect(row.lastError).toContain('MetaCapiTimeoutError');
  });

  it('increments attempts only on a genuine Meta failure, never on a local payload defect', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 1 })]);
    const d = deps(repo, {
      sender: async () => {
        throw new MetaCapiValidationError('value must be positive');
      },
    });

    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(result.outcome).toBe('dead_letter');
    expect(repo.get('e1').attempts).toBe(1); // unchanged
    expect(repo.get('e1').lastError).toContain('permanently invalid payload');
  });

  it('dead-letters without spending an attempt when no dispatch context exists', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 3 })]);
    const d = deps(repo, { loadContext: async () => null });
    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);
    expect(result.outcome).toBe('dead_letter');
    expect(repo.get('e1').attempts).toBe(3);
  });

  it('treats a context-loading crash as retryable', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      loadContext: async () => {
        throw new Error('db unavailable');
      },
    });
    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);
    expect(result.outcome).toBe('retry');
    expect(repo.get('e1').attempts).toBe(1);
  });

  it('walks the full schedule and dead-letters on the fifth failure', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      sender: async () => {
        throw new MetaCapiTimeoutError(1);
      },
      random: () => 0,
    });

    const seen: string[] = [];
    for (let i = 0; i < DEFAULT_MAX_ATTEMPTS; i += 1) {
      const claimed = await claimMetaEvent(d);
      expect(claimed).not.toBeNull();
      seen.push((await processMetaEvent(d, claimed!)).outcome);
    }

    expect(seen).toEqual(['retry', 'retry', 'retry', 'retry', 'dead_letter']);
    expect(repo.get('e1').status).toBe('DEAD_LETTER');
    expect(repo.get('e1').attempts).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(await claimMetaEvent(d)).toBeNull();
  });
});

describe('scheduleRetry', () => {
  it('honours a lowered maxAttempts', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 1 })]);
    const d = deps(repo, { maxAttempts: 2 });
    const claimed = await claimMetaEvent(d);
    const result = await scheduleRetry(d, claimed!, 'boom');
    expect(result.outcome).toBe('dead_letter');
  });
});

describe('lease expiry and stale-worker fencing', () => {
  it('recovers an expired lease to PENDING without charging an attempt', async () => {
    const repo = createFakeRepository([
      makeRow({
        id: 'e1',
        status: 'PROCESSING',
        attempts: 2,
        leaseOwner: 'dead-worker',
        leaseExpiresAt: new Date(NOW.getTime() - 1),
      }),
    ]);

    expect(await releaseExpiredLeases(deps(repo))).toBe(1);
    const row = repo.get('e1');
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(2); // a crash is not a Meta rejection
    expect(row.leaseOwner).toBeNull();
  });

  it('leaves a live lease alone', async () => {
    const repo = createFakeRepository([
      makeRow({
        id: 'e1',
        status: 'PROCESSING',
        leaseOwner: 'worker-b',
        leaseExpiresAt: new Date(NOW.getTime() + 60_000),
      }),
    ]);
    expect(await releaseExpiredLeases(deps(repo))).toBe(0);
    expect(repo.get('e1').status).toBe('PROCESSING');
  });

  it('fences a resurrected worker: it cannot mark SENT a row someone else now owns', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    // A short lease, but still longer than the send timeout — the config
    // guard now rejects timeoutMs >= leaseDurationMs, which is exactly
    // the setting that makes this scenario happen on every single pass
    // instead of rarely.
    const slow = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
    });
    const claimed = await claimMetaEvent(slow);

    // worker-a stalls; its lease expires and the row is recovered and retaken.
    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    const fresh = deps(repo, { workerId: 'worker-b' });
    const retaken = await claimMetaEvent(fresh);
    expect(retaken?.id).toBe('e1');

    // worker-a finally finishes and tries to settle the row.
    const late = await processMetaEvent(slow, claimed!);

    // NOT 'fenced': Meta accepted the event before the lease was lost, so
    // reporting "this worker changed nothing" would file a real delivery
    // under nothing-happened.
    expect(late.outcome).toBe('delivered_unconfirmed');
    const row = repo.get('e1');
    expect(row.status).toBe('PROCESSING'); // still worker-b's
    expect(row.leaseOwner).toBe('worker-b'); // and the fence still held
    expect(row.lastError).toMatch(/^DELIVERED_UNCONFIRMED/);

    // worker-b's own completion still works.
    expect(await processMetaEvent(fresh, retaken!)).toEqual({ outcome: 'sent' });
    expect(repo.get('e1').status).toBe('SENT');
  });

  it('a fenced worker cannot corrupt attempts or schedule a retry', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 1 })]);
    const stale = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
    });
    const claimed = await claimMetaEvent(stale);

    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    const winner = deps(repo, { workerId: 'worker-b' });
    await claimMetaEvent(winner);

    const result = await scheduleRetry(stale, claimed!, 'stale failure');

    expect(result.outcome).toBe('fenced');
    expect(repo.get('e1').attempts).toBe(1);
    expect(repo.get('e1').leaseOwner).toBe('worker-b');
  });

  it('never resurrects a SENT row even if a stale worker reports failure', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const stale = deps(repo, { workerId: 'worker-a' });
    const claimed = await claimMetaEvent(stale);
    await repo.markSent({ id: 'e1', workerId: 'worker-a', now: NOW });

    const result = await scheduleRetry(stale, claimed!, 'late timeout');

    expect(result.outcome).toBe('fenced');
    expect(repo.get('e1').status).toBe('SENT');
  });
});

// ============================ lease-loss after a real external send ===
//
// The scenario these pin down:
//
//   worker A claims -> calls Meta -> Meta ACCEPTS -> A's lease expires
//   -> A's markSent is fenced -> row returns to PENDING -> worker B sends
//   the same event again.
//
// Delivery is at-least-once and cannot be made exactly-once: the HTTP
// call is not transactional with the database. Meta deduplicates on the
// stable event_id, so the conversion is not double-counted — but the
// system used to have no record that the ambiguity ever occurred.

describe('configuration is rejected when a send can outlive its own lease', () => {
  const base = (over: Partial<MetaEventWorkerDeps> = {}) =>
    deps(createFakeRepository([]), over);

  it('rejects timeoutMs equal to leaseDurationMs', () => {
    expect(() =>
      assertWorkerConfig(base({ leaseDurationMs: 5_000, config: { ...config, timeoutMs: 5_000 } })),
    ).toThrow(MetaEventWorkerConfigError);
  });

  it('rejects timeoutMs greater than leaseDurationMs', () => {
    expect(() =>
      assertWorkerConfig(base({ leaseDurationMs: 5_000, config: { ...config, timeoutMs: 9_000 } })),
    ).toThrow(/strictly less than leaseDurationMs/);
  });

  it('accepts timeoutMs strictly less than leaseDurationMs', () => {
    expect(() =>
      assertWorkerConfig(base({ leaseDurationMs: 5_000, config: { ...config, timeoutMs: 4_999 } })),
    ).not.toThrow();
  });

  it('accepts the defaults, so a caller that configures nothing is safe', () => {
    expect(DEFAULT_CAPI_TIMEOUT_MS).toBeLessThan(LEASE_DURATION_MS);
    expect(() => assertWorkerConfig(base())).not.toThrow();
  });

  it('rejects a non-positive or non-integer lease', () => {
    for (const leaseDurationMs of [0, -1, 1.5, Number.NaN]) {
      expect(() => assertWorkerConfig(base({ leaseDurationMs }))).toThrow(
        MetaEventWorkerConfigError,
      );
    }
  });

  it('refuses to claim or process under an invalid configuration', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const bad = deps(repo, { leaseDurationMs: 100, config: { ...config, timeoutMs: 100 } });

    await expect(claimMetaEvent(bad)).rejects.toThrow(MetaEventWorkerConfigError);
    await expect(
      processMetaEvent(bad, {
        id: 'e1',
        metaEventId: 'purchase_x',
        orderId: 'o1',
        eventName: 'Purchase',
        product: 'p',
        valuePaise: 100,
        currency: 'INR',
        attempts: 0,
      }),
    ).rejects.toThrow(MetaEventWorkerConfigError);
    // Nothing was claimed or sent.
    expect(repo.get('e1').status).toBe('PENDING');
  });
});

describe('send outcome is reported honestly', () => {
  it('send succeeds and markSent succeeds -> sent', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, { sender: vi.fn().mockResolvedValue(undefined) });
    const claimed = await claimMetaEvent(d);

    expect(await processMetaEvent(d, claimed!)).toEqual({ outcome: 'sent' });
    expect(repo.get('e1')).toMatchObject({ status: 'SENT', lastError: null, leaseOwner: null });
  });

  it('send fails -> retry, attempts charged, nothing claimed as delivered', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(10_000)),
    });
    const claimed = await claimMetaEvent(d);

    const result = await processMetaEvent(d, claimed!);

    expect(result.outcome).toBe('retry');
    const row = repo.get('e1');
    expect(row.status).toBe('PENDING');
    expect(row.attempts).toBe(1);
    expect(row.lastError).not.toMatch(AMBIGUOUS_SEND_PREFIX);
  });

  it('lease expires BEFORE the send -> fenced, and nothing is sent', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const stale = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
      // The loader is where this worker discovers it has nothing to do;
      // the fence is checked when it tries to write, and it writes via
      // the dead-letter path without ever calling Meta.
      loadContext: async () => null,
      sender,
    });
    const claimed = await claimMetaEvent(stale);

    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    await claimMetaEvent(deps(repo, { workerId: 'worker-b' }));

    const result = await processMetaEvent(stale, claimed!);

    expect(result.outcome).toBe('fenced');
    expect(sender).not.toHaveBeenCalled();
    // No delivery happened, so no ambiguity is recorded — the distinction
    // between these two fenced cases is the whole point.
    expect(repo.get('e1').lastError ?? '').not.toMatch(AMBIGUOUS_SEND_PREFIX);
    expect(repo.get('e1').leaseOwner).toBe('worker-b');
  });

  it('lease expires AFTER the external send -> delivered_unconfirmed, recorded', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const slow = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
      sender,
    });
    const claimed = await claimMetaEvent(slow);

    // The lease expires while the (already accepted) call is in flight.
    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    const fresh = deps(repo, { workerId: 'worker-b' });
    const retaken = await claimMetaEvent(fresh);

    const late = await processMetaEvent(slow, claimed!);

    expect(late).toEqual({
      outcome: 'delivered_unconfirmed',
      reason: 'lease lost after Meta accepted the event',
      metaEventId: claimed!.metaEventId,
    });
    expect(sender).toHaveBeenCalledTimes(1);

    const row = repo.get('e1');
    // Visible to an operator, and greppable.
    expect(row.lastError).toMatch(new RegExp(`^${AMBIGUOUS_SEND_PREFIX}`));
    expect(row.lastError).toContain(claimed!.metaEventId);
    expect(row.lastError).toContain('worker-a');

    // Requirement 4/5: the fence held. Worker A changed no state.
    expect(row.status).toBe('PROCESSING');
    expect(row.leaseOwner).toBe('worker-b');
    expect(row.attempts).toBe(0);

    // Worker B still completes normally, and its SENT clears the note.
    expect(await processMetaEvent(fresh, retaken!)).toEqual({ outcome: 'sent' });
    expect(repo.get('e1')).toMatchObject({ status: 'SENT', lastError: null });
  });

  it('a stale worker cannot mark SENT, even while recording its delivery', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const slow = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
    });
    const claimed = await claimMetaEvent(slow);

    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    await claimMetaEvent(deps(repo, { workerId: 'worker-b' }));

    await processMetaEvent(slow, claimed!);

    const row = repo.get('e1');
    expect(row.status).not.toBe('SENT');
    expect(row.status).toBe('PROCESSING');
    expect(row.leaseOwner).toBe('worker-b');
  });

  it('the reclaiming worker reuses the identical event_id', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sentIds: string[] = [];
    const capture = vi.fn(async (_c: unknown, input: { eventId: string }) => {
      sentIds.push(input.eventId);
    });

    const slow = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
      sender: capture as never,
    });
    const claimed = await claimMetaEvent(slow);

    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    const fresh = deps(repo, { workerId: 'worker-b', sender: capture as never });
    const retaken = await claimMetaEvent(fresh);

    await processMetaEvent(slow, claimed!); // A: delivered, unconfirmed
    await processMetaEvent(fresh, retaken!); // B: delivers the same event

    expect(sentIds).toHaveLength(2);
    // This is what makes at-least-once survivable: Meta deduplicates on
    // event_id, and both sends carry the SAME one. Regenerating it here
    // would double-count the purchase.
    expect(sentIds[0]).toBe(sentIds[1]);
    expect(sentIds[0]).toBe(repo.get('e1').metaEventId);
  });

  it('repeated deployment stays safe: a SENT row is never claimed again', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    // Deployment 1 delivers it.
    const first = await claimMetaEvent(d);
    expect(await processMetaEvent(d, first!)).toEqual({ outcome: 'sent' });

    // Deployments 2 and 3: new worker ids, fresh polls, lease recovery.
    for (const workerId of ['worker-b', 'worker-c']) {
      const redeployed = deps(repo, { workerId, sender });
      await releaseExpiredLeases(redeployed);
      expect(await claimMetaEvent(redeployed)).toBeNull();
    }

    expect(sender).toHaveBeenCalledTimes(1);
    expect(repo.get('e1').status).toBe('SENT');
  });
});

// ===================== the attempt budget is configuration, not a cap ===
//
// The bug: `scheduleRetry` asked TWO sources whether the budget was
// spent — the caller's `maxAttempts` and a helper hardwired to a module
// constant of 5. The effective budget was min(configured, 5), so a
// deployment configured for 8 retried 5 times and nobody could tell why.

describe('maxAttempts is honoured exactly as configured', () => {
  /** Drives one event to exhaustion, counting real outbound sends. */
  async function runToExhaustion(maxAttempts: number) {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockRejectedValue(new MetaCapiTimeoutError(5_000));
    // random: () => 0 draws the FLOOR of the full-jitter range, so every
    // retry is due immediately and the loop can advance without a fake
    // clock. Deterministic, and it exercises the same code path a real
    // 0-delay draw would.
    const d = deps(repo, {
      maxAttempts,
      sender,
      random: () => 0,
      config: { ...config, timeoutMs: 5_000 },
    });

    const outcomes: string[] = [];
    // Generous ceiling: the loop stops when the row leaves PENDING, so a
    // budget that never exhausts would fail on the assertion, not hang.
    for (let i = 0; i < maxAttempts + 10; i += 1) {
      const claimed = await claimMetaEvent(d);
      if (!claimed) break;
      outcomes.push((await processMetaEvent(d, claimed)).outcome);
      if (repo.get('e1').status === 'DEAD_LETTER') break;
    }
    return { repo, sender, outcomes };
  }

  it.each([1, 3, 5, 8])(
    'maxAttempts=%i makes exactly that many outbound attempts, then dead-letters',
    async (maxAttempts) => {
      const { repo, sender, outcomes } = await runToExhaustion(maxAttempts);

      expect(sender).toHaveBeenCalledTimes(maxAttempts);
      expect(repo.get('e1')).toMatchObject({ status: 'DEAD_LETTER', attempts: maxAttempts });
      expect(outcomes.filter((o) => o === 'retry')).toHaveLength(maxAttempts - 1);
      expect(outcomes.at(-1)).toBe('dead_letter');
    },
  );

  it('maxAttempts=8 really means 8 — the old code silently stopped at 5', async () => {
    const { sender, repo } = await runToExhaustion(8);
    expect(sender).toHaveBeenCalledTimes(8);
    expect(repo.get('e1').attempts).toBe(8);
    // The number the hidden cap would have produced.
    expect(repo.get('e1').attempts).not.toBe(DEFAULT_MAX_ATTEMPTS);
  });

  it('maxAttempts=1 dead-letters after a single attempt, with no retry', async () => {
    const { sender, repo, outcomes } = await runToExhaustion(1);
    expect(sender).toHaveBeenCalledTimes(1);
    expect(outcomes).toEqual(['dead_letter']);
    expect(repo.get('e1').status).toBe('DEAD_LETTER');
  });

  it('defaults to DEFAULT_MAX_ATTEMPTS when nothing is configured', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockRejectedValue(new MetaCapiTimeoutError(5_000));
    const d = deps(repo, { sender, random: () => 0 });
    for (let i = 0; i < DEFAULT_MAX_ATTEMPTS + 5; i += 1) {
      const claimed = await claimMetaEvent(d);
      if (!claimed) break;
      await processMetaEvent(d, claimed);
      if (repo.get('e1').status === 'DEAD_LETTER') break;
    }
    expect(sender).toHaveBeenCalledTimes(DEFAULT_MAX_ATTEMPTS);
  });

  it('resolveMaxAttempts is the only place the budget is decided', () => {
    expect(resolveMaxAttempts(deps(createFakeRepository([])))).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(resolveMaxAttempts(deps(createFakeRepository([]), { maxAttempts: 11 }))).toBe(11);
  });

  it('hasExhaustedAttempts needs the budget handed to it', () => {
    expect(hasExhaustedAttempts(4, 5)).toBe(false);
    expect(hasExhaustedAttempts(5, 5)).toBe(true);
    expect(hasExhaustedAttempts(7, 8)).toBe(false); // the old cap said true
    expect(hasExhaustedAttempts(8, 8)).toBe(true);
  });
});

describe('the budget is validated, not clamped', () => {
  const base = (maxAttempts: number) => deps(createFakeRepository([]), { maxAttempts });

  it.each([0, -1, 1.5, Number.NaN])('rejects maxAttempts=%s', (maxAttempts) => {
    expect(() => assertWorkerConfig(base(maxAttempts))).toThrow(MetaEventWorkerConfigError);
  });

  it('rejects a budget above the supported ceiling rather than silently reducing it', () => {
    expect(() => assertWorkerConfig(base(MAX_CONFIGURABLE_ATTEMPTS + 1))).toThrow(
      /exceeds MAX_CONFIGURABLE_ATTEMPTS/,
    );
    // Refusing is the point: quietly clamping is the bug being fixed.
    expect(() => assertWorkerConfig(base(MAX_CONFIGURABLE_ATTEMPTS))).not.toThrow();
  });

  it('accepts every budget the tests above rely on', () => {
    for (const maxAttempts of [1, 3, 5, 8]) {
      expect(() => assertWorkerConfig(base(maxAttempts)), String(maxAttempts)).not.toThrow();
    }
  });
});

describe('retry delays stay deterministic and keep full jitter', () => {
  it('draws uniformly from [0, cap) for every attempt in an 8-budget run', () => {
    // Deterministic: the RandomSource is injected, so these are exact.
    for (const [attempt, cap] of RETRY_CAP_MS.entries()) {
      expect(computeRetryDelayMs(attempt, () => 0)).toBe(0);
      if (cap > 0) {
        expect(computeRetryDelayMs(attempt, () => 0.5)).toBe(Math.floor(0.5 * cap));
        expect(computeRetryDelayMs(attempt, () => 0.999_999_999)).toBeLessThan(cap);
      }
    }
  });

  it('holds the last cap for attempts past the schedule, rather than growing', () => {
    const last = RETRY_CAP_MS[RETRY_CAP_MS.length - 1]!;
    for (const attempt of [RETRY_CAP_MS.length, 8, 20]) {
      expect(computeRetryDelayMs(attempt, () => 0.5)).toBe(Math.floor(0.5 * last));
    }
  });

  it('is full jitter, not fixed backoff: the floor is genuinely reachable', () => {
    // A fixed or decorrelated schedule would never return 0 for a
    // non-zero cap. Full jitter must.
    expect(computeRetryDelayMs(3, () => 0)).toBe(0);
    expect(computeRetryDelayMs(3, () => 0.999_999_999)).toBeGreaterThan(0);
  });
});

describe('attempts are charged only for real outbound failures', () => {
  it('a lease recovery costs nothing, however many times it happens', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 2 })]);
    const short = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
    });

    for (let cycle = 0; cycle < 6; cycle += 1) {
      await claimMetaEvent(short);
      await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 1000) }));
    }
    // Six crashes, zero attempts charged: a dead worker proves nothing
    // about whether Meta would have accepted the event.
    expect(repo.get('e1').attempts).toBe(2);
    expect(repo.get('e1').status).toBe('PENDING');
  });

  it('an unbuildable payload dead-letters without spending budget', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 1 })]);
    const d = deps(repo, { loadContext: async () => null, maxAttempts: 8 });
    const claimed = await claimMetaEvent(d);

    await processMetaEvent(d, claimed!);

    expect(repo.get('e1')).toMatchObject({ status: 'DEAD_LETTER', attempts: 1 });
  });
});

// ================================== explicit routing by event name ===
//
// `sendMetaPurchase` hardcodes `event_name: 'Purchase'` in the payload it
// builds, and the dispatcher used to call it for every claimed row
// without reading `event.eventName`. A row carrying any other name would
// therefore have been delivered to Meta AS a Purchase, with that row's
// value attached — a fabricated conversion, not a dropped event.

describe('dispatch routes on the event name', () => {
  const eventRow = (eventName: string, over: Record<string, unknown> = {}) =>
    createFakeRepository([makeRow({ id: 'e1', eventName, ...over })]);

  it('Purchase is dispatched', async () => {
    const repo = eventRow('Purchase');
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    const claimed = await claimMetaEvent(d);
    expect(await processMetaEvent(d, claimed!)).toEqual({ outcome: 'sent' });

    expect(sender).toHaveBeenCalledTimes(1);
    expect(repo.get('e1').status).toBe('SENT');
  });

  it.each([
    'AddToCart',
    'Lead',
    'CompleteRegistration',
    'InitiateCheckout',
    'ViewContent',
    'Subscribe',
  ])('an unsupported event (%s) is never sent as a Purchase', async (eventName) => {
    const repo = eventRow(eventName);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    const claimed = await claimMetaEvent(d);
    const outcome = await processMetaEvent(d, claimed!);

    // The assertion that matters: nothing reached Meta.
    expect(sender).not.toHaveBeenCalled();
    expect(outcome.outcome).toBe('dead_letter');
    const row = repo.get('e1');
    expect(row.status).toBe('DEAD_LETTER');
    expect(row.lastError).toContain(eventName);
    expect(row.lastError).toMatch(/Refusing to send it as a Purchase/);
  });

  it.each([
    ['lowercase', 'purchase'],
    ['uppercase', 'PURCHASE'],
    ['mixed case', 'PurChase'],
    ['leading space', ' Purchase'],
    ['trailing space', 'Purchase '],
    ['empty', ''],
    ['whitespace only', '   '],
    ['lookalike', 'Purchased'],
    ['prefixed', 'Meta.Purchase'],
  ])('a malformed event name (%s) is refused, not coerced', async (_label, eventName) => {
    const repo = eventRow(eventName);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    const claimed = await claimMetaEvent(d);
    const outcome = await processMetaEvent(d, claimed!);

    // Near-misses are data defects. Coercing them would be exactly the
    // silent reinterpretation this routing exists to stop.
    expect(sender).not.toHaveBeenCalled();
    expect(outcome.outcome).toBe('dead_letter');
    expect(repo.get('e1').status).toBe('DEAD_LETTER');
  });

  it('refuses before loading context, so an unroutable row costs no read', async () => {
    const repo = eventRow('AddToCart');
    const loadContext = vi.fn();
    const sender = vi.fn();
    const d = deps(repo, { loadContext: loadContext as never, sender });

    const claimed = await claimMetaEvent(d);
    await processMetaEvent(d, claimed!);

    expect(loadContext).not.toHaveBeenCalled();
    expect(sender).not.toHaveBeenCalled();
  });

  it('spends no retry budget on an unsupported event', async () => {
    const repo = eventRow('AddToCart', { attempts: 2 });
    const d = deps(repo, { sender: vi.fn() });

    const claimed = await claimMetaEvent(d);
    const outcome = await processMetaEvent(d, claimed!);

    // Terminal immediately: the row will say the same thing in five
    // minutes, so charging an attempt would only delay the inevitable.
    expect(outcome).toMatchObject({ outcome: 'dead_letter', attempts: 2 });
    expect(repo.get('e1').attempts).toBe(2);
  });

  it('does not retry an unsupported event on a later poll', async () => {
    const repo = eventRow('AddToCart');
    const sender = vi.fn();
    const d = deps(repo, { sender, random: () => 0 });

    const claimed = await claimMetaEvent(d);
    await processMetaEvent(d, claimed!);

    // DEAD_LETTER is terminal — claim only ever selects PENDING.
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await releaseExpiredLeases(d);
      expect(await claimMetaEvent(d)).toBeNull();
    }
    expect(sender).not.toHaveBeenCalled();
  });

  it('a fenced worker cannot dead-letter an unsupported event it no longer owns', async () => {
    const repo = eventRow('AddToCart');
    const stale = deps(repo, {
      workerId: 'worker-a',
      leaseDurationMs: 5,
      config: { ...config, timeoutMs: 1 },
      sender: vi.fn(),
    });
    const claimed = await claimMetaEvent(stale);

    await releaseExpiredLeases(deps(repo, { now: () => new Date(NOW.getTime() + 10) }));
    await claimMetaEvent(deps(repo, { workerId: 'worker-b' }));

    const outcome = await processMetaEvent(stale, claimed!);

    expect(outcome).toEqual({ outcome: 'fenced', reason: 'lease lost before dead-lettering' });
    expect(repo.get('e1')).toMatchObject({ status: 'PROCESSING', leaseOwner: 'worker-b' });
  });

  it('still retries a SUPPORTED event when Meta fails, rather than dead-lettering', async () => {
    const repo = eventRow('Purchase');
    const sender = vi.fn().mockRejectedValue(new MetaCapiTimeoutError(5_000));
    const d = deps(repo, { sender, random: () => 0, config: { ...config, timeoutMs: 5_000 } });

    const claimed = await claimMetaEvent(d);
    const outcome = await processMetaEvent(d, claimed!);

    // Routing must not have turned a transient provider failure into a
    // terminal one.
    expect(outcome.outcome).toBe('retry');
    expect(repo.get('e1')).toMatchObject({ status: 'PENDING', attempts: 1 });
  });

  it('routes a mixed batch: Purchases sent, everything else dead-lettered', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'p1', metaEventId: 'purchase_1', eventName: 'Purchase' }),
      makeRow({ id: 'x1', metaEventId: 'purchase_2', eventName: 'AddToCart' }),
      makeRow({ id: 'p2', metaEventId: 'purchase_3', eventName: 'Purchase' }),
      makeRow({ id: 'x2', metaEventId: 'purchase_4', eventName: 'purchase' }),
    ]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    for (const claimed of await claimMetaEvents(d, 10)) {
      await processMetaEvent(d, claimed);
    }

    expect(sender).toHaveBeenCalledTimes(2);
    expect(repo.get('p1').status).toBe('SENT');
    expect(repo.get('p2').status).toBe('SENT');
    expect(repo.get('x1').status).toBe('DEAD_LETTER');
    expect(repo.get('x2').status).toBe('DEAD_LETTER');
  });
});

describe('the supported-event registry', () => {
  it('lists exactly what the dispatcher can build a payload for', () => {
    expect([...SUPPORTED_META_EVENTS]).toEqual(['Purchase']);
  });

  it('matches exactly, with no normalisation', () => {
    expect(isSupportedMetaEvent('Purchase')).toBe(true);
    for (const near of ['purchase', 'PURCHASE', ' Purchase', 'Purchase ', 'Purchased', '']) {
      expect(isSupportedMetaEvent(near), near).toBe(false);
    }
  });
});
