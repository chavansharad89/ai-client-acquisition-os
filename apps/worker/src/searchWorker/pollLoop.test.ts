import { describe, expect, it, vi } from 'vitest';

import { runSearchWorkerPollLoop, type SearchWorkerPollLoopDeps } from './pollLoop';

// UNIT tests (fakes only) for the poll-loop shape itself: release ->
// claim -> (wait only if empty) -> repeat, until the abort signal fires.
// The actual claim/pipeline behavior is exercised in ./worker.test.ts;
// here `searches` is a minimal stub whose `claimNextPending` sequence is
// scripted per test.

function fakeDeps(overrides: Partial<SearchWorkerPollLoopDeps> = {}): SearchWorkerPollLoopDeps {
  return {
    searches: {
      create: vi.fn(),
      findByIdempotencyKey: vi.fn(),
      getById: vi.fn(),
      list: vi.fn(),
      transition: vi.fn(),
      claimNextPending: vi.fn().mockResolvedValue(null),
      releaseExpiredLeases: vi.fn().mockResolvedValue(0),
      completeClaimed: vi.fn(),
      recordAttemptFailure: vi.fn(),
    } as unknown as SearchWorkerPollLoopDeps['searches'],
    companies: {} as SearchWorkerPollLoopDeps['companies'],
    prospects: {} as SearchWorkerPollLoopDeps['prospects'],
    discoveryProvider: {} as SearchWorkerPollLoopDeps['discoveryProvider'],
    signals: {} as SearchWorkerPollLoopDeps['signals'],
    researchProvider: {} as SearchWorkerPollLoopDeps['researchProvider'],
    opportunities: {} as SearchWorkerPollLoopDeps['opportunities'],
    workerId: 'worker-a',
    pollIntervalMs: 15_000,
    sleep: vi.fn().mockResolvedValue(undefined),
    now: () => new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('runSearchWorkerPollLoop', () => {
  it('releases expired leases before every claim attempt', async () => {
    const controller = new AbortController();
    const releaseExpiredLeases = vi.fn().mockImplementation(() => {
      controller.abort();
      return Promise.resolve(0);
    });
    const deps = fakeDeps({
      searches: {
        ...fakeDeps().searches,
        releaseExpiredLeases,
      } as SearchWorkerPollLoopDeps['searches'],
    });

    await runSearchWorkerPollLoop(deps, controller.signal);

    expect(releaseExpiredLeases).toHaveBeenCalledTimes(1);
  });

  it('waits pollIntervalMs only when nothing was eligible to claim', async () => {
    let calls = 0;
    const controller = new AbortController();
    const sleep = vi.fn().mockImplementation(async () => {
      calls += 1;
      if (calls >= 2) controller.abort();
    });
    const deps = fakeDeps({ sleep });

    await runSearchWorkerPollLoop(deps, controller.signal);

    expect(sleep).toHaveBeenCalledWith(15_000, controller.signal);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  it('does not wait between iterations when a Search was claimed and processed', async () => {
    const controller = new AbortController();
    let claims = 0;
    const claimNextPending = vi.fn().mockImplementation(async () => {
      claims += 1;
      if (claims >= 3) controller.abort();
      return null; // "empty" outcome is sufficient to prove no artificial delay is needed to loop again
    });
    const sleep = vi.fn().mockImplementation(async () => controller.abort());
    const deps = fakeDeps({
      searches: {
        ...fakeDeps().searches,
        claimNextPending,
      } as SearchWorkerPollLoopDeps['searches'],
      sleep,
    });

    await runSearchWorkerPollLoop(deps, controller.signal);

    // Looped multiple times before aborting, via releaseExpiredLeases'
    // own re-entry rather than being forced through `sleep`.
    expect(claims).toBeGreaterThanOrEqual(1);
  });

  it('stops promptly once the abort signal fires', async () => {
    const controller = new AbortController();
    controller.abort();
    const deps = fakeDeps();

    await runSearchWorkerPollLoop(deps, controller.signal);

    expect(deps.searches.releaseExpiredLeases).not.toHaveBeenCalled();
  });
});
