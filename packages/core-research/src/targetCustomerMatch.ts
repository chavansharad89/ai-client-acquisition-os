import { z } from 'zod';

import { Deadline } from './abortable';
import { ResearchAbortedError, ResearchProviderError, ResearchRefusedError } from './errors';
import { MIN_QUOTE_CHARS, normaliseForMatch, normaliseUrl, type SourceDocument } from './provenance';
import { applyRepair, fromZodIssues, planRepair, type RepairIssue } from './repair';
import { backoffDelayMs, toProviderError, type ModelInvocationUsage, type ResearchModel } from './researcher';

// PCG-4 TARGET_CUSTOMER_MATCH — requirement/
// CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision chain:
//   PDEF4-PCG4-PO-DEC-001 (product semantics)
//   PDEF4-PCG4-ED-DEC-001 (ED-TC-1/3/4/6/8/9 — table/timing/storage shape)
//   PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001 (TC-MATCH-1..12 — evidence/evaluation policy)
//   PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001 (TD-1..TD-16 — model I/O, aggregation, metadata)
//   PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 (sentinel, concurrency, acceptance criteria)
// -----------------------------------------------------------------------
// TD-1: a dedicated, independent bounded model call (not call-shared with
// categoryPlausibility), given the Search's raw `targetCustomer` string as
// one unit (not parsed into segments) plus the same source documents
// already supplied to the per-Prospect research call.
//
// TD-14: reuses researcher.ts's/repair.ts's already-generic pieces
// (backoffDelayMs, toProviderError, the error classes, planRepair/
// applyRepair/fromZodIssues, which operate on `unknown`/dotted paths and
// are not hardcoded to leadResearchSchema) rather than duplicating
// retry/backoff/repair logic. researchLead() itself is NOT reused
// directly — it is hardcoded to leadResearchSchema/buildUserMessage/
// verifyProvenance/verifyCategoryPlausibility, none of which apply to
// this call's own, independent schema (TD-2).
// -----------------------------------------------------------------------

export const TARGET_CUSTOMER_MATCH_RESULTS = ['MATCH', 'NO_MATCH', 'NOT_YET_OBSERVED'] as const;
export type TargetCustomerMatchResult = (typeof TARGET_CUSTOMER_MATCH_RESULTS)[number];

/**
 * PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001 §1.1 — the exact, fixed literal.
 * Untouched by `normalise()` (trim + toLowerCase) in
 * `@acos/core-qualification-equivalence`'s rules.ts, and cannot occur in
 * any legitimate free-text `targetCustomer` value (Postgres TEXT columns
 * cannot carry a NUL byte in ordinary user-authored input) — collision
 * with a real value is structurally impossible, not merely improbable.
 */
export const NO_MATCH_SENTINEL = '\u0000__PCG4_NO_MATCH_SENTINEL__\u0000';

/** TD-6: this evaluator's own prompt/schema version, persisted on every row for replay. */
export const TARGET_CUSTOMER_MATCH_PROMPT_VERSION = 'target-customer-match-v1';

// ---- TD-1/TD-2/TD-4: model call input/output shape ----

/** TD-2/TD-4: one finding, self-identifying which side it supports. */
export const targetCustomerMatchFindingSchema = z.object({
  classification: z.enum(['MATCH', 'NO_MATCH']).describe(
    'MATCH: this quote shows the Prospect IS the kind of customer named by targetCustomer. ' +
      'NO_MATCH: this quote shows the Prospect is NOT that kind of customer. Only cite a quote ' +
      'you are confident affirmatively establishes one side or the other — if the evidence is ' +
      'insufficient either way, omit a finding for it rather than guessing.',
  ),
  quote: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .describe(
      'Text copied VERBATIM from one of the supplied source documents. Checked character by ' +
        'character against that document — a paraphrase or invented sentence will be rejected.',
    ),
  sourceUrl: z
    .string()
    .trim()
    .url()
    .describe('The URL of the supplied source document this quote was copied from.'),
  sourceLabel: z.string().trim().min(1).max(80).describe('The Label of that same supplied document.'),
});
export type TargetCustomerMatchFinding = z.infer<typeof targetCustomerMatchFindingSchema>;

/** TD-2 Option B: array-of-findings, wrapped in a top-level object (container shape is implementation detail, not fixed by TD-2). */
export const targetCustomerMatchResponseSchema = z.object({
  findings: z.array(targetCustomerMatchFindingSchema).max(10).default([]),
});
export type TargetCustomerMatchResponse = z.infer<typeof targetCustomerMatchResponseSchema>;

/** TD-4: a verified evidence item, exactly as persisted in the `evidence` JSONB column. */
export interface TargetCustomerMatchEvidenceItem {
  classification: 'MATCH' | 'NO_MATCH';
  quote: string;
  sourceUrl: string;
  sourceLabel: string;
}

// ---- Deterministic post-processing: verification + aggregation ----

/**
 * TD-4/provenance: a finding is verified only if its quote actually
 * appears (after the same normalisation ./provenance.ts's
 * verifyProvenance uses) in the source document its sourceUrl cites.
 * Unverifiable findings (fabricated quote, wrong/missing URL, too short
 * to be evidence) are silently excluded from the verified set — this is
 * what makes "MATCH requires a VERIFIED quote" (TC-MATCH-3/4) load-bearing
 * rather than a bare model label.
 */
export function verifyTargetCustomerMatchFindings(
  findings: readonly TargetCustomerMatchFinding[],
  sources: readonly SourceDocument[],
): TargetCustomerMatchEvidenceItem[] {
  const prepared = sources.map((doc) => ({
    label: doc.label,
    url: normaliseUrl(doc.url),
    normalisedText: normaliseForMatch(doc.text),
  }));

  const verified: TargetCustomerMatchEvidenceItem[] = [];
  for (const finding of findings) {
    const quote = normaliseForMatch(finding.quote);
    if (quote.length < MIN_QUOTE_CHARS) continue;

    const cited = prepared.find((doc) => doc.url === normaliseUrl(finding.sourceUrl));
    if (!cited) continue;
    if (!cited.normalisedText.includes(quote)) continue;

    verified.push({
      classification: finding.classification,
      quote: finding.quote,
      sourceUrl: finding.sourceUrl,
      sourceLabel: finding.sourceLabel,
    });
  }
  return verified;
}

/**
 * TC-MATCH-3/4/5/6 — the tri-state aggregation, deterministic and
 * pure. Both MATCH-supporting and NO_MATCH-supporting verified evidence
 * present at once is a contradiction (TC-MATCH-6): resolves to
 * NOT_YET_OBSERVED, never auto-MATCH or auto-NO_MATCH. No verified
 * evidence either way (including every finding having been dropped by
 * verification) is also NOT_YET_OBSERVED (TC-MATCH-5) — absence of
 * evidence must never become NO_MATCH.
 */
export function aggregateTargetCustomerMatch(
  verifiedEvidence: readonly TargetCustomerMatchEvidenceItem[],
): TargetCustomerMatchResult {
  const hasMatch = verifiedEvidence.some((item) => item.classification === 'MATCH');
  const hasNoMatch = verifiedEvidence.some((item) => item.classification === 'NO_MATCH');
  if (hasMatch && hasNoMatch) return 'NOT_YET_OBSERVED';
  if (hasMatch) return 'MATCH';
  if (hasNoMatch) return 'NO_MATCH';
  return 'NOT_YET_OBSERVED';
}

// ---- TD-3/TD-13: pcg4.ts-boundary translation ----

/**
 * PDEF4-PCG4-ED-DEC-001 §8 / TD-3: translates the stored tri-state result
 * into `QualificationEquivalenceSubject.observedTargetCustomer`.
 * `evaluateTargetCustomerMatch`/`rules.ts` is never modified — this is the
 * only translation surface. `targetCustomer` must be the exact Search
 * snapshot string `evaluateTargetCustomerMatch` will compare against.
 */
export function toObservedTargetCustomer(
  result: TargetCustomerMatchResult | null,
  targetCustomer: string,
): string | null {
  if (result === 'MATCH') return targetCustomer;
  if (result === 'NO_MATCH') return NO_MATCH_SENTINEL;
  return null; // NOT_YET_OBSERVED or row-absent (null) — existing UNKNOWN branch, unchanged.
}

// ---- TD-1/TD-14: the bounded model call itself ----

const SYSTEM_PROMPT =
  'You determine whether a business, based ONLY on the supplied source documents, is observed to ' +
  'be the kind of customer named by a target-customer criterion. Cite only quotes copied verbatim ' +
  'from a supplied document. If the documents do not clearly establish a match or a mismatch, ' +
  'return no finding for that side rather than guessing — insufficient evidence is a correct answer, ' +
  'not a failure to avoid.';

function buildUserMessage(targetCustomer: string, sources: readonly SourceDocument[]): string {
  const documents = sources
    .map((doc, index) => `[Document ${index + 1}] Label: ${doc.label}\nURL: ${doc.url}\n${doc.text}`)
    .join('\n\n');
  return (
    `Target-customer criterion: "${targetCustomer}"\n\n` +
    `Source documents:\n${documents || '(none supplied)'}\n\n` +
    'Return every finding (classification, quote, sourceUrl, sourceLabel) that a verbatim quote from ' +
    'one of the documents above affirmatively supports, for either MATCH or NO_MATCH. Omit a side ' +
    'with no supporting quote.'
  );
}

function buildRepairMessage(targetCustomer: string, sources: readonly SourceDocument[], issues: readonly RepairIssue[]): string {
  const issueText = issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n');
  return `${buildUserMessage(targetCustomer, sources)}\n\nYour previous answer had these problems:\n${issueText}\n\nReturn a corrected, complete answer.`;
}

export interface TargetCustomerMatchModelOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  random?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
  deadlineMs?: number;
  onInvocation?: (usage: ModelInvocationUsage, requestKind: 'initial' | 'repair') => void | Promise<void>;
}

const DEFAULTS = { maxAttempts: 3, baseDelayMs: 1_000, maxDelayMs: 30_000 };

async function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
  if (signal?.aborted) throw new ResearchAbortedError('signal', 0);
}

/**
 * TD-14: the dedicated bounded call for this signal. Reuses the retry/
 * backoff skeleton (backoffDelayMs, toProviderError) and the generic
 * repair primitives (planRepair/applyRepair/fromZodIssues) rather than
 * reinventing them; the schema-specific validate/repair body is new,
 * because this call's schema (TD-2) is new.
 *
 * Fail-soft (TC-MATCH-9): a provider failure (after retries exhausted), a
 * refusal, or output that never becomes schema-valid within maxAttempts
 * resolves to an EMPTY findings array rather than throwing — which
 * aggregateTargetCustomerMatch() above already turns into
 * NOT_YET_OBSERVED, never NO_MATCH. A caller abort/deadline
 * (ResearchAbortedError) is the one exception: it propagates, because
 * "nobody is listening any more" is not an evaluation failure to paper
 * over (mirrors researcher.ts's own distinction).
 */
export async function callTargetCustomerMatchModel(
  model: ResearchModel,
  targetCustomer: string,
  sources: readonly SourceDocument[],
  options: TargetCustomerMatchModelOptions = {},
): Promise<TargetCustomerMatchFinding[]> {
  const config = { ...DEFAULTS, ...options };
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;
  const signal = options.signal;
  const deadline = new Deadline(options.deadlineMs);

  const assertLive = (): void => {
    if (signal?.aborted) throw new ResearchAbortedError('signal', deadline.elapsedMs());
    if (deadline.expired()) throw new ResearchAbortedError('deadline', deadline.elapsedMs());
  };

  let messages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: buildUserMessage(targetCustomer, sources) },
  ];
  let repairRootsNonEmpty = false;
  let attempts = 0;
  let lastIssues: RepairIssue[] = [];
  let priorValue: unknown = null;

  try {
    while (attempts < config.maxAttempts) {
      assertLive();
      attempts += 1;

      let result;
      try {
        result = await model({ system: SYSTEM_PROMPT, messages, ...(signal ? { signal } : {}) });
      } catch (cause) {
        if (cause instanceof ResearchAbortedError) throw cause;
        if (signal?.aborted) throw new ResearchAbortedError('signal', deadline.elapsedMs());

        const error = toProviderError(cause);
        if (!error.retryable || attempts >= config.maxAttempts) return [];

        const wait = deadline.clamp(backoffDelayMs(attempts, config.baseDelayMs, config.maxDelayMs, random));
        await sleep(wait, signal);
        assertLive();
        continue;
      }

      if (result.usage && options.onInvocation) {
        await options.onInvocation(result.usage, repairRootsNonEmpty ? 'repair' : 'initial');
      }

      if (result.kind === 'refusal') return [];

      // Single top-level field (`findings`) — a repair round always
      // replaces it wholesale rather than merging sub-paths, since the
      // whole array is one semantic unit.
      const candidate =
        repairRootsNonEmpty && priorValue !== null
          ? applyRepair(priorValue, result.value, ['findings'])
          : result.value;

      const parsed = targetCustomerMatchResponseSchema.safeParse(candidate);
      if (parsed.success) return [...parsed.data.findings];

      lastIssues = fromZodIssues(parsed.error.issues);
      priorValue = candidate;

      if (attempts >= config.maxAttempts) break;

      repairRootsNonEmpty = true;
      const plan = planRepair(priorValue, lastIssues);
      messages = [{ role: 'user', content: buildRepairMessage(targetCustomer, sources, plan.issues) }];
    }
    return [];
  } catch (cause) {
    if (cause instanceof ResearchAbortedError) throw cause;
    if (cause instanceof ResearchProviderError || cause instanceof ResearchRefusedError) return [];
    return [];
  }
}

// ---- Full evaluation: model call + verify + aggregate + metadata ----

export interface TargetCustomerMatchModelDeps {
  model: ResearchModel;
  /** Static identifiers (TD-6) — known even when the call itself fails, so every row's metadata is non-null. */
  modelId: string;
  providerId: string;
  promptVersion?: string;
}

export interface TargetCustomerMatchEvaluation {
  result: TargetCustomerMatchResult;
  evidence: readonly TargetCustomerMatchEvidenceItem[];
  model: string;
  provider: string;
  promptVersion: string;
}

/**
 * The full evaluator (TC-MATCH-2 hybrid shape): deterministic framing
 * (buildUserMessage, above), one bounded model call, deterministic
 * verification + aggregation. Never throws except on caller
 * abort/deadline — every other failure mode already resolves to `[]`
 * findings inside callTargetCustomerMatchModel, which aggregates to
 * NOT_YET_OBSERVED here.
 */
export async function evaluateTargetCustomerMatch(
  deps: TargetCustomerMatchModelDeps,
  targetCustomer: string,
  sources: readonly SourceDocument[],
  options: TargetCustomerMatchModelOptions = {},
): Promise<TargetCustomerMatchEvaluation> {
  const findings = await callTargetCustomerMatchModel(deps.model, targetCustomer, sources, options);
  const evidence = verifyTargetCustomerMatchFindings(findings, sources);
  const result = aggregateTargetCustomerMatch(evidence);
  return {
    result,
    evidence,
    model: deps.modelId,
    provider: deps.providerId,
    promptVersion: deps.promptVersion ?? TARGET_CUSTOMER_MATCH_PROMPT_VERSION,
  };
}

// ---- Persistence-ready input shape (produced by ./service.ts) ----

export interface NewTargetCustomerMatchDeterminationInput {
  searchId: string;
  prospectId: string;
  targetCustomer: string;
  result: TargetCustomerMatchResult;
  evidence: readonly TargetCustomerMatchEvidenceItem[];
  model: string;
  provider: string;
  promptVersion: string;
}

export interface StoredTargetCustomerMatchDetermination extends NewTargetCustomerMatchDeterminationInput {
  id: string;
  observedAt: Date;
  /** Never deleted — a same-Search-Prospect re-run supersedes prior rows instead (ED-TC-8). */
  supersededAt: Date | null;
}
