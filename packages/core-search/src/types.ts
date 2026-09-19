import type { ServiceProfileFields } from '@acos/core-service-profile';

/**
 * PRD V2.1 R-05. An asynchronous, owned, resumable unit of work — not the
 * discovery/research engine itself (that is a later phase; see
 * MVP_SCOPE_BOUNDARY.md). Vocabulary is fixed by the PRD; no other status
 * may be introduced.
 */
export type SearchStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';

/** Untrusted shape a caller supplies to start a Search. Never carries id/userId/parameters. */
export interface CreateSearchInput {
  serviceProfileId: string;
  /** Optional client-generated retry key — see @acos/core-payments' createOrder for the same convention. */
  idempotencyKey?: string;
}

export interface TransitionSearchInput {
  status: SearchStatus;
  /** Required in effect for a transition into FAILED; ignored otherwise. */
  error?: string;
}

/**
 * A row as persisted. `userId` is always server-derived (DEC-003).
 * `parameters` is the immutable snapshot taken from the ServiceProfile at
 * creation time (DEC-007) — a later edit to that profile never changes it.
 * `serviceProfileId` is retained only for lineage display.
 */
export interface StoredSearch {
  id: string;
  userId: string;
  serviceProfileId: string;
  status: SearchStatus;
  parameters: ServiceProfileFields;

  /** Job state (R-05) — foundation for the worker that will claim and execute this Search in a later phase. */
  attempts: number;
  lastError: string | null;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  idempotencyKey: string | null;

  createdAt: Date;
  updatedAt: Date;
}
