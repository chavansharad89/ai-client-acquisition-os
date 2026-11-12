import { evaluatePcg4, mostRecentClosedWindow } from '@acos/core-launch-gates';
import {
  createPgTargetCustomerMatchRepository,
  CURRENT_ROW_UNIQUE_CONSTRAINT,
  targetCustomerMatchSourceContentSha256,
  type NewTargetCustomerMatchDeterminationInput,
} from '@acos/core-research';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  cleanupGatesFixtures,
  createGatesTracker,
  seedCompany,
  seedFeedback,
  seedFunnelEvent,
  seedOpportunity,
  seedProspect,
  seedSearch,
  seedServiceProfile,
  seedUser,
} from '../fixtures/launch-gates-fixtures';
import type { Queryable, TestRunContext } from '../fixtures/test-run-context';
import { createTempDatabase } from './support/pgIndexHarness';
import { suiteDatabase } from './support/suiteDb';

// PCG-4 TARGET_CUSTOMER_MATCH — real PostgreSQL (migrations 0036/0037).
// requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision
// chain, acceptance criteria per PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §5.
// -----------------------------------------------------------------------

const suite = suiteDatabase('target_customer_match');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function windowFor(nowIso: string) {
  const now = new Date(nowIso);
  const window = mostRecentClosedWindow(now);
  return { now, window };
}

function input(overrides: Partial<NewTargetCustomerMatchDeterminationInput> = {}): NewTargetCustomerMatchDeterminationInput {
  return {
    searchId: 'search_1',
    prospectId: 'prospect_1',
    targetCustomer: 'smb_saas',
    result: 'MATCH',
    evidence: [{ classification: 'MATCH', quote: 'q', sourceUrl: 'https://x.example.com', sourceLabel: 'x' }],
    model: 'test-model',
    provider: 'test-provider',
    promptVersion: 'v1',
    ...overrides,
  };
}

/** Seeds a user/profile/search/company/prospect graph; returns ids plus a cleanup tracker. */
async function seedSearchAndProspect(
  db: Queryable,
  context: TestRunContext,
  suffix: string,
  completedAt: Date = new Date('2026-03-09T00:00:00.000Z'),
) {
  const tracker = createGatesTracker();
  const userId = await seedUser(db, context, tracker, suffix);
  const profileId = await seedServiceProfile(db, context, tracker, userId, suffix, {
    service: 'ai_automation',
    targetCustomer: 'smb_saas',
    geography: 'IN',
    minProjectValuePaise: 100_000,
  });
  const searchId = await seedSearch(db, context, tracker, userId, profileId, suffix, {
    status: 'COMPLETE',
    completedAt,
    service: 'ai_automation',
    targetCustomer: 'smb_saas',
    geography: 'IN',
    minProjectValuePaise: 100_000,
  });
  const companyId = await seedCompany(db, context, tracker, userId, suffix);
  const prospectId = await seedProspect(db, context, tracker, userId, searchId, companyId, suffix);
  return { tracker, userId, profileId, searchId, companyId, prospectId };
}

describe('migration 0036/0037 — schema shape', () => {
  it('applying both migrations to a clean database creates the expected columns, FKs and indexes; rollback succeeds', async () => {
    const db = await createTempDatabase('tcm_schema');
    try {
      const { rows: columns } = await db.client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'target_customer_match_determinations'`,
      );
      expect(new Set((columns as { column_name: string }[]).map((c) => c.column_name))).toEqual(
        new Set([
          'id',
          'search_id',
          'prospect_id',
          'target_customer',
          'result',
          'evidence',
          'model',
          'provider',
          'prompt_version',
          'observed_at',
          'superseded_at',
          'created_at',
        ]),
      );

      const { rows: indexes } = await db.client.query(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'target_customer_match_determinations'`,
      );
      const indexNames = (indexes as { indexname: string }[]).map((r) => r.indexname);
      expect(indexNames).toContain(CURRENT_ROW_UNIQUE_CONSTRAINT);

      const { rows: sourceColumns } = await db.client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'target_customer_match_source_documents'`,
      );
      expect(new Set((sourceColumns as { column_name: string }[]).map((c) => c.column_name))).toEqual(
        new Set([
          'id',
          'determination_id',
          'document_index',
          'source_label',
          'source_url',
          'source_text',
          'content_sha256',
          'fetched_at',
          'created_at',
        ]),
      );

      // Rollback: 0037 (child) before 0036 (parent), mirroring the FK direction.
      await db.client.query(`DROP TABLE "target_customer_match_source_documents"`);
      await db.client.query(`DROP TABLE "target_customer_match_determinations"`);
    } finally {
      await db.drop();
    }
  }, 30_000);

  it('the FK cascade from 0037 to 0036 is exercised: deleting a determination removes its source-document rows', async () => {
    const { db, context } = suite.require();
    const { tracker, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'cascade');
    const repo = createPgTargetCustomerMatchRepository(db.client);

    const row = await repo.save(
      input({ searchId, prospectId }),
      new Date('2026-03-01T00:00:00.000Z'),
      [{ label: 'x', url: 'https://x.example.com', text: 'exact model-seen text', fetchedAt: new Date('2026-03-01T00:00:00.000Z') }],
    );

    const before = await db.client.query(
      `SELECT id FROM target_customer_match_source_documents WHERE determination_id = $1`,
      [row.id],
    );
    expect(before.rows).toHaveLength(1);

    await db.client.query(`DELETE FROM target_customer_match_determinations WHERE id = $1`, [row.id]);

    const after = await db.client.query(
      `SELECT id FROM target_customer_match_source_documents WHERE determination_id = $1`,
      [row.id],
    );
    expect(after.rows).toHaveLength(0);

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('source-document binding (TD-5, migration 0037)', () => {
  it('each captured source row\'s content_sha256 equals the independently-recomputed SHA-256 of its own source_text', async () => {
    const { db, context } = suite.require();
    const { tracker, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'hash');
    const repo = createPgTargetCustomerMatchRepository(db.client);

    const FETCHED_AT = new Date('2026-03-01T00:00:00.000Z');
    const row = await repo.save(input({ searchId, prospectId }), FETCHED_AT, [
      { label: 'Homepage', url: 'https://acme.example.com', text: 'Acme serves  restaurants — "exact" text ✓', fetchedAt: FETCHED_AT },
      { label: 'About', url: 'https://acme.example.com/about', text: 'A second, distinct document.', fetchedAt: FETCHED_AT },
    ]);

    const { rows } = await db.client.query(
      `SELECT document_index, source_text, content_sha256,
              encode(sha256(convert_to(source_text, 'UTF8')), 'hex') AS recomputed
         FROM target_customer_match_source_documents WHERE determination_id = $1 ORDER BY document_index`,
      [row.id],
    );
    expect(rows).toHaveLength(2);
    for (const r of rows as { source_text: string; content_sha256: string; recomputed: string }[]) {
      expect(r.content_sha256).toBe(r.recomputed);
      expect(r.content_sha256).toBe(targetCustomerMatchSourceContentSha256(r.source_text));
    }

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('model/provider/prompt_version provenance (TD-6)', () => {
  it('every inserted determination row has non-null model/provider/prompt_version matching what the repository was invoked with', async () => {
    const { db, context } = suite.require();
    const { tracker, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'provenance');
    const repo = createPgTargetCustomerMatchRepository(db.client);

    const row = await repo.save(
      input({ searchId, prospectId, model: 'claude-x', provider: 'anthropic', promptVersion: 'v7' }),
      new Date('2026-03-01T00:00:00.000Z'),
    );
    expect(row.model).toBe('claude-x');
    expect(row.provider).toBe('anthropic');
    expect(row.promptVersion).toBe('v7');

    const { rows } = await db.client.query(
      `SELECT model, provider, prompt_version FROM target_customer_match_determinations WHERE id = $1`,
      [row.id],
    );
    expect(rows[0]).toMatchObject({ model: 'claude-x', provider: 'anthropic', prompt_version: 'v7' });

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.2 — real concurrent writes', () => {
  it('exactly one current row survives two concurrent save() calls for the same (search_id, prospect_id) pair; neither call throws', async () => {
    const { db, context } = suite.require();
    const { tracker, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'race');
    const repoA = createPgTargetCustomerMatchRepository(db.client);
    const repoB = createPgTargetCustomerMatchRepository(db.client);

    const [a, b] = await Promise.all([
      repoA.save(input({ searchId, prospectId, result: 'MATCH' }), new Date('2026-03-01T00:00:00.000Z')),
      repoB.save(input({ searchId, prospectId, result: 'NO_MATCH' }), new Date('2026-03-01T00:00:00.001Z')),
    ]);
    expect(a).toBeDefined();
    expect(b).toBeDefined();

    const { rows } = await db.client.query(
      `SELECT id FROM target_customer_match_determinations
         WHERE search_id = $1 AND prospect_id = $2 AND superseded_at IS NULL`,
      [searchId, prospectId],
    );
    expect(rows).toHaveLength(1);

    await cleanupGatesFixtures(db.client, tracker);
  });

  it('a non-index database error is not swallowed as a no-op', async () => {
    const { db, context } = suite.require();
    const { tracker, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'realerr');
    const repo = createPgTargetCustomerMatchRepository(db.client);

    // A genuinely different failure: result value violates the CHECK
    // constraint, not the TD-8 unique index — must propagate, not resolve
    // to a silently-returned row.
    await expect(
      repo.save(input({ searchId, prospectId, result: 'INVALID' as never }), new Date('2026-03-01T00:00:00.000Z')),
    ).rejects.toThrow();

    await cleanupGatesFixtures(db.client, tracker);
  });
});

describe('PCG-4 real-Postgres end-to-end (TD-13 join + §1.1 translation)', () => {
  it('a seeded MATCH determination produces a non-structurally-zero numerator end-to-end', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-09T00:00:00.000Z');
    const { tracker, userId, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'e2e', window.start);

    const opportunityId = await seedOpportunity(db.client, context, tracker, userId, prospectId, 'e2e', {
      needDetected: true,
      recommendedService: 'ai_automation',
      offerRationale: 'fixture',
      offerEstimatedValuePaise: 200_000,
      offerFit: 80,
    });
    await seedFeedback(db.client, context, tracker, userId, opportunityId, 'e2e', true);
    await seedFunnelEvent(db.client, context, tracker, 'e2e', {
      eventName: 'opportunity_reviewed',
      subjectType: 'opportunity',
      subjectId: opportunityId,
      occurredAt: window.start,
      userId,
    });

    const repo = createPgTargetCustomerMatchRepository(db.client);
    await repo.save(input({ searchId, prospectId, targetCustomer: 'smb_saas', result: 'MATCH' }), window.start);

    const result = await evaluatePcg4(db.client, window, now);
    expect(result.status).toBe('EVALUATED');
    expect(result.denominator).toBe(1);
    expect(result.numerator).toBe(1);
    expect(result.value).toBeGreaterThan(0);

    await cleanupGatesFixtures(db.client, tracker);
  });

  it('a NOT_YET_OBSERVED determination row leaves the numerator at 0 (unchanged, documented behavior)', async () => {
    const { db, context } = suite.require();
    const { now, window } = windowFor('2026-03-16T00:00:00.000Z');
    const { tracker, userId, searchId, prospectId } = await seedSearchAndProspect(db.client, context, 'e2e-ny', window.start);

    const opportunityId = await seedOpportunity(db.client, context, tracker, userId, prospectId, 'e2e-ny', {
      needDetected: true,
      recommendedService: 'ai_automation',
      offerRationale: 'fixture',
      offerEstimatedValuePaise: 200_000,
      offerFit: 80,
    });
    await seedFeedback(db.client, context, tracker, userId, opportunityId, 'e2e-ny', true);
    await seedFunnelEvent(db.client, context, tracker, 'e2e-ny', {
      eventName: 'opportunity_reviewed',
      subjectType: 'opportunity',
      subjectId: opportunityId,
      occurredAt: window.start,
      userId,
    });

    const repo = createPgTargetCustomerMatchRepository(db.client);
    await repo.save(input({ searchId, prospectId, result: 'NOT_YET_OBSERVED', evidence: [] }), window.start);

    const result = await evaluatePcg4(db.client, window, now);
    expect(result.numerator).toBe(0);

    await cleanupGatesFixtures(db.client, tracker);
  });
});
