import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './Card';

describe('Card composition', () => {
  it('renders every sub-component with its content, in a single tree', () => {
    const html = renderToStaticMarkup(
      createElement(
        Card,
        null,
        createElement(
          CardHeader,
          null,
          createElement(CardTitle, null, 'Roadmap progress'),
          createElement(CardDescription, null, '3 of 10 topics complete'),
        ),
        createElement(CardContent, null, 'Body content'),
        createElement(CardFooter, null, 'Footer action'),
      ),
    );

    expect(html).toContain('Roadmap progress');
    expect(html).toContain('3 of 10 topics complete');
    expect(html).toContain('Body content');
    expect(html).toContain('Footer action');
  });

  it('CardTitle renders as a heading element', () => {
    const html = renderToStaticMarkup(createElement(CardTitle, null, 'Title'));

    expect(html).toMatch(/<h3[ >]/);
  });
});
