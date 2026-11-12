'use client';

import Link from 'next/link';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

import { TopicDetails } from './TopicDetails';
import { ancestorPath, getAdjacentTopicIds } from './topicNavigation';

// CMS-PO-013: the dedicated topic-detail page, server-rendered at
// /access/[productId]?topic=<assetId>. Reuses TopicDetails verbatim for
// the title/description/Download body — this component only adds the
// page-level chrome (breadcrumb, back link, Previous/Next) that only
// makes sense on a standalone page, not inside the roadmap overview's
// side-by-side layout. `topic` is always an ASSET (resolveTopicParam
// guarantees this), so TopicDetails' CONTAINER branch — the only branch
// that calls onSelectChild — is unreachable here; onSelectChild is a
// stable no-op.
export function TopicDetailView({
  tree,
  productId,
  displayName,
  topic,
}: {
  tree: ContentTreeNode[];
  productId: string;
  displayName: string;
  topic: ContentTreeNode;
}) {
  const ancestors = ancestorPath(tree, topic.id);
  const { prevId, nextId } = getAdjacentTopicIds(tree, topic.id);

  return (
    <main id="main" className="shell-wide">
      <div className="stack">
        <nav aria-label="Breadcrumb">
          <Link href={`/access/${productId}`}>{displayName}</Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id}> / {ancestor.title}</span>
          ))}
          <span> / {topic.title}</span>
        </nav>
        <p style={{ margin: 0 }}>
          <Link href={`/access/${productId}`}>← Back to course overview</Link>
        </p>
        <TopicDetails node={topic} productId={productId} onSelectChild={() => {}} />
        <div className="topic-nav">
          {prevId ? (
            <Link className="btn btn-secondary" href={`/access/${productId}?topic=${prevId}`}>
              Previous
            </Link>
          ) : (
            <span className="btn btn-secondary" aria-disabled="true">
              Previous
            </span>
          )}
          {nextId ? (
            <Link className="btn btn-secondary" href={`/access/${productId}?topic=${nextId}`}>
              Next
            </Link>
          ) : (
            <span className="btn btn-secondary" aria-disabled="true">
              Next
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
