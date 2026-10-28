import { describe, expect, it } from 'vitest';

import { FakeUniqueViolationError, fakeContentItemRepository } from './testing/fakeContentItemRepository';

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
});
