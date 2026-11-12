import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto';

import * as coreResearch from '@acos/core-research';
import {
  IntentSignalValidationError,
  MAX_PROVIDER_ENVELOPE_BYTES,
  requireExactProviderResultForIntake,
  toIntentIntakeInput,
  type RecordIntentIntakeInput,
} from '@acos/core-research';
import type { Logger } from '@acos/observability';
import { IntentIntakeSearchNotFoundError } from '@acos/worker/searchWorker';
import { describe, expect, it, vi } from 'vitest';

import { handleIntentIngress, INTENT_INGRESS_HEADERS, type IntentIngressIntake } from './intentIngress';
import {
  createIntentIntegrationRegistry,
  INTENT_INTEGRATION_REGISTRATIONS,
  type IntentIntegrationRegistration,
} from './intentIntegrationRegistry';

// OD-13 push ingress (INTENT-INTAKE-OD13-INGRESS-DEC-001, Alternative I).
// Test-only generated Ed25519 keys and test-only identifiers; no database,
// no provider, no network. P3 is a fake that runs the real X1 check.

const NOW = new Date('2026-02-01T12:00:00.000Z');
const INTEGRATION = 'test-integration-0001';
const KEY_ID = 'test-key-1';
const OWNER = { userId: 'registered_user', searchId: 'registered_search' };

function keyPair(): { publicKey: KeyObject; privateKey: KeyObject } {
  return generateKeyPairSync('ed25519');
}

const PAIR = keyPair();

function registration(overrides: Partial<IntentIntegrationRegistration> = {}): IntentIntegrationRegistration {
  return {
    integrationId: INTEGRATION,
    owner: OWNER,
    keys: [{ keyId: KEY_ID, publicKey: PAIR.publicKey, validFrom: new Date(0), validUntil: null }],
    ...overrides,
  };
}

function aiPlatformResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    sourceFamily: 'AI_PLATFORM_ACQUISITION',
    acquisitionType: 'AI_REFERRAL',
    externalId: 'aiad-evt-0042',
    business: { name: 'Acme Co', website: 'https://acme.example.com' },
    sourceReference: 'https://landing.example.com/forms/ai-referral',
    evidence: [
      {
        origin: 'SUPPLIED_TO_US',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'statedRequirement',
        statement: 'We want an ordering app, budget 3 lakh',
        observedAt: '2026-01-31T10:00:00.000Z',
      },
    ],
    capturedAt: NOW.toISOString(),
    provenance: { integration: INTEGRATION, retrieval: 'AUTHORIZED_INTEGRATION' },
    authorization: {
      businessId: 'integration-business-0001',
      status: 'GRANTED',
      scope: 'ACQUISITION',
      authorizedAt: '2026-01-15T00:00:00.000Z',
      integrationId: INTEGRATION,
      basis: 'fixture: basis as stated by the integration',
      reference: null,
    },
    ...overrides,
  };
}

function envelopeBytes(result: unknown, extra: Record<string, unknown> = {}, space?: number): Buffer {
  return Buffer.from(
    JSON.stringify({ version: 1, integrationId: INTEGRATION, keyId: KEY_ID, signedAt: NOW.toISOString(), result, ...extra }, null, space),
  );
}

function push(
  body: Buffer | string,
  options: { signature?: string | null; integrationId?: string; keyId?: string; headers?: Record<string, string> } = {},
): Request {
  const bytes = typeof body === 'string' ? Buffer.from(body) : body;
  const signature =
    options.signature === undefined ? sign(null, bytes, PAIR.privateKey).toString('base64') : options.signature;
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    [INTENT_INGRESS_HEADERS.integrationId]: options.integrationId ?? INTEGRATION,
    [INTENT_INGRESS_HEADERS.keyId]: options.keyId ?? KEY_ID,
    ...(signature === null ? {} : { [INTENT_INGRESS_HEADERS.signature]: signature }),
    ...options.headers,
  };
  return new Request('http://localhost/api/intent-sources/push', { method: 'POST', headers, body: Uint8Array.from(bytes).buffer });
}

function recordingLogger(): Logger & { calls: { level: string; message: string; meta?: Record<string, unknown> }[] } {
  const calls: { level: string; message: string; meta?: Record<string, unknown> }[] = [];
  const record = (level: string) => (message: string, meta?: Record<string, unknown>) => {
    calls.push({ level, message, ...(meta === undefined ? {} : { meta }) });
  };
  return { calls, info: record('info'), warn: record('warn'), error: record('error') };
}

/** Fake P3 that applies the real OD-13 P3 + X1 check, then records the call. */
function checkingIntake(): IntentIngressIntake & { calls: { userId: string; input: RecordIntentIntakeInput }[] } {
  const calls: { userId: string; input: RecordIntentIntakeInput }[] = [];
  const fn = (async (userId: string, input: RecordIntentIntakeInput, now: Date) => {
    requireExactProviderResultForIntake(toIntentIntakeInput(input, now), input.providerAuthenticity, now);
    calls.push({ userId, input });
    return {};
  }) as IntentIngressIntake & { calls: typeof calls };
  fn.calls = calls;
  return fn;
}

function deps(intake: IntentIngressIntake, registrations = [registration()], logger = recordingLogger()) {
  return { registry: createIntentIntegrationRegistry(registrations), intake, logger, now: () => NOW };
}

async function bodyOf(response: Response): Promise<string> {
  return response.text();
}

describe('OD-13 push ingress — accepted path', () => {
  it('a valid signed FIRST_PARTY push reaches P2 and P3 (with the proof) and returns a generic 200', async () => {
    const intake = checkingIntake();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult())), deps(intake));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'accepted' });
    expect(intake.calls).toHaveLength(1);
    const [call] = intake.calls;
    expect(call!.input.providerAuthenticity).toBeDefined();
    expect(call!.input.companyName).toBe('Acme Co');
    expect(call!.input.signals.some((s) => s.kind === 'FIRST_PARTY')).toBe(true);
  });

  it('verifies the exact received bytes: a non-canonical (pretty-printed) signed body is accepted as sent', async () => {
    const intake = checkingIntake();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult(), {}, 2)), deps(intake));
    expect(response.status).toBe(200);
    expect(intake.calls).toHaveLength(1);
  });
});

describe('OD-13 push ingress — owner / search binding (IG-5)', () => {
  it('owner and search come from the registration of the verified integration, never from the request', async () => {
    const intake = checkingIntake();
    const other = keyPair();
    const registrations = [
      registration(),
      {
        integrationId: 'test-integration-0002',
        owner: { userId: 'other_user', searchId: 'other_search' },
        keys: [{ keyId: KEY_ID, publicKey: other.publicKey, validFrom: new Date(0), validUntil: null }],
      },
    ];
    const bytes = envelopeBytes(
      aiPlatformResult({
        authorization: { ...(aiPlatformResult().authorization as object), businessId: 'other_user' },
      }),
      { userId: 'attacker_user', searchId: 'attacker_search', owner: { userId: 'attacker_user' } },
    );
    const response = await handleIntentIngress(
      push(bytes, { headers: { 'x-acos-user-id': 'attacker_user', 'x-acos-search-id': 'attacker_search' } }),
      deps(intake, registrations),
    );

    expect(response.status).toBe(200);
    expect(intake.calls[0]!.userId).toBe(OWNER.userId);
    expect(intake.calls[0]!.input.searchId).toBe(OWNER.searchId);
  });

  it('a sender-asserted integrationId whose key is not registered cannot borrow another registration', async () => {
    const intake = checkingIntake();
    const response = await handleIntentIngress(
      push(envelopeBytes(aiPlatformResult()), { integrationId: 'unregistered-integration' }),
      deps(intake),
    );
    expect(response.status).toBe(401);
    expect(intake.calls).toHaveLength(0);
  });
});

describe('OD-13 push ingress — P1 refusals (401, before parsing)', () => {
  it('a bad signature over a body that is not even JSON is refused with 401, not 400: nothing was parsed', async () => {
    const intake = checkingIntake();
    const logger = recordingLogger();
    const response = await handleIntentIngress(push('not json {', { signature: 'A'.repeat(86) + '==' }), deps(intake, undefined, logger));

    expect(response.status).toBe(401);
    expect(await bodyOf(response)).toBe(JSON.stringify({ error: 'Invalid signature' }));
    expect(intake.calls).toHaveLength(0);
    expect(logger.calls[0]!.meta).toEqual({ externalId: null, field: 'signature', reason: 'invalid' });
  });

  it('one byte changed after signing is refused', async () => {
    const intake = checkingIntake();
    const bytes = envelopeBytes(aiPlatformResult());
    const signature = sign(null, bytes, PAIR.privateKey).toString('base64');
    const tampered = Buffer.concat([bytes, Buffer.from(' ')]);
    const response = await handleIntentIngress(push(tampered, { signature }), deps(intake));
    expect(response.status).toBe(401);
    expect(intake.calls).toHaveLength(0);
  });

  it.each([
    ['missing signature', { signature: null }],
    ['unknown key identifier', { keyId: 'unknown-key' }],
  ])('%s → 401 with the same generic body', async (_label, options) => {
    const intake = checkingIntake();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult()), options), deps(intake));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid signature' });
    expect(intake.calls).toHaveLength(0);
  });

  it('a stale signedAt (outside five minutes) is refused', async () => {
    const intake = checkingIntake();
    const stale = new Date(NOW.getTime() - 6 * 60 * 1000).toISOString();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult(), { signedAt: stale })), deps(intake));
    expect(response.status).toBe(401);
    expect(intake.calls).toHaveLength(0);
  });

  it('an oversized body is refused without being read in full', async () => {
    const intake = checkingIntake();
    const big = Buffer.alloc(MAX_PROVIDER_ENVELOPE_BYTES + 10, 0x20);
    const response = await handleIntentIngress(push(big), deps(intake));
    expect(response.status).toBe(401);
    expect(intake.calls).toHaveLength(0);
  });

  it('with the production registrations (empty) every push is refused: the ingress is not live', async () => {
    const intake = checkingIntake();
    expect(INTENT_INTEGRATION_REGISTRATIONS).toHaveLength(0);
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult())), deps(intake, [...INTENT_INTEGRATION_REGISTRATIONS]));
    expect(response.status).toBe(401);
    expect(intake.calls).toHaveLength(0);
  });
});

describe('OD-13 push ingress — validation (400) and unexpected errors (500)', () => {
  it('a P2 REJECTED result → generic 400; field / reason only in the log', async () => {
    const intake = checkingIntake();
    const logger = recordingLogger();
    const bytes = envelopeBytes(
      aiPlatformResult({ provenance: { integration: 'someone-else', retrieval: 'AUTHORIZED_INTEGRATION' } }),
    );
    const response = await handleIntentIngress(push(bytes), deps(intake, undefined, logger));

    expect(response.status).toBe(400);
    const text = await bodyOf(response);
    expect(text).toBe(JSON.stringify({ error: 'Unprocessable payload' }));
    expect(text).not.toContain('provenance');
    expect(intake.calls).toHaveLength(0);
    expect(Object.keys(logger.calls[0]!.meta!).sort()).toEqual(['externalId', 'field', 'reason']);
  });

  it('a result with no FIRST_PARTY / intent evidence is not saved → 400', async () => {
    const intake = checkingIntake();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult({ evidence: [] }))), deps(intake));
    expect(response.status).toBe(400);
    expect(intake.calls).toHaveLength(0);
  });

  it.each([
    ['IntentSignalValidationError (e.g. X1 result-mismatch)', new IntentSignalValidationError('signals', 'result-mismatch', 'x')],
    ['IntentIntakeSearchNotFoundError (ownership check)', new IntentIntakeSearchNotFoundError('registered_search')],
  ])('P3 %s → generic 400', async (_label, error) => {
    const intake = vi.fn(async () => {
      throw error;
    });
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult())), deps(intake));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Unprocessable payload' });
  });

  it('an unexpected P3 error → generic 500 with no internal detail', async () => {
    const intake = vi.fn(async () => {
      throw new Error('connection refused at 10.0.0.1');
    });
    const logger = recordingLogger();
    const response = await handleIntentIngress(push(envelopeBytes(aiPlatformResult())), deps(intake, undefined, logger));
    expect(response.status).toBe(500);
    const text = await bodyOf(response);
    expect(text).toBe(JSON.stringify({ error: 'Internal error' }));
    expect(JSON.stringify(logger.calls)).not.toContain('10.0.0.1');
  });
});

describe('intent integration registry', () => {
  it.each([
    ['duplicate integrationId', [registration(), registration()]],
    ['missing owner.userId', [registration({ owner: { userId: '', searchId: 's' } })]],
    ['missing owner.searchId', [registration({ owner: { userId: 'u', searchId: ' ' } })]],
    ['no keys', [registration({ keys: [] })]],
  ])('refuses a malformed registration: %s', (_label, registrations) => {
    expect(() => createIntentIntegrationRegistry(registrations)).toThrow(coreResearch.ProviderKeyRegistryConfigurationError);
  });

  it('C-1 stays in force: the legacy check is not re-exported from the package barrel', () => {
    expect('requireProviderAuthenticityForIntake' in coreResearch).toBe(false);
  });
});
