import type { AiUsageEventRepository } from './repository';
import type { NewAiUsageEventInput, StoredAiUsageEvent } from './types';

/**
 * In-memory AiUsageEventRepository enforcing the same
 * (provider, providerMessageId) idempotency boundary the database's
 * unique index does (D8) — recordEvent() returns the EXISTING row on a
 * duplicate rather than inserting a second one, mirroring
 * @acos/core-opportunity's testSupport.ts conventions.
 */
export function fakeAiUsageEventRepository(): AiUsageEventRepository & {
  rows: StoredAiUsageEvent[];
} {
  const rows: StoredAiUsageEvent[] = [];
  let counter = 0;

  return {
    rows,

    async recordEvent(userId: string, prospectId: string, input: NewAiUsageEventInput, now: Date) {
      const existing = rows.find(
        (row) =>
          row.provider === input.provider && row.providerMessageId === input.providerMessageId,
      );
      if (existing) return existing;

      const stored: StoredAiUsageEvent = {
        id: `ai_usage_event_${(counter += 1)}`,
        userId,
        prospectId,
        ...input,
        createdAt: now,
      };
      rows.push(stored);
      return stored;
    },

    async listByProspect(userId: string, prospectId: string) {
      return rows.filter((row) => row.userId === userId && row.prospectId === prospectId);
    },
  };
}
