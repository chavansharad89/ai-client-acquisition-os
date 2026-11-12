import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    const html = renderToStaticMarkup(Badge({ children: 'PUBLISHED' }));

    expect(html).toContain('PUBLISHED');
  });

  it('renders a visibly different class list per variant', () => {
    const success = renderToStaticMarkup(Badge({ variant: 'success', children: 'Done' }));
    const warning = renderToStaticMarkup(Badge({ variant: 'warning', children: 'Done' }));

    expect(success).not.toEqual(warning);
  });

  it('merges a caller-supplied className', () => {
    const html = renderToStaticMarkup(Badge({ className: 'my-custom-class', children: 'Done' }));

    expect(html).toContain('my-custom-class');
  });
});
