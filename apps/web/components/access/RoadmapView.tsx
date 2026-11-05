'use client';

import { locateNode, type ContentTreeNode } from '../../src/cms-admin/contentTree';

import { RoadmapFlowchart } from './RoadmapFlowchart';
import { TopicDetails } from './TopicDetails';
import type { TopicNavigation } from './topicNavigation';

// View A (CMS-PO-011, visual-redesign addendum): the roadmap.sh-style
// spine + satellite-box flowchart (RoadmapFlowchart) plus the shared
// detail panel below it. Plain-CSS styled — see the implementation
// plan's Global Constraints. The flowchart shows the whole structure at
// once (no collapse/expand), so unlike the original sidebar-tree
// design, a selection at any depth is always visible by construction —
// nothing to auto-expand.
export function RoadmapView({
  tree,
  productId,
  nav,
  onSelect,
}: {
  tree: ContentTreeNode[];
  productId: string;
  nav: TopicNavigation;
  onSelect: (id: string) => void;
}) {
  const location = locateNode(tree, nav.selectedId);

  return (
    <div className="stack">
      <RoadmapFlowchart tree={tree} selectedId={nav.selectedId} onSelect={onSelect} />
      {location && location.node.nodeType === 'CONTAINER' && (
        <TopicDetails node={location.node} productId={productId} onSelectChild={onSelect} />
      )}
    </div>
  );
}
