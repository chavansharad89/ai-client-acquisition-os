import { abortableSleep, Deadline } from './abortable';
import {
  ResearchAbortedError,
  ResearchProviderError,
  ResearchRefusedError,
  ResearchValidationError,
} from './errors';
import { buildTargetedRepairMessage, buildUserMessage, SYSTEM_PROMPT } from './prompt';
import { verifyProvenance } from './provenance';
import {
  applyRepair,
  formatIssue,
  fromProvenanceIssues,
  fromZodIssues,
  planRepair,
  type RepairIssue,
} from './repair';
import {
  leadResearchSchema,
  observedRatio,
  researchInputSchema,
  type LeadResearch,
  type ResearchInput,
} from './schema';

// Orchestration: call, validate, repair, retry.
// -----------------------------------------------------------------------
// Two distinct failure modes, handled differently:
//
//   PROVIDER failures (429, 5xx, network) are transient. Retry with
//   exponential backoff and full jitter — the same shape the Meta worker
//   uses, for the same reason: without jitter, a rate-limited batch
//   retries in lockstep and re-triggers the limit.
//
//   VALIDATION failures are the model's output being wrong. Backoff would
//   not help, so instead the exact errors are fed back and the model is
//   asked to repair — a different request, not the same one again.
//
// A refusal is neither: it is terminal, and retrying it is both futile and
// rude to the safety system.
// -----------------------------------------------------------------------

/** The model call, behind an interface so the loop is testable without the SDK. */
export interface ResearchModel {
  (request: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    /**
     * Forwarded to the provider so an abort cancels the IN-FLIGHT call.
     *
     * Cancelling only the backoff would be theatre: the long wait in this
     * loop is usually the model call itself, not the sleep between them.
     */
    signal?: AbortSignal;
  }): Promise<ModelResult>;
}

export type ModelResult =
  { kind: 'json'; value: unknown } | { kind: 'refusal'; category: string | null };

export interface ResearchOptions {
  /** Total attempts including the first. */
  maxAttempts?: number;
  /** Base backoff for provider failures. */
  baseDelayMs?: number;
  maxDelayMs?: number;
  random?: () => number;
  /** Injectable for deterministic tests. Receives the signal so a fake can honour it. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  /** Caller cancellation — an HTTP request aborting, or a worker shutting down. */
  signal?: AbortSignal;
  /**
   * Wall-clock budget for the WHOLE call, retries and backoff included.
   *
   * Independent of `signal` on purpose. A signal bounds the wait when
   * somebody is watching; a deadline bounds it when nobody is, which is
   * the case that produced minute-long waits nobody had asked for.
   */
  deadlineMs?: number;
  /** Warn below this share of OBSERVED claims. */
  minObservedRatio?: number;
}

export interface ResearchOutcome {
  research: LeadResearch;
  attempts: number;
  /** Validation repairs that were needed. High values mean a prompt problem. */
  repairs: number;
  observedRatio: number;
  /** Set when the result is schema-valid but thin. */
  warning?: string;
}

const DEFAULTS = {
  maxAttempts: 3,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  minObservedRatio: 0.2,
};

/** Full jitter, matching the worker's retry policy. */
export function backoffDelayMs(
  attempt: number,
  base: number,
  max: number,
  random: () => number,
): number {
  const cap = Math.min(max, base * 2 ** (attempt - 1));
  return Math.floor(Math.min(Math.max(random(), 0), 0.999_999) * cap);
}

const defaultSleep = abortableSleep;

export async function researchLead(
  model: ResearchModel,
  rawInput: ResearchInput,
  options: ResearchOptions = {},
): Promise<ResearchOutcome> {
  const input = researchInputSchema.parse(rawInput);
  const config = { ...DEFAULTS, ...options };
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;
  const signal = options.signal;
  const deadline = new Deadline(options.deadlineMs);

  /** Throws the moment either budget is gone. Checked at every boundary. */
  const assertLive = (): void => {
    if (signal?.aborted) throw new ResearchAbortedError('signal', deadline.elapsedMs());
    if (deadline.expired()) throw new ResearchAbortedError('deadline', deadline.elapsedMs());
  };

  // The brief never changes, so it is held separately and a repair round
  // REPLACES the previous correction rather than appending to it. Appending
  // re-sent the whole rejected document on every round, so a three-attempt
  // call carried the output twice and paid for it twice; the model only
  // ever needs its most recent attempt plus what was wrong with it.
  const brief: { role: 'user' | 'assistant'; content: string } = {
    role: 'user',
    content: buildUserMessage(input),
  };
  let messages: { role: 'user' | 'assistant'; content: string }[] = [brief];
  /** Non-empty once a repair is in flight; names what may be replaced. */
  let repairRoots: readonly string[] = [];

  let attempts = 0;
  let repairs = 0;
  let lastIssues: RepairIssue[] = [];
  // The most recent attempt's raw value. Repairs merge INTO this, so a
  // field that already validated is carried forward verbatim rather than
  // regenerated — see repair.ts for why that is the safe direction.
  let priorValue: unknown = null;

  while (attempts < config.maxAttempts) {
    // Before spending a call, not only before sleeping: an aborted
    // caller must not pay for one more request to the provider.
    assertLive();
    attempts += 1;

    let result: ModelResult;
    try {
      result = await model({
        system: SYSTEM_PROMPT,
        messages,
        ...(signal ? { signal } : {}),
      });
    } catch (cause) {
      // An abort surfacing through the model call is an abort, not a
      // provider fault — classifying it as retryable would have us sleep
      // and try again on behalf of a caller who has already left.
      if (cause instanceof ResearchAbortedError) throw cause;
      if (signal?.aborted) throw new ResearchAbortedError('signal', deadline.elapsedMs());

      const error = toProviderError(cause);
      // A non-retryable provider error (400, 401, 404) will fail the same
      // way every time — surface it now rather than burning the budget.
      if (!error.retryable || attempts >= config.maxAttempts) throw error;

      // Clamped to what is left, so the backoff can never outlive the
      // deadline it is supposed to respect.
      const wait = deadline.clamp(
        backoffDelayMs(attempts, config.baseDelayMs, config.maxDelayMs, random),
      );
      await sleep(wait, signal);
      assertLive();
      continue;
    }

    if (result.kind === 'refusal') {
      // Terminal by design. Retrying a safety decline is futile.
      throw new ResearchRefusedError(result.category);
    }

    // On a repair round, take ONLY the failing subtrees from the answer
    // and keep everything else from the attempt that already validated
    // it. Validation below then runs on the merged document in full —
    // merging is a cheaper route to a candidate, never a shortcut past
    // the gate.
    const candidate =
      repairRoots.length > 0 ? applyRepair(priorValue, result.value, repairRoots) : result.value;

    const parsed = leadResearchSchema.safeParse(candidate);
    if (parsed.success) {
      // Shape is right. Now the part Zod cannot check: is the evidence
      // real? A quote the model composed and a URL it invented both pass
      // the schema, so without this an OBSERVED claim means only that the
      // model said "OBSERVED".
      const provenance = verifyProvenance(parsed.data, input.sourceDocuments);
      if (provenance.length === 0) {
        const ratio = observedRatio(parsed.data);
        return {
          research: parsed.data,
          attempts,
          repairs,
          observedRatio: ratio,
          ...(ratio < config.minObservedRatio
            ? {
                warning:
                  `Only ${Math.round(ratio * 100)}% of claims are OBSERVED — the source documents ` +
                  `were probably too thin to research from. Treat this as a lead to revisit, not a brief.`,
              }
            : {}),
        };
      }
      // Fabricated citations are a repairable mistake, not a provider
      // failure — same loop, same feedback, no backoff.
      lastIssues = fromProvenanceIssues(provenance);
      // Provenance ran on the PARSED value, so that is what the next
      // round merges into.
      priorValue = parsed.data;
    } else {
      lastIssues = fromZodIssues(parsed.error.issues);
      priorValue = candidate;
    }

    if (attempts >= config.maxAttempts) break;

    // Repair rather than repeat: name the failures, hand back only the
    // subtrees they refer to, and include the source documents only when
    // the failures are about evidence.
    repairs += 1;
    const plan = planRepair(priorValue, lastIssues);
    repairRoots = plan.roots;
    messages = [{ role: 'user', content: buildTargetedRepairMessage(plan, input) }];
  }

  throw new ResearchValidationError(attempts, lastIssues.map(formatIssue));
}

/** Classifies an SDK/network error as retryable or not. */
export function toProviderError(cause: unknown): ResearchProviderError {
  if (cause instanceof ResearchProviderError) return cause;

  const status =
    typeof cause === 'object' && cause !== null && 'status' in cause
      ? (cause as { status?: unknown }).status
      : undefined;
  const code = typeof status === 'number' ? status : undefined;

  // 408 timeout, 409 conflict, 429 rate limit and every 5xx are transient.
  // 400/401/403/404 are our fault and will not improve.
  const retryable =
    code === undefined || code === 408 || code === 409 || code === 429 || code >= 500;

  const message = cause instanceof Error ? cause.message : String(cause);
  return new ResearchProviderError(
    `lead research model call failed${code ? ` (HTTP ${code})` : ''}: ${message}`,
    code,
    retryable,
    { cause },
  );
}
