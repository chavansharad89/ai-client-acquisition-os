import { createAsset, createContainer, fakeContentItemRepository, fakePlanDisplayNameRepository } from '@acos/core-cms';
import { describe, expect, it } from 'vitest';

import { buildPreviewSections } from './cmsPreviewService';

function deps() {
  return { contentItems: fakeContentItemRepository(), planDisplayNames: fakePlanDisplayNameRepository() };
}

describe('buildPreviewSections', () => {
  it('Plus plan resolves to exactly one section, for ai_income_99', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections.map((s) => s.productId)).toEqual(['ai_income_99']);
  });

  it('Pro plan resolves to exactly one section, for ai_freelancing_499', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_freelancing_499');
    expect(sections.map((s) => s.productId)).toEqual(['ai_freelancing_499']);
  });

  it('Max plan resolves to Plus, Pro, Max sections in that order', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_client_acquisition_1499_subscription');
    expect(sections.map((s) => s.productId)).toEqual([
      'ai_income_99',
      'ai_freelancing_499',
      'ai_client_acquisition_1499_subscription',
    ]);
  });

  it('plan separation: Plus section never includes Pro/Max content', async () => {
    const d = deps();
    await createContainer(d, { owningProductId: 'ai_freelancing_499', parentId: null, title: 'Pro chapter' });
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections).toHaveLength(1);
    expect(sections[0]!.tree).toEqual([]);
  });

  it('includes DRAFT content (unlike the customer-only path)', async () => {
    const d = deps();
    await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Draft chapter' });
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.tree).toHaveLength(1);
    expect(sections[0]!.tree[0]!.status).toBe('DRAFT');
  });

  it('includes PUBLISHED content', async () => {
    const d = deps();
    const chapter = await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Published' });
    await d.contentItems.setStatus(chapter.id, 'PUBLISHED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.tree[0]!.status).toBe('PUBLISHED');
  });

  it('includes ARCHIVED content', async () => {
    const d = deps();
    const chapter = await createContainer(d, { owningProductId: 'ai_income_99', parentId: null, title: 'Archived' });
    await d.contentItems.setStatus(chapter.id, 'PUBLISHED');
    await d.contentItems.setStatus(chapter.id, 'ARCHIVED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.tree[0]!.status).toBe('ARCHIVED');
  });

  it('never leaks storageKey/previousStorageKey on an ASSET row', async () => {
    const d = deps();
    const asset = await createAsset(d, {
      owningProductId: 'ai_income_99',
      parentId: null,
      title: 'File',
      assetKind: 'FILE',
      storageKey: 'cms/ai_income_99/secret-key.pdf',
      bytes: '1024',
    });
    await d.contentItems.setStatus(asset.id, 'PUBLISHED');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.tree[0]).not.toHaveProperty('storageKey');
    expect(sections[0]!.tree[0]).not.toHaveProperty('previousStorageKey');
  });

  it('resolves the CMS-configured display name when one is set', async () => {
    const d = deps();
    await d.planDisplayNames.upsert('ai_income_99', 'Plus', 'admin-1');
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.displayName).toBe('Plus');
  });

  it('falls back to the catalog default display name when no override is set', async () => {
    const d = deps();
    const sections = await buildPreviewSections(d, 'ai_income_99');
    expect(sections[0]!.displayName.length).toBeGreaterThan(0);
  });
});
