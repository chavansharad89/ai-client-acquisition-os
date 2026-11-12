import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('announces itself to assistive tech as an alert', () => {
    const html = renderToStaticMarkup(createElement(ErrorState, null));

    expect(html).toContain('role="alert"');
  });

  it('defaults to a generic title', () => {
    const html = renderToStaticMarkup(createElement(ErrorState, null));

    expect(html).toContain('Something went wrong');
  });

  it('renders a caller-supplied title, description and action', () => {
    const html = renderToStaticMarkup(
      createElement(ErrorState, {
        title: 'Could not load this roadmap',
        description: 'Try again in a moment.',
        action: createElement('button', null, 'Retry'),
      }),
    );

    expect(html).toContain('Could not load this roadmap');
    expect(html).toContain('Try again in a moment.');
    expect(html).toContain('Retry');
  });
});
