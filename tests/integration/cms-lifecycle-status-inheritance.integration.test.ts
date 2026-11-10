import {
  createAsset,
  createContainer,
  createPgContentItemRepository,
  getPublishedContentItemForPlans,
  listPublishedContentForPlans,
  setLifecycleStatus,
  type ContentItemRepository,
} from '@acos/core-cms';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// CMS-PO-015 (Lifecycle Status Inheritance), against real PostgreSQL —
// mirrors plus-pro-max-cms-phase1.integration.test.ts's own harness
// conventions. Nothing here is mocked: the recursive-CTE
// `findWithAncestorChain` query runs against the real 0062 schema, its
// real trigger (`content_items_match_parent_plan`), and its real
// foreign key (`content_items_parent_id_fkey ... ON DELETE RESTRICT`).
//
// Covers what the fake-backed unit tests (customerContentService.test.ts,
// contentItemRepository.test.ts) cannot: whether the actual SQL is
// correct against a real Postgres planner/executor, whether this
// schema's own constraints make certain failure modes (missing ancestor,
// cycle) constructible at all, and whether the list path's "zero
// additional queries" claim holds under a real connection, not just by
// code inspection.

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase('cms-li', {});
  open.push(db);
  return db;
}

function repo(db: TempDatabase): ContentItemRepository {
  return createPgContentItemRepository(db.client);
}

describe('CMS-PO-015 — effective-status ancestor inheritance, real PostgreSQL', () => {
  describe('findWithAncestorChain — the recursive CTE itself', () => {
    it('returns [item] for a root-level item, with parentId null — a legitimate root', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });

      const chain = await deps.contentItems.findWithAncestorChain(root.id);

      expect(chain?.map((n) => n.id)).toEqual([root.id]);
      expect(chain?.at(-1)?.parentId).toBeNull();
    });

    it('returns [item, parent, grandparent, root] in that order for a depth-3 chain', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      const section = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: root.id, title: 'Section' });
      const lesson = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: section.id, title: 'Lesson' });
      const topic = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: lesson.id,
        title: 'Topic',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/depth3.pdf',
        bytes: '100',
      });

      const chain = await deps.contentItems.findWithAncestorChain(topic.id);

      expect(chain?.map((n) => n.id)).toEqual([topic.id, lesson.id, section.id, root.id]);
      expect(chain?.at(-1)?.parentId).toBeNull();
    });

    it('a missing ancestor cannot be constructed at all — the real FK and trigger reject it, confirmed empirically', async () => {
      // Per CMS-PO-015's own investigation: parent_id is write-once at
      // INSERT (no UPDATE path ever touches it) and the
      // content_items_match_parent_plan trigger requires the referenced
      // parent to already exist. This test proves that against the real
      // schema, not just by reading the migration file: a raw INSERT
      // naming a nonexistent parent_id is rejected outright, so a
      // "dangling parentId" row is not just absent in practice — it
      // cannot exist. (The fake-backed unit tests in
      // contentItemRepository.test.ts cover the application-level
      // DEFENSE against this case, seeded directly since the fake has no
      // such constraint; this test covers why the real database never
      // reaches that state to begin with — together, this is the
      // strongest valid coverage for a case the real schema itself
      // rules out.)
      const db = await freshDb();

      await expect(
        db.client.query(
          `INSERT INTO content_items (owning_product_id, parent_id, node_type, title, order_index)
           VALUES ('ai_income_99', 'does-not-exist', 'CONTAINER', 'Orphan', 0)`,
        ),
      ).rejects.toThrow(/does not exist/);
    });

    it('a cycle is defensively broken and never reported as reaching a root -- constructed via a direct UPDATE the application layer never performs', async () => {
      // parent_id is immutable through every application write path
      // (updateMetadata never touches it; no other method does either —
      // see CMS-PO-015's investigation). The trigger itself only checks
      // plan consistency, not cycles, so a cycle IS constructible via a
      // raw UPDATE that bypasses the application layer entirely — this
      // is the realistic "what if" this defense exists for, exercised
      // here directly against real Postgres in a disposable temp
      // database, never against dev/production data.
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const a = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'A' });
      const b = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: a.id, title: 'B' });

      await db.client.query(`UPDATE content_items SET parent_id = $1 WHERE id = $2`, [b.id, a.id]);

      const chain = await deps.contentItems.findWithAncestorChain(a.id);

      expect(chain).not.toBeNull();
      expect(chain!.length).toBeLessThanOrEqual(2); // terminates -- does not hang or loop forever
      expect(chain!.at(-1)!.parentId).not.toBeNull(); // never mistaken for a legitimate root
    });
  });

  describe('listPublishedContentForPlans / getPublishedContentItemForPlans — LI-001/LI-002/LI-003 end to end', () => {
    it('a DRAFT grandparent hides a PUBLISHED topic, in both the list and single-item functions', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      // root stays DRAFT
      const section = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: root.id, title: 'Section' });
      await setLifecycleStatus(deps, section.id, 'PUBLISHED');
      const topic = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Hidden topic',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/li001-draft.pdf',
        bytes: '100',
      });
      await setLifecycleStatus(deps, topic.id, 'PUBLISHED');

      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).not.toContain(topic.id);

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    it('an ARCHIVED ancestor two levels up hides the descendant', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      await setLifecycleStatus(deps, root.id, 'PUBLISHED');
      await setLifecycleStatus(deps, root.id, 'ARCHIVED');
      const section = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: root.id, title: 'Section' });
      await setLifecycleStatus(deps, section.id, 'PUBLISHED');
      const topic = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Hidden by archived grandparent',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/li001-archived.pdf',
        bytes: '100',
      });
      await setLifecycleStatus(deps, topic.id, 'PUBLISHED');

      const single = await getPublishedContentItemForPlans(deps, topic.id, new Set(['ai_income_99']));
      expect(single).toBeNull();
    });

    it('restoring the archived parent does not auto-publish a descendant left DRAFT, but does restore one left untouched (LI-002)', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const section = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Section' });
      await setLifecycleStatus(deps, section.id, 'PUBLISHED');
      const staysPublished = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Stays published throughout',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/li002-a.pdf',
        bytes: '100',
      });
      await setLifecycleStatus(deps, staysPublished.id, 'PUBLISHED');
      const draftedDuringArchive = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: section.id,
        title: 'Never published, independent of the archive',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/li002-b.pdf',
        bytes: '100',
      });
      // stays at its DRAFT default throughout -- never published, whether before, during, or after the archive

      await setLifecycleStatus(deps, section.id, 'ARCHIVED');
      expect(await getPublishedContentItemForPlans(deps, staysPublished.id, new Set(['ai_income_99']))).toBeNull();

      await setLifecycleStatus(deps, section.id, 'PUBLISHED'); // restored

      const restored = await getPublishedContentItemForPlans(deps, staysPublished.id, new Set(['ai_income_99']));
      expect(restored?.id).toBe(staysPublished.id); // visible again, untouched throughout

      const stillHidden = await getPublishedContentItemForPlans(deps, draftedDuringArchive.id, new Set(['ai_income_99']));
      expect(stillHidden).toBeNull(); // not independently published yet -- restoring the parent alone did not change this (not a permanent state: see the full-cycle test below, which independently republishes a descendant left DRAFT and confirms it becomes visible again)
    });

    // Independent-review Finding F-02 (CMS-PO-015 security review,
    // 2026-11-09): the test above stops once the parent is restored and
    // the independently-drafted descendant is confirmed still hidden. It
    // never exercises what happens if that same descendant is LATER,
    // independently, also restored to PUBLISHED -- this test completes
    // that full restoration cycle, exactly as CMS-PO-015 LI-002 and
    // acceptance criterion 3 describe it: restoring a parent never
    // cascades, and a descendant becomes visible again only once BOTH it
    // and every ancestor are independently PUBLISHED.
    it('independently restoring a descendant after the parent is restored makes it visible again only once every ancestor is also PUBLISHED (LI-002, full restoration cycle)', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };

      // 1. A PUBLISHED parent and a PUBLISHED descendant.
      const parent = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Parent' });
      await setLifecycleStatus(deps, parent.id, 'PUBLISHED');
      const descendant = await createAsset(deps, {
        owningProductId: 'ai_income_99',
        parentId: parent.id,
        title: 'Descendant',
        assetKind: 'pdf',
        storageKey: 'cms/ai_income_99/assets/li002-full-cycle.pdf',
        bytes: '100',
      });
      await setLifecycleStatus(deps, descendant.id, 'PUBLISHED');

      // Baseline (R-2 of this step): both are PUBLISHED, and the
      // descendant is effectively visible before anything is archived --
      // establishing the "before" state the rest of this test is a
      // regression against.
      const baseline = await getPublishedContentItemForPlans(deps, descendant.id, new Set(['ai_income_99']));
      expect(baseline?.id).toBe(descendant.id);

      // 2. Change the parent to ARCHIVED -- descendant is hidden by the
      // ancestor rule (LI-001), not by its own (still-PUBLISHED) status.
      await setLifecycleStatus(deps, parent.id, 'ARCHIVED');
      expect(await getPublishedContentItemForPlans(deps, descendant.id, new Set(['ai_income_99']))).toBeNull();
      // Archiving the parent is itself single-row (CMS-PO-015 §2/§7): the
      // descendant's own stored status must be completely untouched by
      // it, still exactly PUBLISHED, even though it's now effectively hidden.
      const storedAfterParentArchive = await deps.contentItems.findById(descendant.id);
      expect(storedAfterParentArchive?.status).toBe('PUBLISHED');

      // 3. While the parent remains ARCHIVED, change the descendant's own
      // stored status.
      await setLifecycleStatus(deps, descendant.id, 'DRAFT');
      // Confirms this step's own write actually took effect, independent
      // of the parent's ARCHIVED status.
      const storedAfterIndependentChange = await deps.contentItems.findById(descendant.id);
      expect(storedAfterIndependentChange?.status).toBe('DRAFT');

      // 4. Restore the parent to PUBLISHED.
      await setLifecycleStatus(deps, parent.id, 'PUBLISHED');

      // 5. The descendant remains hidden -- its own stored status is not
      // PUBLISHED, independent of what the parent just did. No physical
      // cascade touched it: its stored status is still exactly DRAFT.
      expect(await getPublishedContentItemForPlans(deps, descendant.id, new Set(['ai_income_99']))).toBeNull();
      const storedAfterParentRestore = await deps.contentItems.findById(descendant.id);
      expect(storedAfterParentRestore?.status).toBe('DRAFT');

      // 6. Independently restore the descendant to PUBLISHED.
      await setLifecycleStatus(deps, descendant.id, 'PUBLISHED');

      // 7. It becomes visible now that it and its ancestor are BOTH
      // independently PUBLISHED -- in both the single-item and list paths.
      const afterDescendantRestore = await getPublishedContentItemForPlans(deps, descendant.id, new Set(['ai_income_99']));
      expect(afterDescendantRestore?.id).toBe(descendant.id);
      const listed = await listPublishedContentForPlans(deps, new Set(['ai_income_99']));
      expect(listed.map((i) => i.id)).toContain(descendant.id);
    });

    it('listPublishedContentForPlans issues exactly one query per permitted plan, regardless of how many items need an ancestor walk -- no N+1', async () => {
      const db = await freshDb();
      const deps = { contentItems: repo(db) };
      const root = await createContainer(deps, { owningProductId: 'ai_income_99', parentId: null, title: 'Root' });
      await setLifecycleStatus(deps, root.id, 'PUBLISHED');
      for (let i = 0; i < 20; i += 1) {
        const section = await createContainer(deps, {
          owningProductId: 'ai_income_99',
          parentId: root.id,
          title: `Section ${i}`,
        });
        await setLifecycleStatus(deps, section.id, 'PUBLISHED');
        const asset = await createAsset(deps, {
          owningProductId: 'ai_income_99',
          parentId: section.id,
          title: `Topic ${i}`,
          assetKind: 'pdf',
          storageKey: `cms/ai_income_99/assets/nplusone-${i}.pdf`,
          bytes: '100',
        });
        await setLifecycleStatus(deps, asset.id, 'PUBLISHED');
      }

      let queryCount = 0;
      const originalQuery = db.client.query.bind(db.client);
      db.client.query = ((...args: Parameters<typeof originalQuery>) => {
        queryCount += 1;
        return originalQuery(...args);
      }) as typeof db.client.query;

      const result = await listPublishedContentForPlans({ contentItems: repo(db) }, new Set(['ai_income_99']));

      expect(result.length).toBe(41); // root + 20 sections + 20 topics, all effectively published
      expect(queryCount).toBe(1); // exactly one findAllByOwningProduct call -- the ancestor walk for all 41 items is free, in-memory

      db.client.query = originalQuery;
    });
  });
});
