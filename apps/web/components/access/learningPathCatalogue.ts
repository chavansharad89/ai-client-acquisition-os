import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

// Pure filter/sort/pagination logic for the Plus Learning Path catalogue
// (CMS-PO-014, Requirement A). Operates only on fields that actually exist
// on ContentItem — title, description, updatedAt — per CMS-PO-014 §5
// acceptance criterion 6 ("no new database column or CMS designation is
// introduced to identify learning paths"). No category/difficulty/
// duration/thumbnail field exists, so none is read here.

export type LearningPathSortKey = 'title-asc' | 'recently-updated';

/**
 * Case-insensitive substring match over title + description only — this
 * page never searches into a path's descendant topics/assets, since that
 * would change existing roadmap/topic navigation behavior.
 */
export function filterLearningPaths(paths: readonly ContentTreeNode[], query: string): ContentTreeNode[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [...paths];
  return paths.filter((path) => {
    const title = path.title.toLowerCase();
    const description = path.description?.toLowerCase() ?? '';
    return title.includes(trimmed) || description.includes(trimmed);
  });
}

export function sortLearningPaths(paths: readonly ContentTreeNode[], sortKey: LearningPathSortKey): ContentTreeNode[] {
  const copy = [...paths];
  if (sortKey === 'recently-updated') {
    copy.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } else {
    copy.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
  }
  return copy;
}

export interface PaginatedLearningPaths {
  items: ContentTreeNode[];
  page: number;
  totalPages: number;
  totalCount: number;
}

/** `page` is clamped into [1, totalPages] — an out-of-range request never produces an empty page. */
export function paginateLearningPaths(
  paths: readonly ContentTreeNode[],
  page: number,
  pageSize: number,
): PaginatedLearningPaths {
  const totalCount = paths.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;
  return {
    items: paths.slice(start, start + pageSize),
    page: clampedPage,
    totalPages,
    totalCount,
  };
}

export interface CatalogueParams {
  query: string;
  sortKey: LearningPathSortKey;
  page: number;
  pageSize: number;
}

export function getVisibleLearningPaths(
  paths: readonly ContentTreeNode[],
  params: CatalogueParams,
): PaginatedLearningPaths {
  const filtered = filterLearningPaths(paths, params.query);
  const sorted = sortLearningPaths(filtered, params.sortKey);
  return paginateLearningPaths(sorted, params.page, params.pageSize);
}
