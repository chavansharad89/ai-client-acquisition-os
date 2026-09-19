import { z } from 'zod';

// -----------------------------------------------------------------------
// Typed, validated environment loading. This is configuration plumbing
// (matching .env.example 1:1), not business logic — every var listed in
// .env.example at the repo root must have a corresponding field here.
//
// Intentionally NOT called automatically at import time: each app
// (apps/web, apps/worker) must explicitly call loadEnv() once at its own
// boot, so that failures are attributable to a specific process and so
// unit tests that don't need real env vars aren't forced to provide them.
//
// TWO RULES THIS FILE EXISTS TO ENFORCE:
//
//   1. Every secret production needs is declared HERE. A module that
//      reaches for process.env itself is a secret nobody validated, that
//      fails on first use rather than at boot, and that no deployment
//      checklist knows about. `new Anthropic()` reading
//      ANTHROPIC_API_KEY out of the ambient environment was exactly that.
//
//   2. No value ever appears in an error or a log. The failure message
//      below is built from KEY NAMES and generic reasons only — never
//      from Zod's own serialisation, which happily prints the received
//      value for enum mismatches and would put DATABASE_URL's password
//      in a crash log the first time somebody fat-fingered it.
// -----------------------------------------------------------------------

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Carries a password in the userinfo component — treated as a secret.
  DATABASE_URL: z.string().url(),

  // Publishable. This one is handed to the browser for Razorpay Checkout,
  // which is why it is NOT in SECRET_KEYS below.
  RAZORPAY_KEY_ID: z.string().trim().min(1),
  RAZORPAY_KEY_SECRET: z.string().trim().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().trim().min(1),

  META_PIXEL_ID: z.string().trim().min(1),
  META_CAPI_ACCESS_TOKEN: z.string().trim().min(1),
  // Graph API versions are part of the request path. Restrict this to
  // Meta's version format so a malformed environment value cannot change
  // the destination URL.
  META_CAPI_API_VERSION: z
    .string()
    .regex(/^v\d+\.\d+$/)
    .default('v20.0'),

  // Required by @acos/core-research, @acos/core-outreach and
  // @acos/core-proposal. Previously read implicitly by the Anthropic SDK
  // constructor, which meant a deployment could boot cleanly and then
  // fail on the first research call instead of at startup.
  ANTHROPIC_API_KEY: z.string().trim().min(1),

  // HMAC key for signed download grants (@acos/core-entitlements). This
  // one is ours to generate rather than a provider's, so a real minimum
  // length is enforceable and worth enforcing: a short key makes the
  // grant signature forgeable, and a forged grant is unpaid access to a
  // paid product.
  DOWNLOAD_GRANT_SECRET: z.string().trim().min(32),

  // Phase 18 — production DiscoveryProvider (Google Places API, New).
  // Required, not defaulted: a missing key must fail at boot rather than
  // silently falling back to the "not configured" stub (see
  // apps/worker/src/searchWorker/providers.ts).
  GOOGLE_PLACES_API_KEY: z.string().trim().min(1),
  GOOGLE_PLACES_API_BASE_URL: z.string().url().default('https://places.googleapis.com/v1'),
  DISCOVERY_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),

  // Phase 18 — production SourceDocumentProvider (homepage-only HTTP
  // fetch, see packages/core-research/src/sourceDocumentProvider.ts).
  SOURCE_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  SOURCE_FETCH_MAX_BYTES: z.coerce.number().int().positive().default(2_000_000),
  SOURCE_FETCH_USER_AGENT: z.string().trim().min(1).default('ACOS-ResearchBot/1.0'),

  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15000),
  WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(25),
  // 5, not 8. This defaulted to 8 while the worker's own default was 5,
  // and since nothing read the variable the real budget was 5 — so
  // wiring it up at 8 would have silently widened production behaviour
  // as a side effect of a plumbing fix. apps/worker/src/config.ts
  // asserts the two still agree.
  WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().max(20).default(5),

  // How long webhook_events.payload keeps the verbatim provider body
  // before it is narrowed to the retention allowlist. Bounded rather than
  // free: 0 would redact payloads the moment they arrive, destroying the
  // dispute forensics the column exists for, and an unbounded value would
  // reinstate the indefinite retention this is here to end. See
  // docs/SECURITY.md "Webhook payload retention".
  WEBHOOK_PAYLOAD_RETENTION_DAYS: z.coerce.number().int().min(30).max(400).default(180),

  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
export type EnvKey = keyof Env;

/**
 * Variables whose VALUE must never be printed, logged, or returned.
 *
 * RAZORPAY_KEY_ID is deliberately absent: it is the publishable key that
 * goes to the browser for Checkout, and redacting it would suggest a
 * confidentiality it does not have. DATABASE_URL is deliberately present:
 * it carries a password.
 */
export const SECRET_KEYS = [
  'DATABASE_URL',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'META_CAPI_ACCESS_TOKEN',
  'ANTHROPIC_API_KEY',
  'DOWNLOAD_GRANT_SECRET',
  'GOOGLE_PLACES_API_KEY',
] as const satisfies readonly EnvKey[];

export type SecretKey = (typeof SECRET_KEYS)[number];

export function isSecretKey(key: string): key is SecretKey {
  return (SECRET_KEYS as readonly string[]).includes(key);
}

/**
 * Thrown when the environment is not usable. Carries the offending KEY
 * NAMES and never their values.
 */
export class EnvValidationError extends Error {
  readonly missing: readonly string[];
  readonly invalid: readonly string[];

  constructor(missing: readonly string[], invalid: readonly string[]) {
    const parts: string[] = [];
    if (missing.length > 0) parts.push(`missing: ${missing.join(', ')}`);
    if (invalid.length > 0) parts.push(`invalid: ${invalid.join(', ')}`);
    super(
      `Invalid environment configuration (${parts.join('; ')}). ` +
        `See .env.example for the full list. Values are deliberately not shown.`,
    );
    this.name = 'EnvValidationError';
    this.missing = [...missing];
    this.invalid = [...invalid];
  }
}

/**
 * Validates process.env against the schema above and returns a typed
 * object. Throws (fails fast) on any missing/invalid variable — this is
 * meant to be called once at process boot in apps/web and apps/worker,
 * per architecture §11 (secrets validated at boot, not first request).
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  // Built from paths, not from Zod's message: `error.toString()` embeds
  // the received value for enum mismatches, and a crash log is exactly
  // where a password must not appear.
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '(root)');
    const absent = issue.code === 'invalid_type' && source[key] === undefined;
    const bucket = absent ? missing : invalid;
    if (!bucket.includes(key)) bucket.push(key);
  }
  throw new EnvValidationError(missing.sort(), invalid.sort());
}

/**
 * A representation of the config that is safe to log.
 *
 * Secrets become `[redacted]` — not a truncated prefix, not a length.
 * A prefix identifies a key well enough to be worth stealing, and a
 * length narrows a brute force; neither helps anyone debugging, because
 * the useful question is "is it set?", which `[redacted]` vs `[unset]`
 * answers exactly.
 */
export function redactedEnv(env: Env): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      out[key] = '[unset]';
    } else if (isSecretKey(key)) {
      out[key] = '[redacted]';
    } else {
      out[key] = typeof value === 'number' ? value : String(value);
    }
  }
  return out;
}

/**
 * Refuses to start if a secret has been exposed to the browser bundle.
 *
 * Next.js inlines any variable named `NEXT_PUBLIC_*` into client
 * JavaScript at build time, where it is world-readable forever. Copying
 * a secret to such a name — usually to make one page work — is a
 * plausible, quiet, unrecoverable mistake, so this makes it loud. Called
 * from loadEnvOrExit; safe to call anywhere.
 */
export function assertNoPublicSecrets(source: NodeJS.ProcessEnv = process.env): void {
  const exposed: string[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (!key.startsWith('NEXT_PUBLIC_') || !value) continue;
    for (const secret of SECRET_KEYS) {
      const secretValue = source[secret];
      if (secretValue && secretValue.length >= 8 && value.includes(secretValue)) {
        // The NAME of the offending public variable, never either value.
        exposed.push(`${key} (contains ${secret})`);
      }
    }
  }
  if (exposed.length > 0) {
    throw new EnvValidationError(
      [],
      exposed.map((e) => `${e} — NEXT_PUBLIC_* is inlined into client JavaScript`),
    );
  }
}
