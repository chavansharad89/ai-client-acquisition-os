import { CmsValidationError } from './errors';

// CMS-PO-010(R2) Phase 2 -- basic asset-upload validation and the
// system-generated storage-key shape, both pure/synchronous so they can
// be exercised identically whether validating a caller's DECLARED
// upload-authorization request or the ACTUAL object metadata
// `headObject()` returns during completion (CMS-PO-010(R2) Secondary
// Decision 5: "basic validation only" -- extension allowlist, MIME
// check, size ceiling; no malware/virus scanning or deep content
// inspection, deliberately not implemented here).
// -----------------------------------------------------------------------

/** 500 MB per asset (CMS-PO-010(R2) Secondary Decision 4), same limit for every approved type. */
export const MAX_ASSET_BYTES = 500 * 1024 * 1024;

/**
 * Extension -> approved MIME type(s) (CMS-PO-010(R2)-D). A contentType
 * not in this list for the given extension is rejected even if the
 * extension alone is approved -- extension is never trusted alone.
 * `zip` accepts both the standard and the common non-standard MIME type
 * browsers/OSes actually send for it.
 */
const ASSET_ALLOWLIST: Readonly<Record<string, readonly string[]>> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  zip: ['application/zip', 'application/x-zip-compressed'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  mp4: ['video/mp4'],
};

export function normalizeAssetExtension(extension: string): string {
  return extension.trim().toLowerCase().replace(/^\./, '');
}

export interface AssetCandidate {
  extension: string;
  contentType: string;
  bytes: number;
}

/**
 * Throws {@link CmsValidationError} if `candidate` fails any
 * CMS-PO-010(R2) basic-validation rule. Callers run this twice in
 * practice: once against the caller's DECLARED values when authorizing
 * an upload, and again against the ACTUAL `headObject()` result when
 * completing one -- the second call is what actually gates the asset,
 * per CMS-PO-010(R2)'s instruction not to merely trust the original
 * request.
 */
export function validateAssetCandidate(candidate: AssetCandidate): void {
  const extension = normalizeAssetExtension(candidate.extension);
  const allowedMimeTypes = ASSET_ALLOWLIST[extension];
  if (!allowedMimeTypes) {
    throw new CmsValidationError(
      'extension',
      'unsupported-extension',
      `assets: extension '${extension}' is not in the approved allowlist`,
    );
  }
  if (!allowedMimeTypes.includes(candidate.contentType)) {
    throw new CmsValidationError(
      'contentType',
      'mime-mismatch',
      `assets: contentType '${candidate.contentType}' does not match extension '${extension}'`,
    );
  }
  if (!Number.isInteger(candidate.bytes) || candidate.bytes <= 0) {
    throw new CmsValidationError('bytes', 'invalid-size', 'assets: bytes must be a positive integer');
  }
  if (candidate.bytes > MAX_ASSET_BYTES) {
    throw new CmsValidationError(
      'bytes',
      'invalid-size',
      `assets: bytes (${candidate.bytes}) exceeds the ${MAX_ASSET_BYTES}-byte (500MB) maximum`,
    );
  }
}

/** The asset's `assetKind` is its normalized extension -- simple, deterministic, and no enum was ever decided for this TEXT column (types.ts's own comment gives 'FILE'/'VIDEO' only as examples). */
export function assetKindForExtension(extension: string): string {
  return normalizeAssetExtension(extension);
}

const ASSET_KEY_PATTERN = /^cms\/([^/]+)\/assets\/([^/.]+)\.([^/.]+)$/;

/**
 * `cms/<owning-product-id>/assets/<segmentId>.<extension>`
 * (CMS-PO-010(R2) Secondary Decision 3). `segmentId` is system-generated
 * (an upload-session id, or -- after a replacement is published -- the
 * id the replacement row had before it was consumed); the caller never
 * supplies it or any other part of the key.
 */
export function buildAssetStorageKey(owningProductId: string, segmentId: string, extension: string): string {
  return `cms/${owningProductId}/assets/${segmentId}.${normalizeAssetExtension(extension)}`;
}

export interface ParsedAssetStorageKey {
  owningProductId: string;
  segmentId: string;
  extension: string;
}

/** Inverse of {@link buildAssetStorageKey}. Returns null for anything that doesn't match the approved shape -- never throws, since a malformed key is a normal, expected validation outcome for a caller-supplied value. */
export function parseAssetStorageKey(key: string): ParsedAssetStorageKey | null {
  const match = ASSET_KEY_PATTERN.exec(key);
  if (!match) return null;
  // Non-null: the pattern's three capturing groups are all mandatory
  // (none optional/quantified), so a successful match always populates
  // match[1..3].
  return { owningProductId: match[1]!, segmentId: match[2]!, extension: match[3]! };
}
