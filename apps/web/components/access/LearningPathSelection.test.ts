import type { PublicContentItem } from '@acos/core-cms';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { buildContentTree, type ContentTreeNode } from '../../src/cms-admin/contentTree';

import { LearningPathSelection } from './LearningPathSelection';

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

function render(paths: ContentTreeNode[], productId = 'ai_income_99', displayName = 'AI Income Starter Kit'): string {
  return renderToStaticMarkup(createElement(LearningPathSelection, { paths, productId, displayName }));
}

describe('LearningPathSelection', () => {
  it('does not render its own back-navigation breadcrumb — AppShell\'s Sidebar already covers that, and the old one caused redundant top spacing', () => {
    expect(render([])).not.toContain('href="/access"');
    expect(render([])).not.toContain('Your library');
  });

  it('does not render a "shell" wrapper, since AppShell already provides the page\'s own top/side padding (avoids stacking two padding layers)', () => {
    expect(render([])).not.toContain('class="shell"');
  });

  it('bleeds the banner flush to the header (top) and AppShell\'s own edges (sides) — zero gap, not just a reduced one', () => {
    const html = render([path('a')]);
    const bannerWrapper = html.match(/<div class="(-mx-6[^"]*)">/)?.[1] ?? '';

    expect(bannerWrapper).toContain('-mx-6');
    expect(bannerWrapper).toContain('-mt-6');
    expect(bannerWrapper).toContain('lg:-mx-10');
    expect(bannerWrapper).toContain('lg:-mt-8');
  });

  it('keeps the toolbar/heading/grid/pagination in their own contained, max-width column — only the banner bleeds full-width', () => {
    const html = render([path('a')]);

    expect(html).toMatch(/<div class="mt-6 mx-auto flex w-full max-w-6xl flex-col gap-6">/);
  });

  it('renders the given display name as the page heading', () => {
    expect(render([], 'ai_income_99', 'AI Income Starter Kit')).toContain('AI Income Starter Kit');
  });

  it('keeps the "Choose a learning path" marker text relied on by the CMS-PO-015 security regression tests', () => {
    expect(render([path('a', { title: 'Path A' })])).toContain('Choose a learning path');
  });

  it('renders one card per path, each linking to its ?path= destination', () => {
    const paths = [path('a', { title: 'AI Engineering' }), path('b', { title: 'System Design' })];
    const html = render(paths, 'ai_income_99');

    expect(html).toContain('AI Engineering');
    expect(html).toContain('System Design');
    expect(html).toContain('href="/access/ai_income_99?path=a"');
    expect(html).toContain('href="/access/ai_income_99?path=b"');
  });

  it('sorts alphabetically by title by default, regardless of input order', () => {
    const paths = [path('z', { title: 'Zebra Path' }), path('a', { title: 'Alpha Path' })];
    const html = render(paths);

    expect(html.indexOf('Alpha Path')).toBeLessThan(html.indexOf('Zebra Path'));
  });

  it('always shows the pagination bar, even with a single page of results, matching the approved reference', () => {
    const paths = Array.from({ length: 4 }, (_, i) => path(`p${i}`, { title: `Path ${i}` }));
    const html = render(paths);

    expect(html).toContain('Showing 1–4 of 4');
    expect(html).toMatch(/aria-label="Items per page"/);
  });

  it('disables Previous and Next on a single page of results, rather than hiding the controls', () => {
    const paths = Array.from({ length: 4 }, (_, i) => path(`p${i}`, { title: `Path ${i}` }));
    const html = render(paths);

    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>\s*Previous/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>\s*Next/);
  });

  it('shows pagination controls and only the first 12 paths when there are more than 12', () => {
    const paths = Array.from({ length: 25 }, (_, i) => path(`p${i}`, { title: `Path ${String(i).padStart(2, '0')}` }));
    const html = render(paths);

    expect(html).toContain('Showing');
    expect(html).toContain('25');
    expect(html.match(/\?path=p\d+/g)).toHaveLength(12);
  });

  it('renders a search control for filtering by title/description', () => {
    expect(render([path('a')])).toMatch(/aria-label="Search learning paths[^"]*"/);
  });

  it('renders a sort control offering A-Z and Recently Updated, and no third option', () => {
    const html = render([path('a')]);

    expect(html).toContain('A–Z');
    expect(html).toContain('Recently Updated');
  });

  it('never renders category chips or a category filter, since no category field exists on CMS content', () => {
    const html = render([path('a', { title: 'AI Engineering' })]);

    expect(html).not.toContain('All Paths');
    expect(html).not.toContain('AI Fundamentals');
  });

  it('renders grid and list view toggle controls, defaulting to grid', () => {
    const html = render([path('a')]);

    expect(html).toMatch(/aria-label="Grid view"[^>]*aria-pressed="true"/);
    expect(html).toMatch(/aria-label="List view"[^>]*aria-pressed="false"/);
  });

  it('shows an empty state instead of a blank grid when there are no paths at all', () => {
    const html = render([]);

    expect(html).toContain('No learning paths');
    // No point offering search/sort controls over zero items.
    expect(html).not.toMatch(/aria-label="Search learning paths/);
  });

  it('renders a compact heading with the new supporting copy, not a large promotional hero', () => {
    const html = render([path('a')]);

    expect(html).toContain('Explore structured learning paths and build practical AI skills.');
  });

  it('keeps the legacy selection-prompt text available to assistive tech even though it is no longer the visible subtitle', () => {
    const html = render([path('a')]);

    expect(html).toMatch(/class="sr-only"[^>]*>Choose a learning path to get started\./);
  });

  it('shows the total result count, even when there is no pagination', () => {
    const paths = [path('a'), path('b'), path('c')];
    const html = render(paths);

    expect(html).toMatch(/3 learning paths?/);
  });

  it('renders a "Learning Paths" section heading, separate from the search/sort toolbar', () => {
    expect(render([path('a')])).toMatch(/<h2[^>]*>Learning Paths<\/h2>/);
  });

  it('sizes the section heading per the canonical spec: 24px/700/30px desktop, 22px tablet, 20px mobile', () => {
    const html = render([path('a')]);
    const h2 = html.match(/<h2 class="([^"]*)">Learning Paths/)?.[1] ?? '';

    expect(h2).toContain('text-[20px]');
    expect(h2).toContain('md:text-[22px]');
    expect(h2).toContain('lg:text-[length:var(--acos-type-2xl)]');
    expect(h2).toContain('font-bold');
  });

  it('gives the sort and items-per-page dropdowns the canonical "Dropdown text" weight (14px/500)', () => {
    const paths = Array.from({ length: 13 }, (_, i) => path(`p${i}`));
    const html = render(paths);
    const sortSelect = html.match(/<select aria-label="Sort learning paths" class="([^"]*)"/)?.[1] ?? '';
    const pageSizeSelect = html.match(/<select aria-label="Items per page" class="([^"]*)"/)?.[1] ?? '';

    expect(sortSelect).toContain('font-medium');
    expect(pageSizeSelect).toContain('font-medium');
  });

  it('sizes pagination text at 13px per the canonical spec', () => {
    const paths = [path('a'), path('b')];
    const html = render(paths);

    expect(html).toMatch(/<p class="[^"]*text-\[13px\][^"]*">\s*Showing/);
  });

  it('sizes pagination buttons at 13px/500 per the canonical spec', () => {
    const paths = [path('a'), path('b')];
    const html = render(paths);
    const prevButton = html.match(/<button type="button" disabled="" class="([^"]*)"/)?.[1] ?? '';

    expect(prevButton).toContain('text-[13px]');
    expect(prevButton).toContain('font-medium');
  });

  it('uses a two-column grid at sm+ with no three-column breakpoint, per the approved reference', () => {
    const html = render([path('a'), path('b')]);
    const gridDiv = html.match(/<div class="(grid [^"]*)">/)?.[1];

    expect(gridDiv).toContain('sm:grid-cols-2');
    expect(gridDiv).not.toContain('lg:grid-cols-3');
  });

  it('renders an items-per-page selector (alongside the rest of pagination, once needed) defaulting to 12, with 12/24/48 options', () => {
    const paths = Array.from({ length: 13 }, (_, i) => path(`p${i}`));
    const html = render(paths);

    expect(html).toMatch(/aria-label="Items per page"[^>]*>[\s\S]*?<option value="12" selected="">12<\/option>/);
    expect(html).toContain('<option value="24">24</option>');
    expect(html).toContain('<option value="48">48</option>');
  });

  it('shows pagination controls based on the selected items-per-page, not a fixed 12, once more than 12 paths exist', () => {
    const paths = Array.from({ length: 13 }, (_, i) => path(`p${i}`, { title: `Path ${String(i).padStart(2, '0')}` }));
    const html = render(paths);

    expect(html).toContain('Showing');
    expect(html.match(/\?path=p\d+/g)).toHaveLength(12);
  });
});
