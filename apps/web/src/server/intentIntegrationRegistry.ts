import {
  createProviderPublicKeyRegistry,
  ProviderKeyRegistryConfigurationError,
  type ProviderPublicKeyEntry,
  type ProviderPublicKeyRegistry,
} from '@acos/core-research';

// Intent-source integration registration (INTENT-INTAKE-OD13-INGRESS-DEC-001
// IG-5, IG-6; OD-13 Q3).
// -----------------------------------------------------------------------
// One registration per NAMED integration binds, in server configuration:
//   - its Ed25519 PUBLIC key(s)       (Q3 b — handed to the unchanged
//                                      createProviderPublicKeyRegistry)
//   - exactly one owner userId and one searchId owned by that user (IG-5)
//
// The owner / search are looked up ONLY by the integration identity that
// verifyProviderEnvelope has already verified. Nothing in the request —
// headers, body, businessId, business name / website, or a sender-asserted
// integrationId — ever selects them.
//
// Enablement (IG-6): an integration is enabled only while its registration
// exists here. Removing the registration removes its keys and its binding
// together (Q3 e).
// -----------------------------------------------------------------------

export interface IntentIntegrationOwner {
  /** Trusted system user the integration's results are saved for. */
  readonly userId: string;
  /** A Search owned by `userId`; P3 re-checks that ownership before saving. */
  readonly searchId: string;
}

export interface IntentIntegrationRegistration {
  integrationId: string;
  owner: IntentIntegrationOwner;
  /** At least one key; more than one may be valid during rotation (Q3 d). */
  keys: readonly Omit<ProviderPublicKeyEntry, 'integrationId'>[];
}

export interface IntentIntegrationRegistry {
  /** Key registry for verifyProviderEnvelope (P1). */
  readonly keys: ProviderPublicKeyRegistry;
  /** Owner / search for an integration identity AFTER verification; null when not registered. */
  ownerOf(verifiedIntegrationId: string): IntentIntegrationOwner | null;
}

const MAX_IDENTIFIER_LENGTH = 200;

function configText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value !== value.trim() || value.length > MAX_IDENTIFIER_LENGTH) {
    throw new ProviderKeyRegistryConfigurationError(`${field} must be a non-blank, trimmed identifier of at most 200 characters`);
  }
  return value;
}

/**
 * Builds the registry from server-side registrations. Configuration
 * boundary only: reads no environment, fetches nothing, persists nothing.
 * A malformed registration is a configuration fault and throws.
 */
export function createIntentIntegrationRegistry(
  registrations: readonly IntentIntegrationRegistration[],
): IntentIntegrationRegistry {
  const owners = new Map<string, IntentIntegrationOwner>();
  const keyEntries: ProviderPublicKeyEntry[] = [];
  registrations.forEach((registration, index) => {
    const path = `registrations[${index}]`;
    const integrationId = configText(registration.integrationId, `${path}.integrationId`);
    if (owners.has(integrationId)) {
      throw new ProviderKeyRegistryConfigurationError(`${path} duplicates integrationId`);
    }
    const owner = Object.freeze({
      userId: configText(registration.owner?.userId, `${path}.owner.userId`),
      searchId: configText(registration.owner?.searchId, `${path}.owner.searchId`),
    });
    if (!Array.isArray(registration.keys) || registration.keys.length === 0) {
      throw new ProviderKeyRegistryConfigurationError(`${path}.keys must register at least one public key`);
    }
    for (const key of registration.keys) keyEntries.push({ ...key, integrationId });
    owners.set(integrationId, owner);
  });
  const keys = createProviderPublicKeyRegistry(keyEntries);
  return Object.freeze({
    keys,
    ownerOf: (verifiedIntegrationId: string) => owners.get(verifiedIntegrationId) ?? null,
  });
}

/**
 * The server's registrations. EMPTY: no integration is named, no public key
 * is registered and no owner is bound (OD-13 §13.6 item 2). With no entry,
 * every push is refused at P1, so the ingress is not live for any
 * integration. Adding an entry requires separate Product Owner
 * authorization for naming the integration and registering its key.
 */
export const INTENT_INTEGRATION_REGISTRATIONS: readonly IntentIntegrationRegistration[] = Object.freeze([]);
