import { describe, expect, it } from 'vitest';

import { createContainer } from './contentService';
import {
  getPublishedContentItemForPlans,
  listPublishedContentForPlans,
} from './customerContentService';
import { fakeContentItemRepository } from './testing/fakeContentItemRepository';

describe('customerContentService (PUBLISHED-only, access-aware)', () => {
  it('excludes DRAFT content from customer results', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft chapter' });

    const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));

    expect(result).toEqual([]);
  });

  it('includes PUBLISHED content when the plan is permitted', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Published chapter',
    });
    await deps.contentItems.setStatus(chapter.id, 'PUBLISHED');

    const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));

    expect(result.map((i) => i.id)).toEqual([chapter.id]);
  });

  it('excludes ARCHIVED content from customer results, but the row is retained', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Archived chapter',
    });
    await deps.contentItems.setStatus(chapter.id, 'PUBLISHED');
    await deps.contentItems.setStatus(chapter.id, 'ARCHIVED');

    const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));

    expect(result).toEqual([]);
    expect(await deps.contentItems.findById(chapter.id)).not.toBeNull();
  });

  describe('Plus (ai_income_99 only)', () => {
    it('sees Plus published content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const plus = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
      await deps.contentItems.setStatus(plus.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(result.map((i) => i.id)).toEqual([plus.id]);
    });

    it('cannot see Pro content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const pro = await createContainer(deps, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro' });
      await deps.contentItems.setStatus(pro.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(result).toEqual([]);
    });

    it('cannot see Max content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const max = await createContainer(deps, {
        owningProductId: 'ai_client_acquisition_1499_subscription',
        parentId: null,
        title: 'Max',
      });
      await deps.contentItems.setStatus(max.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(result).toEqual([]);
    });
  });

  describe('Pro (ai_freelancing_499 only)', () => {
    it('sees Pro published content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const pro = await createContainer(deps, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro' });
      await deps.contentItems.setStatus(pro.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_freelancing_499']));
      expect(result.map((i) => i.id)).toEqual([pro.id]);
    });

    it('cannot see Plus content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const plus = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
      await deps.contentItems.setStatus(plus.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_freelancing_499']));
      expect(result).toEqual([]);
    });

    it('cannot see Max content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const max = await createContainer(deps, {
        owningProductId: 'ai_client_acquisition_1499_subscription',
        parentId: null,
        title: 'Max',
      });
      await deps.contentItems.setStatus(max.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set(['ai_freelancing_499']));
      expect(result).toEqual([]);
    });
  });

  describe('Max (all three permitted)', () => {
    it('sees Plus, Pro, and Max published content', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const plus = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
      const pro = await createContainer(deps, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro' });
      const max = await createContainer(deps, {
        owningProductId: 'ai_client_acquisition_1499_subscription',
        parentId: null,
        title: 'Max',
      });
      await Promise.all([
        deps.contentItems.setStatus(plus.id, 'PUBLISHED'),
        deps.contentItems.setStatus(pro.id, 'PUBLISHED'),
        deps.contentItems.setStatus(max.id, 'PUBLISHED'),
      ]);

      const result = await listPublishedContentForPlans(
        deps,
        new Set(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499_subscription']),
      );
      expect(result.map((i) => i.id).sort()).toEqual([plus.id, pro.id, max.id].sort());
    });
  });

  describe('Expired (empty permitted-plans set)', () => {
    it('sees nothing, regardless of what content is PUBLISHED', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const plus = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
      await deps.contentItems.setStatus(plus.id, 'PUBLISHED');

      const result = await listPublishedContentForPlans(deps, new Set());
      expect(result).toEqual([]);
    });
  });

  describe('getPublishedContentItemForPlans (single-item security)', () => {
    it('returns the item when PUBLISHED and the plan is permitted', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const plus = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Plus' });
      await deps.contentItems.setStatus(plus.id, 'PUBLISHED');

      const result = await getPublishedContentItemForPlans(deps, plus.id, new Set(['ai_income_99']));
      expect(result?.id).toBe(plus.id);
    });

    it('returns null for a nonexistent id', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const result = await getPublishedContentItemForPlans(deps, 'nope', new Set(['ai_income_99']));
      expect(result).toBeNull();
    });

    it('returns null for unpublished (DRAFT) content even if the plan is permitted', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const draft = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft' });

      const result = await getPublishedContentItemForPlans(deps, draft.id, new Set(['ai_income_99']));
      expect(result).toBeNull();
    });

    it('returns null for ARCHIVED content even if the plan is permitted', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const item = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Item' });
      await deps.contentItems.setStatus(item.id, 'PUBLISHED');
      await deps.contentItems.setStatus(item.id, 'ARCHIVED');

      const result = await getPublishedContentItemForPlans(deps, item.id, new Set(['ai_income_99']));
      expect(result).toBeNull();
    });

    it('returns null when PUBLISHED but the plan is NOT permitted -- no existence leak across the Plus/Pro boundary', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const pro = await createContainer(deps, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro' });
      await deps.contentItems.setStatus(pro.id, 'PUBLISHED');

      // A Plus-only caller asking for this Pro item's id, e.g. by
      // guessing or changing a URL parameter, gets exactly the same
      // null a nonexistent id would -- see the "returns null for a
      // nonexistent id" test above for the identical shape.
      const result = await getPublishedContentItemForPlans(deps, pro.id, new Set(['ai_income_99']));
      expect(result).toBeNull();
    });
  });
});
