import type { ContentItemRepository } from '../contentItemRepository';
import type { ContentItem, NewContentItem, NewReplacementAssetItem } from '../types';

/** Thrown by `createReplacementAsset` when a pending replacement already exists for the target, mirroring the real DB's `content_items_one_pending_replacement` partial-unique-index violation (Postgres error code 23505) closely enough for a caller's generic `(error as {code?:string}).code === '23505'` recovery check to behave the same against the fake as against real Postgres. */
export class FakeUniqueViolationError extends Error {
  readonly code = '23505';
  constructor(message: string) {
    super(message);
    this.name = 'FakeUniqueViolationError';
  }
}

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
        replacesContentItemId: null,
        previousStorageKey: null,
        previousStorageRetentionUntil: null,
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

    async updateMetadata(id, changes) {
      const row = rows.get(id);
      if (!row) throw new Error(`content_items: no row with id ${id}`);
      const updated: ContentItem = {
        ...row,
        title: changes.title !== undefined ? changes.title : row.title,
        description: changes.description !== undefined ? changes.description : row.description,
        orderIndex: changes.orderIndex !== undefined ? changes.orderIndex : row.orderIndex,
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return updated;
    },

    async findPendingReplacement(contentItemId) {
      return [...rows.values()].find((row) => row.replacesContentItemId === contentItemId) ?? null;
    },

    async createReplacementAsset(input: NewReplacementAssetItem) {
      const existing = [...rows.values()].find(
        (row) => row.replacesContentItemId === input.replacesContentItemId,
      );
      if (existing) {
        throw new FakeUniqueViolationError(
          `content_items: a pending replacement already exists for '${input.replacesContentItemId}'`,
        );
      }

      const now = new Date();
      const row: ContentItem = {
        id: nextId(),
        owningProductId: input.owningProductId,
        parentId: input.parentId,
        nodeType: 'ASSET',
        assetKind: input.assetKind,
        title: input.title,
        description: input.description ?? null,
        storageKey: input.storageKey,
        bytes: input.bytes,
        orderIndex: input.orderIndex ?? 0,
        status: 'DRAFT',
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
        replacesContentItemId: input.replacesContentItemId,
        previousStorageKey: null,
        previousStorageRetentionUntil: null,
      };
      rows.set(row.id, row);
      return row;
    },

    async updatePendingReplacement(id, changes) {
      const row = rows.get(id);
      if (!row || row.status !== 'DRAFT' || row.replacesContentItemId === null) {
        throw new Error(
          `content_items: '${id}' is not a pending DRAFT replacement (it may already have been published, or never was one)`,
        );
      }
      const updated: ContentItem = {
        ...row,
        storageKey: changes.storageKey,
        assetKind: changes.assetKind,
        bytes: changes.bytes,
        updatedAt: new Date(),
      };
      rows.set(id, updated);
      return updated;
    },
  };
}
