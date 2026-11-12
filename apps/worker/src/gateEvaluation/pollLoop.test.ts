import type { GateResult, SqlExecutor } from '@acos/core-launch-gates';
import { describe, expect, it, vi } from 'vitest';

import { runGateEvaluationPollLoop, type GateEvaluationPollLoopDeps } from './pollLoop';
import { runGateEvaluationTick } from './worker';

// UNIT tests (fakes only) for the gate-evaluation tick and poll-loop
// shape: run tick -> (wait) -> repeat, until the abort signal fires. Real
// evaluateAllGates/writeProductionSnapshot behavior against a real
// database is exercised by the real-Postgres integration test under
// tests/integration/ — here `evaluateAllGates`/`writeProductionSnapshot`
// are scripted fakes, mirroring ../searchWorker/pollLoop.test.ts's own
// convention of stubbing `searches` for the Search poll loop.

const fakeSql: SqlExecutor = { query: vi.fn() };

function fakeResult(gate: GateResult['gate']): GateResult {
  return {
    gate,
    window: { start: new Date('2026-01-01T00:00:00.000Z'), end: new Date('2026-01-31T00:00:00.000Z') },
    status: 'EVALUATED',
    numerator: 1,
    denominator: 2,
    value: 0.5,
  };
}

function fakeDeps(overrides: Partial<GateEvaluationPollLoopDeps> = {}): GateEvaluationPollLoopDeps {
  return {
    sql: fakeSql,
    now: () => new Date('2026-02-01T00:00:00.000Z'),
    evaluateAllGates: vi.fn().mockResolvedValue([fakeResult('PCG-1'), fakeResult('PCG-2')]),
    writeProductionSnapshot: vi.fn().mockResolvedValue(undefined),
    pollIntervalMs: 86_400_000,
    sleep: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('runGateEvaluationTick', () => {
  it('calls evaluateAllGates once with the injected now, then writeProductionSnapshot once per result', async () => {
    const deps = fakeDeps();

    const outcome = await runGateEvaluationTick(deps);

    expect(deps.evaluateAllGates).toHaveBeenCalledTimes(1);
    expect(deps.evaluateAllGates).toHaveBeenCalledWith(fakeSql, new Date('2026-02-01T00:00:00.000Z'));
    expect(deps.writeProductionSnapshot).toHaveBeenCalledTimes(2);
    expect(outcome.evaluated).toEqual(['PCG-1', 'PCG-2']);
  });

  it('a second invocation for the same (already-evaluated) window does not throw', async () => {
    const deps = fakeDeps();

    await runGateEvaluationTick(deps);
    await expect(runGateEvaluationTick(deps)).resolves.toEqual({ evaluated: ['PCG-1', 'PCG-2'] });
    expect(deps.writeProductionSnapshot).toHaveBeenCalledTimes(4);
  });
});

describe('runGateEvaluationPollLoop', () => {
  it('runs exactly one tick per interval, sleeping pollIntervalMs between ticks', async () => {
    const controller = new AbortController();
    let ticks = 0;
    const evaluateAllGates = vi.fn().mockImplementation(async () => {
      ticks += 1;
      return [fakeResult('PCG-1')];
    });
    const sleep = vi.fn().mockImplementation(async () => {
      if (ticks >= 2) controller.abort();
    });
    const deps = fakeDeps({ evaluateAllGates, sleep });

    await runGateEvaluationPollLoop(deps, controller.signal);

    expect(ticks).toBeGreaterThanOrEqual(2);
    expect(sleep).toHaveBeenCalledWith(86_400_000, controller.signal);
  });

  it('never has two ticks in flight at once (single-flight by construction)', async () => {
    const controller = new AbortController();
    let inFlight = 0;
    let maxInFlight = 0;
    let ticks = 0;
    const evaluateAllGates = vi.fn().mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      ticks += 1;
      return [fakeResult('PCG-1')];
    });
    const sleep = vi.fn().mockImplementation(async () => {
      if (ticks >= 3) controller.abort();
    });
    const deps = fakeDeps({ evaluateAllGates, sleep });

    await runGateEvaluationPollLoop(deps, controller.signal);

    expect(maxInFlight).toBe(1);
  });

  it('logs and retries on the next tick after a failure, without crashing the loop', async () => {
    const controller = new AbortController();
    let calls = 0;
    const evaluateAllGates = vi.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw new Error('simulated failure');
      return [fakeResult('PCG-1')];
    });
    const sleep = vi.fn().mockImplementation(async () => {
      if (calls >= 2) controller.abort();
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const deps = fakeDeps({ evaluateAllGates, sleep });

    await runGateEvaluationPollLoop(deps, controller.signal);

    expect(calls).toBeGreaterThanOrEqual(2);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('gateEvaluation.tick.failed'));
    errorSpy.mockRestore();
  });

  it('stops promptly once the abort signal fires', async () => {
    const controller = new AbortController();
    controller.abort();
    const deps = fakeDeps();

    await runGateEvaluationPollLoop(deps, controller.signal);

    expect(deps.evaluateAllGates).not.toHaveBeenCalled();
    expect(deps.sleep).not.toHaveBeenCalled();
  });
});
