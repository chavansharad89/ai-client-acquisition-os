import { describe, expect, it } from 'vitest';

import {
  assertNoPublicSecrets,
  EnvValidationError,
  isSecretKey,
  loadEnv,
  redactedEnv,
  SECRET_KEYS,
} from './index';

// Environment validation.
// -----------------------------------------------------------------------
// Two properties, and the second matters as much as the first: every
// production secret must be DECLARED here so a missing one stops the
// process at boot, and no failure path may ever print a value.
// -----------------------------------------------------------------------

/** A complete, valid environment. Every value is obviously fake. */
const COMPLETE: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:pw-not-real@localhost:5432/db?schema=public',
  RAZORPAY_KEY_ID: 'rzp_test_publishable',
  RAZORPAY_KEY_SECRET: 'rzp-secret-not-real',
  RAZORPAY_WEBHOOK_SECRET: 'whsec-not-real',
  META_PIXEL_ID: '1234567890',
  META_CAPI_ACCESS_TOKEN: 'meta-token-not-real',
  META_CAPI_API_VERSION: 'v20.0',
  ANTHROPIC_API_KEY: 'sk-ant-not-real',
  DOWNLOAD_GRANT_SECRET: 'a'.repeat(48),
  GOOGLE_PLACES_API_KEY: 'places-key-not-real',
};

const without = (key: string): NodeJS.ProcessEnv => {
  const copy = { ...COMPLETE };
  delete copy[key];
  return copy;
};

describe('all required secrets present', () => {
  it('loads a complete environment', () => {
    const env = loadEnv(COMPLETE);
    expect(env.NODE_ENV).toBe('production');
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-not-real');
    expect(env.DOWNLOAD_GRANT_SECRET).toHaveLength(48);
  });

  it('applies defaults for the optional operational knobs', () => {
    const env = loadEnv(COMPLETE);
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.WORKER_MAX_ATTEMPTS).toBe(5);
    expect(env.META_CAPI_API_VERSION).toBe('v20.0');
  });

  it('declares every secret this system uses', () => {
    // A checklist, deliberately hard-coded rather than derived: if a new
    // secret is added to the schema and not to SECRET_KEYS, it would be
    // logged in the clear, and only a literal list catches that.
    expect([...SECRET_KEYS].sort()).toEqual([
      'ANTHROPIC_API_KEY',
      'DATABASE_URL',
      'DOWNLOAD_GRANT_SECRET',
      'GEMINI_API_KEY',
      'GOOGLE_PLACES_API_KEY',
      'META_CAPI_ACCESS_TOKEN',
      'OPENAI_API_KEY',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
    ]);
    // The publishable key must NOT be in there — marking it secret would
    // imply a confidentiality it does not have.
    expect(isSecretKey('RAZORPAY_KEY_ID')).toBe(false);
    expect(isSecretKey('META_PIXEL_ID')).toBe(false);
  });
});

describe('a missing required secret fails at load', () => {
  it.each([
    'DATABASE_URL',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'META_PIXEL_ID',
    'META_CAPI_ACCESS_TOKEN',
    'ANTHROPIC_API_KEY',
    'DOWNLOAD_GRANT_SECRET',
    'GOOGLE_PLACES_API_KEY',
  ])('refuses to load without %s', (key) => {
    expect(() => loadEnv(without(key))).toThrow(EnvValidationError);
    try {
      loadEnv(without(key));
    } catch (error) {
      expect((error as EnvValidationError).missing).toContain(key);
    }
  });

  it('missing ANTHROPIC_API_KEY is a boot failure, not a first-call failure', () => {
    // The regression this guards: the key used to be read inside the
    // Anthropic SDK constructor, so a process booted fine and died on its
    // first research call instead.
    expect(() => loadEnv(without('ANTHROPIC_API_KEY'))).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('missing DOWNLOAD_GRANT_SECRET is a boot failure', () => {
    expect(() => loadEnv(without('DOWNLOAD_GRANT_SECRET'))).toThrow(/DOWNLOAD_GRANT_SECRET/);
  });

  it('reports every missing key at once, not one per restart', () => {
    const bare = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;
    try {
      loadEnv(bare);
      expect.unreachable('expected a validation error');
    } catch (error) {
      const missing = (error as EnvValidationError).missing;
      expect(missing).toContain('ANTHROPIC_API_KEY');
      expect(missing).toContain('DOWNLOAD_GRANT_SECRET');
      expect(missing).toContain('RAZORPAY_WEBHOOK_SECRET');
      expect(missing.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('rejects a present-but-empty secret, not just an absent one', () => {
    expect(() => loadEnv({ ...COMPLETE, RAZORPAY_WEBHOOK_SECRET: '   ' })).toThrow(
      EnvValidationError,
    );
  });

  it('rejects a download grant secret too short to be a safe HMAC key', () => {
    expect(() => loadEnv({ ...COMPLETE, DOWNLOAD_GRANT_SECRET: 'short' })).toThrow(
      EnvValidationError,
    );
    try {
      loadEnv({ ...COMPLETE, DOWNLOAD_GRANT_SECRET: 'short' });
    } catch (error) {
      // Present but wrong is "invalid", not "missing" — a deployer who
      // set it needs a different message from one who forgot.
      expect((error as EnvValidationError).invalid).toContain('DOWNLOAD_GRANT_SECRET');
      expect((error as EnvValidationError).missing).not.toContain('DOWNLOAD_GRANT_SECRET');
    }
  });
});

describe('no secret value is ever emitted', () => {
  const canaries = [
    'pw-not-real',
    'rzp-secret-not-real',
    'whsec-not-real',
    'meta-token-not-real',
    'sk-ant-not-real',
    'places-key-not-real',
    'sk-openai-not-real',
    'gm-not-real',
  ];
  // OPENAI_API_KEY/GEMINI_API_KEY are OPTIONAL (unlike every other secret
  // in COMPLETE) — set explicitly here so this suite still proves every
  // secret this system CAN hold is redacted, not just the required ones.
  const COMPLETE_WITH_OPTIONAL_PROVIDERS: NodeJS.ProcessEnv = {
    ...COMPLETE,
    OPENAI_API_KEY: 'sk-openai-not-real',
    GEMINI_API_KEY: 'gm-not-real',
  };

  it('keeps values out of the error when a variable is missing', () => {
    try {
      loadEnv(without('ANTHROPIC_API_KEY'));
      expect.unreachable('expected a validation error');
    } catch (error) {
      const serialised = `${(error as Error).message} ${JSON.stringify(error)}`;
      for (const canary of canaries) expect(serialised).not.toContain(canary);
    }
  });

  it('keeps values out of the error when a variable is INVALID', () => {
    // The dangerous case. Zod's own serialisation prints the received
    // value for enum mismatches, so an error built from `error.toString()`
    // would leak whatever was set — including DATABASE_URL's password.
    const leaky = {
      ...COMPLETE,
      LOG_LEVEL: 'super-verbose-pw-not-real',
      META_CAPI_API_VERSION: 'not-a-version',
    };
    try {
      loadEnv(leaky);
      expect.unreachable('expected a validation error');
    } catch (error) {
      const serialised = `${(error as Error).message} ${JSON.stringify(error)}`;
      expect(serialised).toContain('LOG_LEVEL');
      expect(serialised).toContain('META_CAPI_API_VERSION');
      expect(serialised).not.toContain('super-verbose-pw-not-real');
      expect(serialised).not.toContain('not-a-version');
      for (const canary of canaries) expect(serialised).not.toContain(canary);
    }
  });

  it('redacts every secret in the loggable summary', () => {
    const summary = redactedEnv(loadEnv(COMPLETE_WITH_OPTIONAL_PROVIDERS));
    const serialised = JSON.stringify(summary);

    for (const canary of canaries) expect(serialised).not.toContain(canary);
    for (const key of SECRET_KEYS) expect(summary[key]).toBe('[redacted]');

    // Not a prefix and not a length: a prefix identifies a key well
    // enough to be worth stealing, and a length narrows a brute force.
    expect(serialised).not.toContain('sk-ant');
    expect(serialised).not.toMatch(/"length"/);

    // Non-secrets stay readable, which is the point of having a summary.
    expect(summary.NODE_ENV).toBe('production');
    expect(summary.PORT).toBe(3000);
    expect(summary.RAZORPAY_KEY_ID).toBe('rzp_test_publishable');
  });
});

describe('secrets must not reach the client bundle', () => {
  it('refuses to start when a secret has been copied to a NEXT_PUBLIC_ name', () => {
    expect(() =>
      assertNoPublicSecrets({
        ...COMPLETE,
        NEXT_PUBLIC_ANALYTICS: `prefix-${COMPLETE.ANTHROPIC_API_KEY}`,
      }),
    ).toThrow(EnvValidationError);
  });

  it('names the offending variable without printing either value', () => {
    try {
      assertNoPublicSecrets({
        ...COMPLETE,
        NEXT_PUBLIC_TOKEN: COMPLETE.META_CAPI_ACCESS_TOKEN,
      });
      expect.unreachable('expected a validation error');
    } catch (error) {
      const serialised = `${(error as Error).message} ${JSON.stringify(error)}`;
      expect(serialised).toContain('NEXT_PUBLIC_TOKEN');
      expect(serialised).toContain('META_CAPI_ACCESS_TOKEN');
      expect(serialised).not.toContain('meta-token-not-real');
    }
  });

  it('allows a NEXT_PUBLIC_ variable that holds no secret', () => {
    expect(() =>
      assertNoPublicSecrets({
        ...COMPLETE,
        NEXT_PUBLIC_SITE_URL: 'https://acos.example',
        // The publishable Razorpay key legitimately goes to the browser.
        NEXT_PUBLIC_RAZORPAY_KEY_ID: COMPLETE.RAZORPAY_KEY_ID,
      }),
    ).not.toThrow();
  });

  it('passes on a clean environment', () => {
    expect(() => assertNoPublicSecrets(COMPLETE)).not.toThrow();
  });
});

describe('multi-model research provider selection (OPTIONAL credentials)', () => {
  it('boots without OPENAI_API_KEY or GEMINI_API_KEY — Anthropic-only deployments keep working', () => {
    const env = loadEnv(COMPLETE);
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.GEMINI_API_KEY).toBeUndefined();
  });

  it('defaults RESEARCH_PROVIDER to anthropic and leaves fallback unset', () => {
    const env = loadEnv(COMPLETE);
    expect(env.RESEARCH_PROVIDER).toBe('anthropic');
    expect(env.RESEARCH_MODEL).toBeUndefined();
    expect(env.RESEARCH_FALLBACK_PROVIDER).toBeUndefined();
  });

  it('accepts openai/gemini as RESEARCH_PROVIDER and RESEARCH_FALLBACK_PROVIDER', () => {
    const env = loadEnv({
      ...COMPLETE,
      OPENAI_API_KEY: 'sk-openai-not-real',
      RESEARCH_PROVIDER: 'openai',
      RESEARCH_FALLBACK_PROVIDER: 'anthropic',
    });
    expect(env.RESEARCH_PROVIDER).toBe('openai');
    expect(env.RESEARCH_FALLBACK_PROVIDER).toBe('anthropic');
  });

  it('rejects an unrecognized RESEARCH_PROVIDER value', () => {
    expect(() => loadEnv({ ...COMPLETE, RESEARCH_PROVIDER: 'grok' })).toThrow(
      EnvValidationError,
    );
  });

  it('redacts OPENAI_API_KEY/GEMINI_API_KEY when present, never printing the value', () => {
    const summary = redactedEnv(
      loadEnv({ ...COMPLETE, OPENAI_API_KEY: 'sk-openai-not-real', GEMINI_API_KEY: 'gm-not-real' }),
    );
    expect(summary.OPENAI_API_KEY).toBe('[redacted]');
    expect(summary.GEMINI_API_KEY).toBe('[redacted]');
    expect(JSON.stringify(summary)).not.toContain('sk-openai-not-real');
    expect(JSON.stringify(summary)).not.toContain('gm-not-real');
  });

  it('shows [unset] rather than [redacted] for an absent optional credential', () => {
    const summary = redactedEnv(loadEnv(COMPLETE));
    expect(summary.OPENAI_API_KEY).toBe('[unset]');
    expect(summary.GEMINI_API_KEY).toBe('[unset]');
  });
});

describe('WEBHOOK_PAYLOAD_RETENTION_DAYS', () => {
  it('defaults to the documented 180 days', () => {
    expect(loadEnv(COMPLETE).WEBHOOK_PAYLOAD_RETENTION_DAYS).toBe(180);
  });

  it('accepts a value inside the bounds', () => {
    expect(
      loadEnv({ ...COMPLETE, WEBHOOK_PAYLOAD_RETENTION_DAYS: '120' })
        .WEBHOOK_PAYLOAD_RETENTION_DAYS,
    ).toBe(120);
  });

  it('refuses a value that would destroy dispute forensics', () => {
    // 0 would redact payloads the moment they arrive.
    expect(() => loadEnv({ ...COMPLETE, WEBHOOK_PAYLOAD_RETENTION_DAYS: '0' })).toThrow(
      /WEBHOOK_PAYLOAD_RETENTION_DAYS/,
    );
  });

  it('refuses a value that would reinstate indefinite retention', () => {
    expect(() => loadEnv({ ...COMPLETE, WEBHOOK_PAYLOAD_RETENTION_DAYS: '99999' })).toThrow(
      /WEBHOOK_PAYLOAD_RETENTION_DAYS/,
    );
  });

  it('is not a secret — it may be printed', () => {
    expect(SECRET_KEYS).not.toContain('WEBHOOK_PAYLOAD_RETENTION_DAYS');
  });
});
