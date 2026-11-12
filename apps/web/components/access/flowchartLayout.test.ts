import type { PublicContentItem } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildContentTree } from '../../src/cms-admin/contentTree';

import { buildFlowchart } from './flowchartLayout';

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

describe('buildFlowchart', () => {
  it('treats depth-0 nodes as the spine, in orderIndex order', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'llms', orderIndex: 1 }),
    ]);

    const flowchart = buildFlowchart(tree);

    expect(flowchart.map((s) => s.node.id)).toEqual(['intro', 'llms']);
  });

  it('a CONTAINER child becomes a satellite box whose rows are its own children', () => {
    const tree = buildContentTree([
      item({ id: 'how-llms-work', orderIndex: 0 }),
      item({ id: 'core-elements', parentId: 'how-llms-work', orderIndex: 0 }),
      item({ id: 'tokens', parentId: 'core-elements', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'context', parentId: 'core-elements', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    ]);

    const flowchart = buildFlowchart(tree);

    expect(flowchart[0]!.satellites).toHaveLength(1);
    expect(flowchart[0]!.satellites[0]!.node.id).toBe('core-elements');
    expect(flowchart[0]!.satellites[0]!.rows.map((r) => r.id)).toEqual(['tokens', 'context']);
  });

  it('an ASSET child becomes a satellite box with no rows (it is the box itself)', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'what-is-ai', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    const flowchart = buildFlowchart(tree);

    expect(flowchart[0]!.satellites[0]!.node.id).toBe('what-is-ai');
    expect(flowchart[0]!.satellites[0]!.rows).toEqual([]);
  });

  it('alternates satellite side left/right by index, left first', () => {
    const tree = buildContentTree([
      item({ id: 'intro', orderIndex: 0 }),
      item({ id: 'sat-0', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'sat-1', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
      item({ id: 'sat-2', parentId: 'intro', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 2 }),
    ]);

    const flowchart = buildFlowchart(tree);

    expect(flowchart[0]!.satellites.map((s) => s.side)).toEqual(['left', 'right', 'left']);
  });

  it('a spine node with no children has an empty satellites array, not an error', () => {
    const tree = buildContentTree([item({ id: 'lonely', orderIndex: 0 })]);

    const flowchart = buildFlowchart(tree);

    expect(flowchart[0]!.satellites).toEqual([]);
  });
});
