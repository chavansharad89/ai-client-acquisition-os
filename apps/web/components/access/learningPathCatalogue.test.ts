import type { PublicContentItem } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildContentTree, type ContentTreeNode } from '../../src/cms-admin/contentTree';

import {
  filterLearningPaths,
  getVisibleLearningPaths,
  paginateLearningPaths,
  sortLearningPaths,
} from './learningPathCatalogue';

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

function path(id: string, overrides: Partial<PublicContentItem> = {}): ContentTreeNode {
  return buildContentTree([item({ id, ...overrides })])[0]!;
}

describe('filterLearningPaths', () => {
  it('returns every path unchanged when the query is empty', () => {
    const paths = [path('a', { title: 'AI Engineering' }), path('b', { title: 'System Design' })];

    expect(filterLearningPaths(paths, '')).toEqual(paths);
  });

  it('returns every path unchanged when the query is only whitespace', () => {
    const paths = [path('a', { title: 'AI Engineering' })];

    expect(filterLearningPaths(paths, '   ')).toEqual(paths);
  });

  it('matches a title case-insensitively', () => {
    const paths = [path('a', { title: 'AI Engineering' }), path('b', { title: 'System Design' })];

    expect(filterLearningPaths(paths, 'engineering').map((p) => p.id)).toEqual(['a']);
  });

  it('matches a description when the title does not match', () => {
    const paths = [
      path('a', { title: 'Path One', description: 'Covers vector databases and RAG.' }),
      path('b', { title: 'Path Two', description: 'Covers load balancing.' }),
    ];

    expect(filterLearningPaths(paths, 'vector').map((p) => p.id)).toEqual(['a']);
  });

  it('excludes a path whose title and description both fail to match', () => {
    const paths = [path('a', { title: 'Path One', description: 'Unrelated copy.' })];

    expect(filterLearningPaths(paths, 'nonexistent-term')).toEqual([]);
  });

  it('never throws when a path has no description', () => {
    const paths = [path('a', { title: 'Path One', description: null })];

    expect(filterLearningPaths(paths, 'nonexistent-term')).toEqual([]);
  });
});

describe('sortLearningPaths', () => {
  it('sorts title-asc alphabetically, case-insensitively', () => {
    const paths = [path('a', { title: 'system design' }), path('b', { title: 'AI Engineering' })];

    expect(sortLearningPaths(paths, 'title-asc').map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('sorts recently-updated by updatedAt descending', () => {
    const paths = [
      path('a', { title: 'Older', updatedAt: new Date('2026-01-01') }),
      path('b', { title: 'Newer', updatedAt: new Date('2026-06-01') }),
    ];

    expect(sortLearningPaths(paths, 'recently-updated').map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const paths = [path('a', { title: 'Z' }), path('b', { title: 'A' })];
    const original = [...paths];

    sortLearningPaths(paths, 'title-asc');

    expect(paths).toEqual(original);
  });
});

describe('paginateLearningPaths', () => {
  const paths = Array.from({ length: 25 }, (_, i) => path(`p${i}`, { title: `Path ${i}` }));

  it('returns the first pageSize items on page 1', () => {
    const result = paginateLearningPaths(paths, 1, 12);

    expect(result.items).toHaveLength(12);
    expect(result.items[0]!.id).toBe('p0');
    expect(result.items[11]!.id).toBe('p11');
  });

  it('returns the next slice on page 2', () => {
    const result = paginateLearningPaths(paths, 2, 12);

    expect(result.items[0]!.id).toBe('p12');
    expect(result.items).toHaveLength(12);
  });

  it('returns the remainder on the last page', () => {
    const result = paginateLearningPaths(paths, 3, 12);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe('p24');
  });

  it('computes totalPages and totalCount', () => {
    const result = paginateLearningPaths(paths, 1, 12);

    expect(result.totalCount).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('clamps a page number beyond the last page to the last page', () => {
    const result = paginateLearningPaths(paths, 99, 12);

    expect(result.page).toBe(3);
    expect(result.items[0]!.id).toBe('p24');
  });

  it('clamps a page number below 1 to page 1', () => {
    const result = paginateLearningPaths(paths, 0, 12);

    expect(result.page).toBe(1);
  });

  it('reports a single page when every item fits within pageSize', () => {
    const result = paginateLearningPaths(paths.slice(0, 5), 1, 12);

    expect(result.totalPages).toBe(1);
    expect(result.items).toHaveLength(5);
  });

  it('reports one page (not zero) for an empty list', () => {
    const result = paginateLearningPaths([], 1, 12);

    expect(result.totalPages).toBe(1);
    expect(result.totalCount).toBe(0);
    expect(result.items).toEqual([]);
  });
});

describe('getVisibleLearningPaths', () => {
  it('filters, then sorts, then paginates in that order', () => {
    const paths = [
      path('a', { title: 'Zebra Engineering', description: null }),
      path('b', { title: 'Alpha Engineering', description: null }),
      path('c', { title: 'Unrelated Path', description: null }),
    ];

    const result = getVisibleLearningPaths(paths, { query: 'engineering', sortKey: 'title-asc', page: 1, pageSize: 12 });

    expect(result.items.map((p) => p.id)).toEqual(['b', 'a']);
    expect(result.totalCount).toBe(2);
  });
});
