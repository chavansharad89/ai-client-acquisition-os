import type { Edge, Node } from '@xyflow/react';

import type { ContentTreeNode } from '../../../src/cms-admin/contentTree';

// Prototype-only (CMS-PO-012) — pure graph-shaping for the @xyflow/react
// evaluation. Not used by the production flowchart (RoadmapFlowchart.tsx
// / flowchartLayout.ts), which stays untouched. Computes explicit pixel
// positions (what React Flow's Node.position requires) from the same
// ContentTreeNode tree, using the same spine + alternating-satellite
// shape as the production CSS layout, so the two are a fair visual
// comparison of rendering approach, not of layout algorithm.

const SPINE_X = 0;
const ROW_HEIGHT = 260;
const SATELLITE_OFFSET_X = 320;
const SATELLITE_GAP_Y = 110;

export interface RoadmapNodeData extends Record<string, unknown> {
  label: string;
  kind: 'spine' | 'group' | 'asset';
  rows: ContentTreeNode[];
}

function satelliteNodesAndEdges(
  parent: ContentTreeNode,
  parentY: number,
): { nodes: Node<RoadmapNodeData>[]; edges: Edge[] } {
  const left = parent.children.filter((_, i) => i % 2 === 0);
  const right = parent.children.filter((_, i) => i % 2 === 1);
  const nodes: Node<RoadmapNodeData>[] = [];
  const edges: Edge[] = [];

  const place = (group: ContentTreeNode[], xSign: 1 | -1) => {
    group.forEach((child, i) => {
      const y = parentY - ((group.length - 1) * SATELLITE_GAP_Y) / 2 + i * SATELLITE_GAP_Y;
      nodes.push({
        id: child.id,
        type: 'roadmapNode',
        position: { x: SPINE_X + xSign * SATELLITE_OFFSET_X, y },
        data: {
          label: child.title,
          kind: child.nodeType === 'CONTAINER' ? 'group' : 'asset',
          rows: child.nodeType === 'CONTAINER' ? child.children : [],
        },
      });
      edges.push({ id: `e-${parent.id}-${child.id}`, source: parent.id, target: child.id });
    });
  };

  place(left, -1);
  place(right, 1);

  return { nodes, edges };
}

export function layoutRoadmapGraph(tree: readonly ContentTreeNode[]): {
  nodes: Node<RoadmapNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<RoadmapNodeData>[] = [];
  const edges: Edge[] = [];

  tree.forEach((spineNode, rowIndex) => {
    const y = rowIndex * ROW_HEIGHT;
    nodes.push({
      id: spineNode.id,
      type: 'roadmapNode',
      position: { x: SPINE_X, y },
      data: { label: spineNode.title, kind: 'spine', rows: [] },
    });
    const satellites = satelliteNodesAndEdges(spineNode, y);
    nodes.push(...satellites.nodes);
    edges.push(...satellites.edges);
  });

  return { nodes, edges };
}
