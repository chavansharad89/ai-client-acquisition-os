'use client';

import { assetIcon } from '../../src/cms-admin/assetIcon';
import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

import { buildFlowchart, type SatelliteBox } from './flowchartLayout';

// Roadmap View's flowchart body (CMS-PO-011 visual-redesign addendum):
// a vertical spine of top-level topics, each branching into satellite
// boxes on alternating sides via a dotted connector — roadmap.sh's own
// visual language, built with plain CSS (no new dependency), using the
// same absolutely-positioned-border connector technique the existing
// admin tree (RoadmapSection.tsx) already uses for its indent guide.
//
// Every node is clickable at every level (CMS-PO-011(E)): the spine
// node itself, each satellite box, and each row inside a grouped
// satellite box. A row's own children (4th level and beyond — deeper
// than roadmap.sh's own reference goes) render as a small nested list
// inside that row rather than further spatial branching.

function NestedRows({
  nodes,
  selectedId,
  onSelect,
}: {
  nodes: ContentTreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flowchart-nested-list">
      {nodes.map((node) => (
        <li key={node.id}>
          <button
            type="button"
            className={`flowchart-row-item${node.id === selectedId ? ' roadmap-node-selected' : ''}`}
            onClick={() => onSelect(node.id)}
          >
            {node.title}
          </button>
          <NestedRows nodes={node.children} selectedId={selectedId} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

function SatelliteBoxView({
  box,
  selectedId,
  onSelect,
}: {
  box: SatelliteBox;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { node, rows } = box;
  const isSelected = node.id === selectedId;

  if (rows.length === 0) {
    const Icon = node.nodeType === 'ASSET' ? assetIcon(node.assetKind) : undefined;
    return (
      <button
        type="button"
        className={`flowchart-box flowchart-box-single${isSelected ? ' roadmap-node-selected' : ''}`}
        onClick={() => onSelect(node.id)}
      >
        {Icon && <Icon className="roadmap-node-icon" />}
        {node.title}
      </button>
    );
  }

  return (
    <div className="flowchart-box flowchart-box-group">
      <button
        type="button"
        className={`flowchart-box-group-title${isSelected ? ' roadmap-node-selected' : ''}`}
        onClick={() => onSelect(node.id)}
      >
        {node.title}
      </button>
      <ul className="flowchart-box-group-rows">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              className={`flowchart-row-item${row.id === selectedId ? ' roadmap-node-selected' : ''}`}
              onClick={() => onSelect(row.id)}
            >
              {row.title}
            </button>
            <NestedRows nodes={row.children} selectedId={selectedId} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoadmapFlowchart({
  tree,
  selectedId,
  onSelect,
}: {
  tree: ContentTreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const spine = buildFlowchart(tree);

  return (
    <div className="flowchart">
      {spine.map((spineItem) => {
        const left = spineItem.satellites.filter((s) => s.side === 'left');
        const right = spineItem.satellites.filter((s) => s.side === 'right');
        return (
          <div key={spineItem.node.id} className="flowchart-row">
            <div className="flowchart-side flowchart-side-left">
              {left.map((box) => (
                <SatelliteBoxView key={box.node.id} box={box} selectedId={selectedId} onSelect={onSelect} />
              ))}
            </div>
            <div className="flowchart-spine">
              <button
                type="button"
                className={`flowchart-spine-node${spineItem.node.id === selectedId ? ' roadmap-node-selected' : ''}`}
                onClick={() => onSelect(spineItem.node.id)}
              >
                {spineItem.node.title}
              </button>
            </div>
            <div className="flowchart-side flowchart-side-right">
              {right.map((box) => (
                <SatelliteBoxView key={box.node.id} box={box} selectedId={selectedId} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
