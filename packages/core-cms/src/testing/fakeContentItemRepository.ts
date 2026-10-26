import type { ContentItemRepository } from '../contentItemRepository';
import type { ContentItem, NewContentItem } from '../types';

// In-memory ContentItemRepository fake, mirroring
// fakePlanDisplayNameRepository.ts's shape: a seedable, mutable in-memory
// store behind the same interface the real Postgres-backed repository
// implements. It replicates the DB's invariants that the domain layer
// itself relies on (parent-plan match, archived-consistency) so tests
// exercise the same failure modes production does, without a real DB.

let counter = 0;
function nextId(): string {
  counter += 1;
  return `fake-content-item-${counter}`;
}

export function fakeContentItemRepository(seed: readonly ContentItem[] = []): ContentItemRepository {
  const rows = new Map(seed.map((row) => [row.id, row]));

  return {
    async findById(id) {
      return rows.get(id) ?? null;
    },

    async findChildren(parentId) {
      return [...rows.values()]
        .filter((row) => row.parentId === parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    },

    async findRootsByOwningProduct(owningProductId) {
      return [...rows.values()]
        .filter((row) => row.owningProductId === owningProductId && row.parentId === null)
        .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    },

    async findAllByOwningProduct(owningProductId) {
      return [...rows.values()]
        .filter((row) => row.owningProductId === owningProductId)
        .sort((a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id));
    },

    async create(input: NewContentItem) {
      if (input.parentId !== null) {
        const parent = rows.get(input.parentId);
        if (!parent) {
          throw new Error(`content_items: parent_id ${input.parentId} does not exist`);
        }
        if (parent.owningProductId !== input.owningProductId) {
          throw new Error(
            `content_items: child owning_product_id (${input.owningProductId}) must match parent owning_product_id (${parent.owningProductId})`,
          );
        }
      }

      const now = new Date();
      const row: ContentItem = {
        id: nextId(),
        owningProductId: input.owningProductId,
        parentId: input.parentId,
        nodeType: input.nodeType,
        assetKind: input.nodeType === 'ASSET' ? input.assetKind : null,
        title: input.title,
        description: input.description ?? null,
        storageKey: input.nodeType === 'ASSET' ? input.storageKey : null,
        bytes: input.nodeType === 'ASSET' ? input.bytes : null,
        orderIndex: input.orderIndex ?? 0,
        status: 'DRAFT',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      rows.set(row.id, row);
      return row;
    },

    async setStatus(id, status) {
      const row = rows.get(id);
      if (!row) throw new Error(`content_items: no row with id ${id}`);
      const updated: ContentItem = {
        ...row,
        status,
        archivedAt: status === 'ARCHIVED' ? new Date() : null,
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return updated;
    },
  };
}
