import { useMemo, useState } from 'react';

import { locateNode, type ContentTreeNode } from '../../src/cms-admin/contentTree';

// Shared topic-selection + sequential-navigation model for the customer
// roadmap/topic views (CMS-PO-011). Both RoadmapView (tree) and TopicView
// (flat Previous/Next list) are thin rendering over this one module so
// there is exactly one navigation implementation, not two, and switching
// between the two views never loses the customer's place.
// -----------------------------------------------------------------------

/**
 * Pre-order DFS over `tree`, collecting only ASSET leaves in document
 * order (the same order `buildContentTree`'s own `orderIndex` sort
 * already produces). CONTAINER nodes are groupers, never sequence
 * members — a topic nested at any depth participates in the same flat
 * sequence as a top-level one.
 */
export function flattenTopics(tree: readonly ContentTreeNode[]): ContentTreeNode[] {
  const out: ContentTreeNode[] = [];
  const walk = (nodes: readonly ContentTreeNode[]) => {
    for (const node of nodes) {
      if (node.nodeType === 'ASSET') out.push(node);
      walk(node.children);
    }
  };
  walk(tree);
  return out;
}

/**
 * Resolves "no matching topic" (`-1`, e.g. a CONTAINER is the shared
 * selection when a view that only shows topics renders) to the first
 * topic, when any exist. A valid index passes through unchanged.
 */
export function clampIndex(current: number, total: number): number {
  if (current === -1 && total > 0) return 0;
  return current;
}

/**
 * The first ASSET found anywhere under `containerId` (pre-order,
 * document order) — used when switching to Topic View while a
 * CONTAINER is selected, so the customer lands on the nearest topic
 * inside the section they were just looking at (CMS-PO-011(E) point 5:
 * "preserve the selected topic wherever possible") rather than an
 * arbitrary global first topic. Null if `containerId` is itself a
 * topic, unknown, or has no ASSET descendants.
 */
export function firstDescendantTopicId(tree: readonly ContentTreeNode[], containerId: string): string | null {
  const container = locateNode(tree, containerId)?.node ?? null;
  if (!container || container.nodeType !== 'CONTAINER') return null;
  return flattenTopics(container.children)[0]?.id ?? null;
}

type SelectionAction = { type: 'select'; id: string } | { type: 'prev' } | { type: 'next' };

/**
 * Pure selection-transition logic, factored out of the `useState` call
 * in `useTopicNavigation` so it is directly unit-testable without
 * rendering a component — the actual decision logic behind every click
 * in both views.
 */
export function resolveSelection(
  action: SelectionAction,
  state: { selectedId: string; topics: readonly ContentTreeNode[] },
): string {
  if (action.type === 'select') return action.id;

  const currentIndex = state.topics.findIndex((t) => t.id === state.selectedId);
  const clamped = clampIndex(currentIndex, state.topics.length);

  if (action.type === 'prev') {
    return clamped > 0 ? state.topics[clamped - 1]!.id : state.selectedId;
  }
  return clamped < state.topics.length - 1 ? state.topics[clamped + 1]!.id : state.selectedId;
}

export interface TopicWithSection {
  topic: ContentTreeNode;
  sectionTitle: string | null;
  /** True exactly once per distinct nearest-ancestor container, by identity (id), not by title text — two differently-titled-the-same sections each get their own label. */
  showSectionLabel: boolean;
}

/**
 * Pairs each flattened topic with its nearest-ancestor section title and
 * whether a label should render above it in Topic View — computed once
 * as a plain array transform (not a mutation inside a render-phase
 * `.map`), and deduped by the ancestor's `id`, not its `title` string,
 * so two different sections that happen to share a title each still get
 * their own label.
 */
export function topicsWithSectionLabels(
  tree: readonly ContentTreeNode[],
  topics: readonly ContentTreeNode[],
): TopicWithSection[] {
  let lastSectionId: string | null = null;
  return topics.map((topic) => {
    const parent = locateNode(tree, topic.id)?.parent ?? null;
    const sectionId = parent?.id ?? null;
    const showSectionLabel = sectionId !== null && sectionId !== lastSectionId;
    lastSectionId = sectionId;
    return { topic, sectionTitle: parent?.title ?? null, showSectionLabel };
  });
}

export interface TopicNavigation {
  selectedId: string;
  select: (id: string) => void;
  /** flattenTopics(tree), memoized. */
  topics: ContentTreeNode[];
  /** topics.findIndex(t => t.id === selectedId); -1 if selectedId is a CONTAINER. */
  currentIndex: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
  goPrev: () => void;
  goNext: () => void;
}

/**
 * Finds the ASSET node matching `topicParam` in the flattened topic sequence.
 * Returns null if topicParam is undefined, does not match any node, or matches
 * a CONTAINER (only ASSET nodes are valid topics). Used to resolve the
 * ?topic=<id> query parameter on the dedicated topic-detail page.
 */
export function resolveTopicParam(tree: readonly ContentTreeNode[], topicParam: string | undefined): ContentTreeNode | null {
  return topicParam ? flattenTopics(tree).find((t) => t.id === topicParam) ?? null : null;
}

export type NodeClickAction = { type: 'navigate'; href: string } | { type: 'select'; id: string };

/**
 * Determines the action to take when a node is clicked: navigate to the
 * topic-detail page (for ASSET nodes) or select the container locally
 * (for CONTAINER nodes or unknown ids). Safe default is to select locally,
 * so unknown ids never break navigation.
 */
export function resolveNodeClick(tree: readonly ContentTreeNode[], id: string, productId: string): NodeClickAction {
  const node = locateNode(tree, id)?.node;
  if (node?.nodeType === 'ASSET') {
    return { type: 'navigate', href: `/access/${productId}?topic=${id}` };
  }
  return { type: 'select', id };
}

/**
 * Returns the IDs of the previous and next topics in document order relative
 * to the given topicId. Both are null if topicId is not in the flattened
 * sequence, or null if at either end of the sequence.
 */
export function getAdjacentTopicIds(tree: readonly ContentTreeNode[], topicId: string): { prevId: string | null; nextId: string | null } {
  const topics = flattenTopics(tree);
  const index = topics.findIndex((t) => t.id === topicId);
  if (index === -1) {
    return { prevId: null, nextId: null };
  }
  return {
    prevId: index > 0 ? topics[index - 1]!.id : null,
    nextId: index < topics.length - 1 ? topics[index + 1]!.id : null,
  };
}

/**
 * Returns the ordered chain of CONTAINER ancestors for the given node id,
 * from root to immediate parent (excluding the node itself). Returns [] if
 * the node is at the root level or the id is not found in the tree. Walks
 * the tree in pre-order DFS, accumulating the ancestor path as it goes.
 */
export function ancestorPath(tree: readonly ContentTreeNode[], id: string): ContentTreeNode[] {
  let result: ContentTreeNode[] | null = null;

  const walk = (nodes: readonly ContentTreeNode[], path: ContentTreeNode[]) => {
    for (const node of nodes) {
      if (node.id === id) {
        result = path;
        return;
      }
      walk(node.children, [...path, node]);
      if (result !== null) return;
    }
  };

  walk(tree, []);
  return result ?? [];
}

export function useTopicNavigation(tree: readonly ContentTreeNode[], initialId: string): TopicNavigation {
  const [selectedId, setSelectedId] = useState(initialId);
  const topics = useMemo(() => flattenTopics(tree), [tree]);
  const currentIndex = topics.findIndex((t) => t.id === selectedId);
  const total = topics.length;
  const clamped = clampIndex(currentIndex, total);
  const hasPrev = clamped > 0;
  const hasNext = clamped < total - 1;

  return {
    selectedId,
    select: (id) => setSelectedId(resolveSelection({ type: 'select', id }, { selectedId, topics })),
    topics,
    currentIndex,
    total,
    hasPrev,
    hasNext,
    goPrev: () => setSelectedId(resolveSelection({ type: 'prev' }, { selectedId, topics })),
    goNext: () => setSelectedId(resolveSelection({ type: 'next' }, { selectedId, topics })),
  };
}
