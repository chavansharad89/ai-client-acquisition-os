import type { ProvenanceIssue, SourceDocument } from './provenance';

// Targeted repair.
// -----------------------------------------------------------------------
// A repair round used to resend the entire brief — every source document,
// often ten thousand tokens of them — plus the whole rejected JSON, in
// order to fix what is usually one observation out of twenty.
//
// This narrows the PROMPT. It deliberately does not touch the response
// contract: `output_config.format` pins every call to the full
// leadResearchSchema, so the model still returns a complete document and
// changing that would mean reshaping the model adapter for a saving that
// belongs on the input side anyway.
//
// WHICH LEAVES ONE PROBLEM, AND ITS SOLUTION IS THE INTERESTING PART.
// If the prompt no longer contains the observations that PASSED, the
// model cannot reproduce them — and a full-document response generated
// without them would quietly replace good claims with invented ones.
//
// So the model's answer is not taken wholesale. Only the failing paths
// are spliced into the previous value; every other field is carried over
// verbatim from the attempt that already validated it. Unrelated
// observations are preserved by construction rather than by trusting the
// model to leave them alone — we never read its version of them.
//
// VALIDATION IS UNCHANGED AND STILL TOTAL. The merged document goes
// through leadResearchSchema.safeParse and verifyProvenance in full, on
// every round, exactly as before. Merging is a cheaper way to reach a
// candidate; it is not a shortcut past the gate.
// -----------------------------------------------------------------------

/** A validation failure, before it is flattened into a string. */
export interface RepairIssue {
  path: string;
  message: string;
}

/** Fields of leadResearchSchema that hold arrays of observations. */
const OBSERVATION_LISTS = new Set([
  'visibleProblems',
  'growthOpportunities',
  'aiOpportunities',
  'websiteIssues',
  'contentOpportunities',
  'automationOpportunities',
]);

/**
 * The subtree a failure should be repaired at.
 *
 * Observation granularity, not field granularity, and deliberately: a
 * fabricated quote is often not fixed by editing the quote. The honest
 * repair is to reclassify the claim INFERRED — which changes `value`,
 * `basis`, `evidence` and `confidence` together. Handing back only
 * `evidence.0.quote` would invite the model to invent a better-looking
 * quote instead, which is the failure mode this whole subsystem exists
 * to prevent.
 */
export function repairRoot(path: string): string {
  const segments = path.split('.');
  const head = segments[0] ?? '';
  if (OBSERVATION_LISTS.has(head) && segments.length > 1) return `${head}.${segments[1]}`;
  return head;
}

/** Distinct subtrees to repair, in a stable order. */
export function repairRoots(issues: readonly RepairIssue[]): string[] {
  const seen: string[] = [];
  for (const issue of issues) {
    const root = repairRoot(issue.path);
    if (root && !seen.includes(root)) seen.push(root);
  }
  return seen;
}

function readPath(value: unknown, path: string): unknown {
  let cursor: unknown = value;
  for (const segment of path.split('.')) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

function writePath(target: unknown, path: string, next: unknown): void {
  const segments = path.split('.');
  const last = segments.pop();
  if (last === undefined) return;
  let cursor: unknown = target;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== 'object') return;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (cursor !== null && typeof cursor === 'object') {
    (cursor as Record<string, unknown>)[last] = next;
  }
}

/** Just the failing subtrees of the rejected attempt. */
export function excerptFor(value: unknown, roots: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const root of roots) out[root] = readPath(value, root);
  return out;
}

/**
 * Splices the model's repaired subtrees into the previous attempt.
 *
 * Everything outside `roots` comes from `prior` — the model's opinion of
 * those fields is never consulted. A root the model did not produce is
 * left as it was, which simply fails validation again and costs one more
 * bounded round rather than corrupting the document.
 */
export function applyRepair(
  prior: unknown,
  repaired: unknown,
  roots: readonly string[],
): unknown {
  if (prior === null || typeof prior !== 'object') return repaired;
  const merged: unknown = structuredClone(prior);
  for (const root of roots) {
    const next = readPath(repaired, root);
    if (next !== undefined) writePath(merged, root, next);
  }
  return merged;
}

/**
 * True when a failure can only be fixed by reading the sources again.
 *
 * Provenance failures need the documents: the model has to find a real
 * quote. Schema failures do not — "INFERRED confidence cannot exceed 80"
 * is fixed by changing a number, and re-sending ten thousand tokens of
 * source text to say so is the waste this function exists to avoid.
 */
export function needsSourceContext(issues: readonly RepairIssue[]): boolean {
  return issues.some(
    (issue) =>
      issue.path.includes('.evidence') ||
      /quote|sourceUrl|supplied source|OBSERVED requires/i.test(issue.message),
  );
}

export function fromProvenanceIssues(issues: readonly ProvenanceIssue[]): RepairIssue[] {
  return issues.map((issue) => ({ path: issue.path, message: issue.message }));
}

export function fromZodIssues(
  issues: readonly { path: (string | number)[]; message: string }[],
): RepairIssue[] {
  return issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

export function formatIssue(issue: RepairIssue): string {
  return `${issue.path}: ${issue.message}`;
}

export interface RepairPlan {
  /** Every failing subtree — uncapped, so one round can fix them all. */
  roots: readonly string[];
  /** The issues shown in the message, capped for readability. */
  issues: readonly RepairIssue[];
  /** How many issues were not shown. */
  omittedIssues: number;
  excerpt: Record<string, unknown>;
  includeSources: boolean;
}

/**
 * How many issues a repair message carries.
 *
 * A response wrong in thirty places is wrong in one way, and listing all
 * thirty buys tokens, not clarity.
 */
export const MAX_REPAIR_ISSUES = 12;

export function planRepair(priorValue: unknown, issues: readonly RepairIssue[]): RepairPlan {
  // The cap applies to what is DISPLAYED, not to what may be repaired.
  //
  // Capping the merge set too was a mistake worth recording: with more
  // failures than the cap, a round could only ever fix the first twelve,
  // so the loop needed as many rounds as ceil(failures / 12) and could
  // exhaust its attempt budget on a document that one good response
  // would have fixed. Roots come from every issue; the message shows the
  // first twelve and says how many it left out.
  const roots = repairRoots(issues);
  return {
    roots,
    issues: issues.slice(0, MAX_REPAIR_ISSUES),
    omittedIssues: Math.max(0, issues.length - MAX_REPAIR_ISSUES),
    excerpt: excerptFor(priorValue, roots),
    includeSources: needsSourceContext(issues),
  };
}

export type { SourceDocument };
