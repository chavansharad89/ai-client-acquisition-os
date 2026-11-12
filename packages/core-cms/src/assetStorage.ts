// CMS-PO-010(R2) Phase 2 -- provider-agnostic object-storage interface.
// -----------------------------------------------------------------------
// Cloudflare R2 is the approved provider (CMS-PO-010(R2)-A / Secondary
// Decision 1), but no R2 implementation, SDK dependency, or credential
// exists yet -- that is explicitly a later phase. This interface is the
// seam core-cms's asset-ingestion logic depends on instead, so every
// Phase 2 rule (validation, key generation, replacement/publish
// lifecycle) is testable today against the in-memory fake in
// testing/fakeAssetStorage.ts, and an R2-backed implementation can be
// swapped in later without this package changing at all.
// -----------------------------------------------------------------------

export interface UploadAuthorization {
  uploadUrl: string;
  expiresAt: Date;
}

export interface DownloadAuthorization {
  downloadUrl: string;
  expiresAt: Date;
}

/** What `headObject` reports about an object that actually exists -- the ACTUAL metadata completion validates against, never the caller's declared values. */
export interface StoredObjectMetadata {
  bytes: number;
  contentType: string;
}

export interface AssetStorage {
  /** Authorizes a direct-to-storage upload at `key` (pre-signed, per CMS-PO-010(R2)-C). Does not create or reserve anything CMS-side. */
  createUploadAuthorization(key: string, contentType: string, maxBytes: number): Promise<UploadAuthorization>;

  /** The object's actual metadata if one exists at `key`, or null. The only source of truth for "did an upload really happen, and what is it actually." */
  headObject(key: string): Promise<StoredObjectMetadata | null>;

  /** A temporary signed download URL (customer delivery, CMS-PO-010(R2)-B) -- unused by Phase 2's own logic; declared here so the interface matches what the later customer-delivery phase needs, without this package depending on that phase's code. */
  createDownloadAuthorization(key: string, ttlSeconds: number): Promise<DownloadAuthorization>;

  /** Deletes the object at `key` -- unused by Phase 2 (no cleanup job exists yet); declared for the same forward-compatibility reason as `createDownloadAuthorization`. */
  deleteObject(key: string): Promise<void>;
}
