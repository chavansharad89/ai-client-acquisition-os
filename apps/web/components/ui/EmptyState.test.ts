import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title only when description/icon/action are omitted', () => {
    const html = renderToStaticMarkup(createElement(EmptyState, { title: 'No roadmaps yet' }));

    expect(html).toContain('No roadmaps yet');
  });

  it('renders an optional description', () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, { title: 'No roadmaps yet', description: 'Check back soon.' }),
    );

    expect(html).toContain('Check back soon.');
  });

  it('renders an optional action', () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, { title: 'No roadmaps yet', action: createElement('button', null, 'Browse') }),
    );

    expect(html).toContain('Browse');
  });

  it('hides a provided icon from assistive tech', () => {
    const html = renderToStaticMarkup(
      createElement(EmptyState, { title: 'No roadmaps yet', icon: createElement('svg', { 'data-testid': 'icon' }) }),
    );

    expect(html).toContain('aria-hidden="true"');
  });
});
