import { describe, expect, it, vi } from 'vitest';

import {
  buildHooks,
  FAIL_POINTS,
  INJECTED_CRASH_EXIT_CODE,
  isDryRun,
  positionOf,
  readFaultConfig,
} from './faultInjection';
import type { TargetResult } from './deploy';
import { INDEX_TARGETS } from './targets';

const target = (i: number) => ({ target: INDEX_TARGETS[i]!, durationMs: 0 }) as TargetResult;

describe('fault configuration', () => {
  it('accepts every documented fail point', () => {
    expect(FAIL_POINTS).toEqual([
      'AFTER_INDEX_1',
      'AFTER_INDEX_2',
      'AFTER_INDEX_3',
      'AFTER_INDEX_4',
      'BEFORE_PRISMA_RESOLVE',
    ]);
    for (const failAt of FAIL_POINTS) {
      expect(readFaultConfig({ NODE_ENV: 'test', FAIL_AT: failAt }).failAt).toBe(failAt);
    }
  });

  it('rejects an unknown fail point instead of silently ignoring it', () => {
    expect(() => readFaultConfig({ NODE_ENV: 'test', FAIL_AT: 'AFTER_INDEX_9' })).toThrow(
      /FAIL_AT/,
    );
    expect(() => readFaultConfig({ NODE_ENV: 'test', FAIL_AT: 'nonsense' })).toThrow(/FAIL_AT/);
  });

  it('parses the timing knobs', () => {
    const config = readFaultConfig({
      NODE_ENV: 'test',
      HOLD_LOCK_MS: '5000',
      KILL_AFTER_LOCK_MS: '250',
    });
    expect(config).toMatchObject({ holdLockMs: 5000, killAfterLockMs: 250, enabled: true });
  });

  it('rejects a negative or non-integer duration', () => {
    expect(() => readFaultConfig({ NODE_ENV: 'test', HOLD_LOCK_MS: '-1' })).toThrow();
    expect(() => readFaultConfig({ NODE_ENV: 'test', HOLD_LOCK_MS: '1.5' })).toThrow();
  });

  it('maps AFTER_INDEX_n to a 1-based position', () => {
    expect(positionOf('AFTER_INDEX_1')).toBe(1);
    expect(positionOf('AFTER_INDEX_4')).toBe(4);
    expect(positionOf('BEFORE_PRISMA_RESOLVE')).toBeNull();
  });

  it('reads DRY_RUN from the environment', () => {
    expect(isDryRun({ DRY_RUN: 'true' })).toBe(true);
    expect(isDryRun({ DRY_RUN: 'false' })).toBe(false);
    expect(isDryRun({})).toBe(false);
  });
});

describe('production safety', () => {
  it('is disabled under NODE_ENV=production', () => {
    const config = readFaultConfig({
      NODE_ENV: 'production',
      FAIL_AT: 'AFTER_INDEX_1',
      HOLD_LOCK_MS: '9999',
    });
    expect(config.enabled).toBe(false);
    expect(buildHooks(config)).toEqual({});
  });

  it('cannot kill a production deployment however the env is set', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const hooks = buildHooks(readFaultConfig({ NODE_ENV: 'production', FAIL_AT: 'AFTER_INDEX_1' }));
    await hooks.afterTarget?.(target(0), 1);
    await hooks.afterVerification?.({} as never);
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });
});

describe('hook behaviour', () => {
  it('exits at the requested index position and no other', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const hooks = buildHooks(readFaultConfig({ NODE_ENV: 'test', FAIL_AT: 'AFTER_INDEX_3' }));

    await hooks.afterTarget?.(target(0), 1);
    await hooks.afterTarget?.(target(1), 2);
    expect(exit).not.toHaveBeenCalled();

    await hooks.afterTarget?.(target(2), 3);
    expect(exit).toHaveBeenCalledWith(INJECTED_CRASH_EXIT_CODE);
    exit.mockRestore();
  });

  it('exits at verification for BEFORE_PRISMA_RESOLVE, not at any index', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const hooks = buildHooks(
      readFaultConfig({ NODE_ENV: 'test', FAIL_AT: 'BEFORE_PRISMA_RESOLVE' }),
    );

    for (let i = 1; i <= 4; i += 1) await hooks.afterTarget?.(target(i - 1), i);
    expect(exit).not.toHaveBeenCalled();

    await hooks.afterVerification?.({} as never);
    expect(exit).toHaveBeenCalledWith(INJECTED_CRASH_EXIT_CODE);
    exit.mockRestore();
  });

  it('holds the lock for the requested duration', async () => {
    const hooks = buildHooks(readFaultConfig({ NODE_ENV: 'test', HOLD_LOCK_MS: '60' }));
    const startedAt = Date.now();
    await hooks.afterLock?.();
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(55);
  });

  it('does nothing when no fault is configured', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const hooks = buildHooks(readFaultConfig({ NODE_ENV: 'test' }));
    await hooks.afterLock?.();
    await hooks.afterTarget?.(target(0), 1);
    await hooks.afterVerification?.({} as never);
    expect(exit).not.toHaveBeenCalled();
    exit.mockRestore();
  });
});
