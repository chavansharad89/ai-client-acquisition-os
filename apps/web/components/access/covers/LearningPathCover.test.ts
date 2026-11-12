import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { COVER_COUNT, LearningPathCover } from './LearningPathCover';

function render(id: string, className?: string): string {
  return renderToStaticMarkup(createElement(LearningPathCover, { id, className }));
}

describe('LearningPathCover', () => {
  it('renders a decorative, hidden-from-assistive-tech SVG', () => {
    const html = render('path-1');

    expect(html.trimStart().startsWith('<svg')).toBe(true);
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders the exact same markup for the same id across renders (stable across reloads)', () => {
    expect(render('path-1')).toEqual(render('path-1'));
  });

  it('renders different markup for at least some different ids, out of more than one cover', () => {
    expect(COVER_COUNT).toBeGreaterThan(1);

    const htmls = new Set(Array.from({ length: 20 }, (_, i) => render(`content-item-${i}`)));
    expect(htmls.size).toBeGreaterThan(1);
  });

  it('applies the given className to the root svg', () => {
    expect(render('path-1', 'aspect-video w-full')).toContain('aspect-video w-full');
  });

  it('never renders an emoji character', () => {
    // eslint-disable-next-line no-misleading-character-class
    const emojiPattern = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    for (let i = 0; i < COVER_COUNT; i++) {
      expect(render(`cover-check-${i}`)).not.toMatch(emojiPattern);
    }
  });
});
