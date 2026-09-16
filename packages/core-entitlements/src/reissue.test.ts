import { describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_TTL_MS,
  authorizeDownload,
  hashAccessToken,
  REISSUE_ACKNOWLEDGEMENT,
  reissueAccessToken,
  resolveAccess,
  createDownloadGrant,
} from './index';
import { fakeRepository } from './testSupport';

// Losing a download link must not lose the purchase.
// -----------------------------------------------------------------------
// The shape of the bug: entitlements never expire (the table has
// revoked_at and no expiry, deliberately), but the access token that
// proves who you are lives 30 days and nothing could mint another. On day
// 31 a paying customer held an entitlement they could no longer reach.
//
// The credential expired and took the purchase with it, which is the
// wrong way round — so the fix adds a way to replace the credential and
// changes nothing about entitlements.
// -----------------------------------------------------------------------

const T0 = new Date('2026-06-01T12:00:00.000Z');
const at = (ms: number) => new Date(T0.getTime() + ms);
const DAY = 24 * 60 * 60 * 1000;

const BUYER = 'buyer@example.test';
const PRODUCT = 'ai_income_99';
const SECRET = 'download-grant-secret-not-real-0123456789abcdef';

/** A customer who has paid, holding a live token. */
function paidCustomer(email = BUYER) {
  const token = 'tok_initial_value';
  const repo = fakeRepository({
    entitlements: [
      {
        id: 'ent_1',
        customerEmail: email,
        productSlug: PRODUCT,
        orderId: 'o1',
        grantedAt: T0,
        revokedAt: null,
      },
    ],
    tokens: {
      [hashAccessToken(token)]: {
        customerEmail: email,
        expiresAt: at(ACCESS_TOKEN_TTL_MS),
        revokedAt: null,
      },
    },
  });
  return { repo, token };
}

const download = (email: string, now: Date) =>
  createDownloadGrant({ productId: PRODUCT, assetId: 'starter-prompt-library', customerEmail: email },
    SECRET, now);

describe('a valid grant', () => {
  it('opens the product for the customer who bought it', async () => {
    const { repo, token } = paidCustomer();
    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      grant: download(BUYER, T0),
      grantSecret: SECRET,
      now: at(60_000),
    });
    expect(verdict.allowed).toBe(true);
  });
});

describe('an expired credential', () => {
  it('stops opening the product', async () => {
    const { repo, token } = paidCustomer();
    const afterExpiry = at(ACCESS_TOKEN_TTL_MS + 1);

    const access = await resolveAccess(repo, token, afterExpiry);
    expect(access.granted).toBe(false);
    if (!access.granted) expect(access.reason).toBe('invalid-token');
  });

  it('does NOT revoke the entitlement — the purchase still exists', async () => {
    const { repo, token } = paidCustomer();
    const afterExpiry = at(ACCESS_TOKEN_TTL_MS + 1);

    await resolveAccess(repo, token, afterExpiry);

    // The requirement in one assertion: an expired grant is a lost key,
    // not a cancelled purchase.
    const held = await repo.listActive(BUYER);
    expect(held).toHaveLength(1);
    expect(held[0]!.revokedAt).toBeNull();
    expect(repo.entitlements[0]!.revokedAt).toBeNull();
  });

  it('an expired DOWNLOAD grant is rejected without touching entitlements', async () => {
    const { repo, token } = paidCustomer();
    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      grant: download(BUYER, T0),
      grantSecret: SECRET,
      now: at(60 * 60_000), // an hour later; the grant lives 10 minutes
    });
    expect(verdict.allowed).toBe(false);
    expect((await repo.listActive(BUYER))).toHaveLength(1);
  });
});

describe('a regenerated credential', () => {
  it('restores access after the old one expired', async () => {
    const { repo, token } = paidCustomer();
    const afterExpiry = at(ACCESS_TOKEN_TTL_MS + DAY);

    // Locked out...
    expect((await resolveAccess(repo, token, afterExpiry)).granted).toBe(false);

    // ...asks for a new link...
    const outcome = await reissueAccessToken(repo, BUYER, afterExpiry);
    expect(outcome.issued).toBe(true);
    if (!outcome.issued) return;

    // ...and is back in, with the same entitlement as before.
    const access = await resolveAccess(repo, outcome.token, afterExpiry);
    expect(access.granted).toBe(true);
    if (access.granted) {
      expect(access.context.customerEmail).toBe(BUYER);
      expect(access.context.purchased).toContain(PRODUCT);
    }
    expect(outcome.products).toContain(PRODUCT);
    expect(outcome.expiresAt.getTime()).toBe(afterExpiry.getTime() + ACCESS_TOKEN_TTL_MS);
  });

  it('leaves the previous token working, so another device is not logged out', async () => {
    const { repo, token } = paidCustomer();
    const soon = at(DAY);

    const outcome = await reissueAccessToken(repo, BUYER, soon);
    expect(outcome.issued).toBe(true);

    // Nothing about a re-issue implies the old link was compromised.
    expect((await resolveAccess(repo, token, soon)).granted).toBe(true);
  });

  it('stores only the hash — the plaintext reaches the caller and nowhere else', async () => {
    const { repo } = paidCustomer();
    const outcome = await reissueAccessToken(repo, BUYER, T0);
    expect(outcome.issued).toBe(true);
    if (!outcome.issued) return;

    // Looking the token up works, which means the HASH is what was kept.
    expect((await repo.findAccessToken(hashAccessToken(outcome.token))) !== null).toBe(true);
    // And the plaintext itself is not a key into the store.
    expect(await repo.findAccessToken(outcome.token)).toBeNull();
  });

  it('is high-entropy and different every time', async () => {
    const { repo } = paidCustomer();
    const a = await reissueAccessToken(repo, BUYER, T0);
    const b = await reissueAccessToken(repo, BUYER, T0);
    expect(a.issued && b.issued).toBe(true);
    if (!a.issued || !b.issued) return;
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(42); // 32 bytes base64url
  });
});

describe('an unpaid customer', () => {
  it('gets no credential', async () => {
    const repo = fakeRepository();
    const outcome = await reissueAccessToken(repo, 'never-paid@example.test', T0);
    expect(outcome).toEqual({ issued: false, reason: 'no-entitlement' });
  });

  it('gets no credential after a refund revokes the entitlement', async () => {
    const { repo } = paidCustomer();
    await repo.revoke('ent_1', 'refunded', at(DAY));

    const outcome = await reissueAccessToken(repo, BUYER, at(2 * DAY));
    expect(outcome).toEqual({ issued: false, reason: 'no-entitlement' });
  });

  it('a token issued BEFORE a refund stops opening the product', async () => {
    const { repo } = paidCustomer();
    const outcome = await reissueAccessToken(repo, BUYER, T0);
    expect(outcome.issued).toBe(true);
    if (!outcome.issued) return;

    await repo.revoke('ent_1', 'chargeback', at(DAY));

    // The token still identifies the person; the entitlement decides what
    // they may open, and it is re-read on every request.
    const access = await resolveAccess(repo, outcome.token, at(2 * DAY));
    if (access.granted) expect(access.context.purchased).not.toContain(PRODUCT);
  });

  it('refuses without revealing whether the address exists', async () => {
    const { repo } = paidCustomer();
    const unknown = await reissueAccessToken(repo, 'stranger@example.test', T0);
    const revokedRepo = fakeRepository();
    const alsoUnknown = await reissueAccessToken(revokedRepo, 'other@example.test', T0);

    // Byte-identical refusals: an attacker learns nothing by comparing.
    expect(unknown).toEqual(alsoUnknown);
    expect(JSON.stringify(unknown)).not.toContain('stranger@example.test');
    // And the response the caller must send says nothing either way.
    expect(REISSUE_ACKNOWLEDGEMENT.message).toMatch(/if that address has purchases/i);
    expect(REISSUE_ACKNOWLEDGEMENT.status).toBe(202);
  });

  it('rejects an unusable address before touching the repository', async () => {
    const repo = fakeRepository();
    for (const bad of ['', '   ', 'not-an-email', 'a@b', `${'x'.repeat(400)}@e.test`]) {
      expect(await reissueAccessToken(repo, bad, T0), bad).toEqual({
        issued: false,
        reason: 'invalid-email',
      });
    }
    expect(repo.lookups).toHaveLength(0);
  });
});

describe('the wrong customer', () => {
  it('cannot use a grant signed for somebody else', async () => {
    const { repo, token } = paidCustomer();
    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      // Signed, validly, for a different person.
      grant: download('someone-else@example.test', T0),
      grantSecret: SECRET,
      now: at(60_000),
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe('grant-wrong-customer');
  });

  it('cannot re-issue onto another address by asking for it', async () => {
    const { repo } = paidCustomer();
    // The buyer's entitlement does not make anybody else entitled.
    expect(await reissueAccessToken(repo, 'attacker@example.test', T0)).toEqual({
      issued: false,
      reason: 'no-entitlement',
    });
  });

  it('normalises case, so the same person is the same person', async () => {
    const { repo } = paidCustomer();
    const outcome = await reissueAccessToken(repo, '  BUYER@Example.TEST  ', T0);
    expect(outcome.issued).toBe(true);
    if (outcome.issued) expect(outcome.customerEmail).toBe(BUYER);
  });
});

describe('a tampered grant', () => {
  it('is rejected when the signature is altered', async () => {
    const { repo, token } = paidCustomer();
    const grant = download(BUYER, T0);
    const tampered = `${grant.slice(0, -1)}${grant.endsWith('A') ? 'B' : 'A'}`;

    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      grant: tampered,
      grantSecret: SECRET,
      now: at(60_000),
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe('grant-bad-signature');
  });

  it('is rejected when the claims are rewritten to extend the expiry', async () => {
    const { repo, token } = paidCustomer();
    const grant = download(BUYER, T0);
    const [body, signature] = grant.split('.');
    const claims = JSON.parse(Buffer.from(body!, 'base64url').toString('utf8')) as {
      expiresAt: number;
    };
    claims.expiresAt = T0.getTime() + 365 * DAY;
    const forged = `${Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url')}.${signature}`;

    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      grant: forged,
      grantSecret: SECRET,
      now: at(60_000),
    });
    // The signature covers the claims, so editing them breaks it.
    expect(verdict.allowed).toBe(false);
  });

  it('cannot be signed without the server secret', async () => {
    const { repo, token } = paidCustomer();
    const forged = createDownloadGrant(
      { productId: PRODUCT, assetId: 'starter-prompt-library', customerEmail: BUYER },
      'a-secret-the-attacker-guessed-wrong-0123456789',
      T0,
    );

    const verdict = await authorizeDownload({
      repository: repo,
      accessToken: token,
      productId: PRODUCT,
      assetId: 'starter-prompt-library',
      grant: forged,
      grantSecret: SECRET,
      now: at(60_000),
    });
    expect(verdict.allowed).toBe(false);
    if (!verdict.allowed) expect(verdict.reason).toBe('grant-bad-signature');
  });
});
