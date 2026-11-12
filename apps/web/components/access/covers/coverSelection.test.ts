import { describe, expect, it } from 'vitest';

import { pickCoverIndex } from './coverSelection';

describe('pickCoverIndex', () => {
  it('always returns the same index for the same id (stable across reloads)', () => {
    expect(pickCoverIndex('path-123', 6)).toBe(pickCoverIndex('path-123', 6));
  });

  it('returns an index within [0, count)', () => {
    const ids = ['a', 'path-1', 'c0ffee-aaaa-bbbb', '', 'z'.repeat(50)];
    for (const id of ids) {
      const index = pickCoverIndex(id, 6);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(6);
    }
  });

  it('spreads different ids across more than one index, rather than collapsing to one cover', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `content-item-${i}`);
    const indices = new Set(ids.map((id) => pickCoverIndex(id, 6)));

    expect(indices.size).toBeGreaterThan(1);
  });
});
