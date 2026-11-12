import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

// Pure data-shaping for Roadmap View's flowchart layout (CMS-PO-011,
// visual-redesign addendum): a central vertical spine of top-level
// topics, each branching left/right into satellite boxes — some
// satellites are themselves a grouped multi-item box (roadmap.sh's
// "Core LLM Elements" shape). No new content model: this only groups
// `ContentTreeNode`'s existing CONTAINER/ASSET/children/orderIndex
// shape for the flowchart renderer; the full tree is still what
// RoadmapView holds and what TopicDetails still reads directly.

export interface SatelliteBox {
  node: ContentTreeNode;
  /** The box's own listed items, for a CONTAINER satellite (its children) — empty for an ASSET satellite, which is the box itself. */
  rows: ContentTreeNode[];
  side: 'left' | 'right';
}

export interface SpineNode {
  node: ContentTreeNode;
  satellites: SatelliteBox[];
}

/** `tree`'s depth-0 nodes become the spine (already `orderIndex`-sorted by `buildContentTree`); each one's direct children become satellite boxes, alternating side by index, left first. */
export function buildFlowchart(tree: readonly ContentTreeNode[]): SpineNode[] {
  return tree.map((node) => ({
    node,
    satellites: node.children.map((child, index) => ({
      node: child,
      rows: child.nodeType === 'CONTAINER' ? child.children : [],
      side: index % 2 === 0 ? 'left' : ('right' as const),
    })),
  }));
}
