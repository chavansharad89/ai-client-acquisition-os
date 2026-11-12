'use client';

import type { PublicContentItem } from '@acos/core-cms';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ContentInspector } from './ContentInspector';
import { EmptyState } from './EmptyState';
import { RoadmapSection } from './RoadmapSection';

import { createContainer, type CmsApiError } from '@/src/cms-admin/api';
import { locateNode, type ContentTreeNode } from '@/src/cms-admin/contentTree';

export function RoadmapCanvas({
  tree,
  allItems,
  productId,
}: {
  tree: ContentTreeNode[];
  allItems: PublicContentItem[];
  productId: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingRoot, setCreatingRoot] = useState(false);
  const [newRootTitle, setNewRootTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CmsApiError | null>(null);

  const location = selectedId ? locateNode(tree, selectedId) : null;

  async function handleCreateRoot() {
    if (newRootTitle.trim().length === 0) {
      setError({ kind: 'validation', message: 'Title cannot be blank.' });
      return;
    }
    setBusy(true);
    setError(null);
    const result = await createContainer({
      owningProductId: productId,
      parentId: null,
      title: newRootTitle.trim(),
      orderIndex: tree.length,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNewRootTitle('');
    setCreatingRoot(false);
    setSelectedId(result.data.id);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {creatingRoot ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <input
            autoFocus
            value={newRootTitle}
            onChange={(e) => setNewRootTitle(e.target.value)}
            placeholder="New roadmap title"
            disabled={busy}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={handleCreateRoot}
            disabled={busy}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingRoot(false);
              setError(null);
            }}
            disabled={busy}
            className="rounded-md border border-input px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          {error && <p className="w-full text-sm text-destructive">{error.message}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreatingRoot(true)}
          className="self-start rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          + Add Roadmap
        </button>
      )}

      {tree.length === 0 ? (
        <div className="flex flex-1 rounded-lg border border-border bg-card">
          <EmptyState
            title="No content yet"
            description="This product has no roadmap content for the current filter."
          />
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-4">
            {tree.map((node) => (
              <RoadmapSection
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
          <ContentInspector
            key={selectedId ?? 'none'}
            location={location}
            allItems={allItems}
            productId={productId}
            onSelect={setSelectedId}
          />
        </div>
      )}
    </div>
  );
}
