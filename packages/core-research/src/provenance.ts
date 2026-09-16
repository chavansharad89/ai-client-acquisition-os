import type { LeadResearch, Observation, ResearchInput } from './schema';

// Evidence provenance — the check that makes OBSERVED mean something.
// -----------------------------------------------------------------------
// schema.ts enforces that an OBSERVED claim CARRIES evidence: a non-empty
// quote, a syntactically valid URL, a label. It cannot enforce that the
// evidence is REAL, because Zod sees only the model's output and not the
// documents the model was given.
//
// That gap was the whole guarantee. A model could write a fluent sentence
// it never read, attach a plausible URL, mark it OBSERVED, and every
// downstream consumer — the scoring discount, outreach's
// unsupported-evidence check, the operator reading a brief — would treat
// it as a cited fact. The classification was self-reported.
//
// This module closes it by checking the output against the input:
//
//   * the cited URL must be one of the supplied source URLs, and
//   * the quote must actually occur in THAT document's text.
//
// The pairing is deliberate. Checking the two independently would let a
// model cite document A's URL beside document B's sentence, which is
// still a fabricated citation even though both halves exist somewhere.
//
// MATCHING IS EXACT SUBSTRING, NOT FUZZY. Normalisation folds differences
// that HTML-to-text extraction genuinely introduces — line wrapping,
// runs of whitespace, non-breaking spaces, typographic quotes and dashes
// — and nothing else. It is deliberately case-sensitive: "verbatim" is
// the contract, extraction does not change case, and a case difference is
// a sign of retyping rather than quoting. A false rejection costs one
// repair round; a false acceptance is the bug this file exists to stop,
// so every judgement call here is biased toward rejecting.
// -----------------------------------------------------------------------

export type SourceDocument = ResearchInput['sourceDocuments'][number];

/**
 * Shortest quote that can serve as evidence, in normalised characters.
 *
 * Without a floor the check is trivially defeated: the schema permits a
 * one-character quote, and "a" occurs in every document ever written. A
 * citation that short is not evidence of anything in any case, so the
 * floor costs nothing real and closes the bypass.
 */
export const MIN_QUOTE_CHARS = 12;

/**
 * Zero-width characters carry no meaning and survive copy-paste.
 *
 * Written as escapes, not as the characters themselves: a literal
 * U+200B in a character class is invisible in every editor and diff,
 * so nobody can see whether it is still correct.
 */
const ZERO_WIDTH = /[\u200b-\u200d\ufeff]/g;
/** Every Unicode space separator that is not U+0020. */
const UNICODE_SPACES = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g;
/** Typographic single quotes, and the prime often used as an apostrophe. */
const SINGLE_QUOTES = /[\u2018\u2019\u201a\u201b\u2032]/g;
/** Typographic double quotes, and the double prime. */
const DOUBLE_QUOTES = /[\u201c\u201d\u201e\u201f\u2033]/g;
/** Hyphen, figure/en/em dashes, horizontal bar, and the minus sign. */
const DASHES = /[\u2010-\u2015\u2212]/g;

/**
 * Folds formatting noise so a real quote survives extraction, without
 * folding anything that would let a paraphrase through.
 *
 * Every rule below maps a character to the plain-ASCII character it is a
 * typographic variant of, or collapses whitespace. None of them changes
 * which words are present or what order they are in.
 */
export function normaliseForMatch(text: string): string {
  return text
    .normalize('NFC')
    .replace(ZERO_WIDTH, '')
    .replace(/\r\n?/g, '\n')
    .replace(UNICODE_SPACES, ' ')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
    .replace(DASHES, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Trailing slashes are not meaningful; the rest of a URL is. */
function normaliseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export interface ProvenanceIssue {
  /** Dotted path into the research object, e.g. `visibleProblems.0.evidence.0`. */
  path: string;
  message: string;
}

interface PreparedSource {
  label: string;
  url: string;
  normalisedText: string;
}

function prepare(sources: readonly SourceDocument[]): PreparedSource[] {
  return sources.map((doc) => ({
    label: doc.label,
    url: normaliseUrl(doc.url),
    normalisedText: normaliseForMatch(doc.text),
  }));
}

/** Walks every observation in the result, carrying its path. */
function eachObservation(research: LeadResearch): { path: string; observation: Observation }[] {
  const out: { path: string; observation: Observation }[] = [];

  for (const field of ['companySummary', 'businessModel', 'targetCustomers'] as const) {
    out.push({ path: field, observation: research[field] });
  }
  for (const field of [
    'visibleProblems',
    'growthOpportunities',
    'aiOpportunities',
    'websiteIssues',
    'contentOpportunities',
    'automationOpportunities',
  ] as const) {
    research[field].forEach((observation, index) => {
      out.push({ path: `${field}.${index}`, observation });
    });
  }
  return out;
}

/**
 * Checks every OBSERVED claim's evidence against the documents the model
 * was actually given. Returns one issue per failing citation; an empty
 * array means every OBSERVED claim is genuinely cited.
 *
 * INFERRED and UNKNOWN are not inspected here. Their obligations — basis
 * present, no evidence attached, null value, zero confidence — belong to
 * observationSchema and are already enforced before this runs. Repeating
 * them would mean two places to change and two places to disagree.
 */
export function verifyProvenance(
  research: LeadResearch,
  sources: readonly SourceDocument[],
): ProvenanceIssue[] {
  const prepared = prepare(sources);
  const issues: ProvenanceIssue[] = [];

  for (const { path, observation } of eachObservation(research)) {
    if (observation.classification !== 'OBSERVED') continue;

    if (observation.evidence.length === 0) {
      // observationSchema already rejects this, so reaching it means the
      // two checks disagree. Report rather than pass silently.
      issues.push({
        path: `${path}.evidence`,
        message: 'OBSERVED requires at least one quote with a source URL',
      });
      continue;
    }

    observation.evidence.forEach((evidence, index) => {
      const at = `${path}.evidence.${index}`;
      const quote = normaliseForMatch(evidence.quote);

      if (quote.length < MIN_QUOTE_CHARS) {
        issues.push({
          path: `${at}.quote`,
          message:
            `quote is too short to be evidence (${quote.length} characters, minimum ` +
            `${MIN_QUOTE_CHARS}) — quote a full phrase from the document, or classify ` +
            `this claim INFERRED or UNKNOWN`,
        });
        return;
      }

      const citedUrl = normaliseUrl(evidence.sourceUrl);
      const cited = prepared.find((doc) => doc.url === citedUrl);

      if (!cited) {
        issues.push({
          path: `${at}.sourceUrl`,
          message:
            prepared.length === 0
              ? 'no source documents were supplied, so nothing can be OBSERVED — classify this claim UNKNOWN'
              : `sourceUrl "${evidence.sourceUrl}" is not one of the supplied source documents ` +
                `(supplied: ${prepared.map((doc) => doc.url).join(', ')}) — you may only cite ` +
                `documents you were given`,
        });
        return;
      }

      if (cited.normalisedText.includes(quote)) return;

      // The quote is absent from the document it was attributed to. Say
      // whether it came from a different supplied document, because
      // "you cited the wrong one" and "you made this up" are different
      // mistakes and the model can only fix the one it is told about.
      const elsewhere = prepared.find(
        (doc) => doc.url !== cited.url && doc.normalisedText.includes(quote),
      );

      issues.push({
        path: `${at}.quote`,
        message: elsewhere
          ? `this quote does not appear in "${cited.label}" (${cited.url}) — it appears in ` +
            `"${elsewhere.label}" (${elsewhere.url}). Cite the document the text came from.`
          : `this quote does not appear in any supplied source document. Evidence must be text ` +
            `copied verbatim from a document you were given — if you cannot copy it, the claim ` +
            `is INFERRED or UNKNOWN, not OBSERVED.`,
      });
    });
  }

  return issues;
}

/** Renders issues in the same `path: message` shape schema errors use. */
export function formatProvenanceIssues(issues: readonly ProvenanceIssue[]): string[] {
  return issues.map((issue) => `${issue.path}: ${issue.message}`);
}
