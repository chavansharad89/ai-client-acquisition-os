import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createPgIdentityRepository } from '@acos/core-identity';

import { createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// AUTH Phase 1b: real-PostgreSQL coverage for findOrCreateUser's atomic
// INSERT ... ON CONFLICT DO NOTHING idiom — the one piece of this
// invariant a fake-repository unit test cannot exercise, because it
// depends on `users.email`'s actual UNIQUE constraint deciding
// concurrent-insert outcomes, not application-level logic.

const NOW = new Date('2026-10-10T00:00:00.000Z');

let reachable = false;
let db: TempDatabase | null = null;

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterEach(async () => {
  if (db) {
    await db.drop().catch(() => undefined);
    db = null;
  }
});

async function freshDb() {
  if (!reachable) {
    throw new Error('PostgreSQL not reachable — start it with: docker compose -f docker-compose.test.yml up -d');
  }
  db = await createTempDatabase('id-foc', {});
  return createPgIdentityRepository(db.client);
}

describe('findOrCreateUser (real PostgreSQL)', () => {
  it('creates a password-less row when none exists for the email', async () => {
    const identity = await freshDb();
    const user = await identity.findOrCreateUser('New-Buyer@Example.test', NOW);
    expect(user.email).toBe('new-buyer@example.test');

    const credentials = await identity.findCredentialsByEmail('new-buyer@example.test');
    expect(credentials?.passwordHash).toBeNull();
  });

  it('returns the SAME row on a second call — never a duplicate for the same normalized email', async () => {
    const identity = await freshDb();
    const first = await identity.findOrCreateUser('repeat@example.test', NOW);
    const second = await identity.findOrCreateUser('REPEAT@EXAMPLE.TEST', NOW);
    expect(second.id).toBe(first.id);

    const { rows } = await db!.client.query('SELECT count(*)::int AS n FROM users WHERE email = $1', [
      'repeat@example.test',
    ]);
    expect(rows[0].n).toBe(1);
  });

  it('never overwrites an existing password_hash on an already-activated account', async () => {
    const identity = await freshDb();
    const existing = await identity.createUser({ email: 'has-password@example.test', passwordHash: 'already-hashed' }, NOW);

    const resolved = await identity.findOrCreateUser('has-password@example.test', NOW);
    expect(resolved.id).toBe(existing.id);

    const credentials = await identity.findCredentialsByEmail('has-password@example.test');
    expect(credentials?.passwordHash).toBe('already-hashed');
  });

  it('two concurrent calls for the same new email resolve to exactly one row (race safety)', async () => {
    const identity = await freshDb();
    const [a, b] = await Promise.all([
      identity.findOrCreateUser('racer@example.test', NOW),
      identity.findOrCreateUser('racer@example.test', NOW),
    ]);
    expect(a.id).toBe(b.id);

    const { rows } = await db!.client.query('SELECT count(*)::int AS n FROM users WHERE email = $1', [
      'racer@example.test',
    ]);
    expect(rows[0].n).toBe(1);
  });
});
