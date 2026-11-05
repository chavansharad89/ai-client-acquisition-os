import { useMemo, useState } from 'react';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

import { clampIndex, flattenTopics, resolveSelection, type TopicNavigation } from './topicNavigation';

// Split out of topicNavigation.ts (CMS-PO-013 post-review fix): this is
// the one React-hook export of that module. A Server Component
// (apps/web/app/access/[productId]/page.tsx) now imports pure functions
// from topicNavigation.ts directly, and Next.js refuses to let a Server
// Component import ANY module that uses React hooks without 'use
// client' — even a different, pure export from the same module. Keeping
// this hook in its own file (imported only by already-'use client'
// components) keeps topicNavigation.ts hook-free and therefore legal to
// import from page.tsx.
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
