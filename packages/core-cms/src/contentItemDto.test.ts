import { describe, expect, it } from 'vitest';

import { toPublicContentItem } from './contentItemDto';
import type { ContentItem } from './types';

function contentItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: 'content-1',
    owningProductId: 'ai_income_99',
    parentId: null,
    nodeType: 'ASSET',
    assetKind: 'pdf',
    title: 'Guide',
    description: null,
    storageKey: 'cms/ai_income_99/assets/seg-1.pdf',
    bytes: '1024',
    orderIndex: 0,
    status: 'PUBLISHED',
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    replacesContentItemId: null,
    previousStorageKey: 'cms/ai_income_99/assets/seg-0.pdf',
    previousStorageRetentionUntil: new Date(),
    ...overrides,
  };
}

describe('toPublicContentItem', () => {
  it('strips storageKey and previousStorageKey', () => {
    const dto = toPublicContentItem(contentItem());
    expect(dto).not.toHaveProperty('storageKey');
    expect(dto).not.toHaveProperty('previousStorageKey');
  });

  it('keeps every other field unchanged', () => {
    const item = contentItem();
    const dto = toPublicContentItem(item);
    expect(dto).toMatchObject({
      id: item.id,
      owningProductId: item.owningProductId,
      nodeType: item.nodeType,
      assetKind: item.assetKind,
      title: item.title,
      bytes: item.bytes,
      status: item.status,
      previousStorageRetentionUntil: item.previousStorageRetentionUntil,
    });
  });
});
