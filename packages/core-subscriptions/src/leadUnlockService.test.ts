import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import type { OpportunityRepository } from '@acos/core-opportunity';
import type { StoredResearchSignal } from '@acos/core-research';
import type { ResearchSignalRepository } from '@acos/core-research';
import { describe, expect, it, vi } from 'vitest';

import { CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG, getClientFinderSubscriptionStatus, hasClientFinderAccess } from './access';
import {
  LeadUnlockOpportunityNotFoundError,
  NoActiveClientFinderSubscriptionError,
  NoQualifyingContactError,
} from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import { unlockOpportunityForOwner, type LeadUnlockDeps } from './leadUnlockService';
import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';
import { fakeSubscriptionPeriodRepository } from './testing/fakeSubscriptionPeriodRepository';
import type { LeadUnlock, SubscriptionPeriod } from './types';

const NOW = new Date('2026-02-01T00:00:00Z');

function opportunity() {
  return {
    id: 'opp-1',
    userId: 'user-1',
    prospectId: 'prospect-1',
    state: 'RESEARCHED' as const,
    needDetected: true,
    offer: undefined,
    staleness: 'FRESH' as const,
    stalenessComputedAt: null,
    aiEnrichment: 'DETERMINISTIC_ONLY' as const,
    aiEnrichmentReason: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function prospect() {
  return {
    id: 'prospect-1',
    userId: 'user-1',
    searchId: 'search-1',
    companyId: 'company-1',
    status: 'DISCOVERED' as const,
    createdAt: NOW,
  };
}

function company(overrides: { normalizedDomain?: string } = {}) {
  return {
    id: 'company-1',
    userId: 'user-1',
    name: 'Acme',
    normalizedDomain: overrides.normalizedDomain ?? 'acme.com',
    createdAt: NOW,
  };
}

function activePeriod(overrides: Partial<SubscriptionPeriod> = {}): SubscriptionPeriod {
  return {
    id: 'period-1',
    userId: 'user-1',
    productSlug: CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
    razorpaySubscriptionId: 'sub_123',
    razorpayPaymentId: 'pay_123',
    activationAt: NOW,
    durationDays: 30,
    refundedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function signalWithContact(text: string): StoredResearchSignal {
  return {
    id: 'signal-1',
    prospectId: 'prospect-1',
    field: 'companySummary',
    kind: 'FIRST_PARTY',
    classification: 'OBSERVED',
    signal: text,
    confidence: 80,
    basis: null,
    observedAt: NOW,
    supersededAt: null,
    sources: [],
  };
}

interface Fakes {
  deps: Omit<LeadUnlockDeps, 'identity'>;
  findActiveForUser: ReturnType<typeof vi.fn>;
  revealAtomically: ReturnType<typeof vi.fn>;
}

function makeDeps(overrides: {
  opportunity?: ReturnType<typeof opportunity> | null;
  existingUnlock?: LeadUnlock | null;
  activePeriod?: SubscriptionPeriod | null;
  /** Full control over seeded periods, for multi-row scenarios (e.g. a different-product period alongside the real one). Takes precedence over `activePeriod` when given. */
  periods?: readonly SubscriptionPeriod[];
  signals?: StoredResearchSignal[];
  companyRow?: ReturnType<typeof company> | null;
} = {}): Fakes {
  const opportunities: OpportunityRepository = {
    create: vi.fn(),
    getById: vi.fn(async () => (overrides.opportunity === undefined ? opportunity() : overrides.opportunity)),
    findByProspectId: vi.fn(),
    list: vi.fn(),
    updateStaleness: vi.fn(),
    updateAiEnrichment: vi.fn(),
  };

  const prospects: ProspectRepository = {
    findOrCreate: vi.fn(),
    listBySearch: vi.fn(),
    getById: vi.fn(async () => prospect()),
  };

  const companies: CompanyRepository = {
    findOrCreateByDomain: vi.fn(),
    getById: vi.fn(async () => (overrides.companyRow === undefined ? company() : overrides.companyRow)),
  };

  const signals: ResearchSignalRepository = {
    supersedePrevious: vi.fn(),
    saveSignals: vi.fn(),
    listByProspect: vi.fn(async () => overrides.signals ?? []),
  };

  // Phase 0 regression-safety hardening: seeded through the same fake that
  // mirrors the real repository's active/expired/wrong-product formula
  // (see fakeSubscriptionPeriodRepository.ts), not a mock that ignores its
  // own productSlug/now arguments -- wrapped in vi.fn so existing call
  // assertions (e.g. the IRL-I idempotency test below) still work.
  const seedPeriods =
    overrides.periods !== undefined
      ? overrides.periods
      : overrides.activePeriod === undefined
        ? [activePeriod()]
        : overrides.activePeriod === null
          ? []
          : [overrides.activePeriod];
  const fakeRepo = fakeSubscriptionPeriodRepository(seedPeriods);
  const findActiveForUser = vi.fn(fakeRepo.findActiveForUser);
  const subscriptionPeriods: SubscriptionPeriodRepository = {
    findActiveForUser,
    getById: vi.fn(fakeRepo.getById),
  };

  const revealAtomically = vi.fn(async (input: Parameters<LeadUnlockRepository['revealAtomically']>[0]) => ({
    id: 'unlock-1',
    userId: 'user-1',
    opportunityId: 'opp-1',
    subscriptionPeriodId: 'period-1',
    unlockedAt: NOW,
    createdAt: NOW,
    contacts: input.contacts,
  }));
  const leadUnlocks: LeadUnlockRepository = {
    findByUserAndOpportunity: vi.fn(async () =>
      overrides.existingUnlock === undefined ? null : overrides.existingUnlock,
    ),
    revealAtomically,
  };

  return {
    deps: { opportunities, prospects, companies, signals, subscriptionPeriods, leadUnlocks },
    findActiveForUser,
    revealAtomically,
  };
}

describe('unlockOpportunityForOwner', () => {
  it('throws LeadUnlockOpportunityNotFoundError for an opportunity not owned by the caller', async () => {
    const { deps } = makeDeps({ opportunity: null });
    await expect(unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)).rejects.toThrow(
      LeadUnlockOpportunityNotFoundError,
    );
  });

  it('returns an existing unlock immediately, idempotently, WITHOUT checking subscription state (IRL-I)', async () => {
    const existing: LeadUnlock = {
      id: 'unlock-1',
      userId: 'user-1',
      opportunityId: 'opp-1',
      subscriptionPeriodId: 'period-1',
      unlockedAt: NOW,
      createdAt: NOW,
      contacts: [{ kind: 'BUSINESS_EMAIL', value: 'owner@acme.com' }],
    };
    const { deps, findActiveForUser } = makeDeps({ existingUnlock: existing });

    const result = await unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW);

    expect(result).toEqual(existing);
    // The whole point of IRL-I: a permanently unlocked lead must stay
    // visible even if the subscription that unlocked it has since
    // expired -- this function must never need to ask.
    expect(findActiveForUser).not.toHaveBeenCalled();
  });

  it('throws NoActiveClientFinderSubscriptionError when there is no active period and no existing unlock', async () => {
    const { deps } = makeDeps({ activePeriod: null });
    await expect(unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  });

  it('throws NoActiveClientFinderSubscriptionError for an expired period, same as no period at all', async () => {
    const { deps } = makeDeps({ activePeriod: activePeriod({ activationAt: new Date('2025-12-01T00:00:00Z'), durationDays: 30 }) });
    await expect(unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  });

  it('throws NoActiveClientFinderSubscriptionError when the user only holds a subscription for a DIFFERENT product', async () => {
    const { deps } = makeDeps({ periods: [activePeriod({ productSlug: 'ai_freelancing_499' })] });
    await expect(unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)).rejects.toThrow(
      NoActiveClientFinderSubscriptionError,
    );
  });

  it('throws NoQualifyingContactError when no K1-qualifying contact channel is extractable, and never calls revealAtomically', async () => {
    const { deps, revealAtomically } = makeDeps({ signals: [signalWithContact('A quiet storefront, nothing more.')] });
    await expect(unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)).rejects.toThrow(
      NoQualifyingContactError,
    );
    expect(revealAtomically).not.toHaveBeenCalled();
  });

  it('reveals every extracted qualifying contact when eligible and subscribed', async () => {
    const { deps, revealAtomically } = makeDeps({
      signals: [signalWithContact('Email owner@acme.com or call +1 415-555-0182.')],
    });

    const result = await unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW);

    expect(revealAtomically).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        opportunityId: 'opp-1',
        subscriptionPeriodId: 'period-1',
        contacts: expect.arrayContaining([
          { kind: 'BUSINESS_EMAIL', value: 'owner@acme.com' },
          { kind: 'PHONE', value: '+1 415-555-0182' },
        ]),
      }),
      NOW,
    );
    expect(result.contacts).toHaveLength(2);
  });

  it('extracts using the opportunity prospect\'s own company domain, not an unrelated one', async () => {
    const { deps, revealAtomically } = makeDeps({
      signals: [signalWithContact('Write to owner@othercorp.com for details.')],
      companyRow: company({ normalizedDomain: 'othercorp.com' }),
    });

    await unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW);

    expect(revealAtomically).toHaveBeenCalledWith(
      expect.objectContaining({
        contacts: [{ kind: 'BUSINESS_EMAIL', value: 'owner@othercorp.com' }],
      }),
      NOW,
    );
  });
});

describe('access-decision consistency (Phase 0 regression-safety)', () => {
  // Proves the write path (unlockOpportunityForOwner, reached via
  // POST /api/opportunities/:id/unlock) and the read path
  // (hasClientFinderAccess/getClientFinderSubscriptionStatus, reached via
  // page gating and the status badge) agree on the SAME seeded periods --
  // both now resolve through the one shared
  // findActiveClientFinderSubscriptionPeriod function
  // (AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md §15 item 1), so there
  // is no longer a code path where the UI could show "active" while the
  // unlock POST throws, or vice versa.
  it.each([
    ['no subscription', [] as SubscriptionPeriod[]],
    ['expired subscription', [activePeriod({ activationAt: new Date('2025-12-01T00:00:00Z'), durationDays: 30 })]],
    ['subscription for a different product', [activePeriod({ productSlug: 'ai_freelancing_499' })]],
    ['active Client Finder subscription', [activePeriod()]],
  ] as const)('unlock write path and access read path agree for: %s', async (_label, periods) => {
    const { deps } = makeDeps({ periods, signals: [signalWithContact('Email owner@acme.com for bookings.')] });

    const readPathActive = await hasClientFinderAccess(deps, 'user-1', null, NOW);
    const statusActive = (await getClientFinderSubscriptionStatus(deps, 'user-1', NOW)).active;
    expect(readPathActive).toBe(statusActive);

    const writePathSucceeds = await unlockOpportunityForOwner(deps, 'user-1', 'opp-1', NOW)
      .then(() => true)
      .catch((err) => {
        if (err instanceof NoActiveClientFinderSubscriptionError) return false;
        throw err;
      });

    expect(writePathSucceeds).toBe(readPathActive);
  });
});
