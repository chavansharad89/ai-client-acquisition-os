import type { ResearchProvider, ResearchProviderInput } from './provider';
import type { ResearchSignalRepository } from './repository';
import type { LeadResearch } from './schema';
import type {
  NewResearchSignalInput,
  StoredResearchSignal,
  StoredResearchSignalSource,
} from './types';

/** A provider that always returns the same fixed result — deterministic, no external call. */
export function fakeResearchProvider(
  result: LeadResearch | ((input: ResearchProviderInput) => LeadResearch),
): ResearchProvider {
  return {
    async research(input: ResearchProviderInput) {
      return typeof result === 'function' ? result(input) : result;
    },
  };
}

/**
 * In-memory repository mirroring the database's append-only,
 * supersede-then-insert behaviour. Does not itself enforce Prospect
 * ownership (ResearchSignal carries no user_id — see ./repository) —
 * ownership isolation is exercised through ./service's own
 * `deps.prospects.getById` check in unit tests, and proven at the
 * database level in tests/integration/research.integration.test.ts.
 */
export function fakeResearchSignalRepository(
  seed: StoredResearchSignal[] = [],
): ResearchSignalRepository & { rows: StoredResearchSignal[] } {
  const rows = [...seed];
  let counter = rows.length;

  return {
    rows,

    async supersedePrevious(prospectId: string, at: Date) {
      let count = 0;
      for (const row of rows) {
        if (row.prospectId === prospectId && row.supersededAt === null) {
          row.supersededAt = at;
          count += 1;
        }
      }
      return count;
    },

    async saveSignals(
      prospectId: string,
      signals: readonly NewResearchSignalInput[],
      observedAt: Date,
    ) {
      const created: StoredResearchSignal[] = [];
      for (const input of signals) {
        counter += 1;
        const sources: StoredResearchSignalSource[] = input.sources.map((source, index) => ({
          id: `signal_source_${counter}_${index}`,
          ...source,
        }));
        const row: StoredResearchSignal = {
          id: `signal_${counter}`,
          prospectId,
          field: input.field,
          kind: input.kind,
          classification: input.classification,
          signal: input.signal,
          confidence: input.confidence,
          basis: input.basis,
          observedAt,
          supersededAt: null,
          sources,
        };
        rows.push(row);
        created.push(row);
      }
      return created;
    },

    async listByProspect(_userId: string, prospectId: string) {
      return rows.filter((row) => row.prospectId === prospectId && row.supersededAt === null);
    },
  };
}
