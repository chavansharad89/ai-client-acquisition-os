import type { PublicContentItem } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildContentTree } from '../../../src/cms-admin/contentTree';

import { layoutRoadmapGraph } from './reactFlowLayout';

// Prototype-only (CMS-PO-012) — not part of the production flowchart.
// Verifies the pure graph-shaping logic feeding @xyflow/react: every
// tree node becomes exactly one React Flow node, every parent-child
// relationship becomes exactly one edge, spine nodes share one x
// column, and satellites alternate sides without colliding in y.

function item(overrides: Partial<PublicContentItem> & Pick<PublicContentItem, 'id'>): PublicContentItem {
  return {
    owningProductId: 'ai_income_99',
    parentId: null,
    nodeType: 'CONTAINER',
    assetKind: null,
    title: `Item ${overrides.id}`,
    description: null,
    bytes: null,
    orderIndex: 0,
    status: 'PUBLISHED',
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    replacesContentItemId: null,
    previousStorageRetentionUntil: null,
    ...overrides,
  };
}

describe('layoutRoadmapGraph', () => {
  it('creates one graph node per spine node and per its direct (satellite) children — a grouped satellite\'s own children are not separate graph nodes, matching roadmap.sh\'s single-box grouping (e.g. "Core LLM Elements")', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'what-is', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'how-llms', orderIndex: 1 }),
      item({ id: 'core', parentId: 'how-llms', orderIndex: 0 }),
      item({ id: 'tokens', parentId: 'core', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    const { nodes } = layoutRoadmapGraph(tree);

    expect(nodes.map((n) => n.id).sort()).toEqual(['core', 'how-llms', 'intro', 'what-is'].sort());
  });

  it('creates exactly one edge per parent-child relationship, connecting the right ids', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'what-is', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    const { edges } = layoutRoadmapGraph(tree);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: 'intro', target: 'what-is' });
  });

  it('spine (depth-0) nodes share a single x coordinate and increase in y in orderIndex order', () => {
    const tree = buildContentTree([
      item({ id: 'second', orderIndex: 1 }),
      item({ id: 'first', orderIndex: 0 }),
    ]);

    const { nodes } = layoutRoadmapGraph(tree);
    const first = nodes.find((n) => n.id === 'first')!;
    const second = nodes.find((n) => n.id === 'second')!;

    expect(first.position.x).toBe(second.position.x);
    expect(first.position.y).toBeLessThan(second.position.y);
  });

  it('alternates satellite x side by child index, left first', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'sat-0', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'sat-1', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    ]);

    const { nodes } = layoutRoadmapGraph(tree);
    const spine = nodes.find((n) => n.id === 'intro')!;
    const sat0 = nodes.find((n) => n.id === 'sat-0')!;
    const sat1 = nodes.find((n) => n.id === 'sat-1')!;

    expect(sat0.position.x).toBeLessThan(spine.position.x);
    expect(sat1.position.x).toBeGreaterThan(spine.position.x);
  });

  it('a CONTAINER satellite carries its own children as data.rows for the custom node to render as a grouped box', () => {
    const tree = buildContentTree([
      item({ id: 'how-llms', orderIndex: 0 }),
      item({ id: 'core', parentId: 'how-llms', orderIndex: 0 }),
      item({ id: 'tokens', parentId: 'core', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    const { nodes } = layoutRoadmapGraph(tree);
    const core = nodes.find((n) => n.id === 'core')!;

    expect((core.data as { rows: { id: string }[] }).rows.map((r) => r.id)).toEqual(['tokens']);
  });
});
