import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';

import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
import {
  AI_ESCALATION_BUDGET,
  createPgSearchRepository,
  createSearch,
  getSearch,
  listSearches,
  transitionSearch,
  SearchIdempotencyKeyConflictError,
  SearchInvalidTransitionError,
  SearchServiceProfileNotFoundError,
  type SearchDeps,
} from '@acos/core-search';
import {
  applySystemServiceProfileDefaults,
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Search ownership + lifecycle — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0014's schema plus @acos/core-search's repository
// enforce, at the database itself: cross-user isolation, the immutable
// parameter snapshot (DEC-007), and the fixed lifecycle graph — not just
// application-level checks. Mirrors
// tests/integration/service-profile.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('search');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function deps(): SearchDeps {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `search.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    service: 'Web & Software Development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['website', 'redesign'],
    rationale: 'They lack a working website.',
    ...overrides,
  };
}

async function createOwnedProfile(
  d: SearchDeps,
  token: string,
  overrides: Partial<ServiceProfileInput> = {},
) {
  return createServiceProfile(d, token, sampleProfileInput(overrides));
}

// claimNextPending() claims the globally oldest PENDING row, by design
// (R-34 — a worker has no session to scope by). Tracking every Search
// this suite creates lets afterEach(() => suite.cleanup()) remove them,
// so a PENDING row left behind by an earlier test can never be the one
// a later test's claimNextPending() picks up.
async function createTrackedSearch(
  d: SearchDeps,
  token: string | null,
  input: Parameters<typeof createSearch>[2],
) {
  const created = await createSearch(d, token, input);
  suite.require().context.trackSearch(created.id);
  return created;
}

describe('Search creation + snapshot', () => {
  it('an authenticated user starts a PENDING Search snapshotting their profile', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);

    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });
    expect(created.userId).toBe(a.userId);
    expect(created.serviceProfileId).toBe(profile.id);
    expect(created.status).toBe('PENDING');
    // CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002: a NEW search's
    // profile is created from service+geography alone — createServiceProfile()
    // discards every other field sampleProfileInput() sets (targetCustomer
    // included) in favor of applySystemServiceProfileDefaults(), so the
    // Search snapshot must match that system-owned shape, not the fixture.
    expect(created.parameters).toEqual(
      applySystemServiceProfileDefaults({
        service: 'Web & Software Development',
        geography: 'Mumbai',
      }),
    );
  });

  it('editing the ServiceProfile after creating a Search does not change the Search snapshot', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });

    await d.profiles.update(
      a.userId,
      profile.id,
      sampleProfileInput({ service: 'Rewritten after search creation' }),
      new Date(),
    );

    const reread = await getSearch(d, a.token, created.id);
    expect(reread?.parameters.service).toBe('Web & Software Development');
  });

  it('a serviceProfileId owned by another user is treated as not found', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileB = await createOwnedProfile(d, b.token);

    await expect(
      createSearch(d, a.token, { serviceProfileId: profileB.id }),
    ).rejects.toBeInstanceOf(SearchServiceProfileNotFoundError);
  });
});

describe('Search idempotency', () => {
  it('replaying the same key for the same profile returns the original Search, not a second row', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);

    const first = await createTrackedSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });
    const second = await createTrackedSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });

    expect(second.id).toBe(first.id);
    const all = await listSearches(d, a.token);
    expect(all).toHaveLength(1);
  });

  it('reusing a key for a different profile is a conflict, not a replay', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const otherProfile = await createOwnedProfile(d, a.token, { service: 'Digital Marketing' });

    await createTrackedSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });

    await expect(
      createSearch(d, a.token, {
        serviceProfileId: otherProfile.id,
        idempotencyKey: 'attempt-1',
      }),
    ).rejects.toBeInstanceOf(SearchIdempotencyKeyConflictError);
  });

  it('the same idempotency key is independent per user (unique index is scoped to user_id)', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileA = await createOwnedProfile(d, a.token);
    const profileB = await createOwnedProfile(d, b.token, { service: 'Digital Marketing' });

    const searchA = await createTrackedSearch(d, a.token, {
      serviceProfileId: profileA.id,
      idempotencyKey: 'shared-key',
    });
    const searchB = await createTrackedSearch(d, b.token, {
      serviceProfileId: profileB.id,
      idempotencyKey: 'shared-key',
    });

    expect(searchA.id).not.toBe(searchB.id);
    expect(searchA.userId).toBe(a.userId);
    expect(searchB.userId).toBe(b.userId);
  });
});

describe('Search ownership', () => {
  it('a different authenticated user cannot retrieve the Search', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });

    const asB = await getSearch(d, b.token, created.id);
    expect(asB).toBeNull();
  });

  it('a different authenticated user cannot transition the Search', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });

    const result = await transitionSearch(d, b.token, created.id, { status: 'RUNNING' });
    expect(result).toBeNull();

    const stillPending = await getSearch(d, a.token, created.id);
    expect(stillPending?.status).toBe('PENDING');
  });

  it('the owner sees only their own searches', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileA = await createOwnedProfile(d, a.token);
    const profileB = await createOwnedProfile(d, b.token, { service: 'Digital Marketing' });

    const mine = await createTrackedSearch(d, a.token, { serviceProfileId: profileA.id });
    await createTrackedSearch(d, b.token, { serviceProfileId: profileB.id });

    const aList = await listSearches(d, a.token);
    expect(aList.map((s) => s.id)).toEqual([mine.id]);
  });
});

describe('Search lifecycle', () => {
  it('persists PENDING -> RUNNING -> COMPLETE', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });

    const running = await transitionSearch(d, a.token, created.id, { status: 'RUNNING' });
    expect(running?.status).toBe('RUNNING');
    expect(running?.attempts).toBe(1);

    const complete = await transitionSearch(d, a.token, created.id, { status: 'COMPLETE' });
    expect(complete?.status).toBe('COMPLETE');
  });

  it('rejects an invalid transition (PENDING -> COMPLETE) and leaves the row unchanged', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });

    await expect(
      transitionSearch(d, a.token, created.id, { status: 'COMPLETE' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);

    const stillPending = await getSearch(d, a.token, created.id);
    expect(stillPending?.status).toBe('PENDING');
  });

  it('rejects a transition out of a terminal state', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createTrackedSearch(d, a.token, { serviceProfileId: profile.id });
    await transitionSearch(d, a.token, created.id, { status: 'CANCELLED' });

    await expect(
      transitionSearch(d, a.token, created.id, { status: 'RUNNING' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);
  });
});

describe('identity boundary', () => {
  it('an unauthenticated call is rejected before the repository runs', async () => {
    const d = deps();
    await expect(createSearch(d, null, { serviceProfileId: 'irrelevant' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a revoked/unknown token cannot list another user’s searches', async () => {
    const d = deps();
    await expect(listSearches(d, 'not-a-real-token')).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('AI escalation budget (Phase 5, migration 0046, real Postgres)', () => {
  async function createClaimedSearch(d: SearchDeps, token: string, workerId: string) {
    const profile = await createOwnedProfile(d, token);
    const created = await createTrackedSearch(d, token, { serviceProfileId: profile.id });
    const claimed = await d.searches.claimNextPending({
      workerId,
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });
    return claimed!.id;
  }

  it('0 -> 1: a fresh claimed Search admits its first unit', async () => {
    const a = await createUserAndSession('budget_a');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    const result = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_1',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(result).toEqual({ outcome: 'admitted', consumed: 1 });

    const reread = await getSearch(d, a.token, id);
    expect(reread?.aiEscalationUnitsConsumed).toBe(1);
  });

  it('9 -> 10: the last unit is still admitted', async () => {
    const a = await createUserAndSession('budget_b');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    for (let i = 0; i < 9; i += 1) {
      await d.searches.consumeAiEscalationUnit({
        id,
        workerId: 'worker_1',
        now: new Date(),
        budget: AI_ESCALATION_BUDGET,
      });
    }

    const tenth = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_1',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(tenth).toEqual({ outcome: 'admitted', consumed: 10 });
  });

  it('10 -> rejection: a Search already at budget is exhausted, and the row is left unchanged', async () => {
    const a = await createUserAndSession('budget_c');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    for (let i = 0; i < 10; i += 1) {
      await d.searches.consumeAiEscalationUnit({
        id,
        workerId: 'worker_1',
        now: new Date(),
        budget: AI_ESCALATION_BUDGET,
      });
    }

    const eleventh = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_1',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(eleventh).toEqual({ outcome: 'exhausted', consumed: 10 });

    const reread = await getSearch(d, a.token, id);
    expect(reread?.aiEscalationUnitsConsumed).toBe(10);
  });

  it('a worker that has lost its lease cannot consume a unit (fenced, nothing written)', async () => {
    const a = await createUserAndSession('budget_d');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    const result = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_2', // not the lease holder
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(result).toEqual({ outcome: 'fenced' });

    const reread = await getSearch(d, a.token, id);
    expect(reread?.aiEscalationUnitsConsumed).toBe(0);
  });

  it('a candidate-level AI failure keeps its already-admitted unit (no refund operation exists)', async () => {
    const a = await createUserAndSession('budget_e');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    const admitted = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_1',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(admitted).toEqual({ outcome: 'admitted', consumed: 1 });

    // Simulate the candidate's AI call throwing after admission: the
    // repository has no decrement/refund method, so the counter simply
    // stays at 1 — nothing further to call here proves the invariant.
    const reread = await getSearch(d, a.token, id);
    expect(reread?.aiEscalationUnitsConsumed).toBe(1);
  });

  it('a retry (re-claim) preserves the consumed count — it is never reset', async () => {
    const a = await createUserAndSession('budget_f');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_1',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });

    // Attempt 1 fails and is returned to PENDING; attempt 2 re-claims it.
    await d.searches.recordAttemptFailure({
      id,
      workerId: 'worker_1',
      now: new Date(),
      error: 'simulated crash',
      maxAttempts: 3,
    });
    const reclaimed = await d.searches.claimNextPending({
      workerId: 'worker_2',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });
    expect(reclaimed?.id).toBe(id);
    expect(reclaimed?.aiEscalationUnitsConsumed).toBe(1);

    const second = await d.searches.consumeAiEscalationUnit({
      id,
      workerId: 'worker_2',
      now: new Date(),
      budget: AI_ESCALATION_BUDGET,
    });
    expect(second).toEqual({ outcome: 'admitted', consumed: 2 });
  });

  it('CHECK constraint rejects a direct write past the budget, independent of application logic', async () => {
    const { db } = suite.require();
    const a = await createUserAndSession('budget_g');
    const d = deps();
    const id = await createClaimedSearch(d, a.token, 'worker_1');

    await expect(
      db.client.query(`UPDATE searches SET ai_escalation_units_consumed = 11 WHERE id = $1`, [id]),
    ).rejects.toThrow();
  });

  describe('concurrency (real Postgres)', () => {
    it('N connections racing at the boundary can never push consumed above the budget', async () => {
      const { db } = suite.require();
      const a = await createUserAndSession('budget_race');
      const d = deps();
      const id = await createClaimedSearch(d, a.token, 'worker_1');

      // Pre-consume 9, leaving exactly one unit of headroom.
      for (let i = 0; i < 9; i += 1) {
        await d.searches.consumeAiEscalationUnit({
          id,
          workerId: 'worker_1',
          now: new Date(),
          budget: AI_ESCALATION_BUDGET,
        });
      }

      const RACERS = 5;
      const pool = new Pool({ connectionString: db.url, max: RACERS + 2 });
      try {
        const racers = Array.from({ length: RACERS }, () =>
          createPgSearchRepository(pool).consumeAiEscalationUnit({
            id,
            workerId: 'worker_1',
            now: new Date(),
            budget: AI_ESCALATION_BUDGET,
          }),
        );
        const results = await Promise.all(racers);

        const admittedCount = results.filter((r) => r.outcome === 'admitted').length;
        const exhaustedCount = results.filter((r) => r.outcome === 'exhausted').length;
        expect(admittedCount).toBe(1);
        expect(exhaustedCount).toBe(RACERS - 1);

        const reread = await getSearch(d, a.token, id);
        expect(reread?.aiEscalationUnitsConsumed).toBe(10);
      } finally {
        await pool.end();
      }
    }, 30_000);
  });
});
