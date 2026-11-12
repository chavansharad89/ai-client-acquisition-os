'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';

import type { RoadmapNodeData } from './reactFlowLayout';

// Prototype-only (CMS-PO-012) custom node renderer for @xyflow/react.
// Three visual kinds, mirroring the production CSS flowchart's own
// three shapes (spine / single satellite / grouped satellite box) so
// the two are a fair comparison of rendering approach, not of visual
// design.
export function RoadmapNode({ data, selected }: NodeProps & { data: RoadmapNodeData }) {
  const selectedClass = selected ? ' roadmap-node-selected' : '';

  if (data.kind === 'spine') {
    return (
      <div className={`flowchart-spine-node${selectedClass}`}>
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        {data.label}
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Left} id="left" style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0 }} />
      </div>
    );
  }

  if (data.kind === 'group') {
    return (
      <div className={`flowchart-box flowchart-box-group${selectedClass}`} style={{ position: 'static' }}>
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
        <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
        <div className="flowchart-box-group-title">{data.label}</div>
        <ul className="flowchart-box-group-rows">
          {data.rows.map((row) => (
            <li key={row.id} className="flowchart-row-item">
              {row.title}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={`flowchart-box flowchart-box-single${selectedClass}`} style={{ position: 'static' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} style={{ opacity: 0 }} />
      {data.label}
    </div>
  );
}
