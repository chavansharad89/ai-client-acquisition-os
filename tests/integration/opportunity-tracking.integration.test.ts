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
  getOpportunityTrackingSummary,
  recordFeedback,
  type OpportunityDeps,
  type OpportunityFeedbackDeps,
  type OpportunityTrackingDeps,
} from '@acos/core-opportunity';
import { createPgResearchSignalRepository } from '@acos/core-research';
import {
  createPgSearchRepository,
  createSearch,
  transitionSearch,
  type SearchDeps,
} from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Basic outcome tracking (PRD V2.2 R-27, Phase 15) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves getOpportunityTrackingSummary() computes "created"/"actioned"
// purely from what migrations 0017 (opportunities) and 0020 (feedback)
// already persist — no new migration exists for Phase 15, so there is no
// schema to apply here; this suite instead proves the two existing
// tables' own `user_id` filters compose correctly under a fresh read
// (durability, mirrors opportunity-feedback.integration.test.ts's AC-22
// proof) and that no cross-user leakage occurs at either repository
// boundary. Deliberately does not test a "reviewed" count — R-27 does
// not define one; see service.ts's Phase 15 section.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_tracking');

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

function trackingDeps(base: ReturnType<typeof repos>): OpportunityTrackingDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `opportunity-tracking.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

/** Creates one fresh Opportunity for `token`, via its own ServiceProfile + Search + single candidate. */
async function createOpportunityFor(
  base: ReturnType<typeof repos>,
  token: string,
  candidateName: string,
): Promise<string> {
  const d = discoveryDeps(base, [
    { name: candidateName, website: `https://${randomUUID()}.example.com` },
  ]);
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;

  const result = await runDiscovery(d, token, { searchId: running.id });
  const prospectId = result.prospects[0]!.id;

  const opportunity = await createOpportunity(opportunityDeps(base), token, { prospectId });
  return opportunity.id;
}

describe('getOpportunityTrackingSummary (R-27, Phase 15)', () => {
  it('reports all zeros for an authenticated user with no Opportunities', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(getOpportunityTrackingSummary(trackingDeps(base), a.token)).resolves.toEqual({
      created: 0,
      actioned: 0,
      useful: 0,
      notUseful: 0,
      actionedRate: 0,
    });
  });

  it('counts created and actioned Opportunities from real, persisted rows', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    const first = await createOpportunityFor(base, a.token, 'Acme Co');
    const second = await createOpportunityFor(base, a.token, 'Beta LLC');
    await createOpportunityFor(base, a.token, 'Gamma Inc'); // left without feedback

    await recordFeedback(feedbackDeps(base), a.token, first, {
      useful: true,
      reason: 'Strong fit, following up.',
    });
    await recordFeedback(feedbackDeps(base), a.token, second, {
      useful: false,
      reason: 'No budget this quarter.',
    });

    const summary = await getOpportunityTrackingSummary(trackingDeps(base), a.token);

    expect(summary).toEqual({
      created: 3,
      actioned: 2,
      useful: 1,
      notUseful: 1,
      actionedRate: 2 / 3,
    });
  });

  it('survives a fresh read through separate repository instances (durability, mirrors AC-22)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    const opportunityId = await createOpportunityFor(base, a.token, 'Acme Co');
    await recordFeedback(feedbackDeps(base), a.token, opportunityId, {
      useful: true,
      reason: 'Good fit.',
    });

    const freshBase = repos();
    const summary = await getOpportunityTrackingSummary(trackingDeps(freshBase), a.token);

    expect(summary).toEqual({
      created: 1,
      actioned: 1,
      useful: 1,
      notUseful: 0,
      actionedRate: 1,
    });
  });

  it("a different authenticated user's summary never includes user A's Opportunities or Feedback (R-33 isolation)", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();

    const opportunityId = await createOpportunityFor(base, a.token, 'Acme Co');
    await recordFeedback(feedbackDeps(base), a.token, opportunityId, {
      useful: true,
      reason: 'Good fit.',
    });

    await expect(getOpportunityTrackingSummary(trackingDeps(base), b.token)).resolves.toEqual({
      created: 0,
      actioned: 0,
      useful: 0,
      notUseful: 0,
      actionedRate: 0,
    });

    // Direct-database proof, not just application-level filtering: user
    // B's own userId has zero rows in either table, and user A's rows
    // remain scoped to user A at the SQL layer itself.
    const { db } = suite.require();
    const { rows: opportunityRows } = await db.client.query(
      `SELECT count(*)::int AS count FROM opportunities WHERE user_id = $1`,
      [b.userId],
    );
    expect((opportunityRows[0] as { count: number }).count).toBe(0);

    const { rows: feedbackRows } = await db.client.query(
      `SELECT count(*)::int AS count FROM feedback WHERE user_id = $1`,
      [b.userId],
    );
    expect((feedbackRows[0] as { count: number }).count).toBe(0);

    // user A's own summary is unaffected by user B's (empty) read.
    await expect(getOpportunityTrackingSummary(trackingDeps(base), a.token)).resolves.toEqual({
      created: 1,
      actioned: 1,
      useful: 1,
      notUseful: 0,
      actionedRate: 1,
    });
  });

  it('rejects an unauthenticated request before touching either repository', async () => {
    const base = repos();
    await expect(getOpportunityTrackingSummary(trackingDeps(base), null)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('is deterministic — repeated reads over unchanged data return an equal result', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const opportunityId = await createOpportunityFor(base, a.token, 'Acme Co');
    await recordFeedback(feedbackDeps(base), a.token, opportunityId, {
      useful: true,
      reason: 'Good fit.',
    });

    const first = await getOpportunityTrackingSummary(trackingDeps(base), a.token);
    const second = await getOpportunityTrackingSummary(trackingDeps(base), a.token);

    expect(second).toEqual(first);
  });
});
