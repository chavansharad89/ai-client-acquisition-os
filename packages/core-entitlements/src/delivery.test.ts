import { describe, expect, it } from 'vitest';

import { deliverablesFor, findDeliverable, PRODUCT_LADDER } from '@acos/catalog';

import { hashAccessToken } from './accessToken';
import { authorizeDownload, denialResponse } from './delivery';
import { createDownloadGrant, DOWNLOAD_GRANT_TTL_MS, verifyDownloadGrant } from './downloadGrant';
import { fakeRepository } from './testSupport';
import type { Entitlement } from './types';

const NOW = new Date('2026-05-01T00:00:00.000Z');
const EMAIL = 'buyer@example.com';
const SECRET = 'download-signing-secret';
const STARTER = 'ai_income_99';
const SYSTEM = 'ai_client_acquisition_1499';
const ASSET = 'starter-prompt-library';

const entitlement = (productSlug: string, over: Partial<Entitlement> = {}): Entitlement => ({
  id: `ent_${productSlug}`,
  customerEmail: EMAIL,
  productSlug: productSlug as never,
  orderId: 'order_1',
  grantedAt: NOW,
  revokedAt: null,
  ...over,
});

function repo(entitlements: Entitlement[] = [], token = 'session') {
  return fakeRepository({
    entitlements,
    tokens: {
      [hashAccessToken(token)]: {
        customerEmail: EMAIL,
        expiresAt: new Date(NOW.getTime() + 86_400_000),
        revokedAt: null,
      },
    },
  });
}

const grantFor = (productId = STARTER, assetId = ASSET, email = EMAIL) =>
  createDownloadGrant(
    { productId: productId as never, assetId, customerEmail: email },
    SECRET,
    NOW,
  );

const authorize = (over: Partial<Parameters<typeof authorizeDownload>[0]> = {}) =>
  authorizeDownload({
    repository: repo([entitlement(STARTER)]),
    accessToken: 'session',
    grant: grantFor(),
    productId: STARTER as never,
    assetId: ASSET,
    grantSecret: SECRET,
    now: NOW,
    ...over,
  });

describe('a download needs a real session', () => {
  it('is refused with no cookie, even with a perfectly valid link', async () => {
    expect(await authorize({ accessToken: undefined })).toEqual({
      allowed: false,
      reason: 'no-session',
    });
  });

  it('is refused with an unrecognised cookie', async () => {
    expect(await authorize({ accessToken: 'forged' })).toMatchObject({
      allowed: false,
      reason: 'invalid-session',
    });
  });

  it('identity is checked before the link is even parsed', async () => {
    // A stranger holding a leaked URL never reaches grant verification.
    const result = await authorize({ accessToken: undefined, grant: 'garbage' });
    expect(result).toMatchObject({ reason: 'no-session' });
  });
});

describe('a download needs an entitlement', () => {
  it('is refused for a product the customer has not bought', async () => {
    const result = await authorizeDownload({
      repository: repo([entitlement(STARTER)]),
      accessToken: 'session',
      grant: grantFor(SYSTEM, 'system-walkthrough'),
      productId: SYSTEM as never,
      assetId: 'system-walkthrough',
      grantSecret: SECRET,
      now: NOW,
    });
    expect(result).toMatchObject({ allowed: false, reason: 'not-entitled' });
  });

  it('is allowed for a lower kit granted by ladder implication', async () => {
    const result = await authorizeDownload({
      repository: repo([entitlement(SYSTEM)]),
      accessToken: 'session',
      grant: grantFor(STARTER, ASSET),
      productId: STARTER as never,
      assetId: ASSET,
      grantSecret: SECRET,
      now: NOW,
    });
    expect(result.allowed).toBe(true);
  });

  it('is refused once the entitlement is revoked', async () => {
    const result = await authorize({
      repository: repo([entitlement(STARTER, { revokedAt: NOW })]),
    });
    expect(result).toMatchObject({ allowed: false, reason: 'not-entitled' });
  });
});

describe('the signed link', () => {
  it('allows the legitimate case', async () => {
    const result = await authorize();
    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.asset.storageKey).toBe('ai_income_99/prompt-library.pdf');
  });

  it('is refused when tampered with', async () => {
    const tampered = `${grantFor().slice(0, -3)}aaa`;
    expect(await authorize({ grant: tampered })).toMatchObject({
      allowed: false,
      reason: 'grant-bad-signature',
    });
  });

  it('is refused when signed with a different secret', async () => {
    const foreign = createDownloadGrant(
      { productId: STARTER as never, assetId: ASSET, customerEmail: EMAIL },
      'someone-elses-secret',
      NOW,
    );
    expect(await authorize({ grant: foreign })).toMatchObject({ reason: 'grant-bad-signature' });
  });

  it('expires', async () => {
    const later = new Date(NOW.getTime() + DOWNLOAD_GRANT_TTL_MS + 1);
    expect(await authorize({ now: later })).toMatchObject({
      allowed: false,
      reason: 'grant-expired',
    });
  });

  it('is still valid one millisecond before expiry', async () => {
    const justBefore = new Date(NOW.getTime() + DOWNLOAD_GRANT_TTL_MS - 1);
    expect((await authorize({ now: justBefore })).allowed).toBe(true);
  });

  it('cannot be used by a different customer', async () => {
    const someoneElses = grantFor(STARTER, ASSET, 'other@example.com');
    expect(await authorize({ grant: someoneElses })).toMatchObject({
      reason: 'grant-wrong-customer',
    });
  });

  it('cannot be repointed at another asset', async () => {
    // The grant names the starter prompt library; the URL asks for the
    // pricing sheet. Entitlement is fine — the link is not.
    expect(await authorize({ assetId: 'starter-pricing-sheet' })).toMatchObject({
      allowed: false,
      reason: 'grant-bad-signature',
    });
  });

  it('is refused when absent entirely', async () => {
    expect(await authorize({ grant: null })).toMatchObject({ reason: 'grant-malformed' });
  });
});

describe('asset resolution cannot be steered by the request', () => {
  it('rejects an id that is not in the manifest', async () => {
    const grant = createDownloadGrant(
      { productId: STARTER as never, assetId: '../../etc/passwd', customerEmail: EMAIL },
      SECRET,
      NOW,
    );
    const result = await authorize({ grant, assetId: '../../etc/passwd' });
    expect(result).toMatchObject({ allowed: false, reason: 'unknown-asset' });
  });

  it('storage keys come from the manifest, never from input', () => {
    expect(findDeliverable(STARTER, '../../secret')).toBeNull();
    for (const product of PRODUCT_LADDER) {
      for (const asset of deliverablesFor(product)) {
        expect(asset.storageKey.startsWith(`${product}/`)).toBe(true);
        expect(asset.storageKey).not.toContain('..');
      }
    }
  });

  it('every kit ships content', () => {
    for (const product of PRODUCT_LADDER) {
      expect(deliverablesFor(product).length).toBeGreaterThan(0);
    }
  });
});

describe('denial responses', () => {
  it('map to sensible status codes', () => {
    expect(denialResponse('no-session').status).toBe(401);
    expect(denialResponse('not-entitled').status).toBe(403);
    expect(denialResponse('unknown-asset').status).toBe(404);
    expect(denialResponse('grant-expired').status).toBe(410);
  });

  it('do not tell a prober which part of a forged link was wrong', () => {
    const bad = denialResponse('grant-bad-signature');
    const wrongCustomer = denialResponse('grant-wrong-customer');
    const malformed = denialResponse('grant-malformed');
    expect(bad).toEqual(wrongCustomer);
    expect(bad).toEqual(malformed);
  });

  it('tell an expired link apart, because that one has a fix', () => {
    expect(denialResponse('grant-expired').message).toMatch(/refresh/i);
    expect(denialResponse('grant-expired')).not.toEqual(denialResponse('grant-bad-signature'));
  });
});

describe('grant verification in isolation', () => {
  it('verifies the signature before reading any claim', () => {
    const forged = `${Buffer.from(
      JSON.stringify({
        productId: SYSTEM,
        assetId: 'system-walkthrough',
        customerEmail: EMAIL,
        expiresAt: Date.now() + 1_000_000,
      }),
      'utf8',
    ).toString('base64url')}.not-a-real-signature`;
    expect(verifyDownloadGrant(forged, SECRET, EMAIL, NOW)).toEqual({
      valid: false,
      reason: 'bad-signature',
    });
  });

  it('rejects a token with no separator', () => {
    expect(verifyDownloadGrant('nonsense', SECRET, EMAIL, NOW)).toMatchObject({
      reason: 'malformed',
    });
  });
});
