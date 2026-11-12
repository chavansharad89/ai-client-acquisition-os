import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders its children and defaults to type="button"', () => {
    const html = renderToStaticMarkup(createElement(Button, null, 'Save'));

    expect(html).toContain('Save');
    expect(html).toContain('type="button"');
  });

  it('forwards an explicit type instead of the default', () => {
    const html = renderToStaticMarkup(createElement(Button, { type: 'submit' }, 'Submit'));

    expect(html).toContain('type="submit"');
  });

  it('applies the disabled attribute', () => {
    const html = renderToStaticMarkup(createElement(Button, { disabled: true }, 'Save'));

    expect(html).toContain('disabled=""');
  });

  it('merges a caller-supplied className alongside the variant classes', () => {
    const html = renderToStaticMarkup(createElement(Button, { className: 'my-custom-class' }, 'Save'));

    expect(html).toContain('my-custom-class');
  });

  it('renders a visibly different class list per variant', () => {
    const primary = renderToStaticMarkup(createElement(Button, { variant: 'primary' }, 'Go'));
    const destructive = renderToStaticMarkup(createElement(Button, { variant: 'destructive' }, 'Go'));

    expect(primary).not.toEqual(destructive);
  });
});
