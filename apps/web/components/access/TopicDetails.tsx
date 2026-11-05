'use client';

import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

// Read-only detail panel for a selected roadmap/topic node — shared by
// RoadmapView (View A) and TopicView (View B), CMS-PO-011. An ASSET
// shows its description and a download link via the existing signed
// /access/[productId]/download/[assetId] redirect route (no new API,
// no client-side signing). A CONTAINER shows its description and its
// own published children as clickable rows, so selecting a section is
// never a dead end.
export function TopicDetails({
  node,
  productId,
  onSelectChild,
}: {
  node: ContentTreeNode;
  productId: string;
  onSelectChild: (id: string) => void;
}) {
  return (
    <div className="roadmap-detail">
      <h2 className="page-title" style={{ fontSize: '1.25rem' }}>
        {node.title}
      </h2>
      {node.description && <p className="lede">{node.description}</p>}

      {node.nodeType === 'ASSET' ? (
        <a className="btn btn-secondary" href={`/access/${productId}/download/${node.id}`}>
          Download
        </a>
      ) : node.children.length > 0 ? (
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {node.children.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => onSelectChild(child.id)}
              >
                {child.title}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="roadmap-detail-empty">This section has no content yet.</p>
      )}
    </div>
  );
}
