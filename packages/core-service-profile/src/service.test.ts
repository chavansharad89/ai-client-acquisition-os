import { describe, expect, it } from 'vitest';

import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';

import { ServiceProfileValidationError } from './errors';
import {
  createServiceProfile,
  deleteServiceProfile,
  getServiceProfile,
  listServiceProfiles,
  updateServiceProfile,
} from './service';
import { deriveSystemKeywords, SYSTEM_DEFAULT_RATIONALE, SYSTEM_DEFAULT_TARGET_CUSTOMER, SYSTEM_DEFAULT_TRIGGERS } from './systemDefaults';
import { fakeServiceProfileRepository } from './testSupport';
import type { NewSearchServiceProfileInput, ServiceProfileInput } from './types';

// UNIT tests (fakes only — see tests/integration/service-profile.integration.test.ts
// for the real-Postgres proof of the same ownership boundary).

/** Minimal fake — only what requireUser() reads. Session tokens are keyed by their raw value for test readability. */
function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
  return {
    async createUser() {
      throw new Error('not used by these tests');
    },
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
  };
}

function sessionFor(rawToken: string, userId: string): Record<string, StoredSessionToken> {
  return {
    [hashAccessToken(rawToken)]: {
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  };
}

function sampleInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Content & Copywriting',
    targetCustomer: 'D2C restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content.',
    ...overrides,
  };
}

function deps() {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const profiles = fakeServiceProfileRepository();
  return { identity, profiles };
}

describe('ownership', () => {
  it('the owner can create and retrieve their profile', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', sampleInput());
    expect(created.userId).toBe('user_a');

    const found = await getServiceProfile(d, 'token-a', created.id);
    expect(found?.id).toBe(created.id);
  });

  it('a different user cannot retrieve the profile', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', sampleInput());

    const found = await getServiceProfile(d, 'token-b', created.id);
    expect(found).toBeNull();
  });

  it('a different user cannot update the profile', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', sampleInput());

    const result = await updateServiceProfile(
      d,
      'token-b',
      created.id,
      sampleInput({ service: 'Branding' }),
    );
    expect(result).toBeNull();

    const stillOwned = await getServiceProfile(d, 'token-a', created.id);
    expect(stillOwned?.service).toBe('Content & Copywriting');
  });

  it('a different user cannot delete the profile', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', sampleInput());

    const deleted = await deleteServiceProfile(d, 'token-b', created.id);
    expect(deleted).toBe(false);

    const stillThere = await getServiceProfile(d, 'token-a', created.id);
    expect(stillThere).not.toBeNull();
  });

  it('a user sees only their own profiles in the list', async () => {
    const d = deps();
    const mine = await createServiceProfile(d, 'token-a', sampleInput());
    await createServiceProfile(d, 'token-b', sampleInput({ service: 'Digital Marketing' }));

    const list = await listServiceProfiles(d, 'token-a');
    expect(list.map((p) => p.id)).toEqual([mine.id]);
  });
});

describe('service vocabulary (D6, CF-SERVICE-CATALOG-PO-DEC-001)', () => {
  it('createServiceProfile rejects a non-canonical service value', async () => {
    const d = deps();
    await expect(
      createServiceProfile(d, 'token-a', sampleInput({ service: 'SEO audits' })),
    ).rejects.toBeInstanceOf(ServiceProfileValidationError);
    expect(d.profiles.rows).toHaveLength(0);
  });

  it('updateServiceProfile rejects a non-canonical service value', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', sampleInput());
    await expect(
      updateServiceProfile(d, 'token-a', created.id, sampleInput({ service: 'SEO audits' })),
    ).rejects.toBeInstanceOf(ServiceProfileValidationError);

    const unchanged = await getServiceProfile(d, 'token-a', created.id);
    expect(unchanged?.service).toBe('Content & Copywriting');
  });
});

describe('system defaults (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002)', () => {
  it('createServiceProfile succeeds with only service + geography and fills the rest with system defaults', async () => {
    const d = deps();
    const created = await createServiceProfile(d, 'token-a', {
      service: 'Web & Software Development',
      geography: 'Mumbai',
    });
    expect(created.service).toBe('Web & Software Development');
    expect(created.geography).toBe('Mumbai');
    expect(created.targetCustomer).toBe(';');
    expect(created.minProjectValuePaise).toBe(0);
    expect(created.triggers).toEqual(['WEBSITE', 'NEWS', 'TECH_STACK']);
    expect(created.keywords.length).toBeGreaterThan(0);
    expect(created.rationale).toContain('{signal}');
  });

  it('a caller-supplied value for any of the five system-owned fields cannot override the system default', async () => {
    const d = deps();
    // sampleInput() supplies all seven fields — createServiceProfile()
    // only ever reads `service`/`geography` off whatever it is handed,
    // so the other five are never even looked at, let alone honored.
    const created = await createServiceProfile(d, 'token-a', sampleInput());
    expect(created.targetCustomer).toBe(SYSTEM_DEFAULT_TARGET_CUSTOMER);
    expect(created.minProjectValuePaise).toBe(0);
    expect(created.triggers).toEqual(SYSTEM_DEFAULT_TRIGGERS);
    expect(created.keywords).toEqual(deriveSystemKeywords('Content & Copywriting'));
    expect(created.rationale).toBe(SYSTEM_DEFAULT_RATIONALE);
  });

  it('NewSearchServiceProfileInput contains only service + geography (compile-time)', () => {
    const valid: NewSearchServiceProfileInput = {
      service: 'Web & Software Development',
      geography: 'Mumbai',
    };
    expect(valid).toEqual({ service: 'Web & Software Development', geography: 'Mumbai' });

    const rejected: NewSearchServiceProfileInput = {
      service: 'Web & Software Development',
      geography: 'Mumbai',
      // @ts-expect-error — the five system-owned fields are not
      // assignable; a NEW caller cannot even write a literal that
      // attempts to set one.
      targetCustomer: 'smuggled value',
    };
    void rejected;
  });
});

describe('identity boundary', () => {
  it('the created profile is owned by the authenticated user, never a value smuggled through input', async () => {
    const d = deps();
    // NewSearchServiceProfileInput has no userId field at all — the type
    // system already forbids this. This test proves the *value*, not just
    // the type, is never taken from anything but requireUser().
    const input = { ...sampleInput(), userId: 'user_b' } as unknown as NewSearchServiceProfileInput;
    const created = await createServiceProfile(d, 'token-a', input);
    expect(created.userId).toBe('user_a');
  });

  it('an unauthenticated call never reaches the repository', async () => {
    const d = deps();
    await expect(createServiceProfile(d, null, sampleInput())).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(d.profiles.rows).toHaveLength(0);
  });

  it('an unknown token never reaches the repository', async () => {
    const d = deps();
    await expect(listServiceProfiles(d, 'not-a-real-token')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});
