'use client';

import { ChevronRight, FolderClosed } from 'lucide-react';
import { useState } from 'react';

import { StatusBadge } from './StatusBadge';

import { cn } from '@/lib/utils';
import { assetIcon } from '@/src/cms-admin/assetIcon';
import type { ContentTreeNode } from '@/src/cms-admin/contentTree';

interface Props {
  node: ContentTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

// Recursive roadmap node — doubles as the section/topic/lesson row and
// the resource chip (ASSET leaves render the same row, just without the
// expand toggle). The left border simulates a connector; a dedicated
// RoadmapConnector component would just be this one `<span>`, so it is
// folded in here rather than split out.
export function RoadmapSection({ node, depth, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isAsset = node.nodeType === 'ASSET';
  const hasChildren = node.children.length > 0;
  const Icon = isAsset ? assetIcon(node.assetKind) : FolderClosed;
  const isSelected = node.id === selectedId;

  return (
    <div className="relative" style={depth > 0 ? { marginLeft: 20 } : undefined}>
      {depth > 0 && (
        <span aria-hidden className="absolute -left-3 top-0 h-full border-l border-border" />
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(node.id);
        }}
        className={cn(
          'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent',
          isSelected && 'bg-accent ring-1 ring-ring',
        )}
      >
        {!isAsset && hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="shrink-0 text-muted-foreground"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium" title={node.title}>
          {node.title}
        </span>
        {hasChildren && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {node.children.length}
          </span>
        )}
        <span className="shrink-0">
          <StatusBadge status={node.status} />
        </span>
      </div>
      {!isAsset && hasChildren && expanded && (
        <div className="mt-1 flex flex-col gap-1">
          {node.children.map((child) => (
            <RoadmapSection
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
