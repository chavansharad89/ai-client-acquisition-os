import {
  SourceFetchTransportError,
  type SourceDocumentProvider,
  type SourceDocumentTarget,
} from './sourceDocumentProvider';
import type { SuppliedSourceDocuments } from './provider';

// Phase 5, PO-1 (CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_
// DECISION_ROUND.md): every discovered prospect may have its public
// homepage fetched, non-LLM, before AI admission, reusing the existing
// SourceDocumentProvider rather than a new fetch path.
// -----------------------------------------------------------------------
// PO-1's explicit contract: a fetch failure must not make the Search fail
// merely because of pre-admission fetching — it degrades to "no
// pre-Research evidence" (empty documents), never a thrown error at this
// boundary. createHttpSourceDocumentProvider() already resolves a
// permanent/unusable page to [] on its own; the only case this function
// additionally absorbs is SourceFetchTransportError (the provider's own
// transient-failure signal, already retried once internally before it
// reaches here) — any other thrown error is a programming/contract
// violation, not a "the site was unreachable" outcome, and is left to
// propagate.
// -----------------------------------------------------------------------

/**
 * Fetches the pre-admission homepage document(s) for one candidate.
 * Never throws for a transient source-fetch failure — resolves to
 * `documents: []` instead, per PO-1.
 */
export async function fetchPreAdmissionDocuments(
  provider: SourceDocumentProvider,
  target: SourceDocumentTarget,
  now: Date,
): Promise<SuppliedSourceDocuments> {
  let documents;
  try {
    documents = await provider.fetchSourceDocuments(target);
  } catch (error) {
    if (!(error instanceof SourceFetchTransportError)) throw error;
    documents = [];
  }
  return {
    documents,
    fetchedAt: now,
    extractionMethod: provider.extractionMethod ?? 'UNDECLARED',
  };
}
