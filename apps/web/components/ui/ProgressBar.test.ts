import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('exposes the value via ARIA attributes for assistive tech', () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: 42 }));

    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="42"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
  });

  it('clamps a value above 100 down to 100', () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: 150 }));

    expect(html).toContain('aria-valuenow="100"');
  });

  it('clamps a negative value up to 0', () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: -10 }));

    expect(html).toContain('aria-valuenow="0"');
  });

  it('shows the label and its rounded percentage when provided', () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: 33.6, label: 'Roadmap' }));

    expect(html).toContain('Roadmap');
    expect(html).toContain('34%');
    expect(html).toContain('aria-label="Roadmap"');
  });

  it('falls back to a generic aria-label when no label is given', () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: 50 }));

    expect(html).toContain('aria-label="Progress"');
  });
});
