import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPgCompanyRepository, createPgProspectRepository } from '@acos/core-discovery';
import { createPgIdentityRepository } from '@acos/core-identity';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import { createPgResearchSignalRepository } from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import { createPgServiceProfileRepository, type ServiceProfileFields } from '@acos/core-service-profile';
import {
  createPgLeadUnlockRepository,
  createPgSubscriptionPeriodRepository,
  LeadUnlockOpportunityNotFoundError,
  NoActiveClientFinderSubscriptionError,
  NoQualifyingContactError,
  unlockOpportunityForOwner,
  type LeadUnlockDeps,
} from '@acos/core-subscriptions';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// ₹1,499 Client Finder SUBSCRIPTION — the full unlock (reveal) flow,
// against real PostgreSQL, using the REAL pg-backed repository for every
// domain object (not fakes) — this is the closest this suite gets to a
// true end-to-end test of plan §G without going through Next.js/HTTP.
// Covers: access scenarios (plan §I: zero-entitlement, active, expired,
// refunded, already-unlocked), eligibility (opportunity-eligibility
// decision §7), atomicity/idempotency/duplicate-unlock (Q-UNLOCK-1).

const SUBSCRIPTION_PRODUCT_SLUG = 'ai_client_acquisition_1499_subscription';

let reachable = false;
const open: TempDatabase[] = [];
const pools: Pool[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  for (const pool of pools) await pool.end();
  while (open.length > 0) await open.pop()!.drop();
});

interface Env {
  db: TempDatabase;
  pool: Pool;
  deps: Omit<LeadUnlockDeps, 'identity'>;
  identity: ReturnType<typeof createPgIdentityRepository>;
  profiles: ReturnType<typeof createPgServiceProfileRepository>;
  searches: ReturnType<typeof createPgSearchRepository>;
}

async function freshEnv(label: string): Promise<Env> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});
  open.push(db);
  const pool = new Pool({ connectionString: db.url });
  pools.push(pool);

  const identity = createPgIdentityRepository(pool);
  const profiles = createPgServiceProfileRepository(pool);
  const searches = createPgSearchRepository(pool);
  const companies = createPgCompanyRepository(pool);
  const prospects = createPgProspectRepository(pool);
  const signals = createPgResearchSignalRepository(pool);
  const opportunities = createPgOpportunityRepository(pool);
  const subscriptionPeriods = createPgSubscriptionPeriodRepository(pool);
  const leadUnlocks = createPgLeadUnlockRepository(pool);

  return {
    db,
    pool,
    identity,
    profiles,
    searches,
    deps: { opportunities, prospects, companies, signals, subscriptionPeriods, leadUnlocks },
  };
}

const PROFILE_FIELDS: ServiceProfileFields = {
  service: 'Website redesign',
  targetCustomer: 'Local service businesses',
  geography: 'United States',
  minProjectValuePaise: 500_000,
  triggers: ['WEBSITE'],
  keywords: ['outdated', 'redesign'],
  rationale: 'Businesses with an outdated website need a redesign.',
};

/** Builds a full owned Opportunity, with or without a K1-qualifying contact in its evidence. */
async function seedOpportunity(
  env: Env,
  suffix: string,
  options: { contactText: string | null },
): Promise<{ userId: string; opportunityId: string }> {
  const now = new Date();
  const user = await env.identity.createUser({ email: `user_${suffix}@example.test` }, now);
  const profile = await env.profiles.create(user.id, PROFILE_FIELDS, now);
  const search = await env.searches.create(
    user.id,
    { serviceProfileId: profile.id, parameters: PROFILE_FIELDS, idempotencyKey: null },
    now,
  );
  const company = await env.deps.companies.findOrCreateByDomain(
    user.id,
    { name: `Acme ${suffix}`, normalizedDomain: `acme-${suffix}.com` },
    now,
  );
  const prospect = await env.deps.prospects.findOrCreate(
    user.id,
    { searchId: search.id, companyId: company.id },
    now,
  );
  await env.deps.signals.saveSignals(
    prospect.id,
    [
      {
        field: 'companySummary',
        kind: 'WEBSITE',
        classification: 'OBSERVED',
        signal: options.contactText ?? 'A growing local business with no public contact details.',
        confidence: 80,
        basis: null,
        sources: [
          { sourceUrl: `https://acme-${suffix}.com`, sourceQuote: options.contactText ?? 'n/a', sourceLabel: 'Homepage' },
        ],
      },
    ],
    now,
  );
  // need_detected/offer are an all-or-nothing pair (migration 0017's
  // opportunities_need_offer_consistency CHECK) -- irrelevant to the
  // unlock flow under test, so NO SUITABLE OFFER (AC-14) is used here.
  const opportunity = await env.deps.opportunities.create(
    user.id,
    { prospectId: prospect.id, needDetected: false, offer: undefined },
    now,
  );
  return { userId: user.id, opportunityId: opportunity.id };
}

async function insertSubscriptionPeriod(
  env: Env,
  input: { userId: string; activationAt: Date; durationDays: number; refundedAt?: Date | null },
): Promise<string> {
  const id = randomUUID();
  await env.db.client.query(
    `INSERT INTO subscription_periods
       (id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id,
        activation_at, duration_days, refunded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      input.userId,
      SUBSCRIPTION_PRODUCT_SLUG,
      `sub_${id}`,
      `pay_${id}`,
      input.activationAt,
      input.durationDays,
      input.refundedAt ?? null,
    ],
  );
  return id;
}

describe('access scenarios (plan §I)', () => {
  it('zero-entitlement: unlock is rejected for a user with no subscription period at all', async () => {
    const env = await freshEnv('access-zero');
    const { userId, opportunityId } = await seedOpportunity(env, 'zero', {
      contactText: 'Email owner@acme-zero.com for a quote.',
    });

    await expect(unlockOpportunityForOwner(env.deps, userId, opportunityId)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
    expect((await env.deps.leadUnlocks.findByUserAndOpportunity(userId, opportunityId))).toBeNull();
  }, 30_000);

  it('active subscriber with an eligible opportunity: unlock succeeds and persists contacts', async () => {
    const env = await freshEnv('access-active');
    const { userId, opportunityId } = await seedOpportunity(env, 'active', {
      contactText: 'Reach us at owner@acme-active.com or +1 415-555-0100.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    const result = await unlockOpportunityForOwner(env.deps, userId, opportunityId);

    expect(result.opportunityId).toBe(opportunityId);
    expect(result.contacts.length).toBeGreaterThanOrEqual(2);
    expect(result.contacts).toEqual(
      expect.arrayContaining([
        { kind: 'BUSINESS_EMAIL', value: 'owner@acme-active.com' },
        { kind: 'PHONE', value: '+1 415-555-0100' },
      ]),
    );
  }, 30_000);

  it('expired subscription (past its own activation_at + duration_days): unlock is rejected, same as zero-entitlement', async () => {
    const env = await freshEnv('access-expired');
    const { userId, opportunityId } = await seedOpportunity(env, 'expired', {
      contactText: 'Email owner@acme-expired.com.',
    });
    await insertSubscriptionPeriod(env, {
      userId,
      activationAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      durationDays: 30,
    });

    await expect(unlockOpportunityForOwner(env.deps, userId, opportunityId)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  }, 30_000);

  it('refunded subscription (still within its window, but refunded): unlock is rejected (IRL-N)', async () => {
    const env = await freshEnv('access-refunded');
    const { userId, opportunityId } = await seedOpportunity(env, 'refunded', {
      contactText: 'Email owner@acme-refunded.com.',
    });
    await insertSubscriptionPeriod(env, {
      userId,
      activationAt: new Date(),
      durationDays: 30,
      refundedAt: new Date(),
    });

    await expect(unlockOpportunityForOwner(env.deps, userId, opportunityId)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  }, 30_000);

  it('a previously unlocked opportunity stays accessible after the granting subscription later expires (IRL-I)', async () => {
    const env = await freshEnv('access-permanent');
    const { userId, opportunityId } = await seedOpportunity(env, 'permanent', {
      contactText: 'Email owner@acme-permanent.com.',
    });
    const periodId = await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });
    const firstUnlock = await unlockOpportunityForOwner(env.deps, userId, opportunityId);

    // Simulate the subscription having since expired.
    await env.db.client.query(
      `UPDATE subscription_periods SET activation_at = $2 WHERE id = $1`,
      [periodId, new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)],
    );

    const secondCall = await unlockOpportunityForOwner(env.deps, userId, opportunityId);
    // Same underlying row (id, ownership, contacts, unlock moment) --
    // `createdAt` is excluded: the fast (winning-insert) path and the
    // reread-after-conflict path construct it differently (the insert's
    // own `DEFAULT CURRENT_TIMESTAMP` vs. the caller's `now`), a
    // cosmetic bookkeeping difference no business logic depends on.
    expect(secondCall).toMatchObject({
      id: firstUnlock.id,
      userId: firstUnlock.userId,
      opportunityId: firstUnlock.opportunityId,
      subscriptionPeriodId: firstUnlock.subscriptionPeriodId,
      unlockedAt: firstUnlock.unlockedAt,
      contacts: firstUnlock.contacts,
    });
  }, 30_000);
});

describe('opportunity eligibility (CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md §7)', () => {
  it('rejects unlock with NO_QUALIFYING_CONTACT when no contact channel is extractable, and writes no lead_unlocks row', async () => {
    const env = await freshEnv('eligibility-none');
    const { userId, opportunityId } = await seedOpportunity(env, 'none', {
      contactText: 'A quiet, unremarkable storefront with no listed contact.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    await expect(unlockOpportunityForOwner(env.deps, userId, opportunityId)).rejects.toThrow(
      NoQualifyingContactError,
    );
    expect(await env.deps.leadUnlocks.findByUserAndOpportunity(userId, opportunityId)).toBeNull();
  }, 30_000);

  it('accepts a PHONE-only qualifying channel (no email at all)', async () => {
    const env = await freshEnv('eligibility-phone-only');
    const { userId, opportunityId } = await seedOpportunity(env, 'phoneonly', {
      contactText: 'Call +1 415-555-0199 to discuss your project.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    const result = await unlockOpportunityForOwner(env.deps, userId, opportunityId);
    expect(result.contacts).toEqual([{ kind: 'PHONE', value: '+1 415-555-0199' }]);
  }, 30_000);

  it('throws LeadUnlockOpportunityNotFoundError for an opportunity id the user does not own', async () => {
    const env = await freshEnv('eligibility-notfound');
    const { userId } = await seedOpportunity(env, 'notfound', { contactText: 'owner@acme-notfound.com' });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    await expect(
      unlockOpportunityForOwner(env.deps, userId, 'opp_does_not_exist'),
    ).rejects.toThrow(LeadUnlockOpportunityNotFoundError);
  }, 30_000);
});

describe('unlock atomicity, idempotency, and concurrency (Q-UNLOCK-1)', () => {
  it('a duplicate unlock request returns the identical result and writes no second row', async () => {
    const env = await freshEnv('unlock-duplicate');
    const { userId, opportunityId } = await seedOpportunity(env, 'dup', {
      contactText: 'Email owner@acme-dup.com.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    const first = await unlockOpportunityForOwner(env.deps, userId, opportunityId);
    const second = await unlockOpportunityForOwner(env.deps, userId, opportunityId);

    // See the IRL-I test above for why `createdAt` is excluded.
    expect(second).toMatchObject({
      id: first.id,
      userId: first.userId,
      opportunityId: first.opportunityId,
      subscriptionPeriodId: first.subscriptionPeriodId,
      unlockedAt: first.unlockedAt,
      contacts: first.contacts,
    });
    const { rows } = await env.db.client.query(
      `SELECT count(*)::int AS n FROM lead_unlocks WHERE user_id = $1 AND opportunity_id = $2`,
      [userId, opportunityId],
    );
    expect(rows[0].n).toBe(1);
  }, 30_000);

  it('two concurrent first-time unlock requests race safely to exactly one lead_unlocks row', async () => {
    const env = await freshEnv('unlock-race');
    const { userId, opportunityId } = await seedOpportunity(env, 'race', {
      contactText: 'Email owner@acme-race.com.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    const [a, b] = await Promise.all([
      unlockOpportunityForOwner(env.deps, userId, opportunityId),
      unlockOpportunityForOwner(env.deps, userId, opportunityId),
    ]);

    expect(a.id).toBe(b.id);
    const { rows } = await env.db.client.query(
      `SELECT count(*)::int AS n FROM lead_unlocks WHERE user_id = $1 AND opportunity_id = $2`,
      [userId, opportunityId],
    );
    expect(rows[0].n).toBe(1);
    const { rows: contactRows } = await env.db.client.query(
      `SELECT count(*)::int AS n FROM lead_unlock_contacts WHERE lead_unlock_id = $1`,
      [a.id],
    );
    expect(contactRows[0].n).toBe(1);
  }, 30_000);

  it('persists every captured contact row with the correct FK to its lead_unlocks row', async () => {
    const env = await freshEnv('unlock-persist');
    const { userId, opportunityId } = await seedOpportunity(env, 'persist', {
      contactText: 'Email owner@acme-persist.com or call +1 415-555-0177.',
    });
    await insertSubscriptionPeriod(env, { userId, activationAt: new Date(), durationDays: 30 });

    const result = await unlockOpportunityForOwner(env.deps, userId, opportunityId);

    const { rows } = await env.db.client.query(
      `SELECT kind, value FROM lead_unlock_contacts WHERE lead_unlock_id = $1 ORDER BY kind`,
      [result.id],
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        { kind: 'BUSINESS_EMAIL', value: 'owner@acme-persist.com' },
        { kind: 'PHONE', value: '+1 415-555-0177' },
      ]),
    );
  }, 30_000);
});
