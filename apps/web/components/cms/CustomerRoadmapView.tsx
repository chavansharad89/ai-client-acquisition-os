import { FolderClosed } from 'lucide-react';

import { EmptyState } from './EmptyState';
import { StatusBadge } from './StatusBadge';

import { assetIcon } from '@/src/cms-admin/assetIcon';
import type { ContentTreeNode } from '@/src/cms-admin/contentTree';
import { formatBytes } from '@/src/cms-admin/formatBytes';
import type { PreviewSection } from '@/src/server/cmsPreviewService';

// Phase 1H read-only renderer -- deliberately NOT ContentInspector,
// which carries admin mutation affordances (edit/upload/publish/
// archive/replace). This component has no onClick, no <a href>, no
// fetch, and no client-side state: every asset row (DRAFT, PUBLISHED,
// or ARCHIVED alike, per the Product Owner's "Asset Preview Decision --
// FINAL") is metadata-only -- title, type, size, status -- with no
// download/playback control and no signed-URL/asset-delivery API call
// of any kind. Shaped to be reusable by a future real customer-facing
// route (pass showLifecycleBadges=false there, since customer-fetched
// items are always PUBLISHED already) without any change here.
// -----------------------------------------------------------------------

function RoadmapViewNode({
  node,
  depth,
  showLifecycleBadges,
}: {
  node: ContentTreeNode;
  depth: number;
  showLifecycleBadges: boolean;
}) {
  const isAsset = node.nodeType === 'ASSET';
  const hasChildren = node.children.length > 0;
  const Icon = isAsset ? assetIcon(node.assetKind) : FolderClosed;

  const row = (
    <div className="flex flex-col gap-1 rounded-md px-2 py-1.5 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium" title={node.title}>
          {node.title}
        </span>
        {!isAsset && showLifecycleBadges && (
          <span className="shrink-0">
            <StatusBadge status={node.status} />
          </span>
        )}
      </div>
      {isAsset && (
        <div className="ml-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{node.assetKind} · {node.bytes !== null ? formatBytes(Number(node.bytes)) : '—'}</span>
          <span>Preview only — not downloadable</span>
          {showLifecycleBadges && <StatusBadge status={node.status} />}
        </div>
      )}
    </div>
  );

  if (!isAsset && hasChildren) {
    return (
      <details open={depth < 2} style={depth > 0 ? { marginLeft: 20 } : undefined}>
        <summary className="cursor-pointer list-none">{row}</summary>
        <div className="mt-1 flex flex-col gap-1">
          {node.children.map((child) => (
            <RoadmapViewNode key={child.id} node={child} depth={depth + 1} showLifecycleBadges={showLifecycleBadges} />
          ))}
        </div>
      </details>
    );
  }

  return <div style={depth > 0 ? { marginLeft: 20 } : undefined}>{row}</div>;
}

export function CustomerRoadmapView({
  sections,
  showLifecycleBadges,
}: {
  sections: readonly PreviewSection[];
  showLifecycleBadges: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.productId} className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 text-lg font-semibold tracking-tight">{section.displayName}</h2>
          {section.tree.length === 0 ? (
            <EmptyState
              compact
              title="No content yet"
              description={`${section.displayName} has no roadmap content for the current filter.`}
            />
          ) : (
            <div className="flex flex-col gap-1">
              {section.tree.map((node) => (
                <RoadmapViewNode key={node.id} node={node} depth={0} showLifecycleBadges={showLifecycleBadges} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
