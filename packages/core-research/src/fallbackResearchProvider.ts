import { InsufficientEvidenceError } from './anthropicResearchProvider';
import { ResearchProviderError } from './errors';
import type { ResearchProvider, ResearchProviderInput } from './provider';
import { researchLead, type ModelInvocationUsage, type ResearchModel, type ResearchOptions } from './researcher';
import type { ResearchInput } from './schema';
import type { SourceDocumentProvider } from './sourceDocumentProvider';

// Cross-provider fallback (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md §6 — "Option A,
// refined").
// -----------------------------------------------------------------------
// Sits at the SAME layer anthropicResearchProvider.ts occupies, not a
// wrapper of opaque ResearchProviders: source documents are fetched
// EXACTLY ONCE and the same ResearchInput is reused across every attempt
// in the chain, so falling back to a different provider never re-fetches
// evidence and never checks a fallback attempt's output against
// different or staler source text than the primary attempt. This
// function itself satisfies ResearchProvider — a drop-in replacement for
// createAnthropicResearchProvider at the worker's wiring point. No
// change to ResearchProvider, researchLead(), or schema.ts.
//
// Fallback eligibility is decided purely by error TYPE, not by
// re-deriving an HTTP-status classification here:
//
//   ResearchProviderError  -> FALLBACK-ELIGIBLE. By construction this is
//     the only error researchLead() throws for timeout, rate limit,
//     provider outage, authentication failure, and context-length
//     failure alike (toProviderError()'s existing classification decides
//     retryable vs not; by the time this error reaches here, that
//     retry budget is already exhausted or the failure was never
//     retryable to begin with — either way, "the existing retry budget
//     is exhausted" holds).
//   ResearchRefusedError, ResearchValidationError, ResearchAbortedError
//     -> FALLBACK-INELIGIBLE, always. A refusal, an exhausted
//     schema/evidence repair loop, or a caller abort are never retried
//     against a different provider — see the decision review's Decision
//     6 and the technical spike §6 for why.
//   InsufficientEvidenceError -> thrown before any attempt is made (no
//     source documents at all); not provider-specific, so no fallback
//     attempt is made — a different provider cannot fetch evidence this
//     function itself found none of.
// -----------------------------------------------------------------------

export interface ResearchProviderAttempt {
  /** Diagnostic/metering label only — this file never branches on it. */
  provider: string;
  model: ResearchModel;
}

export interface FallbackResearchProviderDeps {
  sourceDocuments: SourceDocumentProvider;
  /**
   * Ordered. Index 0 is the primary attempt; every later entry is tried
   * only after the one before it throws a FALLBACK-ELIGIBLE error.
   */
  attempts: readonly ResearchProviderAttempt[];
  /**
   * Fired once per real model invocation across the WHOLE chain.
   * `requestKind` is `'fallback'` for every invocation belonging to
   * `attempts[1..]` — regardless of that inner researchLead() call's own
   * initial/repair distinction — and the inner call's own
   * `'initial'|'repair'` value for `attempts[0]`, unchanged from today's
   * single-provider behavior (see requirement/
   * MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md Decision 5).
   */
  onUsage?: (
    usage: ModelInvocationUsage,
    requestKind: 'initial' | 'repair' | 'fallback',
    prospectId: string,
  ) => void | Promise<void>;
  /** Shared retry/backoff/deadline config applied to every attempt in the chain. `onInvocation` is set internally and ignored if supplied here. */
  researchOptions?: Omit<ResearchOptions, 'onInvocation'>;
}

export function createFallbackResearchProvider(deps: FallbackResearchProviderDeps): ResearchProvider {
  if (deps.attempts.length === 0) {
    throw new Error('createFallbackResearchProvider requires at least one attempt');
  }

  return {
    async research(input: ResearchProviderInput) {
      const sourceDocuments = await deps.sourceDocuments.fetchSourceDocuments({
        companyName: input.companyName,
        normalizedDomain: input.normalizedDomain,
      });

      if (sourceDocuments.length === 0) {
        throw new InsufficientEvidenceError(input.companyName, input.normalizedDomain);
      }

      // Fetched and built exactly once — reused, unchanged, by every
      // attempt in the chain (§6/§7 of the technical spike).
      const researchInput: ResearchInput = {
        companyName: input.companyName,
        websiteUrl: `https://${input.normalizedDomain}`,
        sourceDocuments: sourceDocuments as ResearchInput['sourceDocuments'],
      };

      let lastError: unknown;
      for (const [index, attempt] of deps.attempts.entries()) {
        const isFallback = index > 0;
        const isLastAttempt = index === deps.attempts.length - 1;

        try {
          // eslint-disable-next-line no-await-in-loop -- attempts are sequential by design: a fallback attempt must not start before the prior one has fully exhausted its own retry budget.
          const outcome = await researchLead(attempt.model, researchInput, {
            ...deps.researchOptions,
            onInvocation: async (usage, requestKind) => {
              await deps.onUsage?.(usage, isFallback ? 'fallback' : requestKind, input.prospectId);
            },
          });
          return outcome.research;
        } catch (error) {
          if (!(error instanceof ResearchProviderError) || isLastAttempt) {
            throw error;
          }
          lastError = error;
        }
      }

      // Unreachable — the loop above always returns or throws — but
      // keeps control-flow analysis satisfied without a non-null
      // assertion or an `as never`.
      throw lastError instanceof Error
        ? lastError
        : new Error('createFallbackResearchProvider: exhausted every attempt');
    },
  };
}
