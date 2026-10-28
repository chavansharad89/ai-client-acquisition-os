import type { ModelInvocationUsage } from '@acos/core-research';

// AI usage metering (PRD V2.2 R-29; Phase 16 scope lock
// requirement/PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md). One row per actual
// provider/model invocation that produced a provider response with usage
// (D1/D7) — never fabricated, never estimated (D6). No monetary field of
// any kind (D10/D11); this measures token usage, not spend.
// -----------------------------------------------------------------------

/**
 * 'initial' covers both the true first attempt and any provider-error
 * retry of it (same original message); 'repair' covers every round after
 * a schema/provenance failure triggers researcher.ts's targeted repair —
 * see ./researcher.ts's own repairRoots-based distinction, which this
 * type mirrors exactly.
 *
 * 'fallback' (migration 0026, Multi-Model Research Provider) covers
 * every invocation made against a non-primary provider in a
 * cross-provider fallback chain — see @acos/core-research's
 * createFallbackResearchProvider, which tags a fallback attempt's
 * invocations 'fallback' regardless of that inner attempt's own
 * initial/repair distinction, so this package never has to know which
 * provider in a chain was primary.
 */
export type AiUsageRequestKind = 'initial' | 'repair' | 'fallback';

/** What gets persisted for one invocation — everything but ownership, which the service layer resolves. */
export interface NewAiUsageEventInput {
  provider: string;
  model: string;
  requestKind: AiUsageRequestKind;
  /** The provider's own response identifier — the idempotency boundary (D8). */
  providerMessageId: string;
  inputTokens: number;
  outputTokens: number;
  /** NULL when the provider's response omits it — never coerced to 0 (D6). */
  cacheCreationInputTokens: number | null;
  cacheReadInputTokens: number | null;
}

export interface StoredAiUsageEvent extends NewAiUsageEventInput {
  id: string;
  /** Top-level ownership (D3) — not inherited through Prospect the way research_signals/opportunity_scores are. */
  userId: string;
  prospectId: string;
  createdAt: Date;
}

/** Adapts the Phase-7 compatibility payload onto this package's own persistence shape. */
export function toNewAiUsageEventInput(
  usage: ModelInvocationUsage,
  requestKind: AiUsageRequestKind,
): NewAiUsageEventInput {
  return {
    provider: usage.provider,
    model: usage.model,
    requestKind,
    providerMessageId: usage.providerMessageId,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheCreationInputTokens: usage.cacheCreationInputTokens,
    cacheReadInputTokens: usage.cacheReadInputTokens,
  };
}
