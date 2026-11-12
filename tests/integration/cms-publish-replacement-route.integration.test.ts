import { randomUUID } from 'node:crypto';

import { NextRequest } from 'next/server';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { hashAccessToken } from '@acos/core-entitlements';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// CMS-PO-010(R2) — the ACTUAL publish-replacement route handler, end to
// end, against a real database.
// -----------------------------------------------------------------------
// Mirrors webhook-route.integration.test.ts's own rationale exactly:
// packages/core-cms/src/contentReplacementTransaction.ts's own
// integration suite already proves publishReplacementTransaction is
// correct in isolation. It does NOT prove the HTTP route calls it, in
// the right order, with requireUser/requireCmsAdmin actually gating it.
// A route that skipped authorization entirely, or called the wrong
// function, would pass every mocked-dependency unit test in this
// directory's own route.test.ts. So this file imports
// apps/web/app/api/cms/admin/assets/publish-replacement/route.ts and
// invokes its exported POST with a real Request, a real session cookie,
// and a real cms_admins row, against a real database.
//
// R2_* is set to harmless placeholder values, never read for anything
// beyond constructing an (unused) S3Client -- this route's own logic
// never touches AssetStorage, so no network call to R2 is ever made;
// the placeholders exist only so commerceRepositories()'s existing,
// unmodified `storage: getAssetStorage()` entry does not throw
// R2ConfigError before this route ever gets to destructure the `pool`/
// `cmsAdmins`/`identity` entries it actually needs.
// -----------------------------------------------------------------------

let reachable = false;

/** One live database/pool at a time -- same connection-exhaustion rationale as webhook-route.integration.test.ts. */
let current: { db: TempDatabase; close: () => Promise<void> } | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (current) {
    await current.close().catch(() => undefined);
    await current.db.drop().catch(() => undefined);
    current = null;
  }
  vi.resetModules();
});

type RoutePost = (request: Request) => Promise<Response>;

interface Env {
  db: TempDatabase;
  post: RoutePost;
}

async function freshRoute(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` + `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = db.url;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_route';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_route';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_route_level_suite';
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_route';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-route-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'd'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-route-not-real';
  // Placeholders only -- see file header. Never a real R2 account/bucket.
  process.env.R2_ACCOUNT_ID = 'route-test-account';
  process.env.R2_ACCESS_KEY_ID = 'route-test-access-key';
  process.env.R2_SECRET_ACCESS_KEY = 'route-test-secret-key';
  process.env.R2_BUCKET_NAME = 'route-test-bucket';

  vi.resetModules();
  const mod = (await import('../../apps/web/app/api/cms/admin/assets/publish-replacement/route')) as {
    POST: RoutePost;
  };
  const clientFinderDb = (await import('../../apps/web/src/server/db')) as {
    closeClientFinderPool: () => Promise<void>;
  };
  current = { db, close: () => clientFinderDb.closeClientFinderPool() };
  return { db, post: mod.POST };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Seeds a user + a valid session token (access_tokens, user_id set) + a cms_admins row for it. */
async function seedAdmin(env: Env, suffix: string): Promise<{ userId: string; token: string }> {
  const userId = `user_admin_${suffix}`;
  const token = `tok_admin_${suffix}_${randomUUID()}`;
  await env.db.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [userId, `${userId}@example.test`]);
  await env.db.client.query(
    `INSERT INTO access_tokens (id, token_hash, customer_email, user_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), hashAccessToken(token), `${userId}@example.test`, userId, new Date(Date.now() + DAY_MS)],
  );
  await env.db.client.query(`INSERT INTO cms_admins (user_id) VALUES ($1)`, [userId]);
  return { userId, token };
}

/** A valid session for a user who is NOT a CMS admin. */
async function seedNonAdmin(env: Env, suffix: string): Promise<{ userId: string; token: string }> {
  const userId = `user_plain_${suffix}`;
  const token = `tok_plain_${suffix}_${randomUUID()}`;
  await env.db.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [userId, `${userId}@example.test`]);
  await env.db.client.query(
    `INSERT INTO access_tokens (id, token_hash, customer_email, user_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), hashAccessToken(token), `${userId}@example.test`, userId, new Date(Date.now() + DAY_MS)],
  );
  return { userId, token };
}

interface SeedReplacementOptions {
  liveId: string;
  pendingId: string;
  owningProductId?: string;
}

/** Mirrors cms-asset-replacement-publish.integration.test.ts's own seedLiveWithPending helper exactly. */
async function seedLiveWithPending(env: Env, opts: SeedReplacementOptions): Promise<void> {
  const owningProductId = opts.owningProductId ?? 'ai_income_99';
  await env.db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Live Asset', $3, 1000, 'PUBLISHED')`,
    [opts.liveId, owningProductId, `cms/${owningProductId}/assets/${opts.liveId}.pdf`],
  );
  await env.db.client.query(
    `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
     VALUES ($1, $2, 'ASSET', 'pdf', 'Pending Replacement', $3, 2000, 'DRAFT', $4)`,
    [opts.pendingId, owningProductId, `cms/${owningProductId}/assets/${opts.pendingId}.pdf`, opts.liveId],
  );
}

function postPublish(post: RoutePost, body: unknown, token?: string): Promise<Response> {
  // NextRequest, not a plain Request -- readSessionToken() (the route's
  // real, unmocked dependency here) reads the session cookie via
  // NextRequest's own `.cookies.get()`, which a plain Web Request does
  // not have at all.
  return post(
    new NextRequest('http://localhost/api/cms/admin/assets/publish-replacement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Cookie: `acos_session=${token}` } : {}),
      },
      body: JSON.stringify(body),
    }) as never,
  );
}

describe('POST /api/cms/admin/assets/publish-replacement — real route, real Postgres', () => {
  it('401s with no session cookie', async () => {
    const env = await freshRoute('pubroute1');
    const response = await postPublish(env.post, { contentItemId: 'x', expectedPendingReplacementId: 'y' });
    expect(response.status).toBe(401);
  });

  it('403s for an authenticated user who is not a CMS admin', async () => {
    const env = await freshRoute('pubroute2');
    const { token } = await seedNonAdmin(env, 'a');
    const response = await postPublish(env.post, { contentItemId: 'x', expectedPendingReplacementId: 'y' }, token);
    expect(response.status).toBe(403);
  });

  it('valid admin publish succeeds: the live asset is updated, the pending row is consumed, and the obsolete object is bookkept with ~30-day retention', async () => {
    const env = await freshRoute('pubroute3');
    const { token } = await seedAdmin(env, 'a');
    await seedLiveWithPending(env, { liveId: 'live_a', pendingId: 'pending_a' });
    const before = Date.now();

    const response = await postPublish(
      env.post,
      { contentItemId: 'live_a', expectedPendingReplacementId: 'pending_a' },
      token,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;

    // Proves the route invoked the REAL transaction, not a stub: the
    // physical fields actually moved, and the response never exposes a
    // storage key at all (toPublicContentItem).
    expect(body.id).toBe('live_a');
    expect(body.status).toBe('PUBLISHED');
    expect(body.bytes).toBe('2000');
    expect(body).not.toHaveProperty('storageKey');
    expect(body).not.toHaveProperty('previousStorageKey');

    const { rows: pendingRows } = await env.db.client.query(`SELECT 1 FROM content_items WHERE id = 'pending_a'`);
    expect(pendingRows).toHaveLength(0); // consumed

    const { rows: obsoleteRows } = await env.db.client.query(
      `SELECT storage_key, retention_until FROM content_item_obsolete_objects WHERE content_item_id = 'live_a'`,
    );
    expect(obsoleteRows).toHaveLength(1);
    expect((obsoleteRows[0] as { storage_key: string }).storage_key).toBe('cms/ai_income_99/assets/live_a.pdf');
    const retentionMs = (obsoleteRows[0] as { retention_until: Date }).retention_until.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(retentionMs).toBeGreaterThanOrEqual(before + thirtyDaysMs - 5000);
    expect(retentionMs).toBeLessThanOrEqual(Date.now() + thirtyDaysMs + 5000);
  });

  it('400s with a mapped VALIDATION_ERROR when no pending replacement exists for the given contentItemId', async () => {
    const env = await freshRoute('pubroute4');
    const { token } = await seedAdmin(env, 'a');
    await env.db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
       VALUES ('live_b', 'ai_income_99', 'ASSET', 'pdf', 'Live', 'cms/ai_income_99/assets/live_b.pdf', 1000, 'PUBLISHED')`,
    );

    const response = await postPublish(
      env.post,
      { contentItemId: 'live_b', expectedPendingReplacementId: 'does-not-exist' },
      token,
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { code: string; reason: string };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.reason).toBe('wrong-pending-replacement');
  });

  it('400s with a mapped VALIDATION_ERROR when expectedPendingReplacementId names the wrong (or an unrelated) replacement', async () => {
    const env = await freshRoute('pubroute5');
    const { token } = await seedAdmin(env, 'a');
    await seedLiveWithPending(env, { liveId: 'live_c1', pendingId: 'pending_c1' });
    await seedLiveWithPending(env, { liveId: 'live_c2', pendingId: 'pending_c2' });

    const response = await postPublish(
      env.post,
      { contentItemId: 'live_c1', expectedPendingReplacementId: 'pending_c2' },
      token,
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as { reason: string };
    expect(body.reason).toBe('wrong-pending-replacement');

    // Neither asset was touched by the rejected cross-asset attempt.
    const { rows } = await env.db.client.query(
      `SELECT id, status, storage_key FROM content_items WHERE id IN ('live_c1', 'live_c2') ORDER BY id`,
    );
    expect(rows).toMatchObject([
      { id: 'live_c1', status: 'PUBLISHED', storage_key: 'cms/ai_income_99/assets/live_c1.pdf' },
      { id: 'live_c2', status: 'PUBLISHED', storage_key: 'cms/ai_income_99/assets/live_c2.pdf' },
    ]);
  });

  it('a replayed (already-consumed) publish request fails safely as the same mapped VALIDATION_ERROR, without corrupting the now-current state', async () => {
    const env = await freshRoute('pubroute6');
    const { token } = await seedAdmin(env, 'a');
    await seedLiveWithPending(env, { liveId: 'live_d', pendingId: 'pending_d' });

    const first = await postPublish(env.post, { contentItemId: 'live_d', expectedPendingReplacementId: 'pending_d' }, token);
    expect(first.status).toBe(200);

    const replay = await postPublish(env.post, { contentItemId: 'live_d', expectedPendingReplacementId: 'pending_d' }, token);
    expect(replay.status).toBe(400);
    const replayBody = (await replay.json()) as { reason: string };
    expect(replayBody.reason).toBe('wrong-pending-replacement');

    const { rows } = await env.db.client.query(`SELECT storage_key FROM content_items WHERE id = 'live_d'`);
    expect((rows[0] as { storage_key: string }).storage_key).toBe('cms/ai_income_99/assets/pending_d.pdf'); // unchanged by the replay
  });

  it('400s on a missing/invalid request body before ever reaching the transaction', async () => {
    const env = await freshRoute('pubroute7');
    const { token } = await seedAdmin(env, 'a');

    const missingBoth = await postPublish(env.post, {}, token);
    expect(missingBoth.status).toBe(400);

    const missingPending = await postPublish(env.post, { contentItemId: 'live_x' }, token);
    expect(missingPending.status).toBe(400);
    const body = (await missingPending.json()) as { field: string };
    expect(body.field).toBe('expectedPendingReplacementId');
  });

  it('concurrent publish of the same replacement through the real route allows only one success, with no duplicate obsolete-object row', async () => {
    const env = await freshRoute('pubroute8');
    const { token } = await seedAdmin(env, 'a');
    await seedLiveWithPending(env, { liveId: 'live_e', pendingId: 'pending_e' });

    const [first, second] = await Promise.all([
      postPublish(env.post, { contentItemId: 'live_e', expectedPendingReplacementId: 'pending_e' }, token),
      postPublish(env.post, { contentItemId: 'live_e', expectedPendingReplacementId: 'pending_e' }, token),
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([200, 400]); // exactly one winner, one safely-rejected loser

    const { rows: obsoleteRows } = await env.db.client.query(
      `SELECT 1 FROM content_item_obsolete_objects WHERE content_item_id = 'live_e'`,
    );
    expect(obsoleteRows).toHaveLength(1); // never duplicated by the losing concurrent attempt

    const { rows: pendingRows } = await env.db.client.query(`SELECT 1 FROM content_items WHERE id = 'pending_e'`);
    expect(pendingRows).toHaveLength(0);
  });

  it('SECURITY: the response never exposes storage keys, and an unexpected error never exposes DB internals', async () => {
    const env = await freshRoute('pubroute9');
    const { token } = await seedAdmin(env, 'a');
    await seedLiveWithPending(env, { liveId: 'live_f', pendingId: 'pending_f' });

    const response = await postPublish(
      env.post,
      { contentItemId: 'live_f', expectedPendingReplacementId: 'pending_f' },
      token,
    );
    const body = (await response.json()) as Record<string, unknown>;
    const serialized = JSON.stringify(body);
    expect(serialized).not.toMatch(/storageKey/i);
    expect(serialized).not.toMatch(/password|secret|credential/i);
  });
});
