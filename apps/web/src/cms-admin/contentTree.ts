import type { ContentLifecycleStatus, PublicContentItem } from '@acos/core-cms';

// Builds the roadmap tree the UI renders directly from content_items rows
// — no new hierarchy model. `content_items` is already a self-referencing
// CONTAINER/ASSET tree with ordering and status, which is exactly the
// Roadmap -> Section -> Topic -> Lesson/Resource shape the product
// direction asks for; this file only groups/sorts/filters what the
// backend already returns. See requireCmsAdminForPage.ts and
// app/cms/roadmaps/page.tsx for where these are used.

export interface ContentTreeNode extends PublicContentItem {
  children: ContentTreeNode[];
}

/** Groups a flat parent_id-linked list into a tree. Orphans (parentId pointing outside the given set) are treated as roots. */
export function buildContentTree(items: readonly PublicContentItem[]): ContentTreeNode[] {
  const byId = new Map<string, ContentTreeNode>();
  for (const item of items) {
    byId.set(item.id, { ...item, children: [] });
  }

  const roots: ContentTreeNode[] = [];
  for (const item of items) {
    const node = byId.get(item.id);
    if (!node) continue;
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: ContentTreeNode[]) => {
    nodes.sort((a, b) => a.orderIndex - b.orderIndex);
    for (const node of nodes) sortTree(node.children);
  };
  sortTree(roots);

  return roots;
}

export function countByStatus(
  items: readonly PublicContentItem[],
): Record<ContentLifecycleStatus, number> {
  return {
    DRAFT: items.filter((item) => item.status === 'DRAFT').length,
    PUBLISHED: items.filter((item) => item.status === 'PUBLISHED').length,
    ARCHIVED: items.filter((item) => item.status === 'ARCHIVED').length,
  };
}

/**
 * Keeps a node if it matches `status`, or if any descendant does — so
 * filtering to e.g. Drafts doesn't hide the Section/Topic ancestry a
 * draft Lesson lives under. Returns the full tree unchanged when `status`
 * is null ("All Content").
 */
export function filterTreeByStatus(
  nodes: readonly ContentTreeNode[],
  status: ContentLifecycleStatus | null,
): ContentTreeNode[] {
  if (!status) return [...nodes];

  const filterNode = (node: ContentTreeNode): ContentTreeNode | null => {
    const children = node.children
      .map(filterNode)
      .filter((n): n is ContentTreeNode => n !== null);
    if (node.status === status || children.length > 0) {
      return { ...node, children };
    }
    return null;
  };

  return nodes.map(filterNode).filter((n): n is ContentTreeNode => n !== null);
}

// UI terminology for "friendly" node naming without a new backend
// concept (target IA §9): depth 0 = Roadmap, 1 = Section, 2 = Topic,
// 3+ = Lesson, for CONTAINER nodes. ASSET leaves are always "Resource"
// regardless of depth, since a file/video/project can live at any level.
const CONTAINER_DEPTH_LABELS = ['Roadmap', 'Section', 'Topic'] as const;

export function depthLabel(depth: number, nodeType: 'CONTAINER' | 'ASSET'): string {
  if (nodeType === 'ASSET') return 'Resource';
  return CONTAINER_DEPTH_LABELS[depth] ?? 'Lesson';
}

/** What the Content Inspector needs for one selected node, from a single tree walk. */
export interface NodeLocation {
  node: ContentTreeNode;
  /** null for a root (depth 0) node. */
  parent: ContentTreeNode | null;
  depth: number;
  /** This node's siblings (nodes sharing its parent), sorted by orderIndex, node included. */
  siblings: ContentTreeNode[];
}

/**
 * Finds the pending DRAFT replacement row for `targetId`, if any, by
 * scanning an already-fetched flat item list — no new query. At most
 * one row may ever carry a given `replacesContentItemId` (DB partial
 * unique index, migration 0066), so the first match is the only match.
 */
export function findPendingReplacement<T extends { id: string; replacesContentItemId: string | null }>(
  items: readonly T[],
  targetId: string,
): T | null {
  return items.find((item) => item.replacesContentItemId === targetId) ?? null;
}

/** Finds `id` anywhere in the tree along with its parent, depth, and sorted sibling group. Null if not present. */
export function locateNode(tree: readonly ContentTreeNode[], id: string): NodeLocation | null {
  const walk = (
    nodes: readonly ContentTreeNode[],
    parent: ContentTreeNode | null,
    depth: number,
  ): NodeLocation | null => {
    const match = nodes.find((n) => n.id === id);
    if (match) {
      return { node: match, parent, depth, siblings: [...nodes].sort((a, b) => a.orderIndex - b.orderIndex) };
    }
    for (const node of nodes) {
      const found = walk(node.children, node, depth + 1);
      if (found) return found;
    }
    return null;
  };
  return walk(tree, null, 0);
}
