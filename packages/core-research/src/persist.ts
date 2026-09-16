import { allObservations, type LeadResearch, type Observation } from './schema';

// Storing research results.
// -----------------------------------------------------------------------
// Maps a validated result onto `acq_lead_research` rows — the append-only
// table the acquisition engine already scores from. One row per claim, so
// a signal keeps its own provenance, confidence and source URL rather than
// being flattened into a blob nobody can audit.
//
// UNKNOWN claims are deliberately NOT stored as signals: they have no
// value and would score as zero-weight noise. They are kept in the run
// record's `gaps` instead, where they answer "what should I go and find
// out" rather than polluting the evidence.
// -----------------------------------------------------------------------

export type ResearchSourceKind =
  'WEBSITE' | 'JOB_POST' | 'LINKEDIN' | 'NEWS' | 'FUNDING' | 'TECH_STACK' | 'REVIEW' | 'MANUAL';

export interface LeadResearchRow {
  leadId: string;
  companyId: string | null;
  kind: ResearchSourceKind;
  signal: string;
  sourceUrl: string | null;
  /** 0-100, already adjusted for classification. */
  confidence: number;
  weight: number;
  observedAt: Date;
}

/** Maps a result field onto the source kind the scorer weights. */
const FIELD_KIND: Record<string, ResearchSourceKind> = {
  companySummary: 'WEBSITE',
  businessModel: 'WEBSITE',
  targetCustomers: 'WEBSITE',
  visibleProblems: 'WEBSITE',
  growthOpportunities: 'NEWS',
  aiOpportunities: 'TECH_STACK',
  websiteIssues: 'WEBSITE',
  contentOpportunities: 'WEBSITE',
  automationOpportunities: 'TECH_STACK',
};

/**
 * An INFERRED claim is halved before it reaches the scorer.
 *
 * The schema already caps inference confidence at 80, but a scorer that
 * treats "we think they need this" the same as "they wrote that they need
 * this" will rank guesses alongside facts. Halving keeps inferences
 * useful for ordering without letting them outrank evidence.
 */
export function effectiveConfidence(observation: Observation): number {
  if (observation.classification === 'OBSERVED') return observation.confidence;
  if (observation.classification === 'INFERRED') return Math.floor(observation.confidence / 2);
  return 0;
}

export interface ToRowsInput {
  leadId: string;
  companyId?: string | null;
  observedAt?: Date;
}

/** Rows to insert. UNKNOWN claims are excluded — see the module note. */
export function toResearchRows(
  research: LeadResearch,
  { leadId, companyId = null, observedAt = new Date() }: ToRowsInput,
): readonly LeadResearchRow[] {
  return allObservations(research)
    .filter((observation) => observation.classification !== 'UNKNOWN')
    .filter((observation) => observation.value !== null)
    .map((observation) => ({
      leadId,
      companyId,
      kind: FIELD_KIND[observation.field] ?? 'WEBSITE',
      signal: observation.value as string,
      sourceUrl: observation.evidence[0]?.sourceUrl ?? null,
      confidence: effectiveConfidence(observation),
      weight: 0, // the scorer derives weight from kind + confidence
      observedAt,
    }));
}

export interface ResearchRunRecord {
  leadId: string;
  model: string;
  attempts: number;
  repairs: number;
  observedRatio: number;
  gaps: readonly string[];
  recommendedService: string;
  /** The whole validated result, for replay and audit. */
  raw: LeadResearch;
  completedAt: Date;
}

/** The audit record for one research run, stored alongside the rows. */
export function toRunRecord(
  research: LeadResearch,
  meta: { leadId: string; model: string; attempts: number; repairs: number; observedRatio: number },
  completedAt: Date = new Date(),
): ResearchRunRecord {
  return {
    leadId: meta.leadId,
    model: meta.model,
    attempts: meta.attempts,
    repairs: meta.repairs,
    observedRatio: meta.observedRatio,
    gaps: research.gaps,
    recommendedService: research.recommendedService.service,
    raw: research,
    completedAt,
  };
}

/** Persistence boundary, owned by the caller. */
export interface ResearchRepository {
  saveResearch(input: { rows: readonly LeadResearchRow[]; run: ResearchRunRecord }): Promise<void>;
  /** Marks prior findings for this lead as superseded before inserting new ones. */
  supersedePrevious(leadId: string, at: Date): Promise<number>;
}

/**
 * Stores a result: supersede, then insert.
 *
 * In that order and ideally in one transaction — research is append-only,
 * so the old rows must stop counting before the new ones start, or the
 * scorer briefly sees both and double-counts the same company.
 */
export async function storeResearch(
  repository: ResearchRepository,
  research: LeadResearch,
  meta: {
    leadId: string;
    companyId?: string | null;
    model: string;
    attempts: number;
    repairs: number;
    observedRatio: number;
  },
  now: Date = new Date(),
): Promise<{ superseded: number; inserted: number }> {
  const superseded = await repository.supersedePrevious(meta.leadId, now);
  const rows = toResearchRows(research, {
    leadId: meta.leadId,
    companyId: meta.companyId ?? null,
    observedAt: now,
  });
  await repository.saveResearch({ rows, run: toRunRecord(research, meta, now) });
  return { superseded, inserted: rows.length };
}
