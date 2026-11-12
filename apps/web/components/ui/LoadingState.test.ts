import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('announces itself to assistive tech as a polite status region', () => {
    const html = renderToStaticMarkup(createElement(LoadingState, null));

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('defaults to a generic label', () => {
    const html = renderToStaticMarkup(createElement(LoadingState, null));

    expect(html).toContain('Loading');
  });

  it('renders a caller-supplied label', () => {
    const html = renderToStaticMarkup(createElement(LoadingState, { label: 'Loading your roadmap…' }));

    expect(html).toContain('Loading your roadmap…');
  });
});
