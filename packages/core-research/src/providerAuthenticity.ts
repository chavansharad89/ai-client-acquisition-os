import { createPublicKey, verify as verifySignature, type KeyObject } from 'node:crypto';

import { IntentSignalValidationError, type IntentSignalValidationReason } from './intentSignal';

// Inbound provider authenticity — OD-13 Option B
// (INTENT-INTAKE-OD13-AUTHENTICITY-DEC-001 §13; IA-OD13-B).
// -----------------------------------------------------------------------
//   P1  verifyProviderEnvelope      Ed25519 over the EXACT received bytes,
//                                   before any parsing; then the signed
//                                   envelope (version, integrationId,
//                                   keyId, signedAt ±5 min) is checked
//   P2  normalizeVerifiedProviderResult (intentSourceProviderContract)
//                                   parses the result from the verified
//                                   bytes and binds the verified identity
//                                   to provenance / authorization
//   P3  requireProviderAuthenticityForIntake (recordIntentIntakeForOwner)
//                                   re-verifies the signature before any
//                                   FIRST_PARTY signal is saved; then
//                                   requireExactProviderResultForIntake
//                                   (intentSourceProviderContract) binds the
//                                   signals to the exact verified result (X1)
//
// Public keys only: nothing here can sign. Keys are supplied by the
// caller through createProviderPublicKeyRegistry — never fetched, never
// read from the database. No provider call, no network, no retry. Nothing
// here is persisted: the signature, raw bytes and verification outcome
// live only in memory for the life of the VerifiedProviderResult.
//
// Every failure is a REJECTED outcome carrying field + reason only; the
// messages are fixed text and never echo the signature, body or any
// value read from it. Failures never throw and never halt the integration
// (Q8) — AUTHENTICATION_FAILED keeps its outbound-only meaning.
//
// OD-13 runtime gate: building this does not wire any caller. No runtime
// caller may feed FIRST_PARTY results into saving until an integration is
// named, its key registered and runtime wiring authorized separately.
// -----------------------------------------------------------------------

/** The only envelope version accepted (Q10). The in-process contract stays unversioned (OD-9). */
export const PROVIDER_ENVELOPE_VERSION = 1;

/** Q5: signedAt must be within this many ms before or after receipt. */
export const PROVIDER_SIGNATURE_FRESHNESS_MS = 5 * 60 * 1000;

/** Bounded body size; larger bodies are refused before any verification work. */
export const MAX_PROVIDER_ENVELOPE_BYTES = 1_048_576; // 1 MiB

const MAX_IDENTIFIER_LENGTH = 200;
/** Base64 of a 64-byte Ed25519 signature. */
const ED25519_SIGNATURE_BASE64 = /^[A-Za-z0-9+/]{86}==$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
/** Provider-contract fields carried as ISO instants on the wire and as Date in process. */
const DATE_KEYS: readonly string[] = ['capturedAt', 'observedAt', 'publishedAt', 'authorizedAt'];

// ---- Key registry boundary -------------------------------------------------

/** Raised for a malformed registry entry — a configuration fault, never attacker input. */
export class ProviderKeyRegistryConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderKeyRegistryConfigurationError';
  }
}

export interface ProviderPublicKeyEntry {
  integrationId: string;
  keyId: string;
  /** Ed25519 PUBLIC key: a KeyObject or SPKI PEM. Private keys are refused. */
  publicKey: KeyObject | string;
  /** Signatures by this key are accepted from this instant (inclusive). */
  validFrom: Date;
  /** Signatures by this key are refused from this instant; null = no end. */
  validUntil: Date | null;
}

export interface RegisteredProviderPublicKey {
  readonly integrationId: string;
  readonly keyId: string;
  readonly publicKey: KeyObject;
  readonly validFrom: Date;
  readonly validUntil: Date | null;
}

/** Read-only lookup of registered public keys. More than one key per integration may be valid (Q3 d). */
export interface ProviderPublicKeyRegistry {
  find(integrationId: string, keyId: string): RegisteredProviderPublicKey | null;
}

function configText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value !== value.trim() || value.length > MAX_IDENTIFIER_LENGTH) {
    throw new ProviderKeyRegistryConfigurationError(`${field} must be a non-blank, trimmed identifier of at most 200 characters`);
  }
  return value;
}

function configDate(value: unknown, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new ProviderKeyRegistryConfigurationError(`${field} must be a valid Date`);
  }
  return new Date(value.getTime());
}

function toEd25519PublicKey(value: unknown, field: string): KeyObject {
  let key: KeyObject;
  try {
    key = typeof value === 'string' ? createPublicKey(value) : (value as KeyObject);
  } catch {
    throw new ProviderKeyRegistryConfigurationError(`${field} is not a readable public key`);
  }
  if (typeof key !== 'object' || key === null || key.type !== 'public') {
    throw new ProviderKeyRegistryConfigurationError(`${field} must be a public key — private keys are never held for integration payloads`);
  }
  if (key.asymmetricKeyType !== 'ed25519') {
    throw new ProviderKeyRegistryConfigurationError(`${field} must be an Ed25519 key`);
  }
  return key;
}

/**
 * Builds the in-memory registry from caller-supplied entries. This is the
 * configuration boundary only: it registers no real integration, reads no
 * environment, fetches nothing and persists nothing.
 */
export function createProviderPublicKeyRegistry(entries: readonly ProviderPublicKeyEntry[]): ProviderPublicKeyRegistry {
  const keys = new Map<string, RegisteredProviderPublicKey>();
  entries.forEach((entry, index) => {
    const path = `keys[${index}]`;
    const integrationId = configText(entry.integrationId, `${path}.integrationId`);
    const keyId = configText(entry.keyId, `${path}.keyId`);
    const validFrom = configDate(entry.validFrom, `${path}.validFrom`);
    const validUntil = entry.validUntil === null ? null : configDate(entry.validUntil, `${path}.validUntil`);
    if (validUntil !== null && validUntil.getTime() <= validFrom.getTime()) {
      throw new ProviderKeyRegistryConfigurationError(`${path}.validUntil must be after validFrom`);
    }
    const mapKey = JSON.stringify([integrationId, keyId]);
    if (keys.has(mapKey)) throw new ProviderKeyRegistryConfigurationError(`${path} duplicates an integrationId / keyId pair`);
    keys.set(
      mapKey,
      Object.freeze({ integrationId, keyId, publicKey: toEd25519PublicKey(entry.publicKey, `${path}.publicKey`), validFrom, validUntil }),
    );
  });
  return Object.freeze({
    find: (integrationId: string, keyId: string) => keys.get(JSON.stringify([integrationId, keyId])) ?? null,
  });
}

// ---- Verified-result boundary ----------------------------------------------

/** Brand. Not exported, so no other module can forge the marker. */
declare const VERIFIED_PROVIDER_RESULT: unique symbol;

/**
 * Proof that a pushed provider result passed Option B verification.
 * Producible only by verifyProviderEnvelope: the brand is unforgeable at
 * the type level and every check also confirms, at run time, that the
 * object was issued here. The fields are informational; every decision
 * uses the verifier's private copy.
 */
export interface VerifiedProviderResult {
  readonly [VERIFIED_PROVIDER_RESULT]: true;
  readonly integrationId: string;
  readonly keyId: string;
  readonly signedAt: Date;
  readonly receivedAt: Date;
}

interface VerifiedState {
  registry: ProviderPublicKeyRegistry;
  integrationId: string;
  keyId: string;
  /** Private copy of the exact bytes the signature covers. */
  body: Uint8Array;
  signature: Buffer;
  /** Receipt instant of the verification; the X1 re-derivation runs at this time (Q-X4). */
  receivedAt: Date;
}

/** In memory only; never persisted (Q9). */
const ISSUED = new WeakMap<object, VerifiedState>();

/** Same shape as a provider-contract REJECTED outcome; nothing was parsed, so externalId is null. */
export interface ProviderAuthenticityRejection {
  status: 'REJECTED';
  externalId: null;
  field: string;
  reason: IntentSignalValidationReason;
  message: string;
}

export type ProviderEnvelopeVerification =
  | { ok: true; verified: VerifiedProviderResult }
  | { ok: false; rejection: ProviderAuthenticityRejection };

export interface ProviderEnvelopeRequest {
  /** The RAW pushed body. Never a parsed object, never re-serialised. */
  rawBody: Uint8Array;
  /** Transport claim used to select the key; must equal the signed envelope's integrationId. */
  integrationId: string | null | undefined;
  /** Transport claim used to select the key; must equal the signed envelope's keyId. */
  keyId: string | null | undefined;
  /** Base64 Ed25519 signature over rawBody. */
  signature: string | null | undefined;
}

function refusal(field: string, reason: IntentSignalValidationReason, message: string): { ok: false; rejection: ProviderAuthenticityRejection } {
  return { ok: false, rejection: { status: 'REJECTED', externalId: null, field, reason, message } };
}

function claimText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_IDENTIFIER_LENGTH;
}

function validDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Key lookup, validity window and Ed25519 check. Never throws. Returns null on success. */
function checkSignature(
  registry: ProviderPublicKeyRegistry,
  integrationId: string,
  keyId: string,
  body: Uint8Array,
  signature: Buffer,
  at: Date,
): { ok: false; rejection: ProviderAuthenticityRejection } | null {
  let key: RegisteredProviderPublicKey | null;
  try {
    key = registry.find(integrationId, keyId);
  } catch {
    key = null;
  }
  if (key === null) return refusal('keyId', 'not-allowed', 'no registered public key for this integration and key identifier');
  if (at.getTime() < key.validFrom.getTime() || (key.validUntil !== null && at.getTime() >= key.validUntil.getTime())) {
    return refusal('keyId', 'not-allowed', 'the public key is outside its validity window');
  }
  let valid = false;
  try {
    valid = verifySignature(null, body, key.publicKey, signature);
  } catch {
    valid = false;
  }
  return valid ? null : refusal('signature', 'invalid', 'the signature does not verify against the registered public key');
}

function reviveDates(key: string, value: unknown): unknown {
  if (DATE_KEYS.includes(key) && typeof value === 'string' && ISO_INSTANT.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  }
  return value;
}

function parseBody(body: Uint8Array, reviver?: (key: string, value: unknown) => unknown): unknown {
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body), reviver);
}

/**
 * P1: the only door for a pushed provider result. Verifies the Ed25519
 * signature over the exact received bytes BEFORE parsing, then checks the
 * signed envelope. Never throws on request input.
 */
export function verifyProviderEnvelope(
  request: ProviderEnvelopeRequest,
  options: { registry: ProviderPublicKeyRegistry; receivedAt?: Date },
): ProviderEnvelopeVerification {
  const receivedAt = options.receivedAt ?? new Date();
  const rawBody = (request as Partial<ProviderEnvelopeRequest> | null)?.rawBody;
  if (!(rawBody instanceof Uint8Array) || rawBody.byteLength === 0) {
    return refusal('body', 'required', 'a non-empty raw body is required');
  }
  if (rawBody.byteLength > MAX_PROVIDER_ENVELOPE_BYTES) return refusal('body', 'too-long', 'the body exceeds the size limit');
  if (!claimText(request.integrationId)) return refusal('integrationId', 'required', 'an integration identifier is required');
  if (!claimText(request.keyId)) return refusal('keyId', 'required', 'a key identifier is required');
  if (typeof request.signature !== 'string' || request.signature.length === 0) {
    return refusal('signature', 'required', 'a signature is required');
  }
  if (!ED25519_SIGNATURE_BASE64.test(request.signature)) return refusal('signature', 'invalid', 'the signature is not a base64 Ed25519 signature');

  // Copy first: the caller keeps no handle on the bytes that were verified.
  const body = Uint8Array.from(rawBody);
  const signature = Buffer.from(request.signature, 'base64');
  const integrationId = request.integrationId;
  const keyId = request.keyId;
  const failed = checkSignature(options.registry, integrationId, keyId, body, signature, receivedAt);
  if (failed) return failed;

  // Signature verified — only now is the body parsed.
  let envelope: Record<string, unknown>;
  try {
    const parsed = parseBody(body);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object');
    envelope = parsed as Record<string, unknown>;
  } catch {
    return refusal('envelope', 'invalid', 'the signed body is not a JSON envelope object');
  }
  if (envelope.version !== PROVIDER_ENVELOPE_VERSION) return refusal('envelope.version', 'unsupported', 'unknown envelope version');
  if (envelope.integrationId !== integrationId) {
    return refusal('envelope.integrationId', 'invalid', 'the signed integration identifier does not match the transport claim');
  }
  if (envelope.keyId !== keyId) return refusal('envelope.keyId', 'invalid', 'the signed key identifier does not match the transport claim');
  const signedAt = typeof envelope.signedAt === 'string' && ISO_INSTANT.test(envelope.signedAt) ? new Date(envelope.signedAt) : null;
  if (!validDate(signedAt)) return refusal('envelope.signedAt', 'invalid', 'signedAt must be an ISO-8601 UTC instant');
  if (Math.abs(receivedAt.getTime() - signedAt.getTime()) > PROVIDER_SIGNATURE_FRESHNESS_MS) {
    return refusal('envelope.signedAt', 'invalid', 'signedAt is outside the five-minute freshness window');
  }
  if (typeof envelope.result !== 'object' || envelope.result === null || Array.isArray(envelope.result)) {
    return refusal('envelope.result', 'required', 'the envelope carries no provider result object');
  }

  const verified = Object.freeze({
    integrationId,
    keyId,
    signedAt,
    receivedAt: new Date(receivedAt.getTime()),
  }) as unknown as VerifiedProviderResult;
  ISSUED.set(verified, {
    registry: options.registry,
    integrationId,
    keyId,
    body,
    signature,
    receivedAt: new Date(receivedAt.getTime()),
  });
  return { ok: true, verified };
}

/**
 * P2 / P3 support: the verified identity, the receipt instant and a FRESH
 * parse of the provider result from the verified bytes (Dates revived), or
 * null when `value` was not issued by verifyProviderEnvelope. Parsing
 * afresh each time means a caller can never alter what was verified.
 */
export function openVerifiedProviderResult(
  value: unknown,
): { integrationId: string; receivedAt: Date; result: unknown } | null {
  const state = typeof value === 'object' && value !== null ? ISSUED.get(value) : undefined;
  if (state === undefined) return null;
  const envelope = parseBody(state.body, reviveDates) as { result: unknown };
  return { integrationId: state.integrationId, receivedAt: new Date(state.receivedAt.getTime()), result: envelope.result };
}

function authenticityError(field: string, reason: IntentSignalValidationReason, message: string): never {
  throw new IntentSignalValidationError(field, reason, message);
}

/**
 * P3 (save boundary): before any FIRST_PARTY signal is written, the
 * caller must present the VerifiedProviderResult it came from. The
 * signature is verified again over the verifier's private copy of the
 * bytes, against the key as registered NOW (a removed or expired key
 * stops acceptance from that moment, Q3 e), and every FIRST_PARTY
 * signal's integrationId must equal the verified identity. Freshness is a
 * receipt-time rule and was enforced at P1. Events with no FIRST_PARTY
 * signal are outside this requirement (Q12). Throws
 * IntentSignalValidationError — the whole event is refused before any write.
 */
export function requireProviderAuthenticityForIntake(
  signals: readonly { kind: string; authorizationEvidence?: { integrationId: string } | undefined }[],
  proof: unknown,
  now: Date,
): void {
  if (!signals.some((signal) => signal.kind === 'FIRST_PARTY')) return;
  const state = typeof proof === 'object' && proof !== null ? ISSUED.get(proof) : undefined;
  if (state === undefined) {
    authenticityError('providerAuthenticity', 'required', 'FIRST_PARTY signals require a verified provider result (OD-13)');
  }
  const failed = checkSignature(state.registry, state.integrationId, state.keyId, state.body, state.signature, now);
  if (failed) {
    authenticityError(`providerAuthenticity.${failed.rejection.field}`, failed.rejection.reason, failed.rejection.message);
  }
  signals.forEach((signal, index) => {
    if (signal.kind !== 'FIRST_PARTY') return;
    if (signal.authorizationEvidence?.integrationId !== state.integrationId) {
      authenticityError(
        `signals[${index}].authorizationEvidence.integrationId`,
        'invalid',
        'the FIRST_PARTY integrationId must equal the verified integration identity',
      );
    }
  });
}
