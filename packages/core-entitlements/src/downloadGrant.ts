import { createHmac, timingSafeEqual } from 'node:crypto';

import type { ProductId } from '@acos/catalog';

// Signed, short-lived download grants.
// -----------------------------------------------------------------------
// A download link is NOT the authorisation. The route checks the access
// cookie against the entitlement table on every request; this signature
// sits on top of that, and each layer closes a hole the other leaves:
//
//   * The COOKIE check stops a copied link working for anyone else. A
//     signature alone would be a bearer token — whoever holds the URL
//     gets the file, forever, and links end up in chat histories.
//
//   * The SIGNATURE stops an entitled customer naming an arbitrary
//     asset. Without it, a valid session could walk asset ids (or storage
//     keys) across products it has not bought.
//
//   * The EXPIRY bounds both. Ten minutes is long enough to start a large
//     download and short enough that a leaked URL is worthless by the
//     time it is shared.
//
// The grant is signed, not encrypted: its contents are not secret, and a
// reader learning "this link was for the launch kit" costs nothing.
// -----------------------------------------------------------------------

/** Long enough to begin a 400MB download, short enough to be useless later. */
export const DOWNLOAD_GRANT_TTL_MS = 10 * 60 * 1000;

export interface DownloadGrantClaims {
  productId: ProductId;
  assetId: string;
  /** Binds the grant to one customer; the route requires the cookie to agree. */
  customerEmail: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

export class DownloadGrantError extends Error {
  constructor(
    message: string,
    readonly reason: DownloadGrantRejection,
  ) {
    super(message);
    this.name = 'DownloadGrantError';
  }
}

export type DownloadGrantRejection = 'malformed' | 'bad-signature' | 'expired' | 'wrong-customer';

function encode(claims: DownloadGrantClaims): string {
  return Buffer.from(JSON.stringify(claims), 'utf8').toString('base64url');
}

function sign(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

/** Mints `<claims>.<signature>`. */
export function createDownloadGrant(
  claims: Omit<DownloadGrantClaims, 'expiresAt'>,
  secret: string,
  now: Date = new Date(),
): string {
  if (!secret) throw new DownloadGrantError('download grant secret is required', 'bad-signature');
  const body = encode({
    ...claims,
    customerEmail: claims.customerEmail.trim().toLowerCase(),
    expiresAt: now.getTime() + DOWNLOAD_GRANT_TTL_MS,
  });
  return `${body}.${sign(body, secret)}`;
}

export type DownloadGrantVerdict =
  { valid: true; claims: DownloadGrantClaims } | { valid: false; reason: DownloadGrantRejection };

/**
 * Verifies a grant.
 *
 * Signature first, then expiry, then customer — never the other way
 * round. Reading claims out of an unverified token and acting on them is
 * the classic JWT mistake, and the order here makes it impossible.
 */
export function verifyDownloadGrant(
  token: string,
  secret: string,
  expectedCustomerEmail: string,
  now: Date = new Date(),
): DownloadGrantVerdict {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return { valid: false, reason: 'malformed' };

  const body = token.slice(0, separator);
  const provided = token.slice(separator + 1);
  const expected = sign(body, secret);

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad-signature' };
  }

  let claims: DownloadGrantClaims;
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as DownloadGrantClaims;
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (
    typeof claims?.productId !== 'string' ||
    typeof claims?.assetId !== 'string' ||
    typeof claims?.customerEmail !== 'string' ||
    typeof claims?.expiresAt !== 'number'
  ) {
    return { valid: false, reason: 'malformed' };
  }

  if (claims.expiresAt <= now.getTime()) return { valid: false, reason: 'expired' };

  if (claims.customerEmail !== expectedCustomerEmail.trim().toLowerCase()) {
    return { valid: false, reason: 'wrong-customer' };
  }

  return { valid: true, claims };
}
