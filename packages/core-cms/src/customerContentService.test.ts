import { describe, expect, it } from 'vitest';

import { buildAssetStorageKey } from './assetValidation';
import { createAsset, createContainer } from './contentService';
import {
  getPublishedContentItemForPlans,
  listPublishedContentForPlans,
} from './customerContentService';
import { fakeContentItemRepository } from './testing/fakeContentItemRepository';
import type { ContentItem } from './types';

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

  // CMS-PO-015: effective publication status (LI-001/LI-002/LI-003) --
  // an item is effectively PUBLISHED only when its own stored status AND
  // every ancestor's stored status are PUBLISHED. Enforced centrally here
  // (customerContentService.ts), the single point both the list and
  // single-item functions share, per the approved enforcement-point
  // decision (TD-001).
  describe('effective-status ancestor inheritance (CMS-PO-015)', () => {
    async function seedChain(deps: { contentItems: ReturnType<typeof fakeContentItemRepository> }) {
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      const section = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: root.id, title: 'Section' });
      const topic = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Topic',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'seg-1', 'pdf'),
        bytes: '100',
      });
      return { root, section, topic };
    }

    it('a published item with every ancestor PUBLISHED is visible, in both the list and single-item functions', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { root, section, topic } = await seedChain(deps);
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'PUBLISHED');
      await deps.contentItems.setStatus(topic.id, 'PUBLISHED');

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id).sort()).toEqual([root.id, section.id, topic.id].sort());

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single?.id).toBe(topic.id);
    });

    it('a DRAFT ancestor (the immediate parent) hides a PUBLISHED child (LI-001) -- list and single-item', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { root, topic } = await seedChain(deps);
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');
      // section stays DRAFT -- never setStatus('PUBLISHED')
      await deps.contentItems.setStatus(topic.id, 'PUBLISHED');

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).not.toContain(topic.id);

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    it('an ARCHIVED ancestor (the immediate parent) hides a PUBLISHED child (LI-001) -- list and single-item', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { root, section, topic } = await seedChain(deps);
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'ARCHIVED');
      await deps.contentItems.setStatus(topic.id, 'PUBLISHED');

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).not.toContain(topic.id);

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    it('a DRAFT/ARCHIVED ancestor at a NON-immediate level (the grandparent) also hides the descendant, not just the direct parent', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { section, topic } = await seedChain(deps);
      // root stays DRAFT -- never setStatus('PUBLISHED'); section and topic ARE published
      await deps.contentItems.setStatus(section.id, 'PUBLISHED');
      await deps.contentItems.setStatus(topic.id, 'PUBLISHED');

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).not.toContain(topic.id);
      expect(listed.map((i) => i.id)).not.toContain(section.id); // section's own ancestor (root) is also unpublished

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    it('restoring the parent to PUBLISHED does not automatically publish a descendant left DRAFT during the archived period (LI-002)', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { root, section, topic } = await seedChain(deps);
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'ARCHIVED');
      // topic is never published -- it stays at its DRAFT default throughout, independent of section's archive

      await deps.contentItems.setStatus(section.id, 'PUBLISHED'); // restored

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull(); // topic's own status was never independently set to PUBLISHED
    });

    it('restoring the parent to PUBLISHED makes an unchanged-throughout PUBLISHED descendant visible again (LI-002)', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const { root, section, topic } = await seedChain(deps);
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');
      await deps.contentItems.setStatus(section.id, 'PUBLISHED');
      await deps.contentItems.setStatus(topic.id, 'PUBLISHED'); // topic published before the archive

      await deps.contentItems.setStatus(section.id, 'ARCHIVED');
      let single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull(); // hidden while archived

      await deps.contentItems.setStatus(section.id, 'PUBLISHED'); // restored, topic's own status never touched
      single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single?.id).toBe(topic.id); // visible again, with no action taken on topic itself
    });

    it('a PUBLISHED item whose ancestor chain is cut short (missing ancestor) fails closed -- never treated as a root', async () => {
      const now = new Date();
      const orphan: ContentItem = {
        id: 'orphan-cms-po-015',
        owningProductId: 'ai_income_99',
        parentId: 'does-not-exist',
        nodeType: 'ASSET',
        assetKind: 'pdf',
        title: 'Orphan',
        description: null,
        storageKey: 'cms/ai_income_99/assets/orphan.pdf',
        bytes: '100',
        orderIndex: 0,
        status: 'PUBLISHED',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        replacesContentItemId: null,
        previousStorageKey: null,
        previousStorageRetentionUntil: null,
      };
      const deps = { contentItems: fakeContentItemRepository([orphan]) };

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).not.toContain('orphan-cms-po-015');

      const single = await getPublishedContentItemForPlans(deps, 'orphan-cms-po-015', new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    // Independent-review Finding F-01 (CMS-PO-015 security review, 2026-11-09):
    // the tests above each exercise exactly one hiding cause in isolation.
    // This test puts three siblings of one PUBLISHED parent side by side --
    // one effectively published, one hidden by its OWN status, and one
    // hidden by an ANCESTOR other than the shared parent -- to prove the
    // causes don't interact: a hidden sibling must never suppress a valid
    // one, and "hidden by ancestor" must be distinguishable from "hidden by
    // own status" in the same result set.
    it('mixed siblings: a published sibling stays visible even though another sibling is hidden by its own DRAFT status and a nested descendant is hidden by an archived ancestor (F-01)', async () => {
      const deps = { contentItems: fakeContentItemRepository() };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      await deps.contentItems.setStatus(root.id, 'PUBLISHED');

      // Sibling 1 -- effectively PUBLISHED (own status PUBLISHED, ancestor
      // Root PUBLISHED). Must remain visible regardless of its siblings.
      const visibleChild = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: root.id,
        title: 'Visible child',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'mix-visible', 'pdf'),
        bytes: '100',
      });
      await deps.contentItems.setStatus(visibleChild.id, 'PUBLISHED');

      // Sibling 2 -- hidden by its OWN stored status (DRAFT). Its ancestor
      // (Root) is fine; this is the ordinary, already-covered case, kept
      // here only to prove it coexists with Sibling 1 without suppressing it.
      const draftChild = await createContainer(deps, {
        owningProductId: 'ai_income_99',
        parentId: root.id,
        title: 'Draft child',
      });
      // never setStatus('PUBLISHED') -- stays DRAFT

      // Sibling 3 -- an ARCHIVED container (itself hidden by its own
      // status too), whose own child is PUBLISHED but hidden by an
      // ANCESTOR (Sibling 3 itself), not by its own stored status.
      const archivedSection = await createContainer(deps, {
        owningProductId: 'ai_income_99',
        parentId: root.id,
        title: 'Archived section',
      });
      await deps.contentItems.setStatus(archivedSection.id, 'PUBLISHED');
      await deps.contentItems.setStatus(archivedSection.id, 'ARCHIVED');
      const hiddenByAncestor = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: archivedSection.id,
        title: 'Hidden by ancestor',
        assetKind: 'pdf',
        storageKey: buildAssetStorageKey('ai_income_99', 'mix-hidden', 'pdf'),
        bytes: '100',
      });
      await deps.contentItems.setStatus(hiddenByAncestor.id, 'PUBLISHED'); // own status fine -- only the archived ancestor hides it

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      const listedIds = listed.map((i) => i.id);

      expect(listedIds).toContain(root.id);
      expect(listedIds).toContain(visibleChild.id); // the hidden siblings never suppress this valid sibling
      expect(listedIds).not.toContain(draftChild.id); // hidden by its own DRAFT status
      expect(listedIds).not.toContain(archivedSection.id); // hidden by its own ARCHIVED status
      expect(listedIds).not.toContain(hiddenByAncestor.id); // hidden by its ARCHIVED ancestor, even though its OWN status is PUBLISHED

      // The single-item path must agree with the list path for every one of these.
      await expect(getPublishedContentItemForPlans(deps, visibleChild.id, new Set(['ai_income_99']))).resolves.toMatchObject({
        id: visibleChild.id,
      });
      await expect(getPublishedContentItemForPlans(deps, draftChild.id, new Set(['ai_income_99']))).resolves.toBeNull();
      await expect(getPublishedContentItemForPlans(deps, hiddenByAncestor.id, new Set(['ai_income_99']))).resolves.toBeNull();
    });

    it('a database/resolution failure propagates rather than being swallowed into a grant -- fail-closed by construction', async () => {
      const failingContentItems = {
        ...fakeContentItemRepository(),
        findWithAncestorChain: async () => {
          throw new Error('simulated connection failure');
        },
      };
      const deps = { contentItems: failingContentItems };

      await expect(
        getPublishedContentItemForPlans(deps, 'any-id', new Set(['ai_income_99'])),
      ).rejects.toThrow('simulated connection failure');
      // No path in getPublishedContentItemForPlans catches this and
      // returns content instead -- the caller's own request fails
      // entirely, which is what "fail closed" requires: an error can
      // never result in content being granted.
    });
  });
});
