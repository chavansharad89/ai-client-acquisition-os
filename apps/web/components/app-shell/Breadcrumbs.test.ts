import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders nothing for an empty trail', () => {
    const html = renderToStaticMarkup(createElement(Breadcrumbs, { items: [] }));

    expect(html).toBe('');
  });

  it('links every item except the last, and marks the last as the current page', () => {
    const html = renderToStaticMarkup(
      createElement(Breadcrumbs, {
        items: [{ label: 'Home', href: '/home' }, { label: 'Section', href: '/home/section' }, { label: 'Topic' }],
      }),
    );

    expect(html).toContain('href="/home"');
    expect(html).toContain('href="/home/section"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('Topic');
  });
});
