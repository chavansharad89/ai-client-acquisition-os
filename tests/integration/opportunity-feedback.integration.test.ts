import { randomUUID } from 'node:crypto';

import {
  createPgCompanyRepository,
  createPgProspectRepository,
  runDiscovery,
  type DiscoveryCandidate,
  type DiscoveryDeps,
  type DiscoveryProvider,
} from '@acos/core-discovery';
import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
import {
  createOpportunity,
  createPgFeedbackRepository,
  createPgOpportunityRepository,
  FeedbackValidationError,
  getFeedback,
  OpportunityNotFoundError,
  recordFeedback,
  type OpportunityDeps,
  type OpportunityFeedbackDeps,
} from '@acos/core-opportunity';
import { createPgResearchSignalRepository } from '@acos/core-research';
import {
  createPgSearchRepository,
  createSearch,
  transitionSearch,
  type SearchDeps,
  type StoredSearch,
} from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Feedback persistence (migration 0020) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0020's schema plus @acos/core-opportunity's
// recordFeedback()/getFeedback() enforce, at the database itself:
// top-level user_id ownership (unlike opportunity_scores' inherited
// ownership), one current verdict per Opportunity
// (UNIQUE(opportunity_id)), free-form `reason` persisted verbatim (OQ-5:
// no enum, no CHECK, no taxonomy), and that feedback survives a fresh
// read (AC-22 "survives a page reload and a server restart" — proved by
// reading back through a separate repository instance against real
// Postgres, not an in-memory fake). Mirrors
// tests/integration/opportunity-score.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_feedback');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}

function repos() {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
    companies: createPgCompanyRepository(db.client),
    prospects: createPgProspectRepository(db.client),
    signals: createPgResearchSignalRepository(db.client),
    opportunities: createPgOpportunityRepository(db.client),
    feedback: createPgFeedbackRepository(db.client),
  };
}

function discoveryDeps(
  base: ReturnType<typeof repos>,
  candidates: readonly DiscoveryCandidate[],
): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
}

function opportunityDeps(base: ReturnType<typeof repos>): OpportunityDeps {
  return base;
}

function feedbackDeps(base: ReturnType<typeof repos>): OpportunityFeedbackDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `opportunity-feedback.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
    userId,
    email,
  ]);

  const identity = createPgIdentityRepository(db.client);
  const minted = await mintUserSession(identity, { id: userId, email });
  return { userId, token: minted.token };
}

function sampleProfileInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'AI content system',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 15_000_000,
    triggers: ['WEBSITE'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
    ...overrides,
  };
}

async function createProspect(base: ReturnType<typeof repos>, token: string): Promise<string> {
  const d = discoveryDeps(base, [{ name: 'Acme Co', website: 'https://acme.example.com' }]);
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;

  const result = await runDiscovery(d, token, { searchId: running.id });
  return result.prospects[0]!.id;
}

async function createOpportunityFor(base: ReturnType<typeof repos>, token: string) {
  const prospectId = await createProspect(base, token);
  return createOpportunity(opportunityDeps(base), token, { prospectId });
}

describe('feedback schema (migration 0020)', () => {
  it('feedback exists, carries its own user_id, references opportunities', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'feedback'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('user_id');
    expect(columns).toContain('opportunity_id');
    expect(columns).toContain('useful');
    expect(columns).toContain('reason');
  });

  it('enforces one current verdict per Opportunity', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'feedback' AND indexname = 'feedback_opportunity_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('recordFeedback', () => {
  it('persists a useful verdict with a free-text reason, verbatim (R-21/AC-22)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);
    const reason = 'The prospect already has an internal team.';

    const stored = await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: true,
      reason,
    });

    expect(stored.userId).toBe(a.userId);
    expect(stored.opportunityId).toBe(opportunity.id);
    expect(stored.useful).toBe(true);
    expect(stored.reason).toBe(reason);
  });

  it('survives a fresh read through a separate repository instance (AC-22 "survives a page reload and a server restart")', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);

    await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: true,
      reason: 'Good fit, following up next week.',
    });

    const freshBase = repos();
    const fetched = await getFeedback(feedbackDeps(freshBase), a.token, opportunity.id);

    expect(fetched?.useful).toBe(true);
    expect(fetched?.reason).toBe('Good fit, following up next week.');
  });

  it('does not restrict, rewrite, or categorize the reason content (OQ-5: free text, not a closed set)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);
    const reason =
      'Not useful — budget cut this quarter, but circle back after their next funding round. See notes from call on 2026-08-01.';

    const stored = await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: false,
      reason,
    });

    expect(stored.reason).toBe(reason);
  });

  it('resubmitting replaces the current verdict — UNIQUE(opportunity_id), never a second row', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);

    const first = await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: true,
      reason: 'first reason',
    });
    const second = await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: false,
      reason: 'changed my mind',
    });

    expect(second.id).toBe(first.id);
    expect(second.useful).toBe(false);
    expect(second.reason).toBe('changed my mind');

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM feedback WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });

  it('rejects a missing reason before touching the repository', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);

    await expect(
      recordFeedback(feedbackDeps(base), a.token, opportunity.id, { useful: true, reason: '  ' }),
    ).rejects.toBeInstanceOf(FeedbackValidationError);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM feedback WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      recordFeedback(feedbackDeps(base), null, 'irrelevant', { useful: true, reason: 'x' }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      recordFeedback(feedbackDeps(base), a.token, 'does-not-exist', {
        useful: true,
        reason: 'x',
      }),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different authenticated user cannot record feedback against another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);

    await expect(
      recordFeedback(feedbackDeps(base), b.token, opportunity.id, {
        useful: true,
        reason: 'x',
      }),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM feedback WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });
});

describe('getFeedback', () => {
  it('returns null when no feedback has been recorded yet', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);

    await expect(getFeedback(feedbackDeps(base), a.token, opportunity.id)).resolves.toBeNull();
  });

  it("a different user cannot read user A's feedback — isolation via Feedback's own user_id at the database boundary", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const opportunity = await createOpportunityFor(base, a.token);
    await recordFeedback(feedbackDeps(base), a.token, opportunity.id, {
      useful: true,
      reason: 'x',
    });

    await expect(getFeedback(feedbackDeps(base), b.token, opportunity.id)).resolves.toBeNull();
  });

  it('rejects an unauthenticated read', async () => {
    const base = repos();
    await expect(getFeedback(feedbackDeps(base), null, 'irrelevant')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});
