'use client';

import { useMemo, useState } from 'react';
import { FolderGit2, LayoutGrid, List, Search } from 'lucide-react';

import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

import { LearningPathCard } from './LearningPathCard';
import { getVisibleLearningPaths, type LearningPathSortKey } from './learningPathCatalogue';
import { RepositoryBanner } from './RepositoryBanner';
import type { ContentTreeNode } from '../../src/cms-admin/contentTree';

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
const DEFAULT_PAGE_SIZE = 12;

// Pro's landing page: the bare overview (no ?path=/?topic=) lists one card
// per depth-0 CONTAINER as a "repository", extending Plus's Learning Path
// Selection pattern (CMS-PO-014) to Pro per explicit 2026-11-12 direction.
// Deliberately reuses the same search/sort/pagination logic
// (learningPathCatalogue.ts already operates on generic ContentTreeNode[]
// fields, nothing Plus-specific) and the same card component, so the only
// new surface area is copy, iconography, and the --primary accent Pro
// already owns in the ACOS palette.
export function RepositorySelection({
  repositories,
  productId,
  displayName,
}: {
  repositories: ContentTreeNode[];
  productId: string;
  displayName: string;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<LearningPathSortKey>('title-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const visible = useMemo(
    () => getVisibleLearningPaths(repositories, { query, sortKey, page, pageSize }),
    [repositories, query, sortKey, page, pageSize],
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
      {/* Full-bleed banner, same treatment as the Plus catalogue. */}
      <div className="-mx-6 -mt-6 lg:-mx-10 lg:-mt-8">
        <RepositoryBanner displayName={displayName} />
      </div>

      <div className="mt-6 mx-auto flex w-full max-w-6xl flex-col gap-6">
        {repositories.length === 0 ? (
          <EmptyState
            title="No repositories yet"
            description="Check back soon — new repositories are added regularly."
          />
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <span className="sr-only">Search repositories</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Search repositories"
                  placeholder="Search repositories..."
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring!"
                />
              </label>

              <label>
                <span className="sr-only">Sort repositories</span>
                <select
                  aria-label="Sort repositories"
                  value={sortKey}
                  onChange={(event) => handleSortChange(event.target.value as LearningPathSortKey)}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring!"
                >
                  <option value="title-asc">A–Z</option>
                  <option value="recently-updated">Recently Updated</option>
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="m-0 text-[20px] font-bold leading-[25px] text-foreground md:text-[22px] md:leading-[28px] lg:text-[length:var(--acos-type-2xl)] lg:leading-[30px]">
                    Git Repositories
                  </h2>
                  <p className="m-0 text-sm text-muted-foreground">
                    {visible.totalCount} repositor{visible.totalCount === 1 ? 'y' : 'ies'}
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
                    view === 'grid' ? 'bg-primary text-primary-foreground!' : 'text-muted-foreground',
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
                    view === 'list' ? 'bg-primary text-primary-foreground!' : 'text-muted-foreground',
                  )}
                >
                  <List className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {visible.items.length === 0 ? (
              <EmptyState
                title="No repositories match your search"
                description={`Try a different search term — no results for "${query}".`}
              />
            ) : (
              <div className={cn(view === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'flex flex-col gap-3')}>
                {visible.items.map((repository) => (
                  <LearningPathCard
                    key={repository.id}
                    id={repository.id}
                    title={repository.title}
                    description={repository.description}
                    href={`/access/${productId}?path=${repository.id}`}
                    hoverBorderClassName="hover:border-primary/40"
                    arrowClassName="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground!"
                  />
                ))}
              </div>
            )}

            <div className="flex flex-col items-center justify-between gap-3 border-t border-border pt-4 sm:flex-row">
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
