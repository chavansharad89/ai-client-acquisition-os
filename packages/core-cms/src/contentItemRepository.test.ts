import { describe, expect, it } from 'vitest';

import { fakeContentItemRepository } from './testing/fakeContentItemRepository';

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
});
