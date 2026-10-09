import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import type { OpportunityRepository } from '@acos/core-opportunity';
import type { StoredResearchSignal } from '@acos/core-research';
import type { ResearchSignalRepository } from '@acos/core-research';
import { describe, expect, it, vi } from 'vitest';

import {
  LeadUnlockOpportunityNotFoundError,
  NoActiveClientFinderSubscriptionError,
  NoQualifyingContactError,
} from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import { unlockOpportunityForOwner, type LeadUnlockDeps } from './leadUnlockService';
import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';
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
    productSlug: 'ai_client_acquisition_1499_subscription',
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
  signals?: StoredResearchSignal[];
  companyRow?: ReturnType<typeof company> | null;
} = {}): Fakes {
  const opportunities: OpportunityRepository = {
    create: vi.fn(),
    getById: vi.fn(async () => (overrides.opportunity === undefined ? opportunity() : overrides.opportunity)),
    findByProspectId: vi.fn(),
    list: vi.fn(),
    updateStaleness: vi.fn(),
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

  const findActiveForUser = vi.fn(async () =>
    overrides.activePeriod === undefined ? activePeriod() : overrides.activePeriod,
  );
  const subscriptionPeriods: SubscriptionPeriodRepository = {
    findActiveForUser,
    getById: vi.fn(),
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
