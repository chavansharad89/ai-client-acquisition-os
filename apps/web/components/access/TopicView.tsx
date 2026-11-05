'use client';

import Link from 'next/link';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

import { topicsWithSectionLabels, type TopicNavigation } from './topicNavigation';

// View B (CMS-PO-011): a flat, sequential topic list with Previous/Next
// and "X of Y" position, over the same shared TopicNavigation model View
// A uses. Section labels (CMS-PO-011(D)) are plain, non-interactive text
// naming each topic's nearest-ancestor container, deduped by that
// container's identity via topicsWithSectionLabels (topicNavigation.ts)
// — not by title text, since two differently-identified sections can
// share a title.
export function TopicView({
  tree,
  productId,
  nav,
}: {
  tree: ContentTreeNode[];
  productId: string;
  nav: TopicNavigation;
}) {
  const rows = topicsWithSectionLabels(tree, nav.topics);

  return (
    <ul className="topic-list" style={{ listStyle: 'none', padding: 0 }}>
      {rows.map(({ topic, sectionTitle, showSectionLabel }) => (
        <li key={topic.id}>
          {showSectionLabel && <p className="topic-section-label">{sectionTitle}</p>}
          <Link href={`/access/${productId}?topic=${topic.id}`} className="topic-row">
            {topic.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
