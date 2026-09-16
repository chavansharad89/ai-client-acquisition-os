import type { IdentityRepository, StoredSessionToken } from './repository';
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

  return {
    users,
    sessions,

    async createUser({ email }, now: Date): Promise<StoredUser> {
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
      return created;
    },

    async findUserByEmail(email: string) {
      const normalised = email.trim().toLowerCase();
      return users.find((u) => u.email === normalised) ?? null;
    },

    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },

    async saveSessionToken({ tokenHash, userId, expiresAt }) {
      sessions[tokenHash] = { userId, expiresAt, revokedAt: null };
    },
  };
}
