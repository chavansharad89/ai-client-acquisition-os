import {
  IntentSignalValidationError,
  MAX_PROVIDER_ENVELOPE_BYTES,
  normalizeVerifiedProviderResult,
  verifyProviderEnvelope,
  type RecordIntentIntakeInput,
} from '@acos/core-research';
import type { Logger } from '@acos/observability';
import { IntentIntakeSearchNotFoundError } from '@acos/worker/searchWorker';

import type { IntentIntegrationRegistry } from './intentIntegrationRegistry';

// OD-13 push ingress (INTENT-INTAKE-OD13-INGRESS-DEC-001, Alternative I).
// -----------------------------------------------------------------------
// One request, one process:
//
//   1. read the RAW body, capped at MAX_PROVIDER_ENVELOPE_BYTES — never
//      request.json(): the signature covers the exact received bytes (Q10).
//   2. P1 verifyProviderEnvelope — signature before parsing (Option B).
//   3. owner / search from the registration of the VERIFIED integration
//      identity only (IG-5).
//   4. P2 normalizeVerifiedProviderResult.
//   5. P3 recordIntentIntakeForOwner (X1 re-derivation, OD-8 transaction).
//
// The VerifiedProviderResult proof is process-local (WeakMap), so all
// five steps run in this request. Nothing from the request is persisted
// before P3 and no signature or payload is ever retained (Q9).
//
// IG-4 responses are generic; field / reason go only to the redacted
// Logger (OD-11), never to the caller. No rejection table. No retry
// (OD-12).
// -----------------------------------------------------------------------

/** Transport headers carrying the key-selection claims and the signature (Q10). */
export const INTENT_INGRESS_HEADERS = Object.freeze({
  integrationId: 'x-acos-integration-id',
  keyId: 'x-acos-key-id',
  signature: 'x-acos-signature',
});

/** P3, bound by the caller to the canonical recordIntentIntakeForOwner. */
export type IntentIngressIntake = (userId: string, input: RecordIntentIntakeInput, now: Date) => Promise<unknown>;

export interface IntentIngressDeps {
  registry: IntentIntegrationRegistry;
  intake: IntentIngressIntake;
  logger: Logger;
  now?: () => Date;
}

const ACCEPTED = { status: 'accepted' } as const;
const INVALID_SIGNATURE = { error: 'Invalid signature' } as const;
const UNPROCESSABLE = { error: 'Unprocessable payload' } as const;
const INTERNAL_ERROR = { error: 'Internal error' } as const;

function json(body: object, status: number): Response {
  return Response.json(body, { status });
}

/**
 * Reads at most `limit + 1` bytes of the request body without parsing.
 * Returns null when the body is larger than `limit`; the verifier then
 * refuses it as too long.
 */
async function readRawBody(request: Request, limit: number): Promise<Uint8Array | null> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (request.body === null) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function handleIntentIngress(request: Request, deps: IntentIngressDeps): Promise<Response> {
  const receivedAt = (deps.now ?? (() => new Date()))();
  try {
    const read = await readRawBody(request, MAX_PROVIDER_ENVELOPE_BYTES);
    // An oversized body is handed on as one byte over the limit, so the
    // verifier's own size rule refuses it; the excess is never read.
    const rawBody = read ?? new Uint8Array(MAX_PROVIDER_ENVELOPE_BYTES + 1);

    const verification = verifyProviderEnvelope(
      {
        rawBody,
        integrationId: request.headers.get(INTENT_INGRESS_HEADERS.integrationId),
        keyId: request.headers.get(INTENT_INGRESS_HEADERS.keyId),
        signature: request.headers.get(INTENT_INGRESS_HEADERS.signature),
      },
      { registry: deps.registry.keys, receivedAt },
    );
    if (!verification.ok) {
      const { externalId, field, reason } = verification.rejection;
      deps.logger.warn('intent ingress: push refused at P1', { externalId, field, reason });
      return json(INVALID_SIGNATURE, 401);
    }

    // IG-5: only the verified identity selects the owner / search.
    const owner = deps.registry.ownerOf(verification.verified.integrationId);
    if (owner === null) {
      deps.logger.warn('intent ingress: push refused at P1', { externalId: null, field: 'integrationId', reason: 'not-allowed' });
      return json(INVALID_SIGNATURE, 401);
    }

    const outcome = normalizeVerifiedProviderResult(verification.verified, { searchId: owner.searchId, now: receivedAt });
    if (outcome.status !== 'NORMALIZED') {
      const meta =
        outcome.status === 'REJECTED'
          ? { externalId: outcome.externalId, field: outcome.field, reason: outcome.reason }
          : { externalId: outcome.externalId, field: null, reason: outcome.status };
      deps.logger.warn('intent ingress: result not saved at P2', meta);
      return json(UNPROCESSABLE, 400);
    }

    try {
      await deps.intake(owner.userId, outcome.event.intake, receivedAt);
    } catch (error) {
      if (error instanceof IntentSignalValidationError) {
        deps.logger.warn('intent ingress: result not saved at P3', {
          externalId: outcome.externalId,
          field: error.field,
          reason: error.reason,
        });
        return json(UNPROCESSABLE, 400);
      }
      if (error instanceof IntentIntakeSearchNotFoundError) {
        deps.logger.warn('intent ingress: result not saved at P3', {
          externalId: outcome.externalId,
          field: 'searchId',
          reason: 'not-found',
        });
        return json(UNPROCESSABLE, 400);
      }
      throw error;
    }
    return json(ACCEPTED, 200);
  } catch (error) {
    deps.logger.error('intent ingress: unexpected error', { errorName: error instanceof Error ? error.name : 'unknown' });
    return json(INTERNAL_ERROR, 500);
  }
}
