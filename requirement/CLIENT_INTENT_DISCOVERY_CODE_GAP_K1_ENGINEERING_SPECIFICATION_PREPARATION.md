# CLIENT INTENT DISCOVERY — CODE-GAP K-1 — ENGINEERING SPECIFICATION PREPARATION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001
**Date:** 2026-10-02
**Type:** Engineering specification **preparation** (read-only analysis). Not a Product Owner decision, not an audit,
not an implementation plan approval, not an implementation authorization.
**Author role:** Engineering Specification Analyst.

> **No implementation is authorized by this record. PD-1 remains PENDING.**
> This record makes no Product Owner decision and resolves no Product Owner question. Where the decided policy does not
> determine a behavior, the gap is recorded in §9 with the words "Product Owner decision required before
> implementation." Statements labelled **ENGINEERING OBSERVATION** are analyst observations, not decisions.

**Abbreviations** (as in the governing records): K1I-DEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-001;
K1I-AUDIT = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-DEC-CONFORMANCE-AUDIT-001; K1I-Q =
CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-QUESTIONNAIRE-001; K1I-PREP =
CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001; K1-DEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001
(K1-R1..R3); K1-AUDIT = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001; PO-DEC =
CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B); OQ-DEC = OQ-PO-DEC-001 (OQ-3, OQ-7, OQ-11); DEC-003 =
INTENT-INTAKE-PO-DEC-003; CONTRACT-REC = INTENT-SOURCE-PROVIDER-CONTRACT-REC-001; ADAPTER-REC =
INTENT-SOURCE-ADAPTER-IMPL-REC-001; REQ-001 = canonical requirement.

**Numbering note.** E-1..E-13 in this record follow the task's specification areas. They are **not** the E-1..E-14
numbering of K1I-PREP §6 that K1I-DEC §10 cites. Mapping:

| This record | K1I-PREP §6 item(s) |
|---|---|
| E-1 Domain canonicalization | E-1, E-11 (not required), E-12 (not contemplated) |
| E-2 Related domains | — (K1-I2 consequence) |
| E-3 Email detection | E-2, E-3, E-5, E-6, E-8 (mailto) |
| E-4 Phone detection | E-7, E-8 (tel / sms) |
| E-5 Obfuscated identifiers | E-2, E-7 |
| E-6 Incomplete identifiers | E-2, E-7 |
| E-7 Uncertain-string threshold | E-2, E-7 |
| E-8 K1-I5 lifecycle screening | E-9 (field traversal part) |
| E-9 Rejection propagation | E-9 |
| E-10 Processing order | E-9, E-10 |
| E-11 Multiple identifiers | E-4 |
| E-12 Rejection reason | E-13 |
| E-13 Tests | E-14 |

---

## §1 Purpose

Engineering preparation only. This record:

- translates K1-B, K1-R1..R3 and K1-I1..K1-I6 into implementable technical semantics;
- records where the current code stands relative to that policy;
- separates engineering choices (§10) from Product Owner dependencies (§9).

It modifies no code, test, schema, migration, API, UI, requirement, decision or audit.

## §2 Baseline (verified before writing)

| Item | Value | Matches K1I-AUDIT §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |
| Target file / record ID pre-existence | Neither existed | — |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| K1I-DEC (PO decision) | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes (K1I-AUDIT §2) |
| K1I-AUDIT (conformance audit) | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` | n/a (latest record; no prior recorded value) |
| K1I-Q (questionnaire) | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` | Yes |
| K1I-PREP (preparation record) | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes |
| K1-DEC (K1 residual decision) | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT (K1 residual audit) | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q (residual questionnaire) | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| K1-PREP (residual preparation) | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes (K1-AUDIT §2) |
| PO-DEC (K1-B) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 (canonical requirement) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 (`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md`) | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

**Baseline: PASS.**

## §3 Governing Product Owner policy (quoted; not expanded)

Starting rules (unchanged):
- **K1-B:** "An evidence item whose free-text quote contains a personal contact identifier is rejected." (PO-DEC §2)
- **K1-R1:** identifiers in scope are "Email addresses and phone numbers in any form, including `mailto:`, `tel:` and
  `sms:` references"; business = an email whose domain is the "same normalized domain as the business website domain
  that identifies the attributed organization under OQ-7"; "Every other email address and **every phone number**" =
  personal; public availability irrelevant. Operational: "An item with no attributed organization is already not a
  Client Intent Signal … so no classification arises for it." (K1-DEC §3)
- **K1-R2:** a name alone is not a ground; quotes verbatim, never masked. (K1-DEC §4)
- **K1-R3:** K1-B is part of the OQ-3 item 4 privacy screen; failure → `REJECTED`. (K1-DEC §5)

| Policy | Product Owner decision (K1I-DEC; wording condensed from the record) |
|---|---|
| K1-I1 (§3) | Identical website host → business. "Subdomain of that host → business" at any depth. "Parent host → personal." "Sibling or any other host → personal." "No registrable-domain equivalence." Website identity / OQ-7 normalization unchanged. |
| K1-I2 (§4) | A domain "neither the attributed organization's normalized website host nor a subdomain of it" is personal, "whether the relationship is established or merely claimed": alternate / additional, alias, country-code / TLD variant, parent-company, sister, affiliate; a relationship asserted in the evidence text "does not change the classification". |
| K1-I3 (§5) | "Any rendering that conveys a complete email address or phone number" is in scope. A "fragment from which no complete email address or phone number can be read (e.g. `jane@`, `@gmail.com`, a phone number with digits masked by the source) is not, by itself, a ground". Undetermined (e.g. `jane@gmail`) → K1-I4. |
| K1-I4 (§6) | "When a string within K1-B scope (K1-I5) plausibly is a phone number or email address and the system cannot establish that it is **not** one, it is treated as a **personal** contact identifier and the item is `REJECTED`." No new outcome. A string established as not an identifier ("evidently a date, price, amount or labelled reference number") causes no rejection. "What counts as 'plausibly' and 'established' is an engineering specification matter." |
| K1-I5 (§7) | (1) Evidence statements always in scope. (2) Other free text "is in scope if the system persists it, displays it to a user, or passes it beyond the privacy screen as part of the signal, event or outcome". (3) Transient free text not screened; an identifier there "must not be extracted, stored, displayed or used". (4) Structured fields / metadata unchanged (existing CONTRACT-REC §3 screen). |
| K1-I6 (§8) | "The whole provider result — the source item — becomes `REJECTED`." Other entries not evaluated into signals. Not broader: other results in the batch, objects from other source items, and future results are unaffected. "Evidence item" = provider result, for K1-B only. |

K1I-AUDIT findings carried as inputs (not resolved here): I3-F2 (phone "complete" undefined), I4-F3 (threshold
policy-weighted), I5-F4 ("used" wording), I6-F6 (I4 × I6 amplification).

---

## §4 Existing implementation findings (IMPLEMENTATION FACT; no governance status)

### 4.A Current privacy screening

| # | Location | Function | Input | Behavior | Rejection | Timing | Unit |
|---|---|---|---|---|---|---|---|
| S1 | `packages/core-research/src/intentSourceProviderContract.ts:278–295` | `screenProviderKeys` | whole provider result (recursive) | Rejects keys in `PROVIDER_PROHIBITED_KEYS` (`:221–267`) and system-assigned keys; for every key **not** in `FREE_TEXT_KEYS` (`:272`: `title`, `snippet`, `body`, `statement`, `evidence`, `basis`) calls `checkIdentifier` | throws `IntentSignalValidationError(path, 'not-allowed', …)` | first step of `prepare` (`:582`), **before** normalization / mapping | per provider result |
| S2 | same file `:298–303` | `checkIdentifier` | one string value | `isPersonalContactIdentifier(value)` → reject. Also called for `externalId` (`:361`) and every http URL (`:309`) | `'not-allowed'` | inside S1 / `checkCommon` / `checkHttpUrl` | per provider result |
| S3 | `packages/core-research/src/intentSignal.ts:91–96` | `isPersonalContactIdentifier` | one string | `PERSONAL_EMAIL_PATTERN = /[^\s@/]+@[^\s@/]+\.[^\s@/]+/` (unanchored, non-global, `test` only) **or** `/^\s*(mailto\|tel\|sms):/i` (string start only). No domain classification; no phone-value detection | boolean | — | — |
| S4 | `intentSignal.ts:123–129` | `validateAuthorizationEvidence` | `businessId` | S3 → reject | `'not-allowed'` | FIRST_PARTY evidence validation | per result (provider) / per signal (intake) |
| S5 | `packages/core-research/src/intentSource.ts:204–221` | `screenPersonalData` (adapter-level) | raw record and adapter candidate | keys only (`PROHIBITED_PERSONAL_DATA_KEYS`, `:167–199`); no value scan | `'not-allowed'` | inside `normalizeIntentEvent` (`:263`, `:267`) | per event |
| S6 | `intentSource.ts:232–247` | `checkReference` | each signal `sourceReference` | rejects click/tracking query params | `'not-allowed'` | inside `normalizeIntentEvent` | per event |

Free text (evidence statements, title, snippet, body, basis) is **not** value-scanned anywhere (CONTRACT-REC §6 item 4).
The existing test `intentSourceProviderContract.test.ts:578–582` asserts that a business email in a notice body is
accepted ("known limitation: free text is not PII-scanned").

### 4.B Domain handling

| Concern | Location | Behavior |
|---|---|---|
| Website normalization | `packages/core-discovery/src/normalize.ts:15–35` `normalizeDomain` | trim; prepend `https://` if no scheme; WHATWG `new URL(...).hostname` (drops scheme, port, path, query, fragment, userinfo; IDN → punycode A-label; lower-cases ASCII); `.toLowerCase()`; strip one trailing `.`; strip one leading `www.`; empty / unparsable → `null` |
| Candidate normalization | `normalize.ts:43–52` `normalizeCandidate` | name + `normalizeDomain(website)`; null → skip |
| Identity matching | `apps/worker/src/searchWorker/intentIntake.ts:107–115` | `normalizeCandidate` then `companies.findOrCreateByDomain(userId, normalized)`; null domain → `IntentSignalValidationError('website','invalid')` at P3 |
| Provider-level website use | `intentSourceProviderContract.ts:366–373` `hasIdentity` | only non-blank `name` and `website`; **website not normalized at provider level** |
| Subdomain / public suffix | — | none exists; no public-suffix data or library in the repository |
| Package dependency | `packages/core-research/package.json` | `@acos/core-discovery` is already a dependency (reuse of `normalizeDomain` needs no new dependency) |

### 4.C Evidence lifecycle

```text
IntentProviderResult (caller-supplied; or parsed from OD-13 verified bytes: providerAuthenticity.ts:335–339)
  → prepare(): screenProviderKeys (S1) → [bindVerifiedIdentity] → family prepare:
       checkCommon, type, URL, sourceText = title+snippet | title+body (transient),
       NO_INTENT_EVIDENCE skip, requirement + checkVerbatim per entry, UNATTRIBUTED skip,
       build adapter raw record (excerpt / interests[].statement / requirements[].text, org name+website, context)
  → normalizeIntentEvent(): S5, adapter.normalize, S5, S6, build intake (quote = evidence), toIntentIntakeInput
  → ProviderResultOutcome NORMALIZED { event, notes }      (normalizeWith :743–781)
  → normalizeProviderBatch: in-batch dedupe by eventId     (:789–803)
  → ingress P3: deps.intake(owner.userId, outcome.event.intake)   (apps/web/src/server/intentIngress.ts:132)
  → recordIntentIntakeForOwner: toIntentIntakeInput, requireExactProviderResultForIntake (X1 re-derivation of the
    verified bytes), findOrCreateByDomain (Company), Prospect, saveSignals in one transaction, Research (if needed),
    runPostResearchPipelineForOwner (Opportunity)   (intentIntake.ts:93–145)
  → display: opportunities/[id]/page.tsx:163 renders source.sourceQuote
  → downstream: core-opportunity/src/adapters.ts:130 reads row.signal and sourceQuote (offer / scoring path)
```

Only `event.intake` reaches persistence. `event.context`, `event.externalId`, `notes` (provenance, publication,
authorization status) live on the outcome only (CONTRACT-REC §4, §6 item 3). Ingress logs `externalId`, `field`,
`reason` only and returns generic responses (`intentIngress.ts:122–127`).

### 4.D Rejection object

| Concept | Code object |
|---|---|
| Provider result / source item | `IntentProviderResult` = `PublicWebSearchProviderResult` \| `AiPlatformProviderSignal` \| `PublicIntentProviderNotice` (`intentSourceProviderContract.ts:98–191`) |
| Evidence entry | `ProviderIntentEvidence` (`intentEvidence` / `intentEvidence[]`), `AiPlatformEvidenceItem` (`evidence[]`) |
| Event | `NormalizedIntentEvent` (`intentSource.ts:156–164`); one result → at most one event |
| Signal | `NormalizedIntentSignal` / `IntentSignalEntry` → `research_signals` + `research_signal_sources` rows |
| Opportunity | created by `runPostResearchPipelineForOwner` after persistence |
| Batch | `normalizeProviderBatch(results)` → `ProviderResultOutcome[]` |
| Rejection status | `ProviderResultOutcome` `{ status: 'REJECTED', externalId, field, reason, message }` (`:207–213`); produced by catching `IntentSignalValidationError` in `normalizeWith` (`:769–779`). Not persisted. |

Today, any failure inside `prepare` or `normalizeIntentEvent` rejects the **whole provider result** (code comment
`:439`, "Any defect rejects the whole result"; test `:514`). Other batch members are unaffected (`:794–802`; test
`:224`). Intake (`toIntentIntakeInput`) also rejects the whole intake event before any write (ADAPTER-REC §4).

### 4.E Identifier utilities

| Kind | Existing utility | Notes |
|---|---|---|
| Email | `PERSONAL_EMAIL_PATTERN` (S3) | detection only, boolean, first match; module-private constant |
| `mailto:` / `tel:` / `sms:` | S3 second regex | string start only |
| URL | `new URL` in `checkHttpUrl` (`:305–319`), `checkReference`, `normalizeDomain` | — |
| Phone value | **none** in core-research | only phone-named keys (S1/S5) and `tel:` |
| Phone (other package) | `packages/core-payments/src/schemas.ts:22` `phoneRegex = /^\+?[1-9]\d{7,14}$/` | module-private; anchored **input validator** for a customer-supplied phone field (8–15 digits, E.164-style, no spaces); not a detector |
| Obfuscation / Unicode normalization | **none** | — |
| Phone / PSL libraries | **none** in any `package.json` | — |

---

## §5 Engineering specification

Common constraint for all items: detection operates on a **read-only copy** of the text. The quote itself is never
altered, masked, stripped or rewritten (K1-R2; CONTRACT-REC §3). Nothing detected is stored, logged or returned
(K1-I5 rule 3; OD-11 pattern).

### E-1 — Domain canonicalization

**Specification.**
1. **Website host `W`.** `W = normalizeDomain(business.website)` (existing function, F-1 / OQ-7). No additional
   normalization of the website. `W = null` → there is no business domain for this item (see 6).
2. **Email domain `D`.** Take the substring after the last `@` of a detected email (E-3), apply the E-3 boundary trim,
   then `D = normalizeDomain(domainText)`. Reusing the same function gives K1-R1's "same normalized domain" on both
   sides. It yields: lower case; trailing dot removed; IDN → punycode A-label (WHATWG host parser); leading `www.`
   removed. Ports and schemes do not occur in email domains; if present the URL parser drops them or fails.
3. **Comparison (label-boundary, exact strings):**
   - `D === W` → business (K1-I1 rule 1);
   - `D.endsWith('.' + W)` → business (K1-I1 rule 2, any depth);
   - anything else → personal (K1-I1 rules 3–4; K1-I2).
4. **Prohibited:** registrable-domain / public-suffix reduction, suffix match without the `.` boundary, DNS, redirects,
   company-name similarity, any lookup (K1-I1 rule 5; OQ-7 item 3; K1I-DEC §3 non-decisions).
5. `D = null` (domain text unparsable by the URL parser) → the domain cannot be classified → K1-I3 rule 3 → K1-I4 →
   personal.
6. `W = null` → no email can satisfy rule 3, so every email is personal. **ENGINEERING OBSERVATION:** such an item
   already fails at P3 (`website … must resolve to a usable domain`). Rejecting it earlier changes only the reported
   stage and label, not whether anything is persisted.

**Case table** (expected results under K1-I1 / K1-I2):

| Website → `W` | Email → `D` | Result |
|---|---|---|
| `https://www.acme.com/` → `acme.com` | `x@ACME.COM.` → `acme.com` | business |
| `acme.com` | `x@mail.acme.com` | business |
| `shop.acme.com` | `x@acme.com` | personal (parent) |
| `shop.acme.com` | `x@mail.acme.com` | personal (sibling) |
| `acme.com` | `x@notacme.com` | personal (no label boundary) |
| `acme.com` | `x@acme.com.evil.io` | personal |
| `acme.com` | `x@acme.co.in` | personal |
| `bücher.de` → `xn--bcher-kva.de` | `x@bücher.de` → `xn--bcher-kva.de` | business |

**`www` edge (ENGINEERING OBSERVATION).** Stripping a leading `www.` from `D` cannot change any result except in a
website whose host itself begins `www.www.` (normalized `W = www.<x>`). No existing convention covers that case;
applying the existing function to both sides is the literal reading of "same normalized domain".

### E-2 — Related domains

**Specification.** The comparison set is exactly `{W}` plus its subdomains (E-1). No data structure, contract field,
configuration, table, list or lookup of "related", "alias", "parent-company", "sister", "affiliate" or country-code
variant domains is created. Any such domain falls into E-1 step 3 "anything else" → personal. A relationship stated in
the evidence text is not parsed or used. No organizational-domain discovery of any kind.

### E-3 — Email detection

**What counts as an email (detection) — separate from classification (E-1).**
1. **Reuse** the character classes of `PERSONAL_EMAIL_PATTERN` (`[^\s@/]+@[^\s@/]+\.[^\s@/]+`). For free-text
   scanning a **global** (all-matches) variant is required because the current `test` returns only the first match and
   no domain. Engineering form: export a matcher from `intentSignal.ts` that reuses the same pattern source; the
   boolean `isPersonalContactIdentifier` behavior for structured fields stays unchanged (K1-I5 rule 4).
2. **Boundaries:** trim from the domain end any of `. , ; : ! ? ) ] } > " '` and closing quotes; trim from the local
   start any of `( [ { < " '` and opening quotes; a leading `mailto:` in the local part is irrelevant because
   classification uses the domain only.
3. **Multiple emails:** every match in the text is detected and classified independently (E-11).
4. **Local part:** not interpreted. Case, dots, plus-addressing (`jane+rfp@…`), role vs individual: no classification
   effect (K1-R1 is domain-based).
5. **Case:** domain lower-cased by E-1; local part untouched.
6. **`mailto:` anywhere in free text:** the address inside is an email and is classified by domain (K1-R1 rule 1–2).
   `mailto:` with no address → fragment (E-6).
7. **Unicode:** detection runs on an NFKC-normalized copy, so full-width `＠` / `．` are recognized. The quote is not
   changed.
8. **Out of scope:** messaging handles / social profiles (e.g. `@acmecorp` with no adjacent local part) — K1-R1 "What
   this decision does NOT decide". They are not email candidates.

### E-4 — Phone detection

**Policy fixed:** every phone number is personal (K1-R1 rule 3). Detection decides only "is this a phone number"; no
business / personal classification of phones exists.

**Specification (deterministic pipeline on the NFKC copy):**
1. **`tel:` / `sms:` anywhere in free text** → phone → personal (K1-R1 rule 1). With no number after it → fragment.
2. **Candidate run:** maximal sequence matching: optional `+`, then digits, where consecutive digits may be separated
   by at most a fixed small number of separator characters from the set { space, `-`, `.`, `(`, `)`, `/`, `·`, `•`,
   `_` } (inserted-character renderings, K1-I3 rule 1). Letters end a run, except an extension marker (`ext`,
   `extn`, `x`, `#`) followed by digits, which attaches the extension to the preceding run.
3. **Digit-word conversion** (E-5): consecutive single-digit number words become digits before step 2.
4. **Established non-phone exclusions** (step 5 of E-7) are applied to each run.
5. **Plausible-phone test** on the remaining runs: digit count of the run excluding the extension compared against
   the bound fixed in §9 PG-1. Upper limit: more than 15 digits (excluding extension) is not an E.164 number
   (ITU-T E.164 technical maximum) and is not a phone run.

**Unresolved engineering questions with policy weight** (listed for §9, not answered): minimum digit count; local
numbers without area code (e.g. `555-0100`, 7 digits — used as a telephone value in the existing test
`intentSourceProviderContract.test.ts:547`); national numbers without country code (`98765 43210`); extension alone
(`ext. 204`); unformatted bare digit runs (CONTRACT-REC §6 item 4, EG-CR-4). See PG-1.

**Formats with no policy weight (engineering):** `+` and country codes, parentheses, separators, Indian / international
grouping, extensions attached to a number — all accepted as one run.

**Known false-positive sources** handled by E-7 step 5: dates, times, currency amounts, comma-grouped numbers,
percentages, version strings, labelled reference numbers.

### E-5 — Obfuscated identifiers

**Email (K1-I3 rule 1).** On the NFKC copy, recognize the at-token and dot-token variants and rebuild a candidate
address for **classification only**:
- at-tokens: `@`; `[at]`, `(at)`, `{at}`, `<at>`, case-insensitive, with optional surrounding spaces; the bare word
  `at` **only** when the remainder forms `label (dot-token label)+`; ` @ ` with spaces on both sides;
- dot-tokens: `.`; `[dot]`, `(dot)`, `{dot}`, `<dot>`; the bare word `dot` between labels.
- Example: `jane [at] gmail [dot] com` → `jane@gmail.com` → personal; `info (at) acme (dot) com` with `W = acme.com` →
  business.

**Phone.** Single-digit number words `zero`/`oh`/`o` (only between other digit words), `one` … `nine`, and
multipliers `double` / `triple` followed by a digit word or digit, become digits, then E-4 applies.

**Documented detection limitations** (policy unchanged; these renderings remain in scope but may be missed):
- compound number words (`forty-three`, `twenty one`);
- keypad / vanity letters (`1-800-FLOWERS`);
- letters inserted between digits (`98765abc43210`);
- images, homoglyphs not unified by NFKC, languages other than English for number or at / dot words;
- arbitrary novel obfuscation schemes.

### E-6 — Incomplete identifiers (K1-I3 rule 2)

Deterministic fragment tests; a fragment is **not** a rejection ground by itself:

| Form | Test | Status |
|---|---|---|
| `jane@` | at-token with empty or missing domain label | fragment |
| `@gmail.com` (no adjacent local part) | at-token with empty local part | fragment (also handle-shaped, E-3 item 8) |
| `mailto:` / `tel:` / `sms:` with nothing after | scheme with empty target | fragment |
| masked phone (`98XXX XX210`, `+91 98765 4****`) | candidate run containing mask characters `X`, `x`, `*`, `•`, `#` in digit positions | fragment |
| `jane@gmail` (adjacent local and domain, no dot-token) | complete-shape check fails, but not empty | **undetermined → K1-I4** (named in K1-I3 rule 3) |

### E-7 — Uncertain-string threshold (K1-I4)

**Deterministic test (structure).** For each in-scope string (E-8):
1. Detect complete emails (E-3, E-5) → classify (E-1).
2. Detect complete phones (E-4, E-5) → personal.
3. Detect fragments (E-6) → no ground.
4. Remaining **email-shaped** residues (`local@label` without dot-token; spaced ` @ ` forms without dot-token) →
   "plausible email, not established as non-email" → personal → `REJECTED`.
5. Remaining **digit runs** → apply exclusions; a run is "established not a phone" if **any** recognizer matches:
   - **date / time:** ISO `yyyy-mm-dd`; `dd/mm/yyyy`, `dd-mm-yyyy`, `dd.mm.yyyy` with valid ranges; a 4-digit year
     1900–2100 standing alone; `hh:mm`;
   - **price / amount:** preceded by a currency symbol or code (`₹`, `$`, `€`, `£`, `Rs`, `INR`, `USD`, …) or
     followed by an amount unit (`lakh`, `crore`, `k`, `m`, `bn`, `%`); comma-grouped numbers (Western or Indian
     grouping); decimals;
   - **labelled reference number:** immediately preceded by a fixed label list (`No.`, `Ref`, `Reference`, `ID`,
     `RFP`, `Tender`, `Bid`, `Invoice`, `Order`, `Case`, `Ticket`, `GST`, `CIN`, …) — the list is an engineering
     artifact, enumerated and tested;
   - **version / structural:** `v1.2.3`-style versions; IPv4 dotted quads.
6. Remaining runs that meet the **plausible-phone bound** → personal → `REJECTED`. Remaining runs below the bound →
   no ground.

**Policy gap.** Steps 1–5 follow from K1-I3, K1-I4's stated examples and existing technical standards. Step 6's
bound — the **minimum digit count** and whether **unformatted bare digit runs** count — cannot be derived from any
record or existing detection convention. It decides which strings cause rejection (K1I-AUDIT I3-F2, I4-F3). The only
existing repository convention (`core-payments` `phoneRegex`, 8–15 digits) is an input validator for a different
purpose; adopting it would declare 7-digit local numbers non-phones. **POLICY GAP — DO NOT IMPLEMENT** step 6 until
§9 PG-1 is answered. No probability score or confidence threshold is proposed.

### E-8 — K1-I5 lifecycle screening

Specification: build the screened text set per family from §6. Evidence statements are scanned in all cases. Fields
classed "transient" are never scanned and never passed to any detector output, log or message. Structured fields keep
S1/S2 unchanged. §6 gives the full matrix; open rows are PG-2 and PG-3.

### E-9 — Rejection propagation (K1-I6)

**Specification.** On any K1-B trigger, throw `IntentSignalValidationError(field, 'not-allowed', <fixed message>)`
from inside `prepare` (provider contract). The existing `normalizeWith` catch converts it to
`ProviderResultOutcome { status: 'REJECTED' }` for that one `IntentProviderResult`. Consequences, all via existing
mechanisms (no new code path needed):
- no `NormalizedIntentEvent`, no intake, no signals; other entries of the same result are not evaluated into signals;
- nothing reaches `recordIntentIntakeForOwner` → no Company / Prospect / signal / Opportunity creation or update;
- other results in `normalizeProviderBatch` are mapped independently; a rejected result is not added to the dedupe
  `seen` set, so a later identical result in the batch is evaluated (and rejected) on its own;
- previously persisted rows are never read, deleted or modified (no such code path exists or is added);
- ingress: generic `400 Unprocessable payload`, logger receives `externalId`, `field`, `reason` only.

Mapping is unambiguous for the provider path (§7). The non-provider intake path is PG-4.

### E-10 — Processing order

**Specification** (inside `prepare`, per family):

```text
screenProviderKeys (S1, unchanged)
→ bindVerifiedIdentity (verified path only, unchanged)
→ checkCommon / type / URL / sourceText (transient) / observedAt
→ NO_INTENT_EVIDENCE skip            (no evidence statement → nothing in K1-B scope)
→ per-entry requirement + checkVerbatim (web, notice) / per-item checks + authorization (AI platform)
→ UNATTRIBUTED skip                   (K1-R1 operational: no classification arises without an attributed organization)
→ K1-B screen  ◄── new: needs W from business.website; evidence statements (+ any field PG-2/PG-3 adds)
→ build raw record → normalizeIntentEvent → NORMALIZED
→ normalizeProviderBatch dedupe → ingress P3 → persistence → Opportunity → display
```

- **After attribution:** required by K1-R1 operational text and by E-1 (needs `W`).
- **After verbatim:** engineering choice. A result failing both is `REJECTED` either way; only `field` / `reason` differ
  (K1I-PREP E-10 note).
- **Before** dedupe, event creation, persistence and display: required so that no rejected text is passed on.
- **X1 re-derivation** (`requireExactProviderResultForIntake`) re-runs `normalizeWith`, so it re-applies the same
  check with no extra placement.
- **Adapter-level screen (S5):** no K1-B duplicate is required for the provider path; an optional defense-in-depth copy
  inside `normalizeIntentEvent` would reject the same unit (it is caught by the same `normalizeWith`). Classified
  ENGINEERING; see PG-4 for non-provider callers.

### E-11 — Multiple identifiers (K1-R1 operational: "Any personal contact identifier means the item is rejected")

| Situation | Result |
|---|---|
| several emails, all business (`D` at / below `W`) | accepted (K1-B not triggered) |
| business email + personal email | `REJECTED` |
| any phone (with or without emails) | `REJECTED` |
| several phones | `REJECTED` |
| several evidence statements, one offending | `REJECTED` (whole result, K1-I6) |
| uncertain string + business email | `REJECTED` (K1-I4) |

Scan order (engineering): entries in array order, each left to right; the first trigger determines `field`. No partial
acceptance, no stripping.

### E-12 — Rejection reason

- **Machine-readable:** existing `IntentSignalValidationReason` value `'not-allowed'` (already used for every privacy
  rejection). **No new enum member is required.**
- **Field:** path of the offending in-scope field, e.g. `intentEvidence.evidence`, `intentEvidence[1].evidence`,
  `evidence[0].statement`.
- **Message:** fixed text, e.g. "`<field>` contains a personal contact identifier — evidence must be business-level";
  never echoes the identifier, its domain or the quote (OD-11 pattern; test `:523`).
- **Logging / audit:** unchanged ingress logging (`externalId`, `field`, `reason`). No new log, table or metric.
- **ENGINEERING OBSERVATION:** `'not-allowed'` does not distinguish K1-B from key-screen rejections except by message
  and field. A distinct reason value would change the exported `IntentSignalValidationReason` type (public API of
  `@acos/core-research`) and is not required by any record. If later wanted, it is an engineering implementation
  requirement, not a Product Owner decision.

### E-13 — Tests

Full matrix in §8. Existing test to update (engineering, E-14 of K1I-PREP): `intentSourceProviderContract.test.ts:578`
remains `NORMALIZED` under K1-I5 rule 3 (body is transient) and K1-R1 rule 2 (same domain); only its "known limitation"
title becomes inaccurate.

---

## §6 Field lifecycle matrix (K1-I5)

Legend: **Always** = K1-I5 rule 1; **Rule 2** = screened because retained / displayed / passed on; **Transient** =
rule 3 (not screened; nothing extracted); **Rule 4** = structured / metadata, existing S1/S2 screen only.

| Field (family) | Exists? | Persisted? | Displayed? | Passed onward? | Screen? | Reason |
|---|---|---|---|---|---|---|
| `intentEvidence.evidence` (web) | Yes | Yes → `source_quote`, `research_signals.signal` | Yes (`opportunities/[id]/page.tsx:163`) | Yes (event, intake, offer / scoring via `core-opportunity/adapters.ts:130`) | **Always** | K1-I5 rule 1 |
| `intentEvidence[].evidence` (notice) | Yes | Yes | Yes | Yes | **Always** | rule 1 |
| `evidence[].statement` (AI platform, PUBLISHED and SUPPLIED_TO_US) | Yes | Yes | Yes | Yes | **Always** | rule 1 |
| `title` (web, notice) | Yes | No | No | No — only in transient `sourceText` (`:393`, `:527`) | **Transient** (see PG-3 for verified pushes) | rule 3 |
| `snippet` (web) | Yes | No | No | No | **Transient** (PG-3) | rule 3 |
| `body` (notice / RFP body) | Yes | No | No | No | **Transient** (PG-3) | rule 3 |
| `authorization.basis` (AI platform) | Yes | No (OD-10) | No | No — not in the five carried values; `notes.authorization` is only `PRESENT` / `MISSING` | **Transient** (PG-3) | rule 3 |
| temporary source / verification text (`sourceText`) | Yes (local variable) | No | No | No | **Transient** | rule 3 (OQ-3 item 1 use) |
| fetched source text | **No** — no fetching exists; results are caller-supplied | — | — | — | n/a | — |
| `context.targetCustomer` / `geography` / `service` | Yes (optional) | No | No (no consumer found) | **Yes** — on `NormalizedIntentEvent.context` in the outcome | **Undetermined: PG-2** | free text vs structured not settled |
| `business.name` | Yes | Yes (Company name) | Yes | Yes | **Rule 4** | named identity field (contract "Business-level identity") |
| `business.website` | Yes | Yes (normalized domain) | Yes | Yes | **Rule 4**; also the `W` anchor (E-1) | structured |
| `url` / `sourceReference` / `referenceUrl` | Yes | Yes (`source_url`) | Yes | Yes | **Rule 4** (+ S6 tracking check) | structured |
| `externalId` | Yes | No | No | Yes (outcome, logs) | **Rule 4** | structured |
| `publication.publisher` | Yes | No | No | Yes (`notes`) | **Rule 4** | metadata |
| `provenance.*` | Yes | No | No | Yes (`notes`) | **Rule 4** | metadata |
| `authorization.integrationId` / `businessId` / `reference` | Yes | `businessId`, `integrationId` persisted (0030); `reference` no | No | evidence values yes | **Rule 4** (S2 / S4) | structured |
| `requirement`, `origin`, `derivation`, enums, dates | Yes | some | some | yes | **Rule 4** | structured |

**Temporary quote-verification text.** It is not screened as a storage / display field. Specification: `sourceText`
is used only by `checkVerbatim` (containment). No detector runs over it, nothing is extracted from it, and it never
enters messages, logs, the raw record or the outcome. This satisfies "must not be extracted, stored, displayed or used"
under the evident reading recorded in K1I-AUDIT I5-F4.

**Effective scope today:** evidence statements only, plus PG-2 / PG-3 if answered toward "in scope" (consistent with
K1I-AUDIT I5-F2).

## §7 Rejection-object mapping (K1-I6)

| Policy term | Code object | Where status lives |
|---|---|---|
| provider result = source item = "evidence item" (for K1-B) | one `IntentProviderResult` passed to `normalizeProviderResult` / `normalizeVerifiedProviderResult`, or one element of `normalizeProviderBatch(results)` | `ProviderResultOutcome.status = 'REJECTED'` (in memory; returned to caller; ingress logs `field` / `reason`) |
| evidence entry (not the rejection unit) | `ProviderIntentEvidence` / `AiPlatformEvidenceItem` | none — never individually accepted or rejected |
| event | `NormalizedIntentEvent` | never created for a rejected result |
| Opportunity / Company / Prospect / persisted signals | DB rows via `recordIntentIntakeForOwner` | untouched (not created for the rejected result; existing rows from other results unaffected) |
| batch | `ProviderResultOutcome[]` | other elements unaffected |

**Ambiguity check.** For the provider path the mapping is one-to-one: one `IntentProviderResult` → one
`ProviderResultOutcome` → at most one event. No ambiguity. The intake functions `recordIntentIntakeForOwner` /
`recordIntentSignalForOwner` can also be called with a `RecordIntentIntakeInput` that did not come from a provider
result (exported from `@acos/worker`; today called at runtime only by the ingress after provider normalization). For
such input no "provider result" exists. That is **PG-4**.

## §8 Test matrix (specification only; no test written)

Base fixtures: existing `webFixtures`, `noticeFixtures`, `aiPlatformSignal()`; `W = example.com` unless stated.
"E" = place the string in an evidence statement; "N" = expected outcome.

### Domain

| # | Case | N |
|---|---|---|
| D1 | E: `info@example.com`, website `https://www.example.com` | NORMALIZED |
| D2 | E: `x@mail.example.com` (subdomain) | NORMALIZED |
| D3 | E: `x@a.b.example.com` (depth 2) | NORMALIZED |
| D4 | website `shop.example.com`, E: `x@example.com` (parent) | REJECTED |
| D5 | website `shop.example.com`, E: `x@mail.example.com` (sibling) | REJECTED |
| D6 | E: `x@other.org` (unrelated) | REJECTED |
| D7 | E: `x@example-group.com` (affiliate) | REJECTED |
| D8 | E: `x@example.co.in` (country-code variant) | REJECTED |
| D9 | E: `x@notexample.com` (no label boundary) | REJECTED |
| D10 | E: `x@example.com.evil.io` | REJECTED |
| D11 | E: `x@EXAMPLE.COM.` (case + trailing dot) | NORMALIZED |
| D12 | IDN website and email at same IDN host | NORMALIZED |
| D13 | evidence text "our parent company acme.com" + `x@acme.com` | REJECTED (claimed relationship ignored) |

### Email

| # | Case | N |
|---|---|---|
| M1 | ordinary business email (D1) | NORMALIZED |
| M2 | `jane.doe@gmail.com` | REJECTED |
| M3 | other-company email `buyer@vendor.com` | REJECTED |
| M4 | two business emails | NORMALIZED |
| M5 | business + personal email | REJECTED |
| M6 | `jane+rfp@example.com` | NORMALIZED |
| M7 | `JANE@GMAIL.COM` | REJECTED |
| M8 | `(info@example.com).` / `"info@example.com",` | NORMALIZED (boundaries trimmed) |
| M9 | `mailto:info@example.com` mid-text | NORMALIZED |
| M10 | `mailto:jane@gmail.com` mid-text | REJECTED |
| M11 | full-width `jane＠gmail．com` | REJECTED |
| M12 | `@examplecorp` handle | not an email (no K1-B ground) |

### Phone (rows marked † depend on PG-1 and have no expected value until it is answered)

| # | Case | N |
|---|---|---|
| P1 | `+91 98765 43210` | REJECTED |
| P2 | `+1 (555) 010-0199` | REJECTED |
| P3 | `+91 22 1234 5678 ext. 204` | REJECTED |
| P4 † | local `555-0100` | — |
| P5 † | national without country code `98765 43210` | — |
| P6 | `nine eight seven six five four three two one zero` | REJECTED |
| P7 † | bare digits `9876543210` | — |
| P8 † | extension alone `ext. 204` | — |
| P9 | `tel:+15550100` mid-text | REJECTED |
| P10 | false positives: `2026-10-02`, `₹50,00,000`, `RFP No. 2026/IT/0457`, `v2.3.1`, `25%` | NORMALIZED |
| P11 | 16+ digit run without separators | not a phone (E.164 max) |

### Obfuscation

| # | Case | N |
|---|---|---|
| O1 | `jane [at] gmail [dot] com` | REJECTED |
| O2 | `info (at) example (dot) com` | NORMALIZED (business) |
| O3 | `jane at gmail dot com` | REJECTED |
| O4 | `9-8-7-6-5-4-3-2-1-0` | REJECTED |
| O5 | `double five` / `triple nine` sequences forming a full number | REJECTED |
| O6 | incomplete email `jane@` | NORMALIZED (fragment) |
| O7 | `@gmail.com` | NORMALIZED (fragment) |
| O8 | masked `98XXX XX210` | NORMALIZED (fragment) |
| O9 | "we work at scale" (bare `at` without domain) | NORMALIZED |
| O10 | documented limitations (compound number words, vanity letters) | test asserts current, documented behavior; labelled as limitation |

### Uncertainty

| # | Case | N |
|---|---|---|
| U1 | clearly non-contact text (no `@`, no digit runs) | NORMALIZED |
| U2 † | phone-plausible run not matched by any exclusion | per PG-1 |
| U3 | `jane@gmail` | REJECTED |
| U4 | `info@example` (website `example.com`) | REJECTED (domain unclassifiable) |
| U5 † | ambiguous digits `12345678` with no label | per PG-1 |
| U6 | labelled `Tender ID 12345678` | NORMALIZED |

### Lifecycle

| # | Case | N |
|---|---|---|
| L1 | personal email in evidence statement (each family) | REJECTED |
| L2 | personal email in `title` only | NORMALIZED |
| L3 | personal email in `snippet` only | NORMALIZED |
| L4 | personal phone in notice `body` only (RFP contact line) | NORMALIZED |
| L5 | personal email in `authorization.basis` only | NORMALIZED, subject to PG-3 for verified pushes |
| L6 | transient text never appears in outcome, message, logs, event or intake (assert by value search) | holds |
| L7 † | phone in `context.service` | per PG-2 |
| L8 | email in structured field (`externalId`, `contactRef`) | REJECTED (existing S1/S2, unchanged) |
| L9 | existing test `:578` (business email in body) | NORMALIZED (retitle only) |

### Rejection

| # | Case | N |
|---|---|---|
| R1 | notice with 3 entries, 1 offending | REJECTED; no event; no signals for the other 2 |
| R2 | AI-platform result: FIRST_PARTY clean + PUBLISHED offending | REJECTED whole result (K1I-AUDIT I6-F6 effect) |
| R3 | batch [clean, offending, clean] | [NORMALIZED, REJECTED, NORMALIZED] |
| R4 | batch [offending, identical offending] | both REJECTED (no DUPLICATE_IN_BATCH) |
| R5 | previously persisted signal for same company, then offending result | prior rows unchanged (integration test) |
| R6 | ingress push of offending result | 400 generic; logger meta has no identifier |
| R7 | message never contains the identifier or its domain | holds |
| R8 | unattributed result with personal email in evidence | UNATTRIBUTED (no classification) |
| R9 | verbatim failure + personal email | REJECTED (field per E-10 order) |
| R10 | X1 re-derivation with offending verified result | rejected at P2; never reaches P3 |

## §9 True policy gaps (Product Owner dependencies only)

### PG-1 — Phone plausibility / completeness bound (K1-I3 rule 2 boundary; K1-I4 "plausibly")

- **Why not engineering-only.** The bound moves strings between "fragment / not a phone" (no rejection) and "phone /
  plausible phone" (rejection). It decides which provider results are rejected. No record defines a complete phone
  number (K1I-AUDIT I3-F2), and the only repository convention (`core-payments` `phoneRegex`, 8–15 digits) is an input
  validator for a different purpose. K1I-DEC §6 delegates "plausibly" to engineering, but K1I-AUDIT I4-F3 records that
  this threshold carries policy weight. The task's governance rule requires recording it rather than choosing it.
- **Exact questions:**
  1. Is a local number without area code (e.g. 7 digits, `555-0100`) a phone number for K1-B?
  2. Is a national number without country code (e.g. 10 digits) a phone number for K1-B?
  3. Is an extension alone (`ext. 204`) a fragment or a phone number?
  4. Are unformatted bare digit runs (no `+`, no separators, no `tel:`), not matched by any exclusion in E-7 step 5,
     plausible phone numbers, and from what digit count (EG-CR-4)?
- Product Owner decision required before implementation.

### PG-2 — Classification of `context.targetCustomer` / `geography` / `service`

- **Why.** These provider-supplied strings are passed beyond the privacy screen on `NormalizedIntentEvent.context`
  (K1-I5 rule 2 trigger). The code treats them as non-free-text (not in `FREE_TEXT_KEYS`; S2 email / scheme check
  only). K1I-AUDIT I5-F2 records the same fact. The two classifications give different results:
  - as **free text** (rule 2): K1-B applies — a phone is rejected, a business email is accepted;
  - as **structured** (rule 4): unchanged — any email (even business) is rejected, a phone is not detected.
- **Exact question:** for K1-I5, are `context.*` values "free text" (rule 2) or "structured fields and metadata"
  (rule 4)?
- Product Owner decision required before implementation.

### PG-3 — Text carried inside the OD-13 verified-result proof

- **Why.** For pushed results, `event.intake.providerAuthenticity` carries an opaque proof whose private state holds the
  exact received bytes, including `title`, `snippet`, `body` and `authorization.basis`
  (`providerAuthenticity.ts:171–179`, `:335–339`). P3 re-parses them only to re-derive the result (X1). Nothing is
  persisted (Q9) or displayed. K1-I5 rule 2 covers text passed "beyond the privacy screen as part of the signal, event
  or outcome". Rule 3 covers text used "only transiently".
  - If carriage inside the proof counts as "passed on", those fields become screened for every pushed result, with
    more rejections.
  - If it does not, they stay transient.
- **Exact question:** is free text held only inside the OD-13 proof, for X1 re-derivation, "passed on" (K1-I5 rule 2)
  or "transient" (rule 3)?
- Product Owner decision required before implementation.

### PG-4 — K1-B for intake input that is not a provider result

- **Why.** K1-I6 defines the K1-B "evidence item" as the provider result. `recordIntentIntakeForOwner` /
  `recordIntentSignalForOwner` (exported; called at runtime today only by the ingress, after provider normalization)
  accept a `RecordIntentIntakeInput` with no provider result behind it. Applying K1-B there would reject the intake
  event, a different object from the one K1-I6 defines. Not applying it leaves that entry point unscreened.
- **Exact question:** does K1-B apply to intake events that do not originate from a provider result, and if so, is the
  intake event (all its signals) the rejection unit?
- Non-blocking for the provider path. Product Owner decision required before implementation **of any K1-B check outside
  the provider contract**.

**Not classified as policy gaps** (engineering-resolvable or already decided): domain canonicalization (E-1); related
domains (decided, K1-I2); email syntax and boundaries (E-3); obfuscation recognizers and their documented limitations
(E-5); email fragments vs `jane@gmail` (decided by K1-I3 examples); exclusion recognizers for dates / prices / amounts /
labelled references (K1-I4 examples; E-7 step 5); check placement and order (E-10; UNATTRIBUTED-first decided by
K1-R1); rejection reason and message (E-12); the I5-F4 "used" wording (no implementation behavior depends on it under
§6's specification).

## §10 Engineering-only decisions (separated from PO policy)

All items below are **ENGINEERING** choices. None changes which results are rejected beyond what K1-B, K1-R1..R3 and
K1-I1..I6 determine, except where marked as dependent on §9.

| # | Engineering choice | Policy it implements |
|---|---|---|
| EN-1 | Reuse `normalizeDomain` for both `W` and `D`; label-boundary suffix comparison | K1-R1 rule 2; K1-I1 |
| EN-2 | No related-domain data or discovery | K1-I2 |
| EN-3 | Global matcher reusing the `PERSONAL_EMAIL_PATTERN` source; boundary trim list; NFKC copy | K1-R1 rule 1; K1-I3 |
| EN-4 | `mailto:` / `tel:` / `sms:` recognized anywhere in in-scope free text | K1-R1 rule 1 |
| EN-5 | Obfuscation token lists; digit-word conversion; documented limitations | K1-I3 rule 1 |
| EN-6 | Fragment tests (empty local / domain / target; mask characters) | K1-I3 rule 2 |
| EN-7 | Exclusion recognizers (date, time, price, amount, labelled reference, version, IPv4) and E.164 15-digit maximum | K1-I4 examples |
| EN-8 | Phone run grammar (separators, extension attachment) | K1-R1 "in any form"; bound pending PG-1 |
| EN-9 | Check placed in provider-contract `prepare`, after UNATTRIBUTED and verbatim checks, before mapping | K1-R3; K1-I6; K1-R1 operational |
| EN-10 | Reject via existing `IntentSignalValidationError` / `'not-allowed'`; fixed, non-echoing message; no new enum | K1-R3; OD-11 pattern |
| EN-11 | First-trigger scan order for `field` reporting | K1-R1 operational ("any") |
| EN-12 | Transient `sourceText` never passed to detectors, logs or outputs | K1-I5 rule 3 |
| EN-13 | Test matrix §8; retitle test `:578` | K1I-PREP E-14 |

**ENGINEERING OBSERVATIONS** (no decision):
- K1I-AUDIT I6-F6: one uncertain string in one entry rejects a whole result, including clean FIRST_PARTY entries. Test
  R2 makes this visible.
- Volume effect remains unknown (EG-1, EG-CR-4).
- The adapter-level screen (S5) needs no K1-B copy for the provider path.

## §11 Implementation authorization

**PD-1 remains PENDING.**

**No implementation is authorized by this record.** Implementing any part of §5 also needs PD-1. Implementing E-4 /
E-7 step 6 needs PG-1, the `context.*` treatment needs PG-2, verified-push free-text treatment needs PG-3, and any
non-provider-path check needs PG-4.

```text
Record type: ENGINEERING SPECIFICATION PREPARATION (read-only)

E-1  Domain canonicalization ........ SPECIFIED
E-2  Related domains ................ SPECIFIED
E-3  Email detection ................ SPECIFIED
E-4  Phone detection ................ SPECIFIED except digit bound (PG-1)
E-5  Obfuscated identifiers ......... SPECIFIED (limitations documented)
E-6  Incomplete identifiers ......... SPECIFIED
E-7  Uncertain-string threshold ..... SPECIFIED steps 1–5; step 6 POLICY GAP (PG-1)
E-8  K1-I5 lifecycle ................ SPECIFIED except context.* (PG-2) and OD-13 proof carriage (PG-3)
E-9  Rejection propagation .......... SPECIFIED (provider path); non-provider intake PG-4
E-10 Processing order ............... SPECIFIED
E-11 Multiple identifiers ........... SPECIFIED
E-12 Rejection reason ............... SPECIFIED (no new enum)
E-13 Tests .......................... SPECIFIED (§8; † rows pending PG-1 / PG-2)

Policy gaps requiring Product Owner decision: PG-1, PG-2, PG-3, PG-4
Product Owner decisions made or modified: NONE
PD-1: PENDING
Implementation authorization: NONE
Validation authority: NONE

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / configuration / API / UI changes: 0
Database connections / writes: 0
Provider calls: 0
External HTTP / research: 0
Participant contact: 0
Commits / pushes: 0
```
