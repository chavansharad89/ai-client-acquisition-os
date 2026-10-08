import type { IdentityRepository, StoredCredentials, StoredSessionToken } from './repository';
import type { StoredUser } from './types';

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
  };
}
