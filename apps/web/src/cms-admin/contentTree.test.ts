import type { PublicContentItem } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildContentTree, countByStatus, depthLabel, filterTreeByStatus, findPendingReplacement, locateNode } from './contentTree';

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
    status: 'DRAFT',
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    replacesContentItemId: null,
    previousStorageRetentionUntil: null,
    ...overrides,
  };
}

describe('buildContentTree', () => {
  it('nests children under their parent, sorted by orderIndex', () => {
    const items = [
      item({ id: 'roadmap', parentId: null, orderIndex: 0 }),
      item({ id: 'section-b', parentId: 'roadmap', orderIndex: 1 }),
      item({ id: 'section-a', parentId: 'roadmap', orderIndex: 0 }),
      item({ id: 'topic', parentId: 'section-a', orderIndex: 0 }),
    ];

    const tree = buildContentTree(items);

    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe('roadmap');
    expect(tree[0]?.children.map((c) => c.id)).toEqual(['section-a', 'section-b']);
    expect(tree[0]?.children[0]?.children.map((c) => c.id)).toEqual(['topic']);
  });

  it('treats a parentId pointing outside the given set as a root', () => {
    const items = [item({ id: 'orphan', parentId: 'missing-parent' })];

    const tree = buildContentTree(items);

    expect(tree.map((n) => n.id)).toEqual(['orphan']);
  });

  it('supports arbitrary nesting depth (roadmap -> section -> topic -> lesson -> resource)', () => {
    const items = [
      item({ id: 'roadmap' }),
      item({ id: 'section', parentId: 'roadmap' }),
      item({ id: 'topic', parentId: 'section' }),
      item({ id: 'lesson', parentId: 'topic' }),
      item({ id: 'resource', parentId: 'lesson', nodeType: 'ASSET', assetKind: 'FILE', bytes: '100' }),
    ];

    const tree = buildContentTree(items);

    const depth = (n: (typeof tree)[number], d = 0): number =>
      n.children.length === 0 ? d : Math.max(...n.children.map((c) => depth(c, d + 1)));
    expect(depth(tree[0]!)).toBe(4);
  });

  it('returns an empty array for an empty input', () => {
    expect(buildContentTree([])).toEqual([]);
  });
});

describe('countByStatus', () => {
  it('counts each lifecycle status independently', () => {
    const items = [
      item({ id: '1', status: 'DRAFT' }),
      item({ id: '2', status: 'DRAFT' }),
      item({ id: '3', status: 'PUBLISHED' }),
      item({ id: '4', status: 'ARCHIVED' }),
    ];

    expect(countByStatus(items)).toEqual({ DRAFT: 2, PUBLISHED: 1, ARCHIVED: 1 });
  });

  it('returns zeros for an empty list', () => {
    expect(countByStatus([])).toEqual({ DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 });
  });
});

describe('filterTreeByStatus', () => {
  const items = [
    item({ id: 'roadmap', status: 'PUBLISHED' }),
    item({ id: 'section-published', parentId: 'roadmap', status: 'PUBLISHED' }),
    item({ id: 'section-draft-only', parentId: 'roadmap', status: 'PUBLISHED' }),
    item({ id: 'topic-draft', parentId: 'section-draft-only', status: 'DRAFT' }),
  ];
  const tree = buildContentTree(items);

  it('returns the tree unchanged when status is null', () => {
    expect(filterTreeByStatus(tree, null)).toHaveLength(1);
    expect(filterTreeByStatus(tree, null)[0]?.children).toHaveLength(2);
  });

  it('keeps an ancestor whose only match is a descendant', () => {
    const filtered = filterTreeByStatus(tree, 'DRAFT');

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('roadmap');
    const sections = filtered[0]?.children ?? [];
    expect(sections.map((s) => s.id)).toEqual(['section-draft-only']);
    expect(sections[0]?.children.map((c) => c.id)).toEqual(['topic-draft']);
  });

  it('drops branches with no matching node at all', () => {
    const filtered = filterTreeByStatus(tree, 'ARCHIVED');
    expect(filtered).toEqual([]);
  });
});

describe('depthLabel', () => {
  it('labels CONTAINER nodes by depth: Roadmap, Section, Topic, then Lesson', () => {
    expect(depthLabel(0, 'CONTAINER')).toBe('Roadmap');
    expect(depthLabel(1, 'CONTAINER')).toBe('Section');
    expect(depthLabel(2, 'CONTAINER')).toBe('Topic');
    expect(depthLabel(3, 'CONTAINER')).toBe('Lesson');
    expect(depthLabel(9, 'CONTAINER')).toBe('Lesson');
  });

  it('labels ASSET nodes as Resource regardless of depth', () => {
    expect(depthLabel(0, 'ASSET')).toBe('Resource');
    expect(depthLabel(5, 'ASSET')).toBe('Resource');
  });
});

describe('locateNode', () => {
  const items = [
    item({ id: 'roadmap', orderIndex: 0 }),
    item({ id: 'section-a', parentId: 'roadmap', orderIndex: 0 }),
    item({ id: 'section-b', parentId: 'roadmap', orderIndex: 1 }),
    item({ id: 'topic', parentId: 'section-a', orderIndex: 0 }),
  ];
  const tree = buildContentTree(items);

  it('returns null parent, depth 0, and itself as the only sibling for a root', () => {
    const location = locateNode(tree, 'roadmap');
    expect(location?.parent).toBeNull();
    expect(location?.depth).toBe(0);
    expect(location?.siblings.map((s) => s.id)).toEqual(['roadmap']);
  });

  it('returns the parent node, correct depth, and sorted sibling group for a nested node', () => {
    const location = locateNode(tree, 'section-b');
    expect(location?.node.id).toBe('section-b');
    expect(location?.parent?.id).toBe('roadmap');
    expect(location?.depth).toBe(1);
    expect(location?.siblings.map((s) => s.id)).toEqual(['section-a', 'section-b']);
  });

  it('includes a lone child as a single-element sibling group', () => {
    const location = locateNode(tree, 'topic');
    expect(location?.parent?.id).toBe('section-a');
    expect(location?.depth).toBe(2);
    expect(location?.siblings.map((s) => s.id)).toEqual(['topic']);
  });

  it('returns null for an id not present in the tree', () => {
    expect(locateNode(tree, 'missing')).toBeNull();
  });
});

describe('findPendingReplacement', () => {
  it('finds the DRAFT row whose replacesContentItemId points at the given target', () => {
    const items = [
      item({ id: 'published-asset', nodeType: 'ASSET', assetKind: 'FILE', status: 'PUBLISHED', bytes: '100' }),
      item({
        id: 'pending-replacement',
        nodeType: 'ASSET',
        assetKind: 'FILE',
        status: 'DRAFT',
        bytes: '200',
        replacesContentItemId: 'published-asset',
      }),
    ];

    const found = findPendingReplacement(items, 'published-asset');

    expect(found?.id).toBe('pending-replacement');
  });

  it('returns null when no row replaces the given target', () => {
    const items = [item({ id: 'published-asset', status: 'PUBLISHED' })];

    expect(findPendingReplacement(items, 'published-asset')).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(findPendingReplacement([], 'anything')).toBeNull();
  });
});
