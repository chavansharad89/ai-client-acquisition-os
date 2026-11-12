import { requireUser, type IdentityRepository } from '@acos/core-identity';

import type {
  CategoryPlausibilitySourceDocumentReader,
  StoredCapturedSourceDocument,
} from './categoryPlausibilityRepository';

// Q-1 reviewer read path for A11-P1 M-2 captured source documents.
// -----------------------------------------------------------------------
// The authenticated, owner-scoped, read-only boundary over
// listSourceDocumentsByDeterminationId(). The caller supplies only a raw
// session token and a determination id; the userId is resolved here via
// requireUser() and is never accepted from the client. Ownership is
// enforced by the reader's own join to prospects (DEC-008), so an unowned
// or missing determination yields [] — the same not-found-for-unowned-or-
// missing convention as getFeedback(). Returns the persisted rows as
// stored: no provider call, no re-fetch, no re-extraction, no writes.
// -----------------------------------------------------------------------

export interface SourceDocumentReviewDeps {
  identity: IdentityRepository;
  categoryPlausibility: CategoryPlausibilitySourceDocumentReader;
}

export async function listSourceDocumentsForReview(
  deps: SourceDocumentReviewDeps,
  rawToken: string | undefined | null,
  determinationId: string,
  now: Date = new Date(),
): Promise<readonly StoredCapturedSourceDocument[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.categoryPlausibility.listSourceDocumentsByDeterminationId(userId, determinationId);
}
