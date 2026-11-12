import type { ContentLifecycleStatus, ContentNodeType, PublicContentItem } from '@acos/core-cms';

// The browser's only two CMS write paths, for Phase 1D (metadata edits,
// ordering via swap, and container creation). Mirrors the shape of
// src/checkout/request.ts: typed request builders, a fetchImpl
// parameter for tests, and a Result type instead of throwing.
//
// Both admin routes this file calls (POST /api/cms/admin/content and
// POST /api/cms/admin/content/[id]) return the raw repository row,
// which — unlike the asset routes — is not passed through
// toPublicContentItem server-side (a known backend inconsistency, see
// the Phase 1D report). `parsePublicContentItem` below is this file's
// own client-side backstop: it picks only the fields PublicContentItem
// defines, so a storageKey/previousStorageKey present on the wire is
// never read into anything this app renders or stores.

export interface CmsApiError {
  kind: 'validation' | 'auth' | 'not-found' | 'network' | 'server';
  message: string;
  field?: string;
}

export type CmsApiResult<T> = { ok: true; data: T } | { ok: false; error: CmsApiError };

function parsePublicContentItem(raw: Record<string, unknown>): PublicContentItem {
  return {
    id: raw.id as string,
    owningProductId: raw.owningProductId as PublicContentItem['owningProductId'],
    parentId: (raw.parentId as string | null) ?? null,
    nodeType: raw.nodeType as ContentNodeType,
    assetKind: (raw.assetKind as string | null) ?? null,
    title: raw.title as string,
    description: (raw.description as string | null) ?? null,
    bytes: (raw.bytes as string | null) ?? null,
    orderIndex: raw.orderIndex as number,
    status: raw.status as PublicContentItem['status'],
    archivedAt: raw.archivedAt ? new Date(raw.archivedAt as string) : null,
    createdAt: new Date(raw.createdAt as string),
    updatedAt: new Date(raw.updatedAt as string),
    replacesContentItemId: (raw.replacesContentItemId as string | null) ?? null,
    previousStorageRetentionUntil: raw.previousStorageRetentionUntil
      ? new Date(raw.previousStorageRetentionUntil as string)
      : null,
  };
}

async function toApiError(response: Response): Promise<CmsApiError> {
  let body: { error?: string; code?: string; field?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    // fall through to the generic message below
  }
  if (response.status === 401) return { kind: 'auth', message: 'Your session has expired. Please log in again.' };
  if (response.status === 403) return { kind: 'auth', message: 'You no longer have CMS access.' };
  if (response.status === 404) return { kind: 'not-found', message: 'This item no longer exists. Refresh and try again.' };
  if (response.status === 400) {
    return {
      kind: 'validation',
      message: body?.error ?? 'Check the values and try again.',
      ...(body?.field ? { field: body.field } : {}),
    };
  }
  return { kind: 'server', message: body?.error ?? 'Something went wrong on our side. Try again in a moment.' };
}

const NETWORK_ERROR: CmsApiError = { kind: 'network', message: "We couldn't reach the server. Check your connection and try again." };

export interface UpdateContentMetadataInput {
  title?: string;
  description?: string | null;
  orderIndex?: number;
}

export async function updateContentMetadata(
  id: string,
  changes: UpdateContentMetadataInput,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl(`/api/cms/admin/content/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(changes),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

export interface CreateContainerInput {
  owningProductId: string;
  parentId: string | null;
  title: string;
  description?: string | null;
  orderIndex?: number;
}

export async function createContainer(
  input: CreateContainerInput,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl('/api/cms/admin/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

export interface RequestAssetUploadAuthorizationInput {
  owningProductId: string;
  extension: string;
  contentType: string;
  declaredBytes: number;
}

export interface AssetUploadAuthorization {
  uploadSessionId: string;
  storageKey: string;
  uploadUrl: string;
  expiresAt: Date;
}

/** Step 1 of 2 of the Phase 1E upload flow — authorizes a direct-to-R2 upload. Creates no content_items row. */
export async function requestAssetUploadAuthorization(
  input: RequestAssetUploadAuthorizationInput,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<AssetUploadAuthorization>> {
  let response: Response;
  try {
    response = await fetchImpl('/api/cms/admin/assets/upload-authorization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return {
    ok: true,
    data: {
      uploadSessionId: raw.uploadSessionId as string,
      storageKey: raw.storageKey as string,
      uploadUrl: raw.uploadUrl as string,
      expiresAt: new Date(raw.expiresAt as string),
    },
  };
}

export interface CompleteAssetUploadInput {
  storageKey: string;
  owningProductId: string;
  parentId: string | null;
  title: string;
  description?: string | null;
  orderIndex?: number;
}

/** Step 2 of 2 — confirms the object uploaded directly to R2 and turns it into a DRAFT content_items row. */
export async function completeAssetUpload(
  input: CompleteAssetUploadInput,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl('/api/cms/admin/assets/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

/** Phase 1F: moves a content item directly to DRAFT, PUBLISHED, or ARCHIVED — covers publish, archive, and reactivate alike (one backend route, CMS-PO-009's immediate lifecycle model). Not valid for a pending-replacement row (DB rejects any status but DRAFT for one); the UI must not call this for a node whose `replacesContentItemId` is set. */
export async function setLifecycleStatus(
  id: string,
  status: ContentLifecycleStatus,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl(`/api/cms/admin/content/${id}/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

/** Phase 1F: publishes a pending DRAFT replacement onto the currently-live asset it targets, atomically. `expectedPendingReplacementId` guards against a stale UI publishing a different replacement than the one the admin saw. */
export async function publishReplacement(
  contentItemId: string,
  expectedPendingReplacementId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl('/api/cms/admin/assets/publish-replacement', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contentItemId, expectedPendingReplacementId }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

export interface CompleteReplacementAssetUploadInput {
  storageKey: string;
  replacesContentItemId: string;
}

/** Phase 1F: the replacement-shaped sibling of {@link completeAssetUpload} — confirms an object just uploaded to R2 as a pending DRAFT replacement of `replacesContentItemId`, reusing step 1's `requestAssetUploadAuthorization` unchanged (title/description/parent/order are inherited server-side from the target). */
export async function completeReplacementAssetUpload(
  input: CompleteReplacementAssetUploadInput,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<PublicContentItem>> {
  let response: Response;
  try {
    response = await fetchImpl('/api/cms/admin/assets/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as Record<string, unknown>;
  return { ok: true, data: parsePublicContentItem(raw) };
}

/**
 * Swaps order_index between two siblings — the ordering primitive this
 * phase uses instead of free-form drag-and-drop (see the Phase 1D
 * report for why). Not transactional: there is no batch/reorder
 * endpoint, so this is two sequential calls to the same metadata route.
 * If the second fails after the first succeeds, this does not attempt
 * an automatic compensating revert (a partial, honestly-surfaced
 * failure is safer than a second automated write trying to undo the
 * first) — the caller must refresh and report the failure.
 */
export async function swapOrder(
  a: { id: string; orderIndex: number },
  b: { id: string; orderIndex: number },
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<true>> {
  const first = await updateContentMetadata(a.id, { orderIndex: b.orderIndex }, fetchImpl);
  if (!first.ok) return first;
  const second = await updateContentMetadata(b.id, { orderIndex: a.orderIndex }, fetchImpl);
  if (!second.ok) return second;
  return { ok: true, data: true };
}

export interface DisplayNameOverride {
  productId: string;
  displayName: string;
  updatedBy: string | null;
}

/**
 * POST /api/cms/admin/display-names/[productId] (Phase 1G, CMS-PO-001(R2)) --
 * sets the CMS display-name override for `productId`. The route itself
 * already restricts `productId` to the 3 CMS-eligible plans and rejects
 * a blank name; this is a thin, typed client wrapper, same shape as
 * every other write function in this file.
 */
export async function setDisplayName(
  productId: string,
  displayName: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CmsApiResult<DisplayNameOverride>> {
  let response: Response;
  try {
    response = await fetchImpl(`/api/cms/admin/display-names/${productId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
  if (!response.ok) return { ok: false, error: await toApiError(response) };
  const raw = (await response.json()) as { productId: string; displayName: string; updatedBy: string | null };
  return { ok: true, data: { productId: raw.productId, displayName: raw.displayName, updatedBy: raw.updatedBy } };
}
