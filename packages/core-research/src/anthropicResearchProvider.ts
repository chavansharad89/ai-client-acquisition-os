import type { ResearchProvider, ResearchProviderInput } from './provider';
import { researchLead, type ModelInvocationUsage, type ResearchModel } from './researcher';
import type { LeadResearch, ResearchInput } from './schema';
import type { SourceDocumentProvider } from './sourceDocumentProvider';

// Concrete production ResearchProvider (Phase 18) — composes the
// existing, unmodified researchLead()/createAnthropicResearchModel()
// engine with a SourceDocumentProvider. The frozen ResearchProvider
// runtime method, research(input), is untouched: byte-for-byte the same
// (input: ResearchProviderInput) => Promise<LeadResearch> signature.
//
// R-29 usage metering: this file does NOT depend on @acos/core-ai-usage
// (that would create a package cycle — core-ai-usage already depends on
// this package for ModelInvocationUsage). Instead it accepts a plain
// `onUsage` callback, typed only in terms of this package's own
// ModelInvocationUsage. The caller (apps/worker's bootstrap, which
// already depends on both packages) supplies a closure that calls
// AiUsageEventRepository.recordEvent() with the Search owner's userId —
// captured there via the per-owner ResearchProvider factory, not here.
// -----------------------------------------------------------------------

/**
 * researchLead() requires real source documents (Phase 18 scope doc
 * §14): this is thrown instead of ever calling it with
 * sourceDocuments: []. Reached only when SourceDocumentProvider
 * genuinely found nothing usable (a non-erroring [] result) — a
 * SourceFetchTransportError from the provider propagates through this
 * function unchanged instead, and is never converted into this error.
 */
export class InsufficientEvidenceError extends Error {
  constructor(
    readonly companyName: string,
    readonly normalizedDomain: string,
  ) {
    super(`no usable source document found for ${companyName} (${normalizedDomain})`);
    this.name = 'InsufficientEvidenceError';
  }
}

export interface AnthropicResearchProviderDeps {
  model: ResearchModel;
  sourceDocuments: SourceDocumentProvider;
  /** Fired once per real model invocation, mirroring researchLead()'s own onInvocation. */
  onUsage?: (
    usage: ModelInvocationUsage,
    requestKind: 'initial' | 'repair',
    prospectId: string,
  ) => void | Promise<void>;
}

export function createAnthropicResearchProvider(deps: AnthropicResearchProviderDeps): ResearchProvider {
  return {
    async research(input: ResearchProviderInput): Promise<LeadResearch> {
      // Not wrapped in a try/catch that reinterprets errors: a thrown
      // SourceFetchTransportError (transient, already bounded-retried
      // once inside the provider) propagates unchanged — it is a
      // transport failure, not a research-quality finding.
      const sourceDocuments = await deps.sourceDocuments.fetchSourceDocuments({
        companyName: input.companyName,
        normalizedDomain: input.normalizedDomain,
      });

      if (sourceDocuments.length === 0) {
        throw new InsufficientEvidenceError(input.companyName, input.normalizedDomain);
      }

      const researchInput: ResearchInput = {
        companyName: input.companyName,
        websiteUrl: `https://${input.normalizedDomain}`,
        sourceDocuments: sourceDocuments as ResearchInput['sourceDocuments'],
      };

      const outcome = await researchLead(deps.model, researchInput, {
        onInvocation: async (usage, requestKind) => {
          await deps.onUsage?.(usage, requestKind, input.prospectId);
        },
      });

      return outcome.research;
    },
  };
}
