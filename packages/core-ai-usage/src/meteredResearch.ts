import { requireUser } from '@acos/core-identity';
import {
  researchLead,
  ResearchProspectNotFoundError,
  type ResearchInput,
  type ResearchModel,
  type ResearchOptions,
  type ResearchOutcome,
} from '@acos/core-research';

import type { AiUsageDeps } from './service';
import { toNewAiUsageEventInput } from './types';

// The narrowest point that has both a real provider response and the
// authenticated ownership context (R-29 Phase 16 scope lock, §8/§20-A).
// -----------------------------------------------------------------------
// @acos/core-research's runResearch() is the only EXISTING authenticated
// call site that ever resolves userId before an AI call, but no real
// ResearchProvider is wired to it anywhere in this repository (the only
// implementation is testSupport.ts's fakeResearchProvider) — building
// that wiring is Search/Discovery/worker territory (R-06/R-34), out of
// bounds for R-29. This function does not touch runResearch() or
// service.ts at all.
//
// Instead it authenticates and checks Prospect ownership itself — the
// same requireUser() + ProspectRepository.getById() check runResearch()
// already performs, reused unmodified from @acos/core-discovery — then
// calls researchLead() (unmodified in its control flow; only the
// optional onInvocation hook, added by the Phase-7 compatibility
// exception, is used) and meters every invocation it makes as a side
// effect, via the SAME repository write recordAiUsageEvent uses.
//
// This does NOT persist ResearchSignals (that remains runResearch()'s
// job) and does NOT call the AI a second time to meter it — one
// researchLead() call produces both the research outcome and every
// metering row.
// -----------------------------------------------------------------------

/**
 * Runs research for one of the caller's own Prospects and meters every
 * provider invocation researchLead() makes along the way (R-29) —
 * initial, repair, and provider-error-retried attempts each become their
 * own usage event; a call that never returns a response is not metered
 * (scope lock D1/D7).
 *
 * Ownership is verified ONCE, before the (billable) AI call is made —
 * an invalid or not-owned prospectId fails before any provider request,
 * not after.
 */
export async function runMeteredResearch(
  deps: AiUsageDeps,
  rawToken: string | undefined | null,
  prospectId: string,
  model: ResearchModel,
  input: ResearchInput,
  options: ResearchOptions = {},
  now: Date = new Date(),
): Promise<ResearchOutcome> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new ResearchProspectNotFoundError(prospectId);

  return researchLead(model, input, {
    ...options,
    onInvocation: async (usage, requestKind) => {
      await deps.usageEvents.recordEvent(
        userId,
        prospect.id,
        toNewAiUsageEventInput(usage, requestKind),
        now,
      );
      await options.onInvocation?.(usage, requestKind);
    },
  });
}
