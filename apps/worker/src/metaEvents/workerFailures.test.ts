import { describe, expect, it, vi } from 'vitest';

import { MetaCapiTimeoutError } from '@acos/core-capi';

import { computeRetryDelayMs, LEASE_DURATION_MS, DEFAULT_MAX_ATTEMPTS, RETRY_CAP_MS } from './backoff';
import type { MetaEventRepository } from './repository';
import { createFakeRepository, makeRow, type FakeRepository } from './testSupport';
import {
  claimMetaEvent,
  claimMetaEvents,
  processMetaEvent,
  releaseExpiredLeases,
  type MetaEventWorkerDeps,
} from './worker';

// Worker failure suite.
// -----------------------------------------------------------------------
// Every scenario here is driven by explicit clock values and explicit
// random draws. There is not a single sleep: "the lease expired" is
// expressed as a clock that reads later than lease_expires_at, and "the
// worker crashed" is expressed as a claim that is simply never settled —
// which is precisely what a crash looks like to the database.
// -----------------------------------------------------------------------

const T0 = new Date('2026-01-01T12:00:00.000Z');
const at = (ms: number) => new Date(T0.getTime() + ms);
const config = { pixelId: '123', apiVersion: 'v20.0', accessToken: 'secret' };

/** Deterministic random: replays the given draws, then holds the last one. */
function draws(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)] ?? 0;
}

function deps(
  repository: MetaEventRepository,
  over: Partial<MetaEventWorkerDeps> = {},
): MetaEventWorkerDeps {
  return {
    repository,
    config,
    workerId: 'worker-a',
    now: () => T0,
    random: draws(0.5),
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

/** Wraps a repository so a chosen write can be made to fail, like a DB blip. */
function withFault(
  repo: FakeRepository,
  method: 'markSent' | 'markForRetry' | 'markDeadLetter',
  error: Error,
): MetaEventRepository {
  return { ...repo, [method]: async () => Promise.reject(error) };
}

// ---------------------------------------------------------------- 1, 2 ----

describe('1. two workers claiming different events', () => {
  it('partitions the backlog with no row appearing in both batches', async () => {
    const repo = createFakeRepository(
      Array.from({ length: 12 }, (_, i) => makeRow({ id: `e${i}` })),
    );

    const [a, b] = await Promise.all([
      claimMetaEvents(deps(repo, { workerId: 'w-a' }), 6),
      claimMetaEvents(deps(repo, { workerId: 'w-b' }), 6),
    ]);

    const aIds = a.map((e) => e.id);
    const bIds = b.map((e) => e.id);
    expect(aIds).toHaveLength(6);
    expect(bIds).toHaveLength(6);
    expect(aIds.filter((id) => bIds.includes(id))).toEqual([]);
    expect(new Set([...aIds, ...bIds]).size).toBe(12);
  });

  it('lets both workers settle their own rows independently', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' }), makeRow({ id: 'e2' })]);
    const a = deps(repo, { workerId: 'w-a' });
    const b = deps(repo, { workerId: 'w-b' });

    const [ca, cb] = [await claimMetaEvent(a), await claimMetaEvent(b)];
    expect(await processMetaEvent(a, ca!)).toEqual({ outcome: 'sent' });
    expect(await processMetaEvent(b, cb!)).toEqual({ outcome: 'sent' });
    expect([repo.get('e1').status, repo.get('e2').status]).toEqual(['SENT', 'SENT']);
  });
});

describe('2. two workers attempting the same event', () => {
  it('gives the row to exactly one worker; the other gets nothing', async () => {
    const repo = createFakeRepository([makeRow({ id: 'only' })]);

    const [a, b] = await Promise.all([
      claimMetaEvent(deps(repo, { workerId: 'w-a' })),
      claimMetaEvent(deps(repo, { workerId: 'w-b' })),
    ]);

    const winners = [a, b].filter((c) => c !== null);
    expect(winners).toHaveLength(1);
    expect(repo.get('only').leaseOwner).toMatch(/^w-[ab]$/);
  });

  it('dispatches the contested event to Meta exactly once', async () => {
    const repo = createFakeRepository([makeRow({ id: 'only' })]);
    const sender = vi.fn().mockResolvedValue(undefined);

    await Promise.all(
      ['w-a', 'w-b', 'w-c'].map(async (workerId) => {
        const d = deps(repo, { workerId, sender });
        const claimed = await claimMetaEvent(d);
        if (claimed) await processMetaEvent(d, claimed);
      }),
    );

    expect(sender).toHaveBeenCalledTimes(1);
    expect(repo.get('only').status).toBe('SENT');
  });
});

// ------------------------------------------------------------- 3, 4, 5 ----

describe('3. expired lease recovery', () => {
  it('returns an abandoned row to PENDING and preserves its attempt count', async () => {
    const repo = createFakeRepository([
      makeRow({
        id: 'e1',
        status: 'PROCESSING',
        attempts: 3,
        leaseOwner: 'dead',
        leaseExpiresAt: at(-1),
      }),
    ]);

    expect(await releaseExpiredLeases(deps(repo))).toBe(1);

    const row = repo.get('e1');
    expect(row).toMatchObject({
      status: 'PENDING',
      attempts: 3,
      leaseOwner: null,
      leaseExpiresAt: null,
    });
  });

  it('makes the recovered row immediately claimable again', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'PROCESSING', leaseOwner: 'dead', leaseExpiresAt: at(-1) }),
    ]);
    await releaseExpiredLeases(deps(repo));
    expect((await claimMetaEvent(deps(repo, { workerId: 'w-b' })))?.id).toBe('e1');
  });
});

describe('4. active lease not reclaimed', () => {
  it('leaves a lease that has not yet expired untouched', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'PROCESSING', leaseOwner: 'w-a', leaseExpiresAt: at(1) }),
    ]);

    expect(await releaseExpiredLeases(deps(repo))).toBe(0);
    expect(repo.get('e1')).toMatchObject({ status: 'PROCESSING', leaseOwner: 'w-a' });
    expect(await claimMetaEvent(deps(repo, { workerId: 'w-b' }))).toBeNull();
  });

  it('recovers only the expired rows when leases are mixed', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'live', status: 'PROCESSING', leaseOwner: 'w-a', leaseExpiresAt: at(60_000) }),
      makeRow({ id: 'dead', status: 'PROCESSING', leaseOwner: 'w-b', leaseExpiresAt: at(-60_000) }),
    ]);

    expect(await releaseExpiredLeases(deps(repo))).toBe(1);
    expect(repo.get('live').status).toBe('PROCESSING');
    expect(repo.get('dead').status).toBe('PENDING');
  });
});

describe('5. exact lease boundary', () => {
  // The predicate is `lease_expires_at <= now` in both the SQL and the
  // fake, so a lease expiring on the exact tick is expired, not live.
  it('reclaims a lease expiring exactly at now', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'PROCESSING', leaseOwner: 'w-a', leaseExpiresAt: at(0) }),
    ]);
    expect(await releaseExpiredLeases(deps(repo, { now: () => at(0) }))).toBe(1);
    expect(repo.get('e1').status).toBe('PENDING');
  });

  it('does not reclaim one millisecond before expiry', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'PROCESSING', leaseOwner: 'w-a', leaseExpiresAt: at(0) }),
    ]);
    expect(await releaseExpiredLeases(deps(repo, { now: () => at(-1) }))).toBe(0);
    expect(repo.get('e1').status).toBe('PROCESSING');
  });

  it('reclaims one millisecond after expiry', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'PROCESSING', leaseOwner: 'w-a', leaseExpiresAt: at(0) }),
    ]);
    expect(await releaseExpiredLeases(deps(repo, { now: () => at(1) }))).toBe(1);
  });

  it('stamps the lease exactly LEASE_DURATION_MS ahead of the claim', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    await claimMetaEvent(deps(repo));
    expect(repo.get('e1').leaseExpiresAt).toEqual(at(LEASE_DURATION_MS));
  });
});

// ---------------------------------------------------------------- 6, 7 ----

describe('6. worker crashes before the Meta request', () => {
  // A crash is modelled as a claim that is never settled — exactly what
  // the database observes when a process dies.
  it('leaves the row leased, then recovers it with no attempt charged and nothing sent', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 1 })]);
    const sender = vi.fn().mockResolvedValue(undefined);

    await claimMetaEvent(deps(repo, { workerId: 'crasher', sender }));
    expect(repo.get('e1').status).toBe('PROCESSING');
    expect(sender).not.toHaveBeenCalled();

    await releaseExpiredLeases(deps(repo, { now: () => at(LEASE_DURATION_MS + 1) }));

    expect(repo.get('e1')).toMatchObject({ status: 'PENDING', attempts: 1, leaseOwner: null });
  });

  it('blocks other workers until the lease actually expires', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    await claimMetaEvent(deps(repo, { workerId: 'crasher' }));

    const midLease = deps(repo, { workerId: 'w-b', now: () => at(LEASE_DURATION_MS - 1) });
    expect(await releaseExpiredLeases(midLease)).toBe(0);
    expect(await claimMetaEvent(midLease)).toBeNull();

    const afterLease = deps(repo, { workerId: 'w-b', now: () => at(LEASE_DURATION_MS) });
    expect(await releaseExpiredLeases(afterLease)).toBe(1);
    expect((await claimMetaEvent(afterLease))?.id).toBe('e1');
  });
});

describe('7. worker crashes after the Meta request', () => {
  it('re-sends after recovery, and Meta dedups because the event id is unchanged', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sent: string[] = [];
    const sender = async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
    };

    // First worker: Meta accepts, then the process dies before settling.
    const crasher = deps(repo, { workerId: 'crasher', sender: sender as never });
    const claimed = await claimMetaEvent(crasher);
    await crasher.sender!(config, {
      eventId: claimed!.metaEventId,
    } as never);
    expect(repo.get('e1').status).toBe('PROCESSING'); // never settled

    // Recovery, then a second worker completes the work.
    await releaseExpiredLeases(deps(repo, { now: () => at(LEASE_DURATION_MS) }));
    const rescuer = deps(repo, {
      workerId: 'w-b',
      sender: sender as never,
      now: () => at(LEASE_DURATION_MS),
    });
    const retaken = await claimMetaEvent(rescuer);
    expect(await processMetaEvent(rescuer, retaken!)).toEqual({ outcome: 'sent' });

    // Meta saw the event twice, but under one id — so it counts once.
    expect(sent).toEqual(['purchase_stable_e1', 'purchase_stable_e1']);
    expect(new Set(sent).size).toBe(1);
    expect(repo.get('e1').attempts).toBe(0); // no Meta failure ever occurred
  });
});

// ---------------------------------------------------------------- 8, 9 ----

describe('8. stale worker cannot mark SENT', () => {
  it('rejects the late completion and leaves the row with its new owner', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const stale = deps(repo, { workerId: 'stale' });
    const claimed = await claimMetaEvent(stale);

    await releaseExpiredLeases(deps(repo, { now: () => at(LEASE_DURATION_MS) }));
    const fresh = deps(repo, { workerId: 'fresh', now: () => at(LEASE_DURATION_MS) });
    await claimMetaEvent(fresh);

    const late = await processMetaEvent(stale, claimed!);

    // The stale worker is still refused the SENT transition — that is the
    // fence doing its job. What changed is that the delivery it already
    // made is now on the record instead of being silently dropped.
    expect(late).toEqual({
      outcome: 'delivered_unconfirmed',
      reason: 'lease lost after Meta accepted the event',
      metaEventId: claimed!.metaEventId,
    });
    expect(repo.get('e1')).toMatchObject({ status: 'PROCESSING', leaseOwner: 'fresh' });
    expect(repo.get('e1').lastError).toMatch(/^DELIVERED_UNCONFIRMED/);
  });

  it('rejects a late retry and a late dead-letter too', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 2 })]);
    const stale = deps(repo, { workerId: 'stale' });
    const claimed = await claimMetaEvent(stale);

    await releaseExpiredLeases(deps(repo, { now: () => at(LEASE_DURATION_MS) }));
    await claimMetaEvent(deps(repo, { workerId: 'fresh', now: () => at(LEASE_DURATION_MS) }));

    expect(
      await repo.markForRetry({
        id: 'e1',
        workerId: 'stale',
        now: T0,
        attempts: 99,
        nextAttemptAt: at(1),
        lastError: 'stale',
      }),
    ).toBe(false);
    expect(
      await repo.markDeadLetter({
        id: 'e1',
        workerId: 'stale',
        now: T0,
        attempts: 99,
        lastError: 'stale',
      }),
    ).toBe(false);
    expect(repo.get('e1').attempts).toBe(2); // untouched by the impostor
    expect(claimed!.metaEventId).toBe('purchase_stable_e1');
  });
});

describe('9. reclaimed worker sends the same eventId', () => {
  it('reuses the persisted id across owners and across retries', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sent: string[] = [];
    const sender = vi.fn(async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
      if (sent.length === 1) throw new MetaCapiTimeoutError(10_000);
    });

    // Owner 1 fails against Meta.
    const first = deps(repo, { workerId: 'w-a', sender: sender as never, random: draws(0) });
    await processMetaEvent(first, (await claimMetaEvent(first))!);
    expect(repo.get('e1').attempts).toBe(1);

    // Owner 2 picks the row up after the retry delay and succeeds.
    const second = deps(repo, {
      workerId: 'w-b',
      sender: sender as never,
      now: () => at(60_000),
    });
    const retaken = await claimMetaEvent(second);
    expect(await processMetaEvent(second, retaken!)).toEqual({ outcome: 'sent' });

    expect(sent).toEqual(['purchase_stable_e1', 'purchase_stable_e1']);
  });
});

// ------------------------------------------------------------- 10, 11 ----

describe('10. post-send database failure', () => {
  it('propagates the write failure and leaves the row leased rather than lost', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, {
      repository: withFault(repo, 'markSent', new Error('connection reset')),
      sender,
    });
    const claimed = await claimMetaEvent(deps(repo));

    await expect(processMetaEvent(d, claimed!)).rejects.toThrow('connection reset');

    // Meta accepted it, but we could not record that. The row must stay
    // PROCESSING so the lease timer — not a lost update — owns recovery.
    expect(sender).toHaveBeenCalledTimes(1);
    expect(repo.get('e1').status).toBe('PROCESSING');
  });

  it('recovers and re-sends under the same event id, so the purchase counts once', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sent: string[] = [];
    const sender = vi.fn(async (_c: unknown, input: { eventId: string }) => {
      sent.push(input.eventId);
    });

    const broken = deps(repo, {
      workerId: 'w-a',
      repository: withFault(repo, 'markSent', new Error('connection reset')),
      sender: sender as never,
    });
    await expect(processMetaEvent(broken, (await claimMetaEvent(deps(repo)))!)).rejects.toThrow();

    await releaseExpiredLeases(deps(repo, { now: () => at(LEASE_DURATION_MS) }));
    const healthy = deps(repo, {
      workerId: 'w-b',
      sender: sender as never,
      now: () => at(LEASE_DURATION_MS),
    });
    expect(await processMetaEvent(healthy, (await claimMetaEvent(healthy))!)).toEqual({
      outcome: 'sent',
    });

    expect(sent).toEqual(['purchase_stable_e1', 'purchase_stable_e1']);
    expect(new Set(sent).size).toBe(1); // one id => one conversion at Meta
    expect(repo.get('e1').attempts).toBe(0); // a DB blip is not a Meta failure
  });
});

describe('11. SENT event never resent', () => {
  it.each(['SENT', 'DEAD_LETTER'] as const)('never re-claims a %s row', async (status) => {
    const repo = createFakeRepository([makeRow({ id: 'e1', status, nextAttemptAt: at(-1) })]);
    expect(await claimMetaEvent(deps(repo))).toBeNull();
    expect(repo.get('e1').status).toBe(status);
  });

  it('is not resurrected by lease recovery, however far the clock advances', async () => {
    const repo = createFakeRepository([
      makeRow({ id: 'e1', status: 'SENT', leaseExpiresAt: at(-1) }),
    ]);
    expect(await releaseExpiredLeases(deps(repo, { now: () => at(86_400_000) }))).toBe(0);
    expect(repo.get('e1').status).toBe('SENT');
  });

  it('cannot be reopened by a stale worker reporting a failure', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const stale = deps(repo, { workerId: 'w-a' });
    const claimed = await claimMetaEvent(stale);
    await processMetaEvent(stale, claimed!);
    expect(repo.get('e1').status).toBe('SENT');

    // The same claim replayed — e.g. a duplicated in-flight message.
    const replay = await processMetaEvent(stale, claimed!);
    // The replay really does hit Meta again, so it reports an unconfirmed
    // delivery rather than a no-op. What matters is the row: SENT is
    // terminal and the replay cannot move it, reopen it, or touch its
    // attempts.
    expect(replay.outcome).toBe('delivered_unconfirmed');
    expect(repo.get('e1').status).toBe('SENT');
  });

  it('sends nothing on a second full poll cycle', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockResolvedValue(undefined);
    const d = deps(repo, { sender });

    for (let cycle = 0; cycle < 3; cycle += 1) {
      for (const e of await claimMetaEvents(d, 10)) await processMetaEvent(d, e);
    }
    expect(sender).toHaveBeenCalledTimes(1);
  });
});

// ------------------------------------------------------------- 12, 13 ----

describe('12. maximum retry limit', () => {
  it('dead-letters on the fifth failure and never claims the row again', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const sender = vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1));
    let clock = T0;
    const d = deps(repo, { sender, random: draws(0), now: () => clock });

    const outcomes: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      const claimed = await claimMetaEvent(d);
      if (!claimed) break;
      outcomes.push((await processMetaEvent(d, claimed)).outcome);
      clock = new Date(clock.getTime() + 3_600_001); // past any cap
    }

    expect(outcomes).toEqual(['retry', 'retry', 'retry', 'retry', 'dead_letter']);
    expect(sender).toHaveBeenCalledTimes(DEFAULT_MAX_ATTEMPTS);
    expect(repo.get('e1')).toMatchObject({ status: 'DEAD_LETTER', attempts: DEFAULT_MAX_ATTEMPTS });
    expect(await claimMetaEvent(d)).toBeNull();
  });

  it('counts attempts that were already spent before this process started', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: DEFAULT_MAX_ATTEMPTS - 1 })]);
    const d = deps(repo, { sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1)) });
    const result = await processMetaEvent(d, (await claimMetaEvent(d))!);
    expect(result.outcome).toBe('dead_letter');
    expect(repo.get('e1').attempts).toBe(DEFAULT_MAX_ATTEMPTS);
  });
});

describe('13. retry delay correctness', () => {
  it.each([
    [1, 60_000],
    [2, 300_000],
    [3, 900_000],
    [4, 3_600_000],
  ])('attempt %i draws from [0, %i)', (attempts, cap) => {
    expect(computeRetryDelayMs(attempts, draws(0))).toBe(0);
    expect(computeRetryDelayMs(attempts, draws(0.5))).toBe(cap / 2);
    expect(computeRetryDelayMs(attempts, draws(0.999_999_999))).toBeLessThan(cap);
    expect(RETRY_CAP_MS[attempts]).toBe(cap);
  });

  it('schedules the first retry no more than one minute out', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1)),
      random: draws(0.999_999_999),
    });
    await processMetaEvent(d, (await claimMetaEvent(d))!);
    const delay = repo.get('e1').nextAttemptAt.getTime() - T0.getTime();
    expect(delay).toBeGreaterThanOrEqual(0);
    expect(delay).toBeLessThan(60_000);
  });

  it('persists exactly the delay the deterministic draw dictates', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1', attempts: 2 })]);
    const d = deps(repo, {
      sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1)),
      random: draws(0.25),
    });
    await processMetaEvent(d, (await claimMetaEvent(d))!);
    // attempts becomes 3 => cap 900_000; 0.25 * 900_000 = 225_000
    expect(repo.get('e1').nextAttemptAt).toEqual(at(225_000));
  });

  it('widens the window on every successive failure', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    let clock = T0;
    const d = deps(repo, {
      sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1)),
      random: draws(1), // clamped just under each cap
      now: () => clock,
    });

    const windows: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const claimed = await claimMetaEvent(d);
      await processMetaEvent(d, claimed!);
      windows.push(repo.get('e1').nextAttemptAt.getTime() - clock.getTime());
      clock = new Date(clock.getTime() + 3_600_001);
    }

    expect(windows.map((w) => Math.ceil(w / 1000))).toEqual([60, 300, 900, 3600]);
    expect([...windows].sort((a, b) => a - b)).toEqual(windows); // strictly widening
  });

  it('keeps a retry invisible to claimers until its delay elapses', async () => {
    const repo = createFakeRepository([makeRow({ id: 'e1' })]);
    const d = deps(repo, {
      sender: vi.fn().mockRejectedValue(new MetaCapiTimeoutError(1)),
      random: draws(0.5),
    });
    await processMetaEvent(d, (await claimMetaEvent(d))!);

    expect(await claimMetaEvent(deps(repo, { now: () => at(29_999) }))).toBeNull();
    expect((await claimMetaEvent(deps(repo, { now: () => at(30_000) })))?.id).toBe('e1');
  });
});
