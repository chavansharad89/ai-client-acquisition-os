'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

import { RoadmapView } from './RoadmapView';
import { firstDescendantTopicId, flattenTopics, resolveNodeClick, useTopicNavigation } from './topicNavigation';
import { TopicView } from './TopicView';


type ViewMode = 'roadmap' | 'topics';

// CMS-PO-011: the thing `/access/[productId]`'s CMS branch actually
// renders — owns the single shared TopicNavigation instance (so
// switching View A <-> View B never loses the selected topic,
// CMS-PO-011(A)) and the view-mode toggle (default: Roadmap View,
// CMS-PO-011(B); no persistence across visits, CMS-PO-011(C)).
export function ProductRoadmap({
  tree,
  productId,
  displayName,
}: {
  tree: ContentTreeNode[];
  productId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('roadmap');
  const initialId = useMemo(() => flattenTopics(tree)[0]?.id ?? tree[0]!.id, [tree]);
  const nav = useTopicNavigation(tree, initialId);

  // CMS-PO-013: clicking an ASSET node navigates to the dedicated
  // topic-detail page; clicking a CONTAINER node keeps the existing
  // local-select behavior.
  function handleSelect(id: string) {
    const action = resolveNodeClick(tree, id, productId);
    if (action.type === 'navigate') router.push(action.href);
    else nav.select(action.id);
  }

  // CMS-PO-011(E) point 5: switching to Topic View while a CONTAINER is
  // selected lands on the nearest topic inside that section (not an
  // arbitrary global first topic) — "preserve the selected topic
  // wherever possible" for a selection Topic View can't represent as-is.
  function openTopicsView() {
    if (nav.currentIndex === -1) {
      const nearest = firstDescendantTopicId(tree, nav.selectedId) ?? nav.topics[0]?.id;
      if (nearest) nav.select(nearest);
    }
    setView('topics');
  }

  return (
    <main id="main" className="shell-wide">
      <div className="stack">
        <p style={{ margin: 0 }}>
          <Link href="/access">← Your library</Link>
        </p>
        <h1 className="page-title">{displayName}</h1>
        <div className="status status-good" role="status">
          <p style={{ margin: 0 }}>
            <strong>Unlocked.</strong> This kit is part of your library.
          </p>
        </div>
        <div className="view-switcher">
          <button
            type="button"
            className={`btn ${view === 'roadmap' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('roadmap')}
          >
            Roadmap
          </button>
          <button
            type="button"
            className={`btn ${view === 'topics' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={openTopicsView}
          >
            Topic list
          </button>
        </div>
        {view === 'roadmap' ? (
          <RoadmapView tree={tree} productId={productId} nav={nav} onSelect={handleSelect} />
        ) : (
          <TopicView tree={tree} productId={productId} nav={nav} />
        )}
      </div>
    </main>
  );
}
