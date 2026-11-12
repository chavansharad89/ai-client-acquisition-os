import { randomUUID } from 'node:crypto';

import type { ProductId } from '@acos/catalog';

import {
  assetKindForExtension,
  buildAssetStorageKey,
  MAX_ASSET_BYTES,
  parseAssetStorageKey,
  validateAssetCandidate,
} from './assetValidation';
import type { AssetStorage } from './assetStorage';
import { isCmsEligibleProduct } from './cmsEligibility';
import type { ContentItemRepository } from './contentItemRepository';
import { createAsset } from './contentService';
import { publishReplacementTransaction, type PublishReplacementInput, type SqlPool } from './contentReplacementTransaction';
import { CmsValidationError } from './errors';
import type { ContentItem } from './types';
import type { UploadSessionRepository } from './uploadSessionRepository';

// CMS-PO-010(R2) Phase 2 -- Core-CMS asset-ingestion business logic.
// -----------------------------------------------------------------------
// The validated entry point for the admin upload flow
// (CMS-PO-010(R2)-C), the same role contentService.ts plays for plain
// container/asset creation -- this file adds nothing to that one; it
// composes it (`completeAssetUpload`'s non-replacement branch calls the
// existing `createAsset` directly) so parent/hierarchy/eligibility
// validation is never duplicated.
//
// Deliberately provider-agnostic: nothing here imports an R2 SDK or
// knows an R2 credential exists. `AssetStorage` (assetStorage.ts) is the
// only thing this module depends on for "ask for an upload URL" / "ask
// what actually got uploaded" -- swapping in a real R2-backed
// implementation later requires no change here.
// -----------------------------------------------------------------------

export interface AssetIngestionServiceDeps {
  contentItems: ContentItemRepository;
  storage: AssetStorage;
  /**
   * CMS-PO-010(R2)-G upload-session bookkeeping (migration 0068).
   * OPTIONAL on this shared interface, unlike `requestAssetUploadAuthorization`'s
   * own stricter deps type below (which requires it) -- a session's
   * absence here never blocks `completeAssetUpload()`: provider HEAD
   * metadata remains the sole authority for whether a completion is
   * valid, exactly as before this capability existed. When supplied, a
   * successful completion additionally consumes (deletes) the matching
   * session row; when omitted, completion behaves exactly as it did
   * before this field existed. The real HTTP route always supplies it.
   */
  uploadSessions?: UploadSessionRepository;
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
}

export interface RequestAssetUploadAuthorizationInput {
  owningProductId: ProductId;
  extension: string;
  contentType: string;
  declaredBytes: number;
}

export interface AssetUploadAuthorization {
  /** Not a content_items id -- no row exists yet. Carried through to `completeAssetUpload` only via the storage key it was used to build; the service itself does not need it again. */
  uploadSessionId: string;
  storageKey: string;
  uploadUrl: string;
  expiresAt: Date;
}

/**
 * Requests authorization for a direct-to-storage upload
 * (CMS-PO-010(R2)-C). Deliberately creates no `content_items` row --
 * an upload that is never completed therefore leaves no `content_items`
 * row at all. It DOES, however, persist a `cms_asset_upload_sessions`
 * row (CMS-PO-010(R2)-G, migration 0068) recording that this storage
 * key/time was authorized -- that row, not a `content_items` row, is
 * what lets the abandoned-upload cleanup job later identify "this
 * object was authorized over 24h ago and nothing ever completed it,"
 * without needing to enumerate R2 itself.
 *
 * SEQUENCE (deliberately in this order -- Postgres and R2 cannot
 * participate in one atomic transaction, so failure handling matters):
 *   1. generate uploadSessionId/storageKey (server-controlled, never
 *      client-supplied);
 *   2. INSERT the session row FIRST. If this fails, propagate
 *      immediately -- no R2 call is ever made, and no authorization is
 *      ever returned to the caller.
 *   3. THEN ask R2 to authorize the upload. If THIS fails, the session
 *      row was already committed but was never handed to any client and
 *      therefore can never be completed -- best-effort delete it here
 *      (rather than leaving it to linger until the 24h abandoned-upload
 *      cleanup job eventually reaps it). If that rollback delete ALSO
 *      fails, the failure is logged (never thrown to the caller, never
 *      including any credential/internal R2 detail) and the row is
 *      simply left for the cleanup job's own idempotent retry -- a
 *      delayed cleanup, never an incorrect one.
 *
 * Takes no user id, entitlement, or customer identity: CMS admin
 * authorization is a web-layer concern (`requireCmsAdmin`, a later
 * phase), not this service's.
 */
export async function requestAssetUploadAuthorization(
  deps: Pick<AssetIngestionServiceDeps, 'storage'> & { uploadSessions: UploadSessionRepository },
  input: RequestAssetUploadAuthorizationInput,
): Promise<AssetUploadAuthorization> {
  if (!isCmsEligibleProduct(input.owningProductId)) {
    throw new CmsValidationError(
      'owningProductId',
      'not-cms-eligible',
      `assets: '${input.owningProductId}' is not a CMS-eligible product`,
    );
  }
  validateAssetCandidate({
    extension: input.extension,
    contentType: input.contentType,
    bytes: input.declaredBytes,
  });

  // The caller never supplies a storage key -- only the inputs above,
  // none of which is a key. This is what makes "admin cannot provide an
  // arbitrary storage key" structural rather than a rule to remember.
  const uploadSessionId = randomUUID();
  const storageKey = buildAssetStorageKey(input.owningProductId, uploadSessionId, input.extension);

  await deps.uploadSessions.create({
    id: uploadSessionId,
    storageKey,
    owningProductId: input.owningProductId,
  });

  let authorization: { uploadUrl: string; expiresAt: Date };
  try {
    authorization = await deps.storage.createUploadAuthorization(storageKey, input.contentType, MAX_ASSET_BYTES);
  } catch (error) {
    try {
      await deps.uploadSessions.deleteById(uploadSessionId);
    } catch (rollbackError) {
      console.error(
        JSON.stringify({
          event: 'cms_asset_ingestion.upload_session_rollback_failed',
          uploadSessionId,
          error: describeError(rollbackError),
        }),
      );
    }
    throw error;
  }

  return {
    uploadSessionId,
    storageKey,
    uploadUrl: authorization.uploadUrl,
    expiresAt: authorization.expiresAt,
  };
}

export interface CompleteNewAssetInput {
  storageKey: string;
  owningProductId: ProductId;
  parentId: string | null;
  title: string;
  description?: string | null;
  orderIndex?: number;
  replacesContentItemId?: undefined;
}

export interface CompleteReplacementAssetInput {
  storageKey: string;
  replacesContentItemId: string;
}

export type CompleteAssetUploadInput = CompleteNewAssetInput | CompleteReplacementAssetInput;

function isReplacement(
  input: CompleteAssetUploadInput,
): input is CompleteReplacementAssetInput {
  return input.replacesContentItemId !== undefined;
}

/** Postgres unique-violation code, or the fake repository's equivalent (`FakeUniqueViolationError`). */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === '23505';
}

/**
 * Completes an already-uploaded object into a DRAFT CMS asset
 * (CMS-PO-010(R2) Phase 2). Trusts nothing about the declared upload --
 * every validation rule runs again against `storage.headObject()`'s
 * ACTUAL reported size/content-type, since the browser that performed
 * the direct-to-storage upload is not a trusted input.
 *
 * Two shapes, discriminated by `replacesContentItemId`:
 *   - a plain new asset: delegates to the existing `createAsset`
 *     (contentService.ts) for parent/hierarchy/eligibility validation,
 *     so that logic is never duplicated;
 *   - a replacement: validates the target, then either creates a new
 *     pending DRAFT or -- "replace the existing DRAFT"
 *     (CMS-PO-010(R2) Secondary Decision 8) -- overwrites the one that
 *     already exists, including recovering gracefully if a concurrent
 *     completion for the same target wins the race to create the first
 *     one (see `isUniqueViolation` above).
 *
 * The created/updated row is always DRAFT -- neither input shape has a
 * status field, so a caller cannot force PUBLISHED or ARCHIVED.
 *
 * CMS-PO-010(R2)-G: when `deps.uploadSessions` is supplied, resolves the
 * matching session row (by `storageKey` -- never by any id correlation;
 * see uploadSessionRepository.ts/migration 0068's own doc comments for
 * why) and, ONLY once the CMS row has actually been created or updated
 * below, consumes (deletes) it. A session's ABSENCE never blocks
 * completion -- it may already have been consumed by an earlier
 * successful completion, reaped by the abandoned-upload cleanup job, or
 * simply not wired into this call at all; `storage.headObject()` remains
 * the sole authority for whether the object itself is valid, unchanged
 * by this capability. If completion fails anywhere before the CMS write
 * succeeds (including this function throwing before that point), the
 * session row is never touched, leaving it available for retry.
 */
export async function completeAssetUpload(
  deps: AssetIngestionServiceDeps,
  input: CompleteAssetUploadInput,
): Promise<ContentItem> {
  const parsedKey = parseAssetStorageKey(input.storageKey);
  if (!parsedKey) {
    throw new CmsValidationError(
      'storageKey',
      'invalid-storage-key',
      `assets: '${input.storageKey}' is not a recognized CMS asset storage key`,
    );
  }

  const session = deps.uploadSessions ? await deps.uploadSessions.findByStorageKey(input.storageKey) : null;
  async function consumeSession(): Promise<void> {
    if (!session || !deps.uploadSessions) return;
    // Best-effort: every call site below awaits this only AFTER the
    // content_items create/update has already succeeded, so a failure
    // here must never roll back that write or fail the caller's
    // response. The session row simply lingers and is reaped later by
    // the abandoned-upload cleanup job (apps/worker's cmsCleanup
    // module) -- exactly the same outcome as if this capability were
    // never wired in at all (see AssetIngestionServiceDeps.uploadSessions'
    // own doc comment above).
    try {
      await deps.uploadSessions.deleteById(session.id);
    } catch (error) {
      console.error(
        JSON.stringify({
          event: 'cms_asset_ingestion.upload_session_consumption_failed',
          uploadSessionId: session.id,
          error: describeError(error),
        }),
      );
    }
  }

  if (isReplacement(input)) {
    const target = await deps.contentItems.findById(input.replacesContentItemId);
    if (!target) {
      throw new CmsValidationError(
        'replacesContentItemId',
        'invalid-replacement-target',
        `content_items: '${input.replacesContentItemId}' does not exist`,
      );
    }
    if (target.nodeType !== 'ASSET') {
      throw new CmsValidationError(
        'replacesContentItemId',
        'invalid-replacement-target',
        `content_items: '${input.replacesContentItemId}' is a ${target.nodeType}, not an ASSET`,
      );
    }
    if (target.replacesContentItemId !== null) {
      throw new CmsValidationError(
        'replacesContentItemId',
        'invalid-replacement-target',
        `content_items: '${input.replacesContentItemId}' is itself a pending replacement and cannot be replaced directly`,
      );
    }
    if (parsedKey.owningProductId !== target.owningProductId) {
      throw new CmsValidationError(
        'storageKey',
        'invalid-storage-key',
        `assets: storage key's product ('${parsedKey.owningProductId}') does not match the replaced asset's product ('${target.owningProductId}')`,
      );
    }

    const metadata = await deps.storage.headObject(input.storageKey);
    if (!metadata) {
      throw new CmsValidationError(
        'storageKey',
        'object-not-found',
        `assets: no object exists at storage key '${input.storageKey}'`,
      );
    }
    validateAssetCandidate({
      extension: parsedKey.extension,
      contentType: metadata.contentType,
      bytes: metadata.bytes,
    });
    const assetKind = assetKindForExtension(parsedKey.extension);
    const bytes = String(metadata.bytes);

    let replacement: ContentItem;
    try {
      replacement = await deps.contentItems.createReplacementAsset({
        owningProductId: target.owningProductId,
        parentId: target.parentId,
        title: target.title,
        description: target.description,
        assetKind,
        storageKey: input.storageKey,
        bytes,
        orderIndex: target.orderIndex,
        replacesContentItemId: target.id,
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Lost the race to create the first pending replacement -- the
      // winner's row is "the existing DRAFT" now; replace its physical
      // fields with ours, exactly as the non-concurrent "upload a second
      // replacement" path would (CMS-PO-010(R2) Secondary Decision 8).
      const existing = await deps.contentItems.findPendingReplacement(target.id);
      if (!existing) throw error; // the row vanished (e.g. published) between the race and this lookup -- surface the original error.
      replacement = await deps.contentItems.updatePendingReplacement(existing.id, {
        storageKey: input.storageKey,
        assetKind,
        bytes,
      });
    }
    await consumeSession();
    return replacement;
  }

  if (!isCmsEligibleProduct(input.owningProductId)) {
    throw new CmsValidationError(
      'owningProductId',
      'not-cms-eligible',
      `assets: '${input.owningProductId}' is not a CMS-eligible product`,
    );
  }
  if (parsedKey.owningProductId !== input.owningProductId) {
    throw new CmsValidationError(
      'storageKey',
      'invalid-storage-key',
      `assets: storage key's product ('${parsedKey.owningProductId}') does not match the requested product ('${input.owningProductId}')`,
    );
  }

  const metadata = await deps.storage.headObject(input.storageKey);
  if (!metadata) {
    throw new CmsValidationError(
      'storageKey',
      'object-not-found',
      `assets: no object exists at storage key '${input.storageKey}'`,
    );
  }
  validateAssetCandidate({
    extension: parsedKey.extension,
    contentType: metadata.contentType,
    bytes: metadata.bytes,
  });

  const asset = await createAsset(deps, {
    owningProductId: input.owningProductId,
    parentId: input.parentId,
    title: input.title,
    description: input.description ?? null,
    assetKind: assetKindForExtension(parsedKey.extension),
    storageKey: input.storageKey,
    bytes: String(metadata.bytes),
    ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
  });
  await consumeSession();
  return asset;
}

/**
 * Publishes a pending replacement onto its logical asset, atomically
 * (CMS-PO-010(R2) Phase 2) -- a thin, intentionally named wrapper around
 * {@link publishReplacementTransaction}, which does the actual locking
 * and multi-statement transaction against a pinned connection.
 */
export async function publishReplacement(
  deps: { pool: SqlPool },
  input: PublishReplacementInput,
): Promise<ContentItem> {
  return publishReplacementTransaction(deps.pool, input);
}
