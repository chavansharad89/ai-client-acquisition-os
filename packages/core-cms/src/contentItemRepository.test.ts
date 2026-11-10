import { describe, expect, it } from 'vitest';

import { FakeUniqueViolationError, fakeContentItemRepository } from './testing/fakeContentItemRepository';
import type { ContentItem } from './types';

describe('ContentItemRepository (content hierarchy)', () => {
  it('creates a valid parent/child hierarchy, ordered by orderIndex', async () => {
    const repo = fakeContentItemRepository();

    const chapter = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Chapter 1',
    });
    const secondTopic = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: chapter.id,
      title: 'Topic B',
      orderIndex: 2,
    });
    const firstTopic = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: chapter.id,
      title: 'Topic A',
      orderIndex: 1,
    });

    const roots = await repo.findRootsByOwningProduct('ai_income_99');
    expect(roots.map((r) => r.id)).toEqual([chapter.id]);

    const children = await repo.findChildren(chapter.id);
    expect(children.map((c) => c.title)).toEqual(['Topic A', 'Topic B']);
    expect(children.map((c) => c.id)).toEqual([firstTopic.id, secondTopic.id]);
  });

  it('distinguishes containers from assets', async () => {
    const repo = fakeContentItemRepository();

    const chapter = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_freelancing_499',
      parentId: null,
      title: 'Chapter 1',
    });
    const asset = await repo.create({
      nodeType: 'ASSET',
      owningProductId: 'ai_freelancing_499',
      parentId: chapter.id,
      title: 'Lesson 1 video',
      assetKind: 'VIDEO',
      storageKey: 's3://bucket/lesson-1.mp4',
      bytes: '104857600',
    });

    expect(chapter.nodeType).toBe('CONTAINER');
    expect(chapter.storageKey).toBeNull();
    expect(chapter.assetKind).toBeNull();
    expect(chapter.bytes).toBeNull();

    expect(asset.nodeType).toBe('ASSET');
    expect(asset.storageKey).toBe('s3://bucket/lesson-1.mp4');
    expect(asset.assetKind).toBe('VIDEO');
    expect(asset.bytes).toBe('104857600');
  });

  it('rejects a child whose owningProductId does not match its parent (invalid cross-plan hierarchy)', async () => {
    const repo = fakeContentItemRepository();

    const plusChapter = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Plus chapter',
    });

    await expect(
      repo.create({
        nodeType: 'CONTAINER',
        owningProductId: 'ai_freelancing_499',
        parentId: plusChapter.id,
        title: 'Pro topic nested under a Plus chapter',
      }),
    ).rejects.toThrow(/owning_product_id/);
  });

  it('retrieves every node owned by a plan across depths, regardless of hierarchy position', async () => {
    const repo = fakeContentItemRepository();

    const chapter = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_client_acquisition_1499_subscription',
      parentId: null,
      title: 'Max chapter',
    });
    const asset = await repo.create({
      nodeType: 'ASSET',
      owningProductId: 'ai_client_acquisition_1499_subscription',
      parentId: chapter.id,
      title: 'Max asset',
      assetKind: 'FILE',
      storageKey: 's3://bucket/max.pdf',
      bytes: '2048',
    });

    const all = await repo.findAllByOwningProduct('ai_client_acquisition_1499_subscription');
    expect(all.map((n) => n.id).sort()).toEqual([asset.id, chapter.id].sort());

    const otherPlan = await repo.findAllByOwningProduct('ai_income_99');
    expect(otherPlan).toEqual([]);
  });

  it('moves a node through DRAFT -> PUBLISHED -> ARCHIVED, stamping/clearing archivedAt', async () => {
    const repo = fakeContentItemRepository();
    const item = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Draft chapter',
    });
    expect(item.status).toBe('DRAFT');
    expect(item.archivedAt).toBeNull();

    const published = await repo.setStatus(item.id, 'PUBLISHED');
    expect(published.status).toBe('PUBLISHED');
    expect(published.archivedAt).toBeNull();

    const archived = await repo.setStatus(item.id, 'ARCHIVED');
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).not.toBeNull();
  });

  it('retains an archived node rather than deleting it', async () => {
    const repo = fakeContentItemRepository();
    const item = await repo.create({
      nodeType: 'CONTAINER',
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'To be archived',
    });

    await repo.setStatus(item.id, 'ARCHIVED');

    const found = await repo.findById(item.id);
    expect(found).not.toBeNull();
    expect(found?.status).toBe('ARCHIVED');
  });

  describe('replacement methods (migration 0066, CMS-PO-010(R2) Phase 2)', () => {
    async function seedLiveAsset(repo: ReturnType<typeof fakeContentItemRepository>) {
      return repo.create({
        nodeType: 'ASSET',
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Live Asset',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/live.pdf',
        bytes: '1000',
      });
    }

    it('findPendingReplacement returns null when none exists', async () => {
      const repo = fakeContentItemRepository();
      const live = await seedLiveAsset(repo);
      expect(await repo.findPendingReplacement(live.id)).toBeNull();
    });

    it('createReplacementAsset creates a DRAFT ASSET linked via replacesContentItemId', async () => {
      const repo = fakeContentItemRepository();
      const live = await seedLiveAsset(repo);

      const replacement = await repo.createReplacementAsset({
        owningProductId: live.owningProductId,
        parentId: live.parentId,
        title: live.title,
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/replacement.pdf',
        bytes: '2000',
        replacesContentItemId: live.id,
      });

      expect(replacement.nodeType).toBe('ASSET');
      expect(replacement.status).toBe('DRAFT');
      expect(replacement.replacesContentItemId).toBe(live.id);
      expect(await repo.findPendingReplacement(live.id)).toMatchObject({ id: replacement.id });
    });

    it('createReplacementAsset refuses a second pending replacement for the same asset', async () => {
      const repo = fakeContentItemRepository();
      const live = await seedLiveAsset(repo);
      await repo.createReplacementAsset({
        owningProductId: live.owningProductId,
        parentId: live.parentId,
        title: live.title,
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/r1.pdf',
        bytes: '2000',
        replacesContentItemId: live.id,
      });

      await expect(
        repo.createReplacementAsset({
          owningProductId: live.owningProductId,
          parentId: live.parentId,
          title: live.title,
          assetKind: 'pdf',
          storageKey: 'cms/ai_income_99/assets/r2.pdf',
          bytes: '3000',
          replacesContentItemId: live.id,
        }),
      ).rejects.toBeInstanceOf(FakeUniqueViolationError);
    });

    it('updatePendingReplacement overwrites the physical fields of an existing pending DRAFT in place', async () => {
      const repo = fakeContentItemRepository();
      const live = await seedLiveAsset(repo);
      const replacement = await repo.createReplacementAsset({
        owningProductId: live.owningProductId,
        parentId: live.parentId,
        title: live.title,
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/r1.pdf',
        bytes: '2000',
        replacesContentItemId: live.id,
      });

      const updated = await repo.updatePendingReplacement(replacement.id, {
        storageKey: 'cms/ai_income_99/assets/r2.pdf',
        assetKind: 'pdf',
        bytes: '3000',
      });

      expect(updated.id).toBe(replacement.id); // same row
      expect(updated.storageKey).toBe('cms/ai_income_99/assets/r2.pdf');
      expect(updated.bytes).toBe('3000');
      expect(updated.replacesContentItemId).toBe(live.id); // linkage preserved
    });

    it('updatePendingReplacement rejects a target that is not a pending DRAFT replacement', async () => {
      const repo = fakeContentItemRepository();
      const live = await seedLiveAsset(repo);
      await expect(
        repo.updatePendingReplacement(live.id, { storageKey: 'x', assetKind: 'pdf', bytes: '1' }),
      ).rejects.toThrow(/not a pending DRAFT replacement/);
    });
  });

  // CMS-PO-015 (Option 4B): the item itself plus its ancestor chain up to
  // the root, in one call -- the data this repository hands to
  // customerContentService.ts's effective-status computation. The real
  // Postgres implementation does this as a single recursive query; this
  // contract test only checks the shape every implementation (real and
  // fake) must agree on.
  describe('findWithAncestorChain', () => {
    it('returns null for a nonexistent id', async () => {
      const repo = fakeContentItemRepository();
      expect(await repo.findWithAncestorChain('nope')).toBeNull();
    });

    it('returns a one-element chain for a root-level item (no parent)', async () => {
      const repo = fakeContentItemRepository();
      const root = await repo.create({
        nodeType: 'CONTAINER',
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Root',
      });

      const chain = await repo.findWithAncestorChain(root.id);

      expect(chain?.map((n) => n.id)).toEqual([root.id]);
      expect(chain?.at(-1)?.parentId).toBeNull(); // the chain reached a true root
    });

    it('returns the item first, then each ancestor up to the root, for a nested item', async () => {
      const repo = fakeContentItemRepository();
      const root = await repo.create({
        nodeType: 'CONTAINER',
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Root',
      });
      const section = await repo.create({
        nodeType: 'CONTAINER',
        owningProductId: 'ai_income_99',
        parentId: root.id,
        title: 'Section',
      });
      const topic = await repo.create({
        nodeType: 'ASSET',
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Topic',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/t1.pdf',
        bytes: '100',
      });

      const chain = await repo.findWithAncestorChain(topic.id);

      expect(chain?.map((n) => n.id)).toEqual([topic.id, section.id, root.id]);
      expect(chain?.at(-1)?.parentId).toBeNull();
    });

    it('a chain whose parent is missing is cut short -- the last element is NOT treated as a root (its parentId is not null)', async () => {
      // Seeded directly (bypassing create()'s own parent-existence check)
      // to construct the otherwise-impossible "dangling parentId" case --
      // see CMS-PO-015's investigation: this cannot happen through any
      // real write path, but the repository contract must still defend
      // against it, per the fail-closed requirement.
      const now = new Date();
      const orphan: ContentItem = {
        id: 'orphan-1',
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
      const repo = fakeContentItemRepository([orphan]);

      const chain = await repo.findWithAncestorChain('orphan-1');

      expect(chain?.map((n) => n.id)).toEqual(['orphan-1']);
      expect(chain?.at(-1)?.parentId).toBe('does-not-exist'); // cut short, not a legitimate root
    });

    it('a cycle is defensively broken, never looping forever, and the chain is never treated as reaching a root', async () => {
      // Seeded directly -- a cycle cannot be constructed through any real
      // write path (parentId is write-once at creation; see CMS-PO-015's
      // investigation), but the repository must still defend against one.
      const now = new Date();
      function node(id: string, parentId: string): ContentItem {
        return {
          id,
          owningProductId: 'ai_income_99',
          parentId,
          nodeType: 'CONTAINER',
          assetKind: null,
          title: id,
          description: null,
          storageKey: null,
          bytes: null,
          orderIndex: 0,
          status: 'PUBLISHED',
          archivedAt: null,
          createdAt: now,
          updatedAt: now,
          replacesContentItemId: null,
          previousStorageKey: null,
          previousStorageRetentionUntil: null,
        };
      }
      const repo = fakeContentItemRepository([node('a', 'b'), node('b', 'a')]);

      const chain = await repo.findWithAncestorChain('a');

      expect(chain).not.toBeNull();
      expect(chain?.length).toBeLessThanOrEqual(2); // terminates, does not loop forever
      expect(chain?.at(-1)?.parentId).not.toBeNull(); // never mistaken for a legitimate root
    });
  });
});
