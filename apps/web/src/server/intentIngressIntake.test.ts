import type { IntentIntakeDeps } from '@acos/worker/searchWorker';
import { describe, expect, it, vi } from 'vitest';

// P3 binding for the OD-13 push ingress: the canonical worker function is
// called, not a copy. The worker module is mocked, so nothing touches a
// database or provider.

const recordIntentIntakeForOwner = vi.fn(async () => ({}));
vi.mock('@acos/worker/searchWorker', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/worker/searchWorker')>()),
  recordIntentIntakeForOwner,
}));
vi.mock('./db', () => ({
  getPool: () => {
    throw new Error('getPool must not be called in this test');
  },
}));

const { createIntentIngressIntake } = await import('./intentIngressIntake');

describe('createIntentIngressIntake', () => {
  it('delegates to @acos/worker recordIntentIntakeForOwner with lazily built deps (once)', async () => {
    const deps = { marker: 'deps' } as unknown as IntentIntakeDeps;
    const build = vi.fn(() => deps);
    const intake = createIntentIngressIntake(build);
    expect(build).not.toHaveBeenCalled();

    const now = new Date('2026-02-01T12:00:00.000Z');
    const input = { searchId: 's', companyName: 'c', website: 'https://c.example', signals: [] };
    await intake('u', input, now);
    await intake('u', input, now);

    expect(build).toHaveBeenCalledTimes(1);
    expect(recordIntentIntakeForOwner).toHaveBeenCalledWith(deps, 'u', input, now);
  });

  it('builds no deps (no pool) until it is first called', () => {
    expect(() => createIntentIngressIntake()).not.toThrow();
  });
});
