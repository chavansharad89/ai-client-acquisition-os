'use client';

import { useMemo, useState } from 'react';
import { Layers, LayoutGrid, List, Search } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

import { LearningPathBanner } from './LearningPathBanner';
import { LearningPathCard } from './LearningPathCard';
import { getVisibleLearningPaths, type LearningPathSortKey } from './learningPathCatalogue';
import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

// CMS-PO-014 (Requirement A, Plus only): the page shown before any Roadmap
// View / Topic-wise View, listing one card per depth-0 CONTAINER (= one
// "learning path") in the product's entitlement-filtered tree. Search/sort/
// pagination operate only on existing content_items fields (title,
// description, updatedAt) — no category/difficulty/duration/thumbnail
// field exists on ContentItem, so none is read or fabricated here
// (CMS-PO-014 §5 acceptance criterion 6).
export function LearningPathSelection({
  paths,
  productId,
  displayName,
}: {
  paths: ContentTreeNode[];
  productId: string;
  displayName: string;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<LearningPathSortKey>('title-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const visible = useMemo(
    () => getVisibleLearningPaths(paths, { query, sortKey, page, pageSize }),
    [paths, query, sortKey, page, pageSize],
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  function handleSortChange(value: LearningPathSortKey) {
    setSortKey(value);
    setPage(1);
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value);
    setPage(1);
  }

  const rangeStart = visible.totalCount === 0 ? 0 : (visible.page - 1) * pageSize + 1;
  const rangeEnd = Math.min(visible.page * pageSize, visible.totalCount);

  return (
    <main id="main">
      {/* Full-bleed: cancels AppShell's own content-wrapper padding
          (px-6 py-6, lg:px-10 py-8) with a matching negative margin, so
          the banner sits flush against the header (top) and the content
          area's own edges (sides) — same treatment as the /home and
          /access hero sections. Only the banner breaks out; everything
          else below stays in its own max-width column. */}
      <div className="-mx-6 -mt-6 lg:-mx-10 lg:-mt-8">
        <LearningPathBanner displayName={displayName} />
      </div>

      <div className="mt-6 mx-auto flex w-full max-w-6xl flex-col gap-6">
        {paths.length === 0 ? (
          <EmptyState
            title="No learning paths yet"
            description="Check back soon — new learning paths are added regularly."
          />
        ) : (
          <>
            {/* A. Catalogue toolbar — search + sort only. No category
                dropdown: no category field exists on ContentItem, and one
                is never invented (CMS-PO-014 §5 acceptance criterion 6). */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Search learning paths and courses</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search learning paths and courses"
                  placeholder="Search learning paths and courses..."
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring!"
                />
              </label>

              <label>
                <span className="sr-only">Sort learning paths</span>
                {/* "Dropdown text": 14px/500/20px per the canonical spec. */}
                <select
                  aria-label="Sort learning paths"
                  value={sortKey}
                  onChange={(event) => handleSortChange(event.target.value as LearningPathSortKey)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring!"
                >
                  <option value="title-asc">A–Z</option>
                  <option value="recently-updated">Recently Updated</option>
                </select>
              </label>
            </div>

            {/* B. Section heading — title, live count, view toggle. */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-plus" aria-hidden="true" />
                <div>
                  {/* "Section headings": 24px/700/30px desktop, 22px tablet,
                      20px mobile. */}
                  <h2 className="m-0 text-[20px] font-bold leading-[25px] text-foreground md:text-[22px] md:leading-[28px] lg:text-[length:var(--acos-type-2xl)] lg:leading-[30px]">
                    Learning Paths
                  </h2>
                  <p className="m-0 text-sm text-muted-foreground">
                    {visible.totalCount} learning path{visible.totalCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              <div role="group" aria-label="Catalogue view" className="flex gap-1 rounded-md border border-border p-1">
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded',
                    view === 'grid' ? 'bg-plus text-plus-foreground!' : 'text-muted-foreground',
                  )}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded',
                    view === 'list' ? 'bg-plus text-plus-foreground!' : 'text-muted-foreground',
                  )}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* C. Learning path cards — one card implementation (image-left,
                text-middle, circular arrow-right) for both views; only the
                container layout differs. */}
            {visible.items.length === 0 ? (
              <EmptyState
                title="No learning paths match your search"
                description={`Try a different search term — no results for "${query}".`}
              />
            ) : (
              <div className={cn(view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'flex flex-col gap-3')}>
                {visible.items.map((path) => (
                  <LearningPathCard
                    key={path.id}
                    id={path.id}
                    title={path.title}
                    description={path.description}
                    href={`/access/${productId}?path=${path.id}`}
                  />
                ))}
              </div>
            )}

            {/* D. Pagination — current range/total, Prev/Next, page
                indicator, items-per-page. Always shown (matching the
                approved reference, which displays it even for a single
                page) — Previous/Next simply disable themselves rather than
                the whole bar disappearing. Pure client-side over the
                already server-filtered/paginated-in-memory list; no new
                database query layer. */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
              {/* "Pagination text": 13px/400/20px. "Pagination buttons":
                  13px/500/20px — both per the canonical spec. */}
              <p className="m-0 text-[13px] leading-[20px] text-muted-foreground">
                Showing {rangeStart}–{rangeEnd} of {visible.totalCount}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage(visible.page - 1)}
                  disabled={visible.page <= 1}
                  className="h-9 rounded-md border border-border px-3 text-[13px] font-medium leading-[20px] text-foreground disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-[13px] leading-[20px] text-muted-foreground">
                  Page {visible.page} of {visible.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(visible.page + 1)}
                  disabled={visible.page >= visible.totalPages}
                  className="h-9 rounded-md border border-border px-3 text-[13px] font-medium leading-[20px] text-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-[13px] leading-[20px] text-muted-foreground">Items per page:</span>
                <select
                  aria-label="Items per page"
                  value={pageSize}
                  onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring!"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
