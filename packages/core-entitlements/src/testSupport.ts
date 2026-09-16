import type { Entitlement, GrantEntitlementInput, GrantResult } from './types';
import type { StoredAccessToken } from './accessToken';
import { normaliseEmail, type EntitlementRepository } from './repository';

/** In-memory repository enforcing the same unique key the database does. */
export function fakeRepository(
  seed: {
    entitlements?: Entitlement[];
    tokens?: Record<string, StoredAccessToken>;
  } = {},
): EntitlementRepository & { entitlements: Entitlement[]; lookups: string[] } {
  const entitlements = [...(seed.entitlements ?? [])];
  const tokens = { ...(seed.tokens ?? {}) };
  const lookups: string[] = [];

  return {
    entitlements,
    lookups,
    async grant(input: GrantEntitlementInput, now: Date): Promise<GrantResult> {
      const email = normaliseEmail(input.customerEmail);
      const existing = entitlements.find(
        (e) => e.customerEmail === email && e.productSlug === input.productSlug,
      );
      if (existing) return { outcome: 'already-held', entitlement: existing };
      const created: Entitlement = {
        id: `ent_${entitlements.length + 1}`,
        customerEmail: email,
        productSlug: input.productSlug,
        orderId: input.orderId,
        grantedAt: now,
        revokedAt: null,
      };
      entitlements.push(created);
      return { outcome: 'granted', entitlement: created };
    },
    async listActive(customerEmail: string) {
      return entitlements.filter(
        (e) => e.customerEmail === normaliseEmail(customerEmail) && e.revokedAt === null,
      );
    },
    async revoke(entitlementId: string, _reason: string, now: Date) {
      const found = entitlements.find((e) => e.id === entitlementId);
      if (!found || found.revokedAt) return false;
      found.revokedAt = now;
      return true;
    },
    async findAccessToken(tokenHash: string) {
      lookups.push(tokenHash);
      return tokens[tokenHash] ?? null;
    },
    async saveAccessToken({ tokenHash, customerEmail, expiresAt }) {
      tokens[tokenHash] = {
        customerEmail: normaliseEmail(customerEmail),
        expiresAt,
        revokedAt: null,
      };
    },
  };
}
