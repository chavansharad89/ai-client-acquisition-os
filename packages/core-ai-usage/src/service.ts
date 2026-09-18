import type { ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { ResearchProspectNotFoundError, type ModelInvocationUsage } from '@acos/core-research';

import type { AiUsageEventRepository } from './repository';
import { toNewAiUsageEventInput, type AiUsageRequestKind, type StoredAiUsageEvent } from './types';

// Application/service boundary (R-29).
// -----------------------------------------------------------------------
// requireUser() resolves the caller FIRST, mirroring every other
// service.ts in this repository (DEC-003) — a caller never supplies a
// userId, and an unauthenticated token never reaches a repository.
// Ownership is resolved through Prospect, reusing
// @acos/core-discovery's existing ProspectRepository unmodified — the
// same getById(userId, prospectId) call @acos/core-research's
// runResearch()/listResearchSignals() already use for the identical
// check.
// -----------------------------------------------------------------------

export interface AiUsageDeps {
  identity: IdentityRepository;
  prospects: ProspectRepository;
  usageEvents: AiUsageEventRepository;
}

/**
 * Records one already-captured provider invocation's usage against one
 * of the caller's own Prospects. The public "record a usage event"
 * operation the Phase 16 scope lock describes: requireUser() → Prospect
 * ownership check → persistence, nothing else.
 *
 * Throws {@link ResearchProspectNotFoundError} when `prospectId` does not
 * resolve to a Prospect owned by the caller — same convention
 * @acos/core-research's service.ts uses.
 */
export async function recordAiUsageEvent(
  deps: AiUsageDeps,
  rawToken: string | undefined | null,
  prospectId: string,
  usage: ModelInvocationUsage,
  requestKind: AiUsageRequestKind,
  now: Date = new Date(),
): Promise<StoredAiUsageEvent> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new ResearchProspectNotFoundError(prospectId);

  return deps.usageEvents.recordEvent(
    userId,
    prospect.id,
    toNewAiUsageEventInput(usage, requestKind),
    now,
  );
}

/**
 * Reads the caller's own AI usage events for one Prospect. Ownership is
 * checked twice, independently: here via deps.prospects.getById, and
 * again by the repository's own WHERE user_id = $1 predicate — the same
 * belt-and-suspenders convention listResearchSignals uses.
 */
export async function listAiUsageEvents(
  deps: AiUsageDeps,
  rawToken: string | undefined | null,
  prospectId: string,
  now: Date = new Date(),
): Promise<readonly StoredAiUsageEvent[]> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new ResearchProspectNotFoundError(prospectId);

  return deps.usageEvents.listByProspect(userId, prospect.id);
}
