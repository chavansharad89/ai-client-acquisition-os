import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  deleteServiceProfile,
  getServiceProfile,
  listServiceProfiles,
  updateServiceProfile,
  type ServiceProfileDeps,
  type ServiceProfileInput,
} from '@acos/core-service-profile';

import { suiteDatabase } from './support/suiteDb';

// ServiceProfile ownership — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves the chain this phase exists to prove: an authenticated session
// (a real access_tokens row, resolved the same way a route would resolve
// it) yields a server-derived userId, and migration 0013's schema plus
// @acos/core-service-profile's repository enforce cross-user isolation
// at the database itself — not just in application code.
// -----------------------------------------------------------------------

const suite = suiteDatabase('svcprofile');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function deps(): ServiceProfileDeps {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
  };
}

/** Provisions a real `users` row and mints a real session token for it — out-of-band provisioning, matching R-02. */
async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `svcprofile.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
    userId,
    email,
  ]);

  const identity = createPgIdentityRepository(db.client);
  const minted = await mintUserSession(identity, { id: userId, email });
  return { userId, token: minted.token };
}

function sampleInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Content writing',
    targetCustomer: 'D2C restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content.',
    ...overrides,
  };
}

describe('ServiceProfile ownership', () => {
  it('the owner creates and retrieves their profile; the id is server-derived, not caller-supplied', async () => {
    const a = await createUserAndSession('a');
    const d = deps();

    const created = await createServiceProfile(d, a.token, sampleInput());
    expect(created.userId).toBe(a.userId);
    expect(created.id).toBeTruthy();

    const found = await getServiceProfile(d, a.token, created.id);
    expect(found).toEqual(created);
  });

  it('a different authenticated user cannot retrieve the profile', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();

    const created = await createServiceProfile(d, a.token, sampleInput());
    const asB = await getServiceProfile(d, b.token, created.id);
    expect(asB).toBeNull();
  });

  it('a different authenticated user cannot update the profile', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();

    const created = await createServiceProfile(d, a.token, sampleInput());
    const result = await updateServiceProfile(
      d,
      b.token,
      created.id,
      sampleInput({ service: 'hijacked' }),
    );
    expect(result).toBeNull();

    const stillOriginal = await getServiceProfile(d, a.token, created.id);
    expect(stillOriginal?.service).toBe('Content writing');
  });

  it('a different authenticated user cannot delete the profile', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();

    const created = await createServiceProfile(d, a.token, sampleInput());
    const deleted = await deleteServiceProfile(d, b.token, created.id);
    expect(deleted).toBe(false);

    const stillThere = await getServiceProfile(d, a.token, created.id);
    expect(stillThere).not.toBeNull();
  });

  it('the owner sees only their own profiles', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();

    const mine = await createServiceProfile(d, a.token, sampleInput());
    await createServiceProfile(d, b.token, sampleInput({ service: 'SEO audits' }));

    const aList = await listServiceProfiles(d, a.token);
    expect(aList.map((p) => p.id)).toEqual([mine.id]);

    const bList = await listServiceProfiles(d, b.token);
    expect(bList.map((p) => p.id)).not.toContain(mine.id);
  });
});

describe('identity boundary', () => {
  it('an unauthenticated call is rejected before the repository runs', async () => {
    const d = deps();
    await expect(createServiceProfile(d, null, sampleInput())).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a revoked/unknown token cannot list another user’s data', async () => {
    const d = deps();
    await expect(listServiceProfiles(d, 'not-a-real-token')).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});
