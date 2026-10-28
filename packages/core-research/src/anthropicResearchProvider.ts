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
    /** Global Entity Architecture (C-1): null for a website-less candidate — there was never a homepage to fetch. */
    readonly normalizedDomain: string | null,
  ) {
    super(
      normalizedDomain
        ? `no usable source document found for ${companyName} (${normalizedDomain})`
        : `no usable source document for ${companyName} — candidate has no website`,
    );
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
      //
      // PO-4 (Phase 5): reuse the pre-admission fetch when supplied,
      // instead of fetching the same homepage a second time. A provider
      // that predates this field, or a caller that omits it, fetches
      // exactly as before.
      // Global Entity Architecture (C-1; Q5_CLOSURE §4.3): a website-less
      // candidate (input.normalizedDomain === null) has no homepage to
      // fetch, structurally — never construct `https://${null}`. Skips
      // straight to the existing "found nothing usable" branch below,
      // exactly as a permanent/unusable-page fetch result already does.
      const supplied = input.suppliedSourceDocuments;
      const sourceDocuments = supplied
        ? supplied.documents
        : input.normalizedDomain
          ? await deps.sourceDocuments.fetchSourceDocuments({
              companyName: input.companyName,
              normalizedDomain: input.normalizedDomain,
            })
          : [];

      if (sourceDocuments.length === 0) {
        throw new InsufficientEvidenceError(input.companyName, input.normalizedDomain);
      }
      const fetchedAt = supplied?.fetchedAt ?? new Date();
      const extractionMethod = supplied?.extractionMethod ?? deps.sourceDocuments.extractionMethod ?? 'UNDECLARED';

      const researchInput: ResearchInput = {
        companyName: input.companyName,
        // input.normalizedDomain is guaranteed non-null here: the only
        // way to reach this line is sourceDocuments.length > 0, which is
        // impossible when normalizedDomain was null (the branch above
        // short-circuits to [] for that case).
        websiteUrl: `https://${input.normalizedDomain}`,
        sourceDocuments: sourceDocuments as ResearchInput['sourceDocuments'],
        targetSegments: [...(input.targetSegments ?? [])],
      };

      const outcome = await researchLead(deps.model, researchInput, {
        onInvocation: async (usage, requestKind) => {
          await deps.onUsage?.(usage, requestKind, input.prospectId);
        },
        // A11-P1 M-2: forward researchLead()'s post-parse documents — the
        // exact model-seen text — never `sourceDocuments` above.
        onSourceDocuments: async (documents) => {
          await input.onSourceDocumentsSupplied?.({
            documents,
            fetchedAt,
            extractionMethod,
          });
        },
      });

      return outcome.research;
    },
  };
}
