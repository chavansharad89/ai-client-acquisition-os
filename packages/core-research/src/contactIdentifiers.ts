import { normalizeDomain } from '@acos/core-discovery';

// K1 contact-identifier detector (CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md).
// Implemented exactly per REV-005 §3-§4, under PD-1-A
// (requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_AUTHORITY_PD1_DECISION.md).
// Not exported from the package index.ts (REV-005 §4.1).
//
// C-1 Read-only: this module detects only; it never strips, masks or
// rewrites a value. C-2: no value, substring, offset or quote is ever
// returned — only the ContactIdentifierKind enum values.
//
// NEW-1 (PD-1 preparation §10 disposition, not re-litigated here): §4.6.4's
// "mask-capable `*`/`•` run" is implemented as HOMOGENEOUS-only (a run of
// `*` only, or of `•` only) — the more conservative reading, consistent
// with §4.6.3 treating `*` and `•` as never co-occurring in one run. This
// is a recorded drafting-gap disposition, not a new policy decision.

export type ContactIdentifierKind =
  | 'BUSINESS_EMAIL'
  | 'PERSONAL_EMAIL'
  | 'UNCERTAIN_EMAIL'
  | 'PHONE'
  | 'FRAGMENT';

// ---------------------------------------------------------------------------
// §4.3 Detection copy C
// ---------------------------------------------------------------------------

/** First code point of each contiguous 10-code-point Unicode decimal-digit (Nd) block in common use. */
const DIGIT_BLOCK_STARTS: readonly number[] = [
  0x0030, 0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6,
  0x0d66, 0x0de6, 0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x1090, 0x17e0, 0x1810, 0x1946, 0x19d0, 0x1a80,
  0x1a90, 0x1b50, 0x1bb0, 0x1c40, 0x1c50, 0xa620, 0xa8d0, 0xa900, 0xa9d0, 0xaa50, 0xabf0, 0xff10,
];

function digitValue(cp: number): number | null {
  for (const start of DIGIT_BLOCK_STARTS) {
    if (cp >= start && cp <= start + 9) return cp - start;
  }
  return null;
}

/** §4.3: NFKC; strip every \p{Cf}; map each \p{Nd} outside 0-9 to an ASCII digit; lower-case. */
function buildC(s: string): string {
  const nfkc = s.normalize('NFKC');
  const noFormat = nfkc.replace(/\p{Cf}/gu, '');
  const digitsMapped = noFormat.replace(/\p{Nd}/gu, (ch) => {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x30 && cp <= 0x39) return ch;
    const dv = digitValue(cp);
    return dv === null ? ch : String(dv);
  });
  return digitsMapped.toLowerCase();
}

// ---------------------------------------------------------------------------
// §4.5 Number words -> digits (Step 3), producing C'
// ---------------------------------------------------------------------------

const DIGIT_WORDS: Readonly<Record<string, string>> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
};

function expandNumberWords(c: string): string {
  const raw = c.match(/[a-z]+|[0-9]+|[^a-z0-9]+/g) ?? [];
  type Kind = 'WORD' | 'DIGIT' | 'OTHER';
  const kinds: Kind[] = raw.map((t) => (/^[a-z]+$/.test(t) ? 'WORD' : /^[0-9]+$/.test(t) ? 'DIGIT' : 'OTHER'));
  const out: string[] = [...raw];

  function nextSignificant(i: number): number {
    let j = i + 1;
    while (j < raw.length && kinds[j] === 'OTHER') j++;
    return j;
  }
  function prevSignificant(i: number): number {
    let j = i - 1;
    while (j >= 0 && kinds[j] === 'OTHER') j--;
    return j;
  }
  function isDigitStringAt(i: number): boolean {
    return i >= 0 && i < raw.length && /^[0-9]+$/.test(out[i] ?? '');
  }

  // double <d> / triple <d>
  for (let i = 0; i < raw.length; i++) {
    if (kinds[i] === 'WORD' && (raw[i] === 'double' || raw[i] === 'triple')) {
      const j = nextSignificant(i);
      if (j < raw.length && kinds[j] === 'DIGIT' && raw[j]!.length === 1) {
        const repeat = raw[i] === 'double' ? 2 : 3;
        out[i] = '';
        for (let k = i + 1; k < j; k++) out[k] = '';
        out[j] = raw[j]!.repeat(repeat);
      }
    }
  }

  // plain digit words
  for (let i = 0; i < raw.length; i++) {
    if (kinds[i] === 'WORD' && DIGIT_WORDS[raw[i]!] !== undefined && out[i] === raw[i]) {
      out[i] = DIGIT_WORDS[raw[i]!]!;
    }
  }

  // oh / o between two digit-equivalents (already-converted digit strings on each side)
  for (let i = 0; i < raw.length; i++) {
    if (kinds[i] === 'WORD' && (raw[i] === 'oh' || raw[i] === 'o') && out[i] === raw[i]) {
      const p = prevSignificant(i);
      const n = nextSignificant(i);
      if (isDigitStringAt(p) && isDigitStringAt(n)) out[i] = '0';
    }
  }

  return out.join('');
}

// ---------------------------------------------------------------------------
// §4.2 Domain canonicalization and business-domain classification
// ---------------------------------------------------------------------------

function classifyEmailDomain(domain: string, website: string | null): ContactIdentifierKind {
  const w = website === null ? null : normalizeDomain(website);
  const d = normalizeDomain(domain);
  if (d === null) return 'UNCERTAIN_EMAIL';
  if (w !== null && (d === w || d.endsWith(`.${w}`))) return 'BUSINESS_EMAIL';
  return 'PERSONAL_EMAIL';
}

// ---------------------------------------------------------------------------
// §4.4.3 EMAIL_DOMAIN validation
// ---------------------------------------------------------------------------

function isValidLabel(label: string, finalLabel: boolean): boolean {
  if (label.length < 1 || label.length > 63) return false;
  if (!/^[\p{L}\p{N}-]+$/u.test(label)) return false;
  if (label.startsWith('-') || label.endsWith('-')) return false;
  if (finalLabel) {
    if (/^xn--[a-z0-9-]+$/i.test(label)) return true;
    if (label.length < 2) return false;
    if (!/^\p{L}+$/u.test(label)) return false;
  }
  return true;
}

/** Longest prefix (by label boundary) of `labels` satisfying EMAIL_DOMAIN, or null. */
function longestValidDomainPrefix(labels: readonly string[]): string[] | null {
  for (let end = labels.length; end >= 2; end--) {
    const candidate = labels.slice(0, end);
    if (candidate.reduce((n, l) => n + l.length + 1, -1) > 253) continue;
    let ok = true;
    for (let i = 0; i < candidate.length; i++) {
      if (!isValidLabel(candidate[i]!, i === candidate.length - 1)) {
        ok = false;
        break;
      }
    }
    if (ok) return candidate;
  }
  return null;
}

// ---------------------------------------------------------------------------
// §4.4.1 / §4.4.2 At-signal candidate scanning
// ---------------------------------------------------------------------------

interface EmailCandidate {
  start: number; // index of first char of local-ish search window
  end: number; // index just past the at-signal token (search continues after)
  atStart: number;
  atEnd: number;
  form: 'A1' | 'A2' | 'A3' | 'A4';
}

const AT_LITERAL = '(?:@|\uff20|\ufe6b)';
const AT_BRACKETED = '(?:\\[at\\]|\\(at\\)|\\{at\\}|<at>|\\[@\\]|\\(@\\)|\\{@\\}|<@>)';
const AT_WORD = '(?:at the rate of|at the rate|at-the-rate-of|at-the-rate|at)';

function findAtSignals(c: string): EmailCandidate[] {
  const out: EmailCandidate[] = [];
  const reA1 = new RegExp(AT_LITERAL, 'g');
  // A1: glued literal @ with no surrounding whitespace permitted (whitespace => A2)
  let m: RegExpExecArray | null;
  while ((m = reA1.exec(c))) {
    const atStart = m.index;
    const atEnd = atStart + m[0].length;
    const beforeWs = atStart > 0 && /\s/.test(c[atStart - 1]!);
    const afterWs = atEnd < c.length && /\s/.test(c[atEnd]!);
    out.push({
      start: atStart,
      end: atEnd,
      atStart,
      atEnd,
      form: beforeWs || afterWs ? 'A2' : 'A1',
    });
  }
  // A3: bracketed at-forms, glued or <=3 ws each side
  const reA3 = new RegExp(AT_BRACKETED, 'gi');
  while ((m = reA3.exec(c))) {
    out.push({ start: m.index, end: m.index + m[0].length, atStart: m.index, atEnd: m.index + m[0].length, form: 'A3' });
  }
  // A4: word at-forms, whitespace-delimited whole words
  const reA4 = new RegExp(`(?<![\\p{L}\\p{N}])${AT_WORD}(?![\\p{L}\\p{N}])`, 'giu');
  while ((m = reA4.exec(c))) {
    out.push({ start: m.index, end: m.index + m[0].length, atStart: m.index, atEnd: m.index + m[0].length, form: 'A4' });
  }
  out.sort((a, b) => a.atStart - b.atStart);
  return out;
}

/** Consumes one ⟨DOT⟩ + following label starting at `pos`; returns null if none present. */
function matchDotLabel(c: string, pos: number): { label: string; end: number } | null {
  let i = pos;
  // literal glued dot
  if (c[i] === '.') {
    const after = c[i + 1];
    if (after !== undefined && /\s/.test(after) === false && after !== '.') {
      // glued dot: proceed directly to label (handled below). If glued dot followed by
      // whitespace/end it's sentence punctuation (handled by caller via label-read failure).
    }
  }
  // try literal dot (glued both sides, or whitespace both/before-only) and bracket/word forms
  const patterns: { re: RegExp; wsAllowed: boolean }[] = [
    { re: /^\./, wsAllowed: false },
    { re: /^\[\.\]/, wsAllowed: true },
    { re: /^\(\.\)/, wsAllowed: true },
    { re: /^\{\.\}/, wsAllowed: true },
    { re: /^<\.>/, wsAllowed: true },
    { re: /^\[dot\]/i, wsAllowed: true },
    { re: /^\(dot\)/i, wsAllowed: true },
    { re: /^\{dot\}/i, wsAllowed: true },
    { re: /^<dot>/i, wsAllowed: true },
    { re: /^dot(?![\p{L}\p{N}])/iu, wsAllowed: true },
  ];
  // leading whitespace (<=3) before the dot-form, except plain literal '.' which may have
  // whitespace before only (not glued) per spec ("literal . with whitespace on both sides or before only").
  let wsBefore = 0;
  while (wsBefore < 3 && /\s/.test(c[i + wsBefore] ?? '')) wsBefore++;
  for (const { re, wsAllowed } of patterns) {
    const tryAt = (offset: number) => {
      const slice = c.slice(i + offset);
      const mm = re.exec(slice);
      if (!mm) return null;
      return i + offset + mm[0].length;
    };
    // glued (no leading whitespace)
    let afterDot = tryAt(0);
    if (afterDot !== null) {
      afterDot = consumeWs(c, afterDot, 3);
      const label = readLabel(c, afterDot);
      if (label) return { label: label.text, end: label.end };
      continue;
    }
    if (wsAllowed && wsBefore > 0) {
      afterDot = tryAt(wsBefore);
      if (afterDot !== null) {
        afterDot = consumeWs(c, afterDot, 3);
        const label = readLabel(c, afterDot);
        if (label) return { label: label.text, end: label.end };
      }
    }
  }
  return null;
}

function consumeWs(c: string, pos: number, max: number, report?: (n: number) => void): number {
  let n = 0;
  while (n < max && /\s/.test(c[pos + n] ?? '')) n++;
  if (report) report(n);
  return pos + n;
}

function readLabel(c: string, pos: number): { text: string; end: number } | null {
  const re = /^[\p{L}\p{N}-]+/u;
  const mm = re.exec(c.slice(pos));
  if (!mm || mm[0].length === 0) return null;
  return { text: mm[0], end: pos + mm[0].length };
}

/** Extracts the maximal domain side (§4.4.2) starting at `pos` (first char of first label). */
function extractDomainSide(c: string, pos: number): { labels: string[]; end: number } {
  const labels: string[] = [];
  let cursor = pos;
  const first = readLabel(c, cursor);
  if (!first) return { labels: [], end: pos };
  labels.push(first.text);
  cursor = first.end;
  for (;;) {
    const dotResult = matchDotLabel(c, cursor);
    if (!dotResult) break;
    // Two consecutive dots cannot join labels (gmail..com -> single label gmail): matchDotLabel
    // only succeeds when a label follows, so an empty label between two dots naturally fails
    // and we stop (leaving the second dot unconsumed, ending the domain side at 'gmail').
    labels.push(dotResult.label);
    cursor = dotResult.end;
  }
  return { labels, end: cursor };
}

/** Extracts the maximal local part ending immediately before `atStart` (A1) or preceding whitespace (A2-A4). */
function extractLocal(c: string, atStart: number, form: EmailCandidate['form']): { text: string; start: number } {
  let end = atStart;
  if (form !== 'A1') {
    // skip back over <=3 whitespace permitted before the at-signal
    let ws = 0;
    while (ws < 3 && end > 0 && /\s/.test(c[end - 1]!)) {
      end--;
      ws++;
    }
  }
  const re = /[\p{L}\p{N}._%+'-]/u;
  let start = end;
  while (start > 0 && re.test(c[start - 1]!)) start--;
  let text = c.slice(start, end);
  text = text.replace(/^\.+/, '').replace(/\.+$/, '');
  return { text, start };
}

const PROSE_LOCAL_TOKENS = new Set([
  'available', 'availability', 'visit', 'visiting', 'visited', 'apply', 'applied', 'us', 'online',
  'found', 'find', 'published', 'posted', 'listed', 'hosted', 'live', 'located', 'based', 'held',
  'login', 'register', 'registered', 'submit', 'submitted', 'upload', 'uploaded', 'download',
  'downloaded', 'accessible', 'access', 'here', 'there', 'website', 'site', 'portal', 'page',
  'link', 'details', 'information', 'more', 'now', 'today',
]);

interface EmailResult {
  kind: ContactIdentifierKind | null;
  consumedStart: number;
  consumedEnd: number;
}

function processAtCandidate(c: string, cand: EmailCandidate, website: string | null): EmailResult {
  const local = extractLocal(c, cand.atStart, cand.form);
  // domain side begins after the at-signal and its permitted whitespace
  let domainStart = cand.atEnd;
  if (cand.form !== 'A1') {
    domainStart = consumeWs(c, domainStart, 3);
  }
  const domain = extractDomainSide(c, domainStart);
  const domainText = domain.labels.join('.');

  // E-2 structural guards (A2, A3, A4)
  if (cand.form !== 'A1') {
    const afterDomain = c.slice(domain.end, domain.end + 1);
    const urlGuard =
      (domain.labels[0] ?? '') === 'www' ||
      afterDomain === '/' ||
      (afterDomain === ':' && /[0-9]/.test(c[domain.end + 1] ?? '')) ||
      /:\/\//.test(c.slice(Math.max(0, local.start - 8), cand.atStart)) ||
      /:\/\//.test(local.text);
    if (urlGuard) return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
  }
  if (cand.form === 'A2' || cand.form === 'A4') {
    if (PROSE_LOCAL_TOKENS.has(local.text.toLowerCase())) {
      return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
    }
  }

  // E-3 complete address
  const validPrefix = longestValidDomainPrefix(domain.labels);
  if (validPrefix !== null) {
    if (local.text.length === 0) {
      return { kind: 'FRAGMENT', consumedStart: local.start, consumedEnd: domainStart + validPrefix.join('.').length };
    }
    const kind = classifyEmailDomain(validPrefix.join('.'), website);
    return { kind, consumedStart: local.start, consumedEnd: domainStart + validPrefix.join('.').length };
  }

  // E-4 content guards (only when no valid prefix exists)
  if (domain.labels.length > 0) {
    const guardResult = applyContentGuards(c, domainStart, domain, cand.form);
    if (guardResult) return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
  }
  if (cand.form === 'A2') {
    // handle guard: whitespace before @, a label glued after @, no DOT in domain side
    const wsBeforeAt = /\s/.test(c[cand.atStart - 1] ?? '');
    const gluedAfter = domainStart === cand.atEnd;
    if (wsBeforeAt && gluedAfter && domain.labels.length === 1) {
      return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
    }
  }

  // E-5 uncertainty / fragments
  const domainHasLetter = /\p{L}/u.test(domainText);
  if (local.text.length > 0) {
    if (domain.labels.length === 1 && domainHasLetter) {
      if (cand.form === 'A4') return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
      return { kind: 'UNCERTAIN_EMAIL', consumedStart: local.start, consumedEnd: domain.end };
    }
    if (domain.labels.length >= 2 && domainHasLetter) {
      if (cand.form === 'A4') {
        const finalLabel = domain.labels[domain.labels.length - 1] ?? '';
        if (/\p{L}/u.test(finalLabel)) {
          return { kind: 'UNCERTAIN_EMAIL', consumedStart: local.start, consumedEnd: domain.end };
        }
        return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
      }
      return { kind: 'UNCERTAIN_EMAIL', consumedStart: local.start, consumedEnd: domain.end };
    }
    if (domain.labels.length === 0) {
      return { kind: 'FRAGMENT', consumedStart: local.start, consumedEnd: cand.end };
    }
  }
  // local empty, domain single label or empty -> nothing (E-5)
  return { kind: null, consumedStart: cand.start, consumedEnd: cand.end };
}

function applyContentGuards(
  c: string,
  domainStart: number,
  domain: { labels: string[]; end: number },
  form: EmailCandidate['form'],
): boolean {
  // CG-3: domain side non-empty and every label all digits
  if (domain.labels.length > 0 && domain.labels.every((l) => /^[0-9]+$/.test(l))) return true;
  // CG-4 (A2, A4 only): first domain-side label begins with a digit
  if ((form === 'A2' || form === 'A4') && /^[0-9]/.test(domain.labels[0] ?? '')) return true;
  // CG-1: currency symbol/code right after the at-signal and its permitted whitespace
  const after = c.slice(domainStart);
  if (CURRENCY_PREFIX_RE.test(after)) return true;
  // CG-2: date/time/price/unit/version/IPv4 pattern matches a span of C beginning at domainStart
  if (matchesExclusionAt(c, domainStart)) return true;
  return false;
}

const CURRENCY_SYMBOLS = '₹$€£¥₩₽¢₺₫₦₱₪฿';
const CURRENCY_CODES = ['rs', 'inr', 'usd', 'eur', 'gbp', 'aed', 'sgd', 'aud', 'cad', 'jpy', 'cny', 'rupees', 'rupee', 'dollars', 'euros'];
const CURRENCY_PREFIX_RE = new RegExp(
  `^\\s?(?:[${CURRENCY_SYMBOLS}]|(?:${CURRENCY_CODES.join('|')})(?=[^a-z]|$))`,
  'i',
);

// ---------------------------------------------------------------------------
// §4.8 Exclusion recognizers
// ---------------------------------------------------------------------------

const NUM = String.raw`\d+(?:[.,]\d+)*`;
const RANGE = `${NUM}(?:\\s?(?:-|\u2013|\u2014|to)\\s?${NUM})?`;

const MONTHS =
  '(?:jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)';

const DATE_PATTERNS: RegExp[] = [
  // YYYY<s>MM<s>DD
  /\b(19|20)\d{2}([-./])(0?[1-9]|1[0-2])\2(0?[1-9]|[12]\d|3[01])\b/g,
  // DD<s>MM<s>YYYY
  /\b(0?[1-9]|[12]\d|3[01])([-./])(0?[1-9]|1[0-2])\2(19|20)\d{2}\b/g,
  // MM<s>DD<s>YYYY
  /\b(0?[1-9]|1[0-2])([-./])(0?[1-9]|[12]\d|3[01])\2(19|20)\d{2}\b/g,
  // DD<s>MM<s>YY
  /\b(0?[1-9]|[12]\d|3[01])([-./])(0?[1-9]|1[0-2])\2\d{2}\b/g,
];
const MONTH_NAME_RE = new RegExp(`\\b${MONTHS}\\.?(?:[\\s,.-]{0,2}(\\d{1,2}))?(?:[\\s,.-]{0,2}((?:19|20)\\d{2}))?\\b`, 'gi');
const MONTH_NAME_DAY_FIRST_RE = new RegExp(`\\b(\\d{1,2})[\\s,.-]{0,2}${MONTHS}\\.?(?:[\\s,.-]{0,2}((?:19|20)\\d{2}))?\\b`, 'gi');
const YEAR_RANGE_RE = /\b(?:fy\s?)?(19|20)\d{2}\s?[-\u2013/]\s?(\d{2}|(?:19|20)\d{2})\b/gi;
const TIME_RE = /\b\d{1,2}:\d{2}(?::\d{2})?\s?(?:am|pm)?\b/gi;
const TIME_AMPM_RE = /\b\d{1,2}(?:\.\d{2})?\s?(?:am|pm|hrs)\b/gi;

const PRICE_PREFIX_RE = new RegExp(`(?:[${CURRENCY_SYMBOLS}]\\s?|(?:${CURRENCY_CODES.join('|')})\\.?\\s?)${RANGE}`, 'gi');
const PRICE_SUFFIX_RE = new RegExp(`${RANGE}\\s?(?:${CURRENCY_CODES.join('|')}|/-)`, 'gi');
const THOUSANDS_RE = /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d{1,3},(?:\d{2},)*\d{3}(?:\.\d+)?\b/g;
const SHORT_DECIMAL_RE = /\b\d+\.\d{1,2}\b/g;

const UNIT_SPACED_OR_GLUED = [
  'sq ft', 'sq. ft.', 'sqft', 'sq m', 'sqm', 'mm', 'cm', 'km', 'inch', 'inches', 'ft', 'feet',
  'acre', 'acres', 'hectare', 'hectares', 'mg', 'kg', 'ton', 'tons', 'tonne', 'tonnes', 'lb',
  'lbs', 'ml', 'ltr', 'litre', 'litres', 'liter', 'liters', 'kl', 'kb', 'mb', 'gb', 'tb', 'kw',
  'mw', 'kwh', 'mwh', 'kmph', 'km/h', 'mph', 'pcs', 'seconds', 'minutes', 'hours', 'days',
  'weeks', 'months', 'years', 'lakh', 'lakhs', 'lac', 'lacs', 'crore', 'crores', 'million',
  'billion', 'thousand', '%',
];
const UNIT_GLUED_ONLY = ['mn', 'bn', 'cr', 'm', 'l', 'g', 't', 'w', 'k'];
const UNIT_SPACED_RE = new RegExp(
  `(${RANGE})(\\s?)(${UNIT_SPACED_OR_GLUED.map((u) => u.replace(/[.]/g, '\\.').replace(/\s/g, '\\s')).join('|')})(?![\\p{L}\\p{N}])`,
  'giu',
);
const UNIT_GLUED_RE = new RegExp(`(${RANGE})(${UNIT_GLUED_ONLY.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

const VERSION_RE = /\b(?:v|version|ver\.?|release|build)\s?\d+(?:\.\d+){1,3}\b/gi;
const IPV4_RE = /(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)(?![\d.])/g;

interface Span {
  start: number;
  end: number;
}

function pushSpan(spans: Span[], start: number, end: number) {
  if (end > start) spans.push({ start, end });
}

/** Returns the numeric exclusion spans (§4.8) found anywhere in `text`. */
function computeExclusionSpans(text: string): Span[] {
  const spans: Span[] = [];
  for (const re of DATE_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) pushSpan(spans, m.index, m.index + m[0].length);
  }
  for (const re of [MONTH_NAME_RE, MONTH_NAME_DAY_FIRST_RE, YEAR_RANGE_RE, TIME_RE, TIME_AMPM_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) pushSpan(spans, m.index, m.index + m[0].length);
  }
  for (const re of [PRICE_PREFIX_RE, PRICE_SUFFIX_RE, THOUSANDS_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) pushSpan(spans, m.index, m.index + m[0].length);
  }
  // short decimal: only when not JOIN_NEAR another group
  SHORT_DECIMAL_RE.lastIndex = 0;
  let sm: RegExpExecArray | null;
  while ((sm = SHORT_DECIMAL_RE.exec(text))) {
    if (!joinNearAnotherGroup(text, sm.index, sm.index + sm[0].length)) {
      pushSpan(spans, sm.index, sm.index + sm[0].length);
    }
  }
  for (const re of [UNIT_SPACED_RE, UNIT_GLUED_RE]) {
    re.lastIndex = 0;
    let um: RegExpExecArray | null;
    while ((um = re.exec(text))) {
      const numEnd = um.index + um[1]!.length;
      if (!joinNearAnotherGroup(text, um.index, numEnd)) pushSpan(spans, um.index, numEnd);
    }
  }
  for (const re of [VERSION_RE, IPV4_RE]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) pushSpan(spans, m.index, m.index + m[0].length);
  }
  computeReferenceLabelSpans(text, spans);
  return mergeSpans(spans);
}

function mergeSpans(spans: Span[]): Span[] {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const out: Span[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1]!;
    const cur = sorted[i]!;
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

/** JOIN_NEAR(a,b): groups separated by <=3 chars with no letter/digit (ws run = 1 char). */
function joinNearAnotherGroup(text: string, start: number, end: number): boolean {
  return nearGroupBefore(text, start) || nearGroupAfter(text, end);
}
function nearGroupBefore(text: string, start: number): boolean {
  let i = start - 1;
  let gap = 0;
  while (i >= 0 && gap < 3) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      let j = i;
      while (j >= 0 && /\s/.test(text[j]!)) j--;
      i = j;
      gap += 1;
      continue;
    }
    if (/[a-z]/i.test(ch)) return false;
    if (/[0-9]/.test(ch)) return true;
    i--;
    gap += 1;
  }
  return false;
}
function nearGroupAfter(text: string, end: number): boolean {
  let i = end;
  let gap = 0;
  while (i < text.length && gap < 3) {
    const ch = text[i]!;
    if (/\s/.test(ch)) {
      let j = i;
      while (j < text.length && /\s/.test(text[j]!)) j++;
      i = j;
      gap += 1;
      continue;
    }
    if (/[a-z]/i.test(ch)) return false;
    if (/[0-9]/.test(ch)) return true;
    i++;
    gap += 1;
  }
  return false;
}

function matchesExclusionAt(text: string, pos: number): boolean {
  const spans = computeExclusionSpans(text);
  return spans.some((s) => s.start === pos);
}

// §4.8 item 5: reference-label construction
const CLASS_R_LABELS = ['ref', 'rfp', 'rfq', 'rfi', 'eoi', 'nit', 'invoice', 'inv', 'po', 'sku', 's/n', 'doi', 'reg'];
const CLASS_S_LABELS: { labels: string[]; shape: RegExp }[] = [
  { labels: ['pin', 'pincode', 'pin code', 'postal code'], shape: /^(?:\d{6}|\d{3}\s\d{3})$/ },
  { labels: ['zip', 'zip code'], shape: /^\d{5}(?:-\d{4})?$/ },
  { labels: ['isbn'], shape: /^(?:[\d-]{10,13}|[\d-]{13,17})$/ },
  { labels: ['issn'], shape: /^\d{4}-\d{3}[\dx]$/i },
  { labels: ['gst', 'gstin'], shape: /^\d{2}[a-z]{5}\d{4}[a-z]\d[a-z\d]z[a-z\d]$/i },
  { labels: ['pan'], shape: /^[a-z]{5}\d{4}[a-z]$/i },
  { labels: ['tan'], shape: /^[a-z]{4}\d{5}[a-z]$/i },
  { labels: ['cin'], shape: /^[lu]\d{5}[a-z]{2}\d{4}[a-z]{3}\d{6}$/i },
];
const CLASS_O_LABELS = [
  'tender', 'bid', 'order', 'case', 'ticket', 'part', 'model', 'serial', 'lot', 'batch',
  'contract', 'agreement', 'file', 'application', 'registration', 'account', 'a/c', 'reference',
];
const DESIGNATORS = ['no\\.', 'no', 'number', 'num\\.', '#', 'id', 'ref\\.', 'ref'];

function computeReferenceLabelSpans(text: string, spans: Span[]) {
  const allLabels = [
    ...CLASS_R_LABELS.map((l) => ({ l, cls: 'R' as const })),
    ...CLASS_S_LABELS.flatMap((s) => s.labels.map((l) => ({ l, cls: 'S' as const, shape: s.shape }))),
    ...CLASS_O_LABELS.map((l) => ({ l, cls: 'O' as const })),
  ];
  // Sort longest-label-first so multi-word labels (e.g. "pin code") match before "pin".
  allLabels.sort((a, b) => b.l.length - a.l.length);
  for (const entry of allLabels) {
    const labelPattern = entry.l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s');
    const re = new RegExp(
      `(?<![\\p{L}\\p{N}])(${labelPattern})(?![\\p{L}\\p{N}])(\\s?)(${DESIGNATORS.join('|')})?([\\s:.\\-#/]{0,3})`,
      'giu',
    );
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text))) {
      const designator = m[3];
      const gapT = m[4] ?? '';
      const hasColonOnlyAsConnector = designator === undefined && gapT.includes(':');
      const tokenStart = m.index + m[0].length;
      const tokenMatch = /^[0-9a-z/._-]+/i.exec(text.slice(tokenStart));
      if (!tokenMatch || !/\d/.test(tokenMatch[0])) continue;
      const token = tokenMatch[0];
      const tokenEnd = tokenStart + token.length;
      // number boundary (token completeness): no further digit follows TOKEN within the same raw
      // stretch (before the next letter or consumed span) -- scan forward through non-letter chars.
      let scan = tokenEnd;
      let furtherDigit = false;
      while (scan < text.length && !/\p{L}/u.test(text[scan]!)) {
        if (/\d/.test(text[scan]!)) {
          furtherDigit = true;
          break;
        }
        scan++;
      }
      if (furtherDigit) continue;
      if (designator === undefined && !hasColonOnlyAsConnector && entry.cls !== 'R' && entry.cls !== 'S') continue;
      if (entry.cls === 'O' && designator === undefined) continue; // O requires a lexical designator
      if (entry.cls === 'S') {
        const shape = CLASS_S_LABELS.find((s) => s.labels.includes(entry.l))!.shape;
        if (!shape.test(token)) continue;
      }
      // GAP_L: 0-1 whitespace between LABEL and DESIGNATOR
      if (designator !== undefined && (m[2] ?? '').length > 1) continue;
      pushSpan(spans, tokenStart, tokenEnd);
    }
  }
}

// ---------------------------------------------------------------------------
// §4.6 Phone stretches, masks, mask units, extensions
// ---------------------------------------------------------------------------

/** §4.6.3 emphasis pairing: returns the set of character indices that are matched `*` delimiters. */
function emphasisDelimiterIndices(text: string): Set<number> {
  const matched = new Set<number>();
  const runs: { start: number; end: number }[] = [];
  const re = /\*+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    // not adjacent to a bullet
    if (text[start - 1] === '\u2022' || text[end] === '\u2022') continue;
    runs.push({ start, end });
  }
  const openers: { start: number; end: number; len: number }[] = [];
  for (const run of runs) {
    const before = run.start > 0 ? text[run.start - 1] : undefined;
    const after = run.end < text.length ? text[run.end] : undefined;
    const isOpener =
      (before === undefined || /\s/.test(before) || !/[\p{L}\p{N}]/u.test(before)) &&
      after !== undefined &&
      !/\s/.test(after);
    const isCloser =
      before !== undefined &&
      !/\s/.test(before) &&
      (after === undefined || /\s/.test(after) || !/[\p{L}\p{N}]/u.test(after));
    if (isCloser) {
      let bestIdx = -1;
      for (let i = openers.length - 1; i >= 0; i--) {
        if (openers[i]!.len === run.end - run.start) {
          const between = text.slice(openers[i]!.end, run.start);
          if (!/\n/.test(between)) {
            bestIdx = i;
            break;
          }
        }
      }
      if (bestIdx >= 0) {
        const opener = openers[bestIdx]!;
        for (let i = opener.start; i < opener.end; i++) matched.add(i);
        for (let i = run.start; i < run.end; i++) matched.add(i);
        openers.splice(bestIdx, 1);
        continue;
      }
    }
    if (isOpener) openers.push({ start: run.start, end: run.end, len: run.end - run.start });
  }
  return matched;
}

interface Elem {
  kind: 'group' | 'mask';
  start: number;
  end: number;
  digits?: string; // group
  maskLen?: number; // mask
}

interface GapInfo {
  class: 'fused' | 'inserted' | 'tight' | 'loose';
}

function classifyGap(text: string, gapStart: number, gapEnd: number, leftIsGroup: boolean, rightIsGroup: boolean): GapInfo {
  const gap = text.slice(gapStart, gapEnd);
  if (gap.length === 0) return { class: 'fused' };
  if (leftIsGroup && rightIsGroup && gap.length === 1 && gap !== '\n') return { class: 'inserted' };
  if (leftIsGroup && rightIsGroup && gap.length === 1 && gap === '\n') return { class: 'loose' };
  // whitespace run counts as one character toward the 1-3 budget
  const collapsedLen = gap.replace(/\s+/g, ' ').length;
  const tightCharset = /^(?:[ \t\u00a0\u202f]|[-\u2013\u2014\u2212().])+$/;
  if (collapsedLen <= 3 && tightCharset.test(gap) && !/\n/.test(gap)) return { class: 'tight' };
  return { class: 'loose' };
}

function buildElements(text: string): { elems: Elem[]; gaps: GapInfo[] } {
  const emphasis = emphasisDelimiterIndices(text);
  const elems: Elem[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i]!;
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < text.length && /[0-9]/.test(text[j]!)) j++;
      let start = i;
      if (start > 0 && text[start - 1] === '+') start -= 1;
      elems.push({ kind: 'group', start, end: j, digits: text.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === 'x') {
      let j = i;
      while (j < text.length && text[j] === 'x') j++;
      const len = j - i;
      if (len >= 2) elems.push({ kind: 'mask', start: i, end: j, maskLen: len });
      i = j;
      continue;
    }
    if (ch === '*' || ch === '\u2022') {
      let j = i;
      while (j < text.length && text[j] === ch) j++;
      const len = j - i;
      if (len >= 2) {
        const isEmphasis = ch === '*' && Array.from({ length: len }, (_, k) => i + k).every((idx) => emphasis.has(idx));
        if (!isEmphasis) {
          elems.push({ kind: 'mask', start: i, end: j, maskLen: len });
        }
      }
      i = j;
      continue;
    }
    i++;
  }
  // M-s side condition (b): fused to digit OR fused/tight-adjacent to another mask-capable element on each side.
  const filtered = elems.filter((e, idx) => {
    if (e.kind === 'group') return true;
    const isStar = text[e.start] === '*' || text[e.start] === '\u2022';
    if (!isStar) return true; // M-x always established
    const fusedLeft = e.start > 0 && /[0-9]/.test(text[e.start - 1]!);
    const fusedRight = e.end < text.length && /[0-9]/.test(text[e.end] ?? '');
    if (!fusedLeft && !fusedRight) return false; // (a) must be fused to a digit on >=1 side
    const leftOk =
      fusedLeft ||
      sideHasMaskCapable(elems, idx, 'left', text);
    const rightOk =
      fusedRight ||
      sideHasMaskCapable(elems, idx, 'right', text);
    return leftOk && rightOk;
  });

  const gaps: GapInfo[] = [];
  for (let k = 0; k < filtered.length - 1; k++) {
    const a = filtered[k]!;
    const b = filtered[k + 1]!;
    gaps.push(classifyGap(text, a.end, b.start, a.kind === 'group', b.kind === 'group'));
  }
  return { elems: filtered, gaps };
}

function sideHasMaskCapable(elems: Elem[], idx: number, side: 'left' | 'right', text: string): boolean {
  const neighbor = side === 'left' ? elems[idx - 1] : elems[idx + 1];
  if (!neighbor || neighbor.kind !== 'mask') return false;
  const gapText =
    side === 'left' ? text.slice(neighbor.end, elems[idx]!.start) : text.slice(elems[idx]!.end, neighbor.start);
  const tightCharset = /^(?:[ \t\u00a0\u202f]|[-\u2013\u2014\u2212().])*$/;
  return gapText.length === 0 || (gapText.length <= 3 && tightCharset.test(gapText) && !/\n/.test(gapText));
}

const L_MIN = 6;
const L_MAX = 15;
const L_CVN = 10;

/** §4.7 plausibility on a raw digit count. */
function plausible(n: number, windowDigitCounts?: number[]): boolean {
  if (n >= L_MIN && n <= L_MAX) return true;
  if (n > L_MAX && windowDigitCounts) {
    // sliding window over the ordered group-digit-counts to find a contiguous run summing in [6,15]
    for (let i = 0; i < windowDigitCounts.length; i++) {
      let sum = 0;
      for (let j = i; j < windowDigitCounts.length; j++) {
        sum += windowDigitCounts[j]!;
        if (sum > L_MAX) break;
        if (sum >= L_MIN) return true;
      }
    }
    return false;
  }
  return false;
}

function processPhoneStretch(text: string, entries: ContactIdentifierKind[]): void {
  const { elems, gaps } = buildElements(text);
  if (elems.length === 0) return;

  // group runs (maximal joined sequences, gap != loose)
  const runs: { start: number; end: number }[] = [];
  let runStart = 0;
  for (let i = 0; i < elems.length; i++) {
    const isLast = i === elems.length - 1;
    const breakHere = isLast || gaps[i]!.class === 'loose';
    if (breakHere) {
      runs.push({ start: runStart, end: i });
      runStart = i + 1;
    }
  }

  const unitSpans: Span[] = [];
  for (const run of runs) {
    const runElems = elems.slice(run.start, run.end + 1);
    const runGaps = gaps.slice(run.start, run.end);
    const hasMask = runElems.some((e) => e.kind === 'mask');
    if (!hasMask) continue; // not a unit; left for remainder computation
    unitSpans.push({ start: runElems[0]!.start, end: runElems[runElems.length - 1]!.end });
    const outcome = evaluateUnit(runElems, runGaps);
    if (outcome !== null) entries.push(outcome);
  }

  // remainder pieces: maximal substrings of the phone stretch outside every unit span, with >=1 digit
  const sortedUnits = [...unitSpans].sort((a, b) => a.start - b.start);
  let cursor = 0;
  const remainderRanges: Span[] = [];
  for (const u of sortedUnits) {
    if (u.start > cursor) remainderRanges.push({ start: cursor, end: u.start });
    cursor = Math.max(cursor, u.end);
  }
  if (cursor < text.length) remainderRanges.push({ start: cursor, end: text.length });
  for (const r of remainderRanges) {
    const piece = text.slice(r.start, r.end);
    const digitGroups = piece.match(/\d+/g);
    if (!digitGroups) continue;
    const counts = digitGroups.map((g) => g.length);
    const n = counts.reduce((a, b) => a + b, 0);
    if (plausible(n, counts)) entries.push('PHONE');
  }
}

function evaluateUnit(elems: Elem[], gaps: GapInfo[]): ContactIdentifierKind | null {
  // U1: no digit at all -> nothing
  const totalDigits = elems.filter((e) => e.kind === 'group').reduce((n, e) => n + e.digits!.length, 0);
  if (totalDigits === 0) return null;

  // segments (consecutive groups) and clusters (consecutive masks)
  interface Segment {
    elems: Elem[];
    startIdx: number;
    endIdx: number;
  }
  interface Cluster {
    elems: Elem[];
    startIdx: number;
    endIdx: number;
    length: number;
  }
  const segments: Segment[] = [];
  const clusters: Cluster[] = [];
  let i = 0;
  while (i < elems.length) {
    if (elems[i]!.kind === 'group') {
      let j = i;
      while (j < elems.length && elems[j]!.kind === 'group') j++;
      segments.push({ elems: elems.slice(i, j), startIdx: i, endIdx: j - 1 });
      i = j;
    } else {
      let j = i;
      while (j < elems.length && elems[j]!.kind === 'mask') j++;
      clusters.push({
        elems: elems.slice(i, j),
        startIdx: i,
        endIdx: j - 1,
        length: elems.slice(i, j).reduce((n, e) => n + e.maskLen!, 0),
      });
      i = j;
    }
  }

  function clusterAdjacentTo(cluster: Cluster, side: 'left' | 'right'): Segment | undefined {
    const idx = side === 'left' ? cluster.startIdx - 1 : cluster.endIdx + 1;
    return segments.find((s) => (side === 'left' ? s.endIdx === idx : s.startIdx === idx));
  }
  function segmentAdjacentCluster(seg: Segment, side: 'left' | 'right'): Cluster | undefined {
    const idx = side === 'left' ? seg.startIdx - 1 : seg.endIdx + 1;
    return clusters.find((cl) => (side === 'left' ? cl.endIdx === idx : cl.startIdx === idx));
  }
  function gapBetween(aIdx: number, bIdx: number): GapInfo | undefined {
    return gaps[Math.min(aIdx, bIdx)];
  }
  function digitsOf(seg: Segment): number {
    return seg.elems.reduce((n, e) => n + e.digits!.length, 0);
  }

  // core computation: drop first group if a FUSED cluster touches left; drop last if FUSED touches right
  function core(seg: Segment): Elem[] {
    let core = [...seg.elems];
    const leftCluster = segmentAdjacentCluster(seg, 'left');
    if (leftCluster) {
      const g = gapBetween(leftCluster.endIdx, seg.startIdx);
      if (g?.class === 'fused' && core.length > 0) core = core.slice(1);
    }
    const rightCluster = segmentAdjacentCluster(seg, 'right');
    if (rightCluster) {
      const g = gapBetween(seg.endIdx, rightCluster.startIdx);
      if (g?.class === 'fused' && core.length > 0) core = core.slice(0, -1);
    }
    return core;
  }

  // U2: CVN check across every segment's core
  for (const seg of segments) {
    const coreGroups = core(seg);
    const counts = coreGroups.map((e) => e.digits!.length);
    for (let a = 0; a < counts.length; a++) {
      let sum = 0;
      for (let b = a; b < counts.length; b++) {
        sum += counts[b]!;
        if (sum >= L_CVN && sum <= L_MAX) return 'PHONE';
        if (sum > L_MAX) break;
      }
    }
  }

  // P(unit)
  const pUnit = totalDigits + clusters.reduce((n, c) => n + c.length, 0);
  if (pUnit <= L_MAX) return 'FRAGMENT'; // U3

  // U4
  function mayBind(cluster: Cluster, seg: Segment): boolean {
    return digitsOf(seg) + cluster.length <= L_MAX;
  }
  function isFree(seg: Segment): boolean {
    const leftCluster = segmentAdjacentCluster(seg, 'left');
    const rightCluster = segmentAdjacentCluster(seg, 'right');
    for (const cl of [leftCluster, rightCluster]) {
      if (!cl) continue;
      const side: 'left' | 'right' = cl === leftCluster ? 'left' : 'right';
      const g = side === 'left' ? gapBetween(cl.endIdx, seg.startIdx) : gapBetween(seg.endIdx, cl.startIdx);
      if (g?.class === 'fused' && mayBind(cl, seg)) return false; // (i)
    }
    for (const cl of [leftCluster, rightCluster]) {
      if (!cl) continue;
      if (!mayBind(cl, seg)) continue;
      const otherSeg = clusterAdjacentTo(cl, cl === leftCluster ? 'left' : 'right');
      if (!otherSeg || !mayBind(cl, otherSeg)) return false; // (ii)
    }
    return true;
  }
  for (const seg of segments) {
    if (isFree(seg) && plausible(digitsOf(seg), seg.elems.map((e) => e.digits!.length))) return 'PHONE';
  }
  return 'FRAGMENT';
}

// ---------------------------------------------------------------------------
// §4.6.9 Extensions (applied before mask-unit evaluation, on plain pieces)
// ---------------------------------------------------------------------------

const EXT_MARKER_RE = /\b(ext|extn|extension)[.:]?\s?(\d{1,6})(?!\d)/gi;

function stripExtensions(text: string): { text: string; fragmentOnlyEntries: ContactIdentifierKind[] } {
  let out = text;
  const fragmentOnlyEntries: ContactIdentifierKind[] = [];
  const matches: { index: number; full: string; digits: string }[] = [];
  const re = new RegExp(EXT_MARKER_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    matches.push({ index: m.index, full: m[0], digits: m[2]! });
  }
  // process from the end so indices remain valid as we splice text out
  for (let k = matches.length - 1; k >= 0; k--) {
    const mm = matches[k]!;
    const before = text.slice(Math.max(0, mm.index - 3), mm.index);
    const hasBase = /[0-9](?:[\s,\-(]{0,3})$/.test(before) && /\d/.test(before);
    if (hasBase) {
      // remove extension digits + marker entirely; base judged alone
      out = out.slice(0, mm.index) + out.slice(mm.index + mm.full.length);
    } else {
      // no base: fragment unless >=6 digits (then ordinary phone stretch) -- leave digits in place,
      // just strip the marker word so it doesn't act as a letter-stretch-ender oddly; actually marker
      // IS a letter and legitimately ends stretches, so no special handling needed beyond leaving as-is,
      // except enforce the <6-digit fragment rule directly here since the marker breaks the stretch
      // from anything before it anyway.
      if (mm.digits.length < 6) {
        fragmentOnlyEntries.push('FRAGMENT');
        out = out.slice(0, mm.index) + out.slice(mm.index + mm.full.length);
      }
      // else: leave as-is; ordinary phone-stretch evaluation of the digits will occur naturally.
    }
  }
  return { text: out, fragmentOnlyEntries };
}

// ---------------------------------------------------------------------------
// §4.9 tel: / sms: URIs and mailto:
// ---------------------------------------------------------------------------

const SCHEME_RE = /(?<![\p{L}\p{N}])(mailto|tel|sms):/giu;

interface SchemeMatch {
  start: number;
  end: number; // end of the dial-string / mailto address portion consumed
  scheme: 'mailto' | 'tel' | 'sms';
  bodyStart: number;
}

function findSchemeSpans(c: string): SchemeMatch[] {
  const out: SchemeMatch[] = [];
  const re = new RegExp(SCHEME_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(c))) {
    const scheme = m[1]!.toLowerCase() as 'mailto' | 'tel' | 'sms';
    const bodyStart = m.index + m[0].length;
    out.push({ start: m.index, end: bodyStart, scheme, bodyStart });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main scanning pipeline
// ---------------------------------------------------------------------------

interface ConsumedRange {
  start: number;
  end: number;
}

function detectInC(c: string, website: string | null): ContactIdentifierKind[] {
  const entries: ContactIdentifierKind[] = [];
  const consumed: ConsumedRange[] = [];

  // Step 1: URIs
  for (const sm of findSchemeSpans(c)) {
    if (sm.scheme === 'mailto') {
      let bodyEnd = sm.bodyStart;
      while (bodyEnd < c.length && !/[?#\s]/.test(c[bodyEnd]!)) bodyEnd++;
      const addrList = c.slice(sm.bodyStart, bodyEnd).split(',');
      let cursor = sm.bodyStart;
      for (const addr of addrList) {
        const atIdx = addr.indexOf('@');
        if (atIdx >= 0) {
          const cand: EmailCandidate = {
            start: cursor,
            end: cursor + addr.length,
            atStart: cursor + atIdx,
            atEnd: cursor + atIdx + 1,
            form: 'A1',
          };
          const res = processAtCandidate(c, cand, website);
          if (res.kind) entries.push(res.kind);
        }
        cursor += addr.length + 1;
      }
      consumed.push({ start: sm.start, end: bodyEnd });
    } else {
      // tel: / sms: dial string = raw stretch immediately after the scheme
      let end = sm.bodyStart;
      while (end < c.length && isStretchChar(c, end)) end++;
      const dial = c.slice(sm.bodyStart, end);
      const digitCount = (dial.match(/\d/g) ?? []).length;
      if (digitCount === 0) {
        entries.push('FRAGMENT');
      } else {
        processPhoneStretch(dial, entries);
      }
      consumed.push({ start: sm.start, end });
    }
  }

  // Step 2: emails (at-signal candidates), skipping ranges already consumed by Step 1
  function insideConsumed(pos: number): boolean {
    return consumed.some((r) => pos >= r.start && pos < r.end);
  }
  for (const cand of findAtSignals(c)) {
    if (insideConsumed(cand.atStart)) continue;
    const res = processAtCandidate(c, cand, website);
    if (res.kind) {
      entries.push(res.kind);
      consumed.push({ start: res.consumedStart, end: res.consumedEnd });
    }
  }

  // Build plain pieces (text outside every consumed range), preserving order
  consumed.sort((a, b) => a.start - b.start);
  const merged = mergeRanges(consumed);
  const pieces: string[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) pieces.push(c.slice(cursor, r.start));
    cursor = Math.max(cursor, r.end);
  }
  if (cursor < c.length) pieces.push(c.slice(cursor));

  // Step 3-5 per plain piece
  for (const piece of pieces) {
    const cPrime = expandNumberWords(piece);
    const { text: stripped, fragmentOnlyEntries } = stripExtensions(cPrime);
    entries.push(...fragmentOnlyEntries);
    processPlainPieceForPhones(stripped, entries);
  }

  return entries;
}

function mergeRanges(ranges: ConsumedRange[]): ConsumedRange[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: ConsumedRange[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i++) {
    const last = out[out.length - 1]!;
    const cur = sorted[i]!;
    if (cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else out.push({ ...cur });
  }
  return out;
}

function isStretchChar(text: string, idx: number): boolean {
  const ch = text[idx]!;
  if (ch === 'x') return true; // x runs are never letters
  return !/\p{L}/u.test(ch);
}

/** §4.4 Step 4-5 over a plain (non-email/URI) piece: raw stretches -> exclusions -> phone stretches. */
function processPlainPieceForPhones(text: string, entries: ContactIdentifierKind[]): void {
  // raw stretches: maximal runs with no "letter" (non-x \p{L} char)
  const rawStretches: Span[] = [];
  let i = 0;
  while (i < text.length) {
    if (isStretchChar(text, i)) {
      let j = i;
      while (j < text.length && isStretchChar(text, j)) j++;
      rawStretches.push({ start: i, end: j });
      i = j;
    } else {
      i++;
    }
  }
  if (rawStretches.length === 0) return;

  const exclusionSpans = computeExclusionSpans(text);

  for (const stretch of rawStretches) {
    // subtract exclusion spans overlapping this stretch
    const relevant = exclusionSpans
      .filter((s) => s.start < stretch.end && s.end > stretch.start)
      .map((s) => ({ start: Math.max(s.start, stretch.start), end: Math.min(s.end, stretch.end) }))
      .sort((a, b) => a.start - b.start);
    let cursor = stretch.start;
    const pieces: Span[] = [];
    for (const ex of relevant) {
      if (ex.start > cursor) pieces.push({ start: cursor, end: ex.start });
      cursor = Math.max(cursor, ex.end);
    }
    if (cursor < stretch.end) pieces.push({ start: cursor, end: stretch.end });

    for (const p of pieces) {
      const piece = text.slice(p.start, p.end);
      if (!/\d/.test(piece)) continue;
      processPhoneStretch(piece, entries);
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function detectContactIdentifiers(text: string, website: string | null): readonly ContactIdentifierKind[] {
  const c = buildC(text);
  return detectInC(c, website);
}

export function containsPersonalContactIdentifier(text: string, website: string | null): boolean {
  return detectContactIdentifiers(text, website).some(
    (k) => k === 'PERSONAL_EMAIL' || k === 'UNCERTAIN_EMAIL' || k === 'PHONE',
  );
}

export function containsAnyContactIdentifier(text: string, website: string | null): boolean {
  return detectContactIdentifiers(text, website).some(
    (k) => k === 'BUSINESS_EMAIL' || k === 'PERSONAL_EMAIL' || k === 'UNCERTAIN_EMAIL' || k === 'PHONE',
  );
}
