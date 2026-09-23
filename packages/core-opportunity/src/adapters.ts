import {
  SOURCE_WEIGHT,
  type ResearchSignal as OfferSignal,
  type ResearchSourceKind,
  type ServiceRule,
} from '@acos/core-acquisition';
import type { StoredResearchSignal } from '@acos/core-research';
import type { ServiceProfileFields } from '@acos/core-service-profile';

// Pure adapters onto @acos/core-acquisition's existing, unmodified
// offer.ts `suggestOffers()` — PRD V2.1 "no replacement scoring
// framework is introduced" applies equally to the offer engine: this
// package adapts persisted shapes onto its contract, it does not
// reimplement need/offer detection itself. Mirrors
// @acos/core-research's scoringAdapter.ts.
// -----------------------------------------------------------------------

const VALID_TRIGGER_KINDS = new Set<string>(Object.keys(SOURCE_WEIGHT));

function isResearchSourceKind(value: string): value is ResearchSourceKind {
  return VALID_TRIGGER_KINDS.has(value);
}

/**
 * Adapts one caller's ServiceProfile snapshot (as retained, immutably,
 * on their Search — DEC-007) onto `suggestOffers()`'s `ServiceRule`
 * contract, replacing offer.ts's generic `DEFAULT_SERVICE_RULES` with
 * the actual service the caller sells.
 *
 * `typicalValuePaise` derives from `minProjectValuePaise` at this
 * boundary — ServiceProfileFields deliberately does not carry a
 * separate typical-value field (see @acos/core-service-profile's
 * types.ts).
 *
 * `triggers` is filtered to the fixed `ResearchSourceKind` vocabulary:
 * `service_profiles.triggers` is stored as unconstrained text (OQ-4 —
 * how the field is derived is not decided), so a value outside the
 * eight kinds `suggestOffers()` understands is dropped here rather than
 * passed through.
 */
export function toServiceRule(fields: ServiceProfileFields): ServiceRule {
  return {
    service: fields.service,
    triggers: fields.triggers.filter(isResearchSourceKind),
    keywords: fields.keywords,
    typicalValuePaise: fields.minProjectValuePaise,
    rationale: fields.rationale,
  };
}

/**
 * Business identity needed by R-70 — deliberately the minimal shape
 * (not the full StoredCompany), so this module stays decoupled from
 * @acos/core-discovery's persistence type.
 */
export interface SourceBusinessIdentity {
  name: string;
}

// ---- R-70 (source-to-business attribution) -----------------------------
// requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md's Goregaon Sports
// Club / heydrop.me case: the fetched homepage was for a different,
// identifiable business, and the research model's own output already
// said so in plain text — nothing downstream read it. This block is the
// downstream reader.
//
// Deliberately NOT "the cited quote must contain the company's own
// name" — the overwhelming majority of genuine evidence (e.g. "no
// pricing page", "hiring a content writer") never restates the
// business's own name, so that rule would reject real, correctly-
// attributed evidence far more often than it catches a real defect.
// Instead this detects the narrower, positive signal the actual
// incident exhibits: evidence text that itself SELF-IDENTIFIES a named
// business — a leading "Company Name. ..." clause, the shape a
// homepage's own byline or a model's company-summary claim naturally
// takes — and checks whether that named business is the one this
// evidence is attached to. Silent on everything else (the default is
// attributable), which is why this does not require a schema change:
// it only acts on a signal that already carries enough evidence to
// judge, and never invents an opinion about ambiguous text.
// -----------------------------------------------------------------------

/** Leading self-identification clause: 1-4 Title-Cased words immediately
 *  followed by ". " — e.g. "HeyDrop. " or "Business B. ". Ordinary
 *  sentence-initial capitalization ("Our website...", "They are...")
 *  never matches: every captured word must itself start with a capital
 *  letter, not just the first. */
const LEADING_SELF_ID = /^((?:[A-Z][A-Za-z0-9&'-]*\s*){1,4})\.\s/;

function selfIdentifiedBusiness(text: string): string | null {
  const match = LEADING_SELF_ID.exec(text.trim());
  return match ? match[1]!.trim() : null;
}

/** First alphabetic word of a business name with length >= 3 — short
 *  legal suffixes/initials ("Co", "A", "Ltd") are excluded as too
 *  generic to serve as a reliable identity anchor on their own. */
function primaryNameToken(name: string): string | null {
  for (const word of name.trim().toLowerCase().split(/\s+/)) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= 3) return cleaned;
  }
  return null;
}

/** True when `text` self-identifies as a named business that is not the
 *  target — a positive, narrow mismatch signal, not the absence of a
 *  match. */
function conflictsWithBusiness(text: string, companyToken: string | null): boolean {
  if (!companyToken) return false;
  const identified = selfIdentifiedBusiness(text);
  if (!identified) return false;
  return !identified.toLowerCase().includes(companyToken);
}

/**
 * R-70: true when any evidentiary (non-UNKNOWN) signal for this
 * Prospect self-identifies as a different, named business. A single
 * reliable mismatch taints the whole evidence set for this Prospect —
 * the underlying defect (the wrong page was fetched at Discovery/
 * Research time, a Phase 18 boundary this document does not touch) is a
 * property of the SOURCE, not of any one claim drawn from it.
 */
function hasConflictingSource(
  stored: readonly StoredResearchSignal[],
  companyToken: string | null,
): boolean {
  return stored.some((row) => {
    if (row.classification === 'UNKNOWN' || row.signal === null) return false;
    const texts = [row.signal, ...row.sources.map((source) => source.sourceQuote)];
    return texts.some((text) => conflictsWithBusiness(text, companyToken));
  });
}

// ---- R-71 (topic-vs-problem relevance) ----------------------------------
// requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md's R-71: a keyword
// substring match must not, by itself, establish a service-relevant
// problem. The research schema (@acos/core-research/src/schema.ts)
// already draws this line structurally, by which field an Observation
// answers: `companySummary`/`businessModel`/`targetCustomers` are
// topical/descriptive ("what is this business"), while every list field
// (visibleProblems, growthOpportunities, aiOpportunities, websiteIssues,
// contentOpportunities, automationOpportunities) is problem/opportunity-
// shaped ("what is wrong or missing"). Reusing that existing structure —
// rather than inventing a new taxonomy or a bigger keyword list — is
// exactly what R-71's own text asks for: distinguishing a signal that
// "merely mentions a topic" from one that "describes a problem", using
// what the research model was already asked to answer, not new
// semantics layered on top of the same keyword match.
// -----------------------------------------------------------------------

const TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers']);

/**
 * Adapts persisted ResearchSignal rows (migration 0016) onto
 * `suggestOffers()`'s `ResearchSignal` input. UNKNOWN rows (signal IS
 * NULL) carry no claim text to match keywords against and are excluded
 * — the same exclusion @acos/core-research's scoringAdapter.ts makes for
 * seven-factor scoring, for the same reason.
 *
 * Confidence is passed through RAW: the inference discount (PRD V2.1
 * "INFERENCE DISCOUNT — CANONICAL FLOW") is reserved for the seven-factor
 * score, not need/offer detection — `suggestOffers()`'s ResearchSignal
 * contract carries no classification field to apply it by.
 *
 * R-70/R-71 (Phase 24): a signal is also excluded when its Prospect's
 * evidence self-identifies as a different business (R-70), or when the
 * signal comes from a purely topical/descriptive field rather than a
 * problem/opportunity field (R-71). Both exclusions apply to OBSERVED
 * and INFERRED alike — neither is a function of `classification`, so
 * Scenario E (whether INFERRED-only evidence is sufficient once it DOES
 * pass these gates) is untouched and remains an open product decision;
 * see requirement/PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md §15.
 */
export function toOfferSignals(
  stored: readonly StoredResearchSignal[],
  company: SourceBusinessIdentity,
): readonly OfferSignal[] {
  const companyToken = primaryNameToken(company.name);
  const sourceConflict = hasConflictingSource(stored, companyToken);

  const signals: OfferSignal[] = [];

  for (const row of stored) {
    if (row.classification === 'UNKNOWN' || row.signal === null) continue;
    if (TOPICAL_FIELDS.has(row.field)) continue; // R-71
    if (sourceConflict) continue; // R-70

    signals.push({
      kind: row.kind,
      signal: row.signal,
      confidence: row.confidence,
      observedAt: row.observedAt,
      supersededAt: row.supersededAt,
    });
  }

  return signals;
}
