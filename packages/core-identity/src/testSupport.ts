import type { StoredActivationToken } from './activationToken';
import type { AccountSetupInput, IdentityRepository, StoredCredentials, StoredSessionToken } from './repository';
import type { StoredUser } from './types';

interface FakeActivationTokenRow extends StoredActivationToken {
  tokenHash: string;
}

/** In-memory repository enforcing the same unique key the database does. */
export function fakeRepository(
  seed: {
    users?: StoredUser[];
    sessions?: Record<string, StoredSessionToken>;
  } = {},
): IdentityRepository & { users: StoredUser[]; sessions: Record<string, StoredSessionToken> } {
  const users = [...(seed.users ?? [])];
  const sessions = { ...(seed.sessions ?? {}) };
  const passwordHashes: Record<string, string | null> = {};
  const emailVerifiedAt: Record<string, Date | null> = {};
  const activationTokens: FakeActivationTokenRow[] = [];

  return {
    users,
    sessions,

    async createUser({ email, passwordHash }, now: Date): Promise<StoredUser> {
      const normalised = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalised)) {
        throw new Error(`fakeRepository.createUser: ${normalised} already exists`);
      }
      const created: StoredUser = {
        id: `user_${users.length + 1}`,
        email: normalised,
        createdAt: now,
      };
      users.push(created);
      passwordHashes[created.id] = passwordHash ?? null;
      return created;
    },

    async findOrCreateUser(email: string, now: Date): Promise<StoredUser> {
      const normalised = email.trim().toLowerCase();
      const existing = users.find((u) => u.email === normalised);
      if (existing) return existing;
      const created: StoredUser = {
        id: `user_${users.length + 1}`,
        email: normalised,
        createdAt: now,
      };
      users.push(created);
      passwordHashes[created.id] = null;
      return created;
    },

    async findUserByEmail(email: string) {
      const normalised = email.trim().toLowerCase();
      return users.find((u) => u.email === normalised) ?? null;
    },

    async findUserById(id: string) {
      return users.find((u) => u.id === id) ?? null;
    },

    async findCredentialsByEmail(email: string): Promise<StoredCredentials | null> {
      const normalised = email.trim().toLowerCase();
      const user = users.find((u) => u.email === normalised);
      if (!user) return null;
      return { id: user.id, email: user.email, passwordHash: passwordHashes[user.id] ?? null };
    },

    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },

    async saveSessionToken({ tokenHash, userId, expiresAt }) {
      sessions[tokenHash] = { userId, expiresAt, revokedAt: null };
    },

    async revokeSessionToken(tokenHash: string, now: Date) {
      const found = sessions[tokenHash];
      if (!found || found.revokedAt) return false;
      found.revokedAt = now;
      return true;
    },

    async findUserAuthStateById(id: string) {
      const user = users.find((u) => u.id === id);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        passwordHash: passwordHashes[user.id] ?? null,
        emailVerifiedAt: emailVerifiedAt[user.id] ?? null,
      };
    },

    async saveActivationToken({ tokenHash, userId, expiresAt, now }) {
      for (const row of activationTokens) {
        if (row.userId === userId && row.consumedAt === null && row.invalidatedAt === null) {
          row.invalidatedAt = now;
        }
      }
      activationTokens.push({ tokenHash, userId, expiresAt, consumedAt: null, invalidatedAt: null });
    },

    async findActivationToken(tokenHash: string) {
      const row = activationTokens.find((t) => t.tokenHash === tokenHash);
      if (!row) return null;
      return {
        userId: row.userId,
        expiresAt: row.expiresAt,
        consumedAt: row.consumedAt,
        invalidatedAt: row.invalidatedAt,
      };
    },

    async consumeActivationToken(tokenHash: string, now: Date) {
      const row = activationTokens.find((t) => t.tokenHash === tokenHash);
      if (!row || row.consumedAt !== null || row.invalidatedAt !== null) return false;
      row.consumedAt = now;
      return true;
    },

    async setEmailVerified(userId: string, now: Date) {
      if (emailVerifiedAt[userId] == null) {
        emailVerifiedAt[userId] = now;
      }
    },

    async completeAccountSetup(userId: string, input: AccountSetupInput, _now: Date) {
      if ((passwordHashes[userId] ?? null) !== null) return false;
      passwordHashes[userId] = input.passwordHash;
      return true;
    },
  };
}
