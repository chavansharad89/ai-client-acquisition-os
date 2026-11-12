import { normalizeCandidate, type StoredCompany, type StoredProspect } from '@acos/core-discovery';
import {
  IntentSignalValidationError,
  requireExactProviderResultForIntake,
  toIntentIntakeInput,
  toIntentSignalInput,
  type RecordIntentIntakeInput,
  type RecordIntentSignalInput,
  type ResearchSignalTransaction,
  type StoredResearchSignal,
} from '@acos/core-research';

import {
  researchProspectForOwner,
  runPostResearchPipelineForOwner,
  type ProspectPipelineDeps,
} from './worker';

// Intent intake (INTENT-INTAKE-PO-DEC-001) — one intake event carrying one
// or more PUBLIC_INTENT / FIRST_PARTY signals into the EXISTING pipeline,
// never a parallel one.
// -----------------------------------------------------------------------
//   validate every signal before any write (fixed OBSERVED confidence, D5)
//     -> caller's own existing Search (G2: never created, never nullable)
//     -> Company via normalizeCandidate + findOrCreateByDomain (G1: no
//        usable website -> rejected, no invented identity)
//     -> Prospect via findOrCreate on (Search, Company) (G3: no merging
//        across Searches)
//     -> saveSignals once per signal, each with its source event's own
//        observedAt (created_at stays the database's capture time);
//        append-only, so signals never supersede one another. Every
//        signal and source row of the event is written in ONE transaction
//        (OD-8); a FIRST_PARTY row's authorization evidence is bound in
//        its own INSERT (OD-7, OD-8). No automatic retry (OD-12).
//     -> existing Research when no CATEGORY_PLAUSIBLE determination
//        exists yet (D4) — its supersession skips intake kinds (C2)
//     -> runPostResearchPipelineForOwner: the same Opportunity / Score /
//        Qualify / Personalize / Prep code runCanonicalPipeline runs.
//
// E1 (keep current behavior): an existing Opportunity is found, not
// recreated, and its offer / next action are not re-evaluated.
// E2 (accept any Search status): the Search is only looked up for
// ownership; its status is never checked and never counts as evidence.
//
// Offer triggering is unchanged (D3): the signal reaches needDetected
// only if the Search's ServiceProfile lists its kind in `triggers`.
// No live provider lives here — callers supply the signal; Research's
// own provider is whatever `deps.researchProvider` the caller wires.
//
// OD-13 gate (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001; IA-OD-WRITER-001
// §4.1): no runtime caller may pass AI-platform results carrying
// SUPPLIED_TO_US items into this path. The Option B mechanism exists
// (IA-OD13-B): an event with any FIRST_PARTY signal must carry the
// VerifiedProviderResult it came from, re-verified here before any write
// (P3), and its FIRST_PARTY signals, companyName and website must equal
// those re-derived from that exact verified result (X1,
// INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001). No integration is named, no
// key registered, no caller wired.
// -----------------------------------------------------------------------

export class IntentIntakeSearchNotFoundError extends Error {
  readonly searchId: string;

  constructor(searchId: string) {
    super(`search not found: ${searchId}`);
    this.name = 'IntentIntakeSearchNotFoundError';
    this.searchId = searchId;
  }
}

export interface IntentIntakeResult {
  company: StoredCompany;
  prospect: StoredProspect;
  /** One per supplied signal, in input order. */
  signals: StoredResearchSignal[];
  /** True when this call ran the existing Research step (no determination existed). */
  researched: boolean;
  opportunityId: string;
}

/** Pipeline deps plus the transaction the event's signal writes run in (OD-8). */
export type IntentIntakeDeps = ProspectPipelineDeps & { signalTransaction: ResearchSignalTransaction };

export interface SingleIntentIntakeResult extends Omit<IntentIntakeResult, 'signals'> {
  signal: StoredResearchSignal;
}

/**
 * Records one intake event (one or more intent signals) for a trusted
 * `userId` and runs the existing pipeline once for its Prospect. Not
 * reachable from any HTTP path.
 */
export async function recordIntentIntakeForOwner(
  deps: IntentIntakeDeps,
  userId: string,
  input: RecordIntentIntakeInput,
  now: Date = new Date(),
): Promise<IntentIntakeResult> {
  const validated = toIntentIntakeInput(input, now);
  // OD-13 P3 + X1 exact-result binding: before any lookup or write; a no-op when no signal is FIRST_PARTY.
  requireExactProviderResultForIntake(validated, input.providerAuthenticity, now);

  // E2: any status is accepted — this lookup is an ownership check only.
  const search = await deps.searches.getById(userId, validated.searchId);
  if (!search) throw new IntentIntakeSearchNotFoundError(validated.searchId);

  const normalized = normalizeCandidate({ name: validated.companyName, website: validated.website });
  if (!normalized) {
    throw new IntentSignalValidationError(
      'website',
      'invalid',
      'website must resolve to a usable domain — intent intake does not invent company identity',
    );
  }

  const company = await deps.companies.findOrCreateByDomain(userId, normalized, now);
  const prospect = await deps.prospects.findOrCreate(
    userId,
    { searchId: search.id, companyId: company.id },
    now,
  );

  // OD-8: all signal + source rows of this event commit or roll back together.
  // Company / Prospect above and the pipeline below stay outside, as before.
  const signals = await deps.signalTransaction(async (tx) => {
    const stored: StoredResearchSignal[] = [];
    for (const { signal, observedAt } of validated.signals) {
      const [row] = await tx.saveSignals(prospect.id, [signal], observedAt);
      stored.push(row!);
    }
    return stored;
  });

  const determination = deps.categoryPlausibility
    ? await deps.categoryPlausibility.getCurrentByProspectId(userId, prospect.id)
    : null;
  const researched = determination === null;
  if (researched) {
    await researchProspectForOwner(deps, userId, prospect.id);
  }

  const { opportunityId } = await runPostResearchPipelineForOwner(deps, userId, prospect.id);

  return { company, prospect, signals, researched, opportunityId };
}

/**
 * Single-signal form: an intake event with exactly one signal. Rejects
 * FIRST_PARTY — it has no provider result behind it (OD-7 item 3).
 */
export async function recordIntentSignalForOwner(
  deps: IntentIntakeDeps,
  userId: string,
  input: RecordIntentSignalInput,
  now: Date = new Date(),
): Promise<SingleIntentIntakeResult> {
  if ((input as { kind?: unknown }).kind === 'FIRST_PARTY') {
    throw new IntentSignalValidationError(
      'kind',
      'not-allowed',
      'FIRST_PARTY is not accepted by the single-signal form; it requires a provider result with authorization evidence',
    );
  }
  toIntentSignalInput(input, now); // keeps this form's un-prefixed error fields
  const { searchId, companyName, website, ...entry } = input;
  const { signals, ...rest } = await recordIntentIntakeForOwner(
    deps,
    userId,
    { searchId, companyName, website, signals: [entry] },
    now,
  );
  return { ...rest, signal: signals[0]! };
}
