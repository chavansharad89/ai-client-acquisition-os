import { describe, expect, it } from 'vitest';

import { loadEnv, type Env } from '@acos/config';

import { workerRuntimeConfig, EXPECTED_DEFAULT_MAX_ATTEMPTS } from './config';
import { DEFAULT_MAX_ATTEMPTS, MAX_CONFIGURABLE_ATTEMPTS } from './metaEvents/backoff';

const BASE: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  RAZORPAY_KEY_ID: 'rzp_id',
  RAZORPAY_KEY_SECRET: 'rzp_secret',
  RAZORPAY_WEBHOOK_SECRET: 'whsec',
  META_PIXEL_ID: '1',
  META_CAPI_ACCESS_TOKEN: 'tok',
  ANTHROPIC_API_KEY: 'sk-ant',
  DOWNLOAD_GRANT_SECRET: 'g'.repeat(48),
};

const env = (over: NodeJS.ProcessEnv = {}): Env => loadEnv({ ...BASE, ...over });

describe('WORKER_* variables reach a consumer', () => {
  it('maps every WORKER_ variable to a named knob', () => {
    const config = workerRuntimeConfig(
      env({
        WORKER_POLL_INTERVAL_MS: '9000',
        WORKER_BATCH_SIZE: '7',
        WORKER_MAX_ATTEMPTS: '6',
      }),
    );
    expect(config).toMatchObject({ pollIntervalMs: 9000, batchSize: 7, maxAttempts: 6 });
  });

  it('carries the schema defaults through unchanged', () => {
    const config = workerRuntimeConfig(env());
    expect(config.pollIntervalMs).toBe(15000);
    expect(config.batchSize).toBe(25);
    expect(config.maxAttempts).toBe(DEFAULT_MAX_ATTEMPTS);
  });

  it('keeps the schema default and the worker default in agreement', () => {
    // These disagreed — the schema said 8, the worker said 5, and since
    // nothing read the variable the real behaviour was 5. Wiring it up
    // without aligning them would have silently widened the budget.
    expect(env().WORKER_MAX_ATTEMPTS).toBe(EXPECTED_DEFAULT_MAX_ATTEMPTS);
    expect(EXPECTED_DEFAULT_MAX_ATTEMPTS).toBe(DEFAULT_MAX_ATTEMPTS);
  });

  it('refuses a budget the worker cannot honour', () => {
    expect(() =>
      loadEnv({ ...BASE, WORKER_MAX_ATTEMPTS: String(MAX_CONFIGURABLE_ATTEMPTS + 1) }),
    ).toThrow();
  });

  it('does not expose leaseDurationMs as an environment variable', () => {
    // It is coupled to the CAPI timeout by an invariant the worker
    // enforces (timeout < lease). Exposing one side of a coupled pair
    // invites a configuration that fails at boot, or passes and
    // duplicates conversions.
    expect(Object.keys(env())).not.toContain('WORKER_LEASE_DURATION_MS');
    expect(workerRuntimeConfig(env()).leaseDurationMs).toBeGreaterThan(0);
  });
});
