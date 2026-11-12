'use client';

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useState } from 'react';

import type { ContentTreeNode } from '../../../src/cms-admin/contentTree';
import { locateNode } from '../../../src/cms-admin/contentTree';
import { TopicDetails } from '../TopicDetails';

import { layoutRoadmapGraph, type RoadmapNodeData } from './reactFlowLayout';
import { RoadmapNode } from './RoadmapNode';


const nodeTypes = { roadmapNode: RoadmapNode };

function Canvas({ tree, productId }: { tree: ContentTreeNode[]; productId: string }) {
  const initial = layoutRoadmapGraph(tree);
  const [nodes, , onNodesChange] = useNodesState<Node<RoadmapNodeData>>(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onNodeClick = useCallback((_: unknown, node: Node) => setSelectedId(node.id), []);

  const location = selectedId ? locateNode(tree, selectedId) : null;

  return (
    <div className="stack">
      <div style={{ height: 560, border: '1px solid var(--line)', borderRadius: 'var(--radius)' }}>
        <ReactFlow
          nodes={nodes.map((n) => ({ ...n, selected: n.id === selectedId }))}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      {location && (
        <TopicDetails node={location.node} productId={productId} onSelectChild={setSelectedId} />
      )}
    </div>
  );
}

export function RoadmapReactFlowCanvas(props: { tree: ContentTreeNode[]; productId: string }) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
