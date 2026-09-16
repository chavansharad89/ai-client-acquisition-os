/** The research call never produced a schema-valid result. */
export class ResearchValidationError extends Error {
  constructor(
    readonly attempts: number,
    readonly issues: readonly string[],
  ) {
    super(
      `lead research failed validation after ${attempts} attempt(s): ${issues.slice(0, 5).join('; ')}`,
    );
    this.name = 'ResearchValidationError';
  }
}

/** The model API failed in a way retrying could not fix. */
export class ResearchProviderError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly retryable: boolean,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'ResearchProviderError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/** The model declined the request on safety grounds. */
export class ResearchRefusedError extends Error {
  constructor(readonly category: string | null) {
    super(`the model refused this research request${category ? ` (${category})` : ''}`);
    this.name = 'ResearchRefusedError';
  }
}

/**
 * The caller cancelled, or the wall-clock deadline expired.
 *
 * Distinct from a provider failure and from a validation failure: nothing
 * is wrong with the request or the response, we simply stopped waiting.
 * Callers retrying on ResearchProviderError must NOT retry this — the
 * point of an abort is that nobody is listening any more.
 */
export class ResearchAbortedError extends Error {
  readonly reason: 'signal' | 'deadline';
  readonly elapsedMs: number;

  constructor(reason: 'signal' | 'deadline', elapsedMs: number) {
    super(
      reason === 'signal'
        ? `lead research aborted by caller after ${elapsedMs}ms`
        : `lead research exceeded its deadline after ${elapsedMs}ms`,
    );
    this.name = 'ResearchAbortedError';
    this.reason = reason;
    this.elapsedMs = elapsedMs;
  }
}
