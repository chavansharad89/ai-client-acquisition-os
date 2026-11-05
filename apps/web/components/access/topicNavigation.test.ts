import type { PublicContentItem } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildContentTree } from '../../src/cms-admin/contentTree';

import {
  ancestorPath,
  clampIndex,
  firstDescendantTopicId,
  flattenTopics,
  getAdjacentTopicIds,
  resolveNodeClick,
  resolveSelection,
  resolveTopicParam,
  topicsWithSectionLabels,
} from './topicNavigation';

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

describe('flattenTopics', () => {
  it('collects ASSET nodes in document order regardless of nesting depth', () => {
    const tree = buildContentTree([
      item({ id: 'section-1', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'section-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'sub-section', parentId: 'section-1', orderIndex: 1 }),
      item({ id: 'topic-2', parentId: 'sub-section', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-3', orderIndex: 1 }), // root-level ASSET after section-1
    ].map((i) => (i.id === 'topic-3' ? { ...i, nodeType: 'ASSET' as const, assetKind: 'pdf' } : i)));

    expect(flattenTopics(tree).map((t) => t.id)).toEqual(['topic-1', 'topic-2', 'topic-3']);
  });

  it('never includes a CONTAINER node, even one with no ASSET children', () => {
    const tree = buildContentTree([item({ id: 'empty-section' })]);

    expect(flattenTopics(tree)).toEqual([]);
  });
});

describe('clampIndex', () => {
  it('maps -1 (no match) to 0 when topics exist', () => {
    expect(clampIndex(-1, 5)).toBe(0);
  });

  it('passes a valid index through unchanged', () => {
    expect(clampIndex(2, 5)).toBe(2);
  });

  it('maps -1 to 0 even with a single topic (total=1)', () => {
    expect(clampIndex(-1, 1)).toBe(0);
  });
});

describe('navigation index math (hasPrev/hasNext formulas used by TopicView)', () => {
  function navState(currentIndex: number, total: number) {
    const clamped = clampIndex(currentIndex, total);
    return {
      hasPrev: clamped > 0,
      hasNext: clamped < total - 1,
    };
  }

  it('at the first topic, hasPrev is false and hasNext is true when more than one topic exists', () => {
    expect(navState(0, 5)).toEqual({ hasPrev: false, hasNext: true });
  });

  it('at the last topic, hasNext is false', () => {
    expect(navState(4, 5)).toEqual({ hasPrev: true, hasNext: false });
  });

  it('with exactly one topic, both hasPrev and hasNext are false', () => {
    expect(navState(0, 1)).toEqual({ hasPrev: false, hasNext: false });
  });
});

describe('resolveSelection', () => {
  const topics = buildContentTree([
    item({ id: 'a', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    item({ id: 'b', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    item({ id: 'c', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 2 }),
  ]);

  it('"select" returns the chosen id unconditionally, even a CONTAINER id', () => {
    expect(resolveSelection({ type: 'select', id: 'some-container' }, { selectedId: 'a', topics })).toBe(
      'some-container',
    );
  });

  it('"next" advances to the following topic', () => {
    expect(resolveSelection({ type: 'next' }, { selectedId: 'a', topics })).toBe('b');
  });

  it('"next" at the last topic is a no-op (returns the current selection unchanged)', () => {
    expect(resolveSelection({ type: 'next' }, { selectedId: 'c', topics })).toBe('c');
  });

  it('"prev" at the first topic is a no-op', () => {
    expect(resolveSelection({ type: 'prev' }, { selectedId: 'a', topics })).toBe('a');
  });

  it('"next" from a CONTAINER selection (not in topics) advances from the clamped position (topic 1, already the effectively-displayed one) to topic 2', () => {
    expect(resolveSelection({ type: 'next' }, { selectedId: 'some-container', topics })).toBe('b');
  });
});

describe('topicsWithSectionLabels', () => {
  it('shows a label once per distinct section, by container identity, not by title text', () => {
    const tree = buildContentTree([
      item({ id: 'sec-a', title: 'Bonus Content', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'sec-a', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'sec-b', title: 'Bonus Content', orderIndex: 1 }), // same title, different container
      item({ id: 'topic-2', parentId: 'sec-b', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);
    const topics = flattenTopics(tree);

    const result = topicsWithSectionLabels(tree, topics);

    expect(result.map((r) => ({ id: r.topic.id, showSectionLabel: r.showSectionLabel }))).toEqual([
      { id: 'topic-1', showSectionLabel: true },
      { id: 'topic-2', showSectionLabel: true }, // must show again: different container, not deduped by title text
    ]);
  });

  it('does not repeat the label for consecutive topics under the same container', () => {
    const tree = buildContentTree([
      item({ id: 'sec-a', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'sec-a', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', parentId: 'sec-a', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    ]);
    const topics = flattenTopics(tree);

    const result = topicsWithSectionLabels(tree, topics);

    expect(result.map((r) => r.showSectionLabel)).toEqual([true, false]);
  });
});

describe('firstDescendantTopicId', () => {
  it('finds the first ASSET nested anywhere under the given container, in document order', () => {
    const tree = buildContentTree([
      item({ id: 'sec-a', orderIndex: 0 }),
      item({ id: 'sub', parentId: 'sec-a', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'sub', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    expect(firstDescendantTopicId(tree, 'sec-a')).toBe('topic-1');
  });

  it('returns null for a container with no ASSET descendants (e.g. an empty or all-container section)', () => {
    const tree = buildContentTree([item({ id: 'empty-sec' })]);

    expect(firstDescendantTopicId(tree, 'empty-sec')).toBeNull();
  });

  it('returns null for an id that is itself a topic, not a container', () => {
    const tree = buildContentTree([item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' })]);

    expect(firstDescendantTopicId(tree, 'topic-1')).toBeNull();
  });
});

describe('resolveTopicParam', () => {
  it('returns the matching ASSET node when topicParam is a real topic id', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    ]);

    expect(resolveTopicParam(tree, 'topic-1')).toEqual(tree[0]);
  });

  it('returns null when topicParam is undefined', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(resolveTopicParam(tree, undefined)).toBeNull();
  });

  it('returns null when topicParam does not match any node in the tree', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(resolveTopicParam(tree, 'nonexistent')).toBeNull();
  });

  it('returns null when topicParam matches a CONTAINER node id (never an ASSET)', () => {
    const tree = buildContentTree([
      item({ id: 'section-1', nodeType: 'CONTAINER', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'section-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    expect(resolveTopicParam(tree, 'section-1')).toBeNull();
  });
});

describe('resolveNodeClick', () => {
  it('returns {type: "navigate", href: "/access/<productId>?topic=<id>"} for an ASSET node id', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(resolveNodeClick(tree, 'topic-1', 'product-123')).toEqual({
      type: 'navigate',
      href: '/access/product-123?topic=topic-1',
    });
  });

  it('returns {type: "select", id} for a CONTAINER node id', () => {
    const tree = buildContentTree([
      item({ id: 'section-1', nodeType: 'CONTAINER' }),
    ]);

    expect(resolveNodeClick(tree, 'section-1', 'product-123')).toEqual({
      type: 'select',
      id: 'section-1',
    });
  });

  it('returns {type: "select", id} for an id not present in the tree (no navigation on an unknown id)', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(resolveNodeClick(tree, 'unknown-id', 'product-123')).toEqual({
      type: 'select',
      id: 'unknown-id',
    });
  });
});

describe('getAdjacentTopicIds', () => {
  it('returns {prevId: null, nextId: <second topic id>} for the first topic in document order', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
      item({ id: 'topic-3', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 2 }),
    ]);

    expect(getAdjacentTopicIds(tree, 'topic-1')).toEqual({
      prevId: null,
      nextId: 'topic-2',
    });
  });

  it('returns {prevId: <second-to-last>, nextId: null} for the last topic', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
      item({ id: 'topic-3', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 2 }),
    ]);

    expect(getAdjacentTopicIds(tree, 'topic-3')).toEqual({
      prevId: 'topic-2',
      nextId: null,
    });
  });

  it('returns both prevId and nextId for a topic in the middle of the sequence', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
      item({ id: 'topic-3', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 2 }),
    ]);

    expect(getAdjacentTopicIds(tree, 'topic-2')).toEqual({
      prevId: 'topic-1',
      nextId: 'topic-3',
    });
  });

  it('returns {prevId: null, nextId: null} when topicId is not in the flattened sequence', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
      item({ id: 'topic-2', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 1 }),
    ]);

    expect(getAdjacentTopicIds(tree, 'nonexistent')).toEqual({
      prevId: null,
      nextId: null,
    });
  });
});

describe('ancestorPath', () => {
  it('returns [] for a top-level (root) node', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(ancestorPath(tree, 'topic-1')).toEqual([]);
  });

  it('returns the ordered chain of CONTAINER ancestors, root first, for a deeply nested node', () => {
    const tree = buildContentTree([
      item({ id: 'root-sec', nodeType: 'CONTAINER', orderIndex: 0 }),
      item({ id: 'child-sec', parentId: 'root-sec', nodeType: 'CONTAINER', orderIndex: 0 }),
      item({ id: 'topic-1', parentId: 'child-sec', nodeType: 'ASSET', assetKind: 'pdf', orderIndex: 0 }),
    ]);

    const result = ancestorPath(tree, 'topic-1');
    expect(result.map((n) => n.id)).toEqual(['root-sec', 'child-sec']);
  });

  it('returns [] for an id not present in the tree', () => {
    const tree = buildContentTree([
      item({ id: 'topic-1', nodeType: 'ASSET', assetKind: 'pdf' }),
    ]);

    expect(ancestorPath(tree, 'nonexistent')).toEqual([]);
  });
});
