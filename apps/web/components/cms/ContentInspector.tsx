'use client';

import type { PublicContentItem } from '@acos/core-cms';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';

import {
  completeAssetUpload,
  completeReplacementAssetUpload,
  createContainer,
  publishReplacement,
  requestAssetUploadAuthorization,
  setLifecycleStatus,
  swapOrder,
  updateContentMetadata,
  type CmsApiError,
} from '@/src/cms-admin/api';
import { ACCEPTED_FILE_EXTENSIONS, extensionFromFileName, validateAssetFile } from '@/src/cms-admin/assetUpload';
import { depthLabel, findPendingReplacement, type NodeLocation } from '@/src/cms-admin/contentTree';
import { formatBytes } from '@/src/cms-admin/formatBytes';

function ErrorLine({ error }: { error: { message: string } }) {
  return <p className="text-sm text-destructive">{error.message}</p>;
}

type UploadPhase =
  | 'form'
  | 'authorizing'
  | 'uploading'
  | 'completing'
  | 'success'
  | 'failed-authorization'
  | 'failed-upload'
  | 'failed-completion';

type LifecycleConfirmation = 'publish' | 'archive' | 'publish-replacement';

/** Puts `file` directly to R2 via `uploadUrl`, reporting progress — fetch() has no upload-progress event, so this uses XMLHttpRequest. Returns the XHR so the caller can abort it. */
function putFileToR2(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
  onDone: (ok: boolean) => void,
): XMLHttpRequest {
  const xhr = new XMLHttpRequest();
  xhr.open('PUT', uploadUrl);
  xhr.setRequestHeader('content-type', file.type);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
  };
  xhr.onload = () => onDone(xhr.status >= 200 && xhr.status < 300);
  xhr.onerror = () => onDone(false);
  xhr.onabort = () => onDone(false);
  xhr.send(file);
  return xhr;
}

interface Props {
  location: NodeLocation | null;
  /** Every content item for the current product, any status, unfiltered by the active Draft/Published/Archived view — lets this component find a pending replacement for the selected node regardless of that filter. */
  allItems: PublicContentItem[];
  productId: string;
  onSelect: (id: string) => void;
}

// Phase 1D editor. Container: title, description, order (via swap
// buttons), parent (read-only — see below), status (read-only, badge
// only), child count, save. Asset: the same, plus asset kind, size, and
// replacement state, all read-only. storageKey/previousStorageKey never
// enter this component — parsePublicContentItem (api.ts) strips them
// before any response reaches client state.
//
// "Parent" has no edit control: POST /api/cms/admin/content/[id] only
// accepts { title, description, orderIndex } — there is no backend
// mutation to change parentId (re-parenting). Shown read-only; see the
// Phase 1D report for this gap. Lifecycle status is shown but not
// editable here — publish/archive/reactivate are explicitly Phase 1F.
export function ContentInspector({ location, allItems, productId, onSelect }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'view' | 'edit' | 'create' | 'upload' | 'replace'>('view');
  const [title, setTitle] = useState(location?.node.title ?? '');
  const [description, setDescription] = useState(location?.node.description ?? '');
  const [newChildTitle, setNewChildTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CmsApiError | null>(null);

  // Phase 1F lifecycle actions (publish/archive/reactivate/replace).
  const [confirmingAction, setConfirmingAction] = useState<LifecycleConfirmation | null>(null);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);
  const [lifecycleError, setLifecycleError] = useState<CmsApiError | null>(null);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileError, setUploadFileError] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('form');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<{ message: string } | null>(null);
  // Transient only — held in memory for this upload's lifetime, never
  // rendered, never written to any longer-lived store. Lets a failed
  // completion retry without re-uploading the (already-in-R2) object.
  const pendingStorageKeyRef = useRef<string | null>(null);
  const activeXhrRef = useRef<XMLHttpRequest | null>(null);

  function resetUploadForm() {
    setUploadTitle('');
    setUploadDescription('');
    setUploadFile(null);
    setUploadFileError(null);
    setUploadPhase('form');
    setUploadProgress(0);
    setUploadError(null);
    pendingStorageKeyRef.current = null;
    activeXhrRef.current = null;
  }

  if (!location) {
    return (
      <aside className="rounded-lg border border-border bg-card p-4">
        <EmptyState title="No selection" description="Select a roadmap node to see its details." compact />
      </aside>
    );
  }

  const { node, parent, depth, siblings } = location;
  const index = siblings.findIndex((s) => s.id === node.id);
  const canMoveUp = index > 0;
  const canMoveDown = index >= 0 && index < siblings.length - 1;

  // A DRAFT row with replacesContentItemId set IS itself a pending
  // replacement (migration 0066's content_items_replacement_shape CHECK
  // forbids any other status on it) — the generic Publish/Archive
  // actions below must never be offered for it; it only ever becomes
  // live via "Publish replacement" from the asset it targets.
  const isPendingReplacementRow = node.replacesContentItemId !== null;
  const replacementTarget = isPendingReplacementRow
    ? allItems.find((i) => i.id === node.replacesContentItemId) ?? null
    : null;
  const pendingReplacement =
    node.nodeType === 'ASSET' && node.status === 'PUBLISHED' ? findPendingReplacement(allItems, node.id) : null;

  function resetLifecycleState() {
    setConfirmingAction(null);
    setLifecycleError(null);
    setLifecycleMessage(null);
  }

  async function handleLifecycleTransition(status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    setLifecycleBusy(true);
    setLifecycleError(null);
    const result = await setLifecycleStatus(node.id, status);
    setLifecycleBusy(false);
    setConfirmingAction(null);
    if (!result.ok) {
      setLifecycleError(result.error);
      return;
    }
    setLifecycleMessage(status === 'PUBLISHED' ? 'Published.' : status === 'ARCHIVED' ? 'Archived.' : 'Moved to draft.');
    router.refresh();
  }

  async function handlePublishReplacement() {
    if (!pendingReplacement) return;
    setLifecycleBusy(true);
    setLifecycleError(null);
    const result = await publishReplacement(node.id, pendingReplacement.id);
    setLifecycleBusy(false);
    setConfirmingAction(null);
    if (!result.ok) {
      setLifecycleError(result.error);
      return;
    }
    setLifecycleMessage('Replacement published.');
    router.refresh();
  }

  async function handleSave() {
    if (title.trim().length === 0) {
      setError({ kind: 'validation', message: 'Title cannot be blank.', field: 'title' });
      return;
    }
    setBusy(true);
    setError(null);
    const result = await updateContentMetadata(node.id, {
      title: title.trim(),
      description: description.trim().length > 0 ? description.trim() : null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMode('view');
    router.refresh();
  }

  async function handleMove(direction: 'up' | 'down') {
    const otherIndex = direction === 'up' ? index - 1 : index + 1;
    const other = siblings[otherIndex];
    if (!other) return;
    setBusy(true);
    setError(null);
    const result = await swapOrder(
      { id: node.id, orderIndex: node.orderIndex },
      { id: other.id, orderIndex: other.orderIndex },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCreateChild() {
    if (newChildTitle.trim().length === 0) {
      setError({ kind: 'validation', message: 'Title cannot be blank.', field: 'title' });
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createContainer({
      owningProductId: productId,
      parentId: node.id,
      title: newChildTitle.trim(),
      orderIndex: node.children.length,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewChildTitle('');
    setMode('view');
    onSelect(result.data.id);
    router.refresh();
  }

  function handleFileSelect(selected: File | null) {
    pendingStorageKeyRef.current = null;
    setUploadPhase('form');
    setUploadError(null);
    if (!selected) {
      setUploadFile(null);
      setUploadFileError(null);
      return;
    }
    const invalid = validateAssetFile(selected);
    setUploadFile(selected);
    setUploadFileError(invalid?.message ?? null);
  }

  /**
   * Completes the upload: authorizes (unless a prior attempt already has
   * a storageKey), PUTs to R2 if needed, then confirms. Shared by the
   * initial attempt and every "Try again", and by both a new resource
   * (`mode === 'upload'`) and a replacement upload (`mode === 'replace'`,
   * Phase 1F) — the two differ only in which product/extension the
   * authorization step declares and which shape `complete` sends;
   * everything else (authorize -> PUT -> complete, retry-without-
   * re-uploading) is the same Phase 1E machinery.
   */
  async function runUpload() {
    if (!uploadFile) return;
    const isReplace = mode === 'replace';
    let storageKey = pendingStorageKeyRef.current;

    if (!storageKey) {
      setUploadPhase('authorizing');
      setUploadError(null);
      const authResult = await requestAssetUploadAuthorization({
        owningProductId: isReplace ? node.owningProductId : productId,
        extension: extensionFromFileName(uploadFile.name),
        contentType: uploadFile.type,
        declaredBytes: uploadFile.size,
      });
      if (!authResult.ok) {
        setUploadPhase('failed-authorization');
        setUploadError(authResult.error);
        return;
      }
      storageKey = authResult.data.storageKey;

      setUploadPhase('uploading');
      setUploadProgress(0);
      const uploadSucceeded = await new Promise<boolean>((resolve) => {
        activeXhrRef.current = putFileToR2(authResult.data.uploadUrl, uploadFile, setUploadProgress, resolve);
      });
      activeXhrRef.current = null;
      if (!uploadSucceeded) {
        setUploadPhase('failed-upload');
        setUploadError({ message: 'The upload to storage did not complete. Try again.' });
        return;
      }
      pendingStorageKeyRef.current = storageKey;
    }

    setUploadPhase('completing');
    const completeResult = isReplace
      ? await completeReplacementAssetUpload({ storageKey, replacesContentItemId: node.id })
      : await completeAssetUpload({
          storageKey,
          owningProductId: productId,
          parentId: node.id,
          title: uploadTitle.trim(),
          description: uploadDescription.trim().length > 0 ? uploadDescription.trim() : null,
          orderIndex: node.children.length,
        });
    if (!completeResult.ok) {
      setUploadPhase('failed-completion');
      setUploadError(completeResult.error);
      return;
    }

    setUploadPhase('success');
    const newAssetId = completeResult.data.id;
    setTimeout(() => {
      resetUploadForm();
      setMode('view');
      // A replacement upload stays DRAFT under the original, published
      // asset — stay there (it now shows "Publish replacement") rather
      // than jumping to the new DRAFT row.
      onSelect(isReplace ? node.id : newAssetId);
      router.refresh();
    }, 600);
  }

  function handleStartUpload() {
    if (mode === 'upload' && uploadTitle.trim().length === 0) {
      setUploadError({ message: 'Title cannot be blank.' });
      return;
    }
    if (!uploadFile || uploadFileError) {
      setUploadError({ message: 'Choose a valid file first.' });
      return;
    }
    void runUpload();
  }

  function handleCancelUpload() {
    if (activeXhrRef.current) {
      activeXhrRef.current.abort();
      activeXhrRef.current = null;
    }
    resetUploadForm();
    setMode('view');
  }

  if (mode === 'upload' || mode === 'replace') {
    const isReplace = mode === 'replace';
    const isWorking = uploadPhase === 'authorizing' || uploadPhase === 'uploading' || uploadPhase === 'completing';
    return (
      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {isReplace ? (
            <>Replace &ldquo;{node.title}&rdquo;</>
          ) : (
            <>New Resource under &ldquo;{node.title}&rdquo;</>
          )}
        </p>
        {isReplace && (
          <p className="text-xs text-muted-foreground">
            &ldquo;{node.title}&rdquo; stays published and visible to customers until this upload is published as its
            replacement. Title and description carry over automatically.
          </p>
        )}

        {uploadPhase === 'success' ? (
          <p className="text-sm text-foreground">
            {isReplace ? 'Uploaded — saved as a pending replacement (DRAFT).' : 'Uploaded — saved as a DRAFT resource.'}
          </p>
        ) : (
          <>
            {!isReplace && (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  Title
                  <input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    disabled={isWorking}
                    className="rounded-md border border-input bg-background px-3 py-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Description
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    disabled={isWorking}
                    rows={2}
                    className="rounded-md border border-input bg-background px-3 py-2"
                  />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-sm">
              File
              <input
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS}
                disabled={isWorking}
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </label>
            {uploadFile && (
              <p className="text-xs text-muted-foreground">
                {uploadFile.name} · {uploadFile.type || 'unknown type'} · {formatBytes(uploadFile.size)}
              </p>
            )}
            {uploadFileError && <ErrorLine error={{ message: uploadFileError }} />}

            {uploadPhase === 'uploading' && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {uploadPhase === 'authorizing' && <p className="text-xs text-muted-foreground">Requesting authorization…</p>}
            {uploadPhase === 'completing' && <p className="text-xs text-muted-foreground">Finalizing…</p>}
            {uploadPhase === 'failed-completion' && (
              <p className="text-xs text-muted-foreground">
                The file is already in storage — retry just finalizes it, no re-upload needed.
              </p>
            )}
            {uploadError && <ErrorLine error={uploadError} />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStartUpload}
                disabled={isWorking || !uploadFile || !!uploadFileError}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {uploadPhase === 'failed-authorization' || uploadPhase === 'failed-upload' || uploadPhase === 'failed-completion'
                  ? 'Try again'
                  : isWorking
                    ? 'Uploading…'
                    : isReplace
                      ? 'Upload replacement'
                      : 'Upload'}
              </button>
              <button
                type="button"
                onClick={handleCancelUpload}
                className="rounded-md border border-input px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </aside>
    );
  }

  if (mode === 'create') {
    return (
      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          New {depthLabel(depth + 1, 'CONTAINER')} under &ldquo;{node.title}&rdquo;
        </p>
        <input
          autoFocus
          value={newChildTitle}
          onChange={(e) => setNewChildTitle(e.target.value)}
          placeholder="Title"
          disabled={busy}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {error && <ErrorLine error={error} />}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCreateChild}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('view');
              setError(null);
            }}
            disabled={busy}
            className="rounded-md border border-input px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </aside>
    );
  }

  if (mode === 'edit') {
    return (
      <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {node.nodeType === 'ASSET' ? (node.assetKind ?? 'Asset') : 'Editing'}
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            rows={3}
            className="rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        {error && <ErrorLine error={error} />}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('view');
              setTitle(node.title);
              setDescription(node.description ?? '');
              setError(null);
            }}
            disabled={busy}
            className="rounded-md border border-input px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {node.nodeType === 'ASSET' ? (node.assetKind ?? 'Asset') : depthLabel(depth, 'CONTAINER')}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-snug">{node.title}</h2>
      </div>

      {node.description && <p className="text-sm text-muted-foreground">{node.description}</p>}

      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Status</dt>
        <dd>
          <StatusBadge status={node.status} />
        </dd>
        <dt className="text-muted-foreground">Parent</dt>
        <dd className="truncate">{parent ? parent.title : '— (top level)'}</dd>
        <dt className="text-muted-foreground">Order</dt>
        <dd>
          {node.orderIndex}
          <span className="ml-1 text-xs text-muted-foreground">
            ({index + 1} of {siblings.length})
          </span>
        </dd>
        <dt className="text-muted-foreground">Children</dt>
        <dd>{node.children.length}</dd>
        {node.nodeType === 'ASSET' && node.bytes && (
          <>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{formatBytes(Number(node.bytes))}</dd>
          </>
        )}
        {isPendingReplacementRow && (
          <>
            <dt className="text-muted-foreground">Replacement</dt>
            <dd>
              Pending — replaces{' '}
              {replacementTarget ? <>&ldquo;{replacementTarget.title}&rdquo;</> : 'another asset'}
            </dd>
          </>
        )}
        {pendingReplacement && (
          <>
            <dt className="text-muted-foreground">Replacement</dt>
            <dd>Pending upload ready to publish</dd>
          </>
        )}
        {node.previousStorageRetentionUntil && (
          <>
            <dt className="text-muted-foreground">Previous version</dt>
            <dd>Retained until {node.previousStorageRetentionUntil.toLocaleDateString()}</dd>
          </>
        )}
      </dl>

      {error && <ErrorLine error={error} />}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleMove('up')}
          disabled={!canMoveUp || busy}
          className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Move up
        </button>
        <button
          type="button"
          onClick={() => handleMove('down')}
          disabled={!canMoveDown || busy}
          className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Move down
        </button>
        {node.nodeType === 'CONTAINER' && (
          <>
            <button
              type="button"
              onClick={() => setMode('create')}
              className="rounded-md border border-input px-3 py-1.5 text-sm"
            >
              + Add {depthLabel(depth + 1, 'CONTAINER')}
            </button>
            <button
              type="button"
              onClick={() => {
                resetUploadForm();
                setMode('upload');
              }}
              className="rounded-md border border-input px-3 py-1.5 text-sm"
            >
              + Add {depthLabel(depth + 1, 'ASSET')}
            </button>
          </>
        )}
      </div>

      {isPendingReplacementRow ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm">
          <p className="text-muted-foreground">
            This is a pending replacement{replacementTarget ? <> for &ldquo;{replacementTarget.title}&rdquo;</> : ''}. It
            stays DRAFT and has no effect until published from the original asset.
          </p>
          {replacementTarget && (
            <button
              type="button"
              onClick={() => onSelect(replacementTarget.id)}
              className="self-start rounded-md border border-input px-3 py-1.5 text-sm"
            >
              Go to original
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lifecycleMessage && <p className="text-sm text-foreground">{lifecycleMessage}</p>}
          {lifecycleError && <ErrorLine error={lifecycleError} />}

          {confirmingAction ? (
            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/40 p-3 text-sm">
              <p>
                {confirmingAction === 'publish' && 'Publish this item? It becomes visible to entitled customers immediately.'}
                {confirmingAction === 'archive' && 'Archive this item? Customer access is removed immediately. The item and its asset are retained and can be reactivated.'}
                {confirmingAction === 'publish-replacement' &&
                  'Publish this replacement? It becomes live immediately, replacing the current version for customers.'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirmingAction === 'publish') void handleLifecycleTransition('PUBLISHED');
                    else if (confirmingAction === 'archive') void handleLifecycleTransition('ARCHIVED');
                    else void handlePublishReplacement();
                  }}
                  disabled={lifecycleBusy}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {lifecycleBusy ? 'Working…' : `Confirm ${confirmingAction === 'publish-replacement' ? 'publish replacement' : confirmingAction}`}
                </button>
                <button
                  type="button"
                  onClick={resetLifecycleState}
                  disabled={lifecycleBusy}
                  className="rounded-md border border-input px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {node.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => setConfirmingAction('publish')}
                  className="rounded-md border border-input px-3 py-1.5 text-sm"
                >
                  Publish
                </button>
              )}
              {node.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => setConfirmingAction('archive')}
                  className="rounded-md border border-input px-3 py-1.5 text-sm"
                >
                  Archive
                </button>
              )}
              {node.status === 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => void handleLifecycleTransition('PUBLISHED')}
                  disabled={lifecycleBusy}
                  className="rounded-md border border-input px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {lifecycleBusy ? 'Working…' : 'Reactivate'}
                </button>
              )}
              {node.nodeType === 'ASSET' && node.status === 'PUBLISHED' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      resetUploadForm();
                      setMode('replace');
                    }}
                    className="rounded-md border border-input px-3 py-1.5 text-sm"
                  >
                    Replace…
                  </button>
                  {pendingReplacement && (
                    <button
                      type="button"
                      onClick={() => setConfirmingAction('publish-replacement')}
                      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                    >
                      Publish replacement
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
