import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sourceContentSha256 } from './categoryPlausibilityPgRepository';
import {
  MODEL_SEEN_SOURCE,
  type CategoryPlausibilitySourceDocumentReader,
  type StoredCapturedSourceDocument,
} from './categoryPlausibilityRepository';
import { listSourceDocumentsForReview } from './sourceDocumentReview';

// Q-1 reviewer read path — unit conformance with fakes (see
// tests/integration/category-plausibility-source-review.integration.test.ts
// for the same boundary through the real route and PostgreSQL).

function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
  return {
    async createUser() {
      throw new Error('not used by these tests');
    },
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
  };
}

function sessionFor(rawToken: string, userId: string): Record<string, StoredSessionToken> {
  return {
    [hashAccessToken(rawToken)]: { userId, expiresAt: new Date(Date.now() + 60_000), revokedAt: null },
  };
}

const TEXT = 'Acme serves  restaurants — “exact” text ✓';

const STORED: StoredCapturedSourceDocument = {
  id: 'src_1',
  determinationId: 'det_1',
  searchId: 'search_1',
  prospectId: 'prospect_1',
  documentIndex: 0,
  label: 'Homepage',
  url: 'https://acme.example.com',
  text: TEXT,
  contentSha256: sourceContentSha256(TEXT),
  captureKind: MODEL_SEEN_SOURCE,
  extractionMethod: 'test-extraction',
  fetchedAt: new Date('2026-09-26T10:00:00.000Z'),
};

/** Owner-scoped like the pg reader: user_a owns det_1; everyone else sees []. Exposes only the read method. */
function fakeReader() {
  const list = vi.fn(async (userId: string, determinationId: string) =>
    userId === 'user_a' && determinationId === 'det_1' ? [STORED] : [],
  );
  const reader: CategoryPlausibilitySourceDocumentReader = { listSourceDocumentsByDeterminationId: list };
  return { reader, list };
}

function deps() {
  const { reader, list } = fakeReader();
  return {
    list,
    deps: {
      identity: fakeIdentity({ ...sessionFor('token-a', 'user_a'), ...sessionFor('token-b', 'user_b') }),
      categoryPlausibility: reader,
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe('listSourceDocumentsForReview (Q-1)', () => {
  it('Q1-T1/T2/T3: the authenticated owner gets the persisted documents exactly as stored, with traceability', async () => {
    const { deps: d, list } = deps();
    const docs = await listSourceDocumentsForReview(d, 'token-a', 'det_1');

    expect(docs).toEqual([STORED]);
    expect(docs[0]!.text).toBe(TEXT);
    expect(list).toHaveBeenCalledWith('user_a', 'det_1'); // userId resolved from the session, not the caller
  });

  it('Q1-T4: an unauthenticated caller is rejected before any read', async () => {
    const { deps: d, list } = deps();
    await expect(listSourceDocumentsForReview(d, undefined, 'det_1')).rejects.toBeInstanceOf(UnauthenticatedError);
    await expect(listSourceDocumentsForReview(d, 'not-a-session', 'det_1')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(list).not.toHaveBeenCalled();
  });

  it("Q1-T5: a different authenticated user gets none of the owner's documents", async () => {
    const { deps: d, list } = deps();
    expect(await listSourceDocumentsForReview(d, 'token-b', 'det_1')).toEqual([]);
    expect(list).toHaveBeenCalledWith('user_b', 'det_1');
  });

  it('Q1-T6: performs no network fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { deps: d } = deps();
    await listSourceDocumentsForReview(d, 'token-a', 'det_1');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('Q1-T8: a missing determination yields [] (same as unowned)', async () => {
    const { deps: d } = deps();
    expect(await listSourceDocumentsForReview(d, 'token-a', 'det_missing')).toEqual([]);
  });
});
