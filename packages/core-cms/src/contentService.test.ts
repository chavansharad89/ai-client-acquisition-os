import { describe, expect, it } from 'vitest';

import {
  archiveContentItem,
  createAsset,
  createContainer,
  updateContentMetadata,
} from './contentService';
import { fakeContentItemRepository } from './testing/fakeContentItemRepository';

describe('contentService (admin content creation/validation)', () => {
  it('creates a valid container for a CMS-eligible product', async () => {
    const deps = { contentItems: fakeContentItemRepository() };

    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Chapter 1',
    });

    expect(chapter.nodeType).toBe('CONTAINER');
    expect(chapter.owningProductId).toBe('ai_income_99');
  });

  it('creates a valid asset nested under a container', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_freelancing_499',
      parentId: null,
      title: 'Chapter 1',
    });

    const asset = await createAsset(deps, {
      owningProductId: 'ai_freelancing_499',
      parentId: chapter.id,
      title: 'Lesson 1',
      assetKind: 'VIDEO',
      storageKey: 's3://bucket/lesson-1.mp4',
      bytes: '2048',
    });

    expect(asset.nodeType).toBe('ASSET');
    expect(asset.parentId).toBe(chapter.id);
  });

  it('rejects an asset with a blank assetKind or storageKey (invalid asset shape)', async () => {
    const deps = { contentItems: fakeContentItemRepository() };

    await expect(
      createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Bad asset',
        assetKind: '  ',
        storageKey: 's3://bucket/x.pdf',
        bytes: '1',
      }),
    ).rejects.toThrow(/assetKind must not be blank/);

    await expect(
      createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'Bad asset',
        assetKind: 'FILE',
        storageKey: '  ',
        bytes: '1',
      }),
    ).rejects.toThrow(/storageKey must not be blank/);
  });

  it('rejects a container/asset whose parent does not exist (invalid parent)', async () => {
    const deps = { contentItems: fakeContentItemRepository() };

    await expect(
      createContainer(deps, {
        owningProductId: 'ai_income_99',
        parentId: 'does-not-exist',
        title: 'Orphan',
      }),
    ).rejects.toThrow(/does not exist/);
  });

  it('rejects nesting under an ASSET parent (an asset cannot have children)', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const asset = await createAsset(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Leaf',
      assetKind: 'FILE',
      storageKey: 's3://bucket/x.pdf',
      bytes: '1',
    });

    await expect(
      createContainer(deps, {
        owningProductId: 'ai_income_99',
        parentId: asset.id,
        title: 'Should not nest under an asset',
      }),
    ).rejects.toThrow(/cannot have children/);
  });

  it('rejects a cross-plan parent (child owning product differs from parent)', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const plusChapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Plus chapter',
    });

    await expect(
      createContainer(deps, {
        owningProductId: 'ai_freelancing_499',
        parentId: plusChapter.id,
        title: 'Pro topic nested under a Plus chapter',
      }),
    ).rejects.toThrow(/must match parent owning product/);
  });

  it('rejects a non-CMS-eligible owning product', async () => {
    const deps = { contentItems: fakeContentItemRepository() };

    await expect(
      createContainer(deps, {
        // Retired one-time SKU -- a real ProductId, but not CMS-eligible.
        owningProductId: 'ai_client_acquisition_1499',
        parentId: null,
        title: 'Should be rejected',
      }),
    ).rejects.toThrow(/not a CMS-eligible product/);
  });

  it('updates title/metadata/ordering without touching plan, parent, or shape', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Original title',
      orderIndex: 0,
    });

    const updated = await updateContentMetadata(deps, chapter.id, {
      title: 'New title',
      orderIndex: 5,
    });

    expect(updated.title).toBe('New title');
    expect(updated.orderIndex).toBe(5);
    expect(updated.owningProductId).toBe('ai_income_99');
    expect(updated.nodeType).toBe('CONTAINER');
  });

  it('rejects updating title to blank', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'Original title',
    });

    await expect(updateContentMetadata(deps, chapter.id, { title: '   ' })).rejects.toThrow(
      /must not be blank/,
    );
  });

  it('archives rather than deletes -- the row is retained with status ARCHIVED', async () => {
    const deps = { contentItems: fakeContentItemRepository() };
    const chapter = await createContainer(deps, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'To archive',
    });

    const archived = await archiveContentItem(deps, chapter.id);

    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).not.toBeNull();
    expect(await deps.contentItems.findById(chapter.id)).not.toBeNull();
  });
});
