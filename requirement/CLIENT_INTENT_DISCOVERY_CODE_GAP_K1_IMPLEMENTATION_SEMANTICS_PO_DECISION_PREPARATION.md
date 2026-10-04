# CLIENT INTENT DISCOVERY — CODE-GAP K-1 IMPLEMENTATION SEMANTICS — PRODUCT OWNER DECISION PREPARATION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001
**Date:** 2026-10-02
**Type:** Product Owner **decision-preparation** record. Not a decision record, not a questionnaire, not an
implementation plan, not an implementation authorization.
**Arises from:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 ("K1-AUDIT") §7 and §8, and
the "What this decision does NOT decide" lists of CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 ("K1-DEC").
**Author role:** governance analyst / decision-preparation author.

> **This record answers, recommends, ranks and selects nothing, and infers no Product Owner preference.** Every
> question below is `PENDING`. Material marked `ANALYST PROPOSAL — NOT A DECISION` is an analyst framing only and has
> no governance status.

> **Resolving implementation semantics does not authorize implementation.** PD-1 remains a separate, PENDING Product
> Owner decision.

**Question labels.** New questions use the namespace **K1-I1 … K1-I6**. K1-R1/R2/R3 (decided) and K1-A..K1-D (K-1
answer alternatives) are not reused.

**Abbreviations:**

| Short form | Record ID / file |
|---|---|
| K1-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 |
| K1-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 |
| K1-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-QUESTIONNAIRE-001 |
| K1-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-PREP-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B) |
| CONF-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 |
| RECON-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-RECON-001 |
| OQ-DEC | OQ-PO-DEC-001 (`CLIENT_INTENT_DISCOVERY_OQ_DECISION.md`): OQ-3, OQ-7, OQ-11 |
| DEC-003 | INTENT-INTAKE-PO-DEC-003 (`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md`) |
| CONTRACT-REC | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| ADAPTER-REC | INTENT-SOURCE-ADAPTER-IMPL-REC-001 |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical) |
| READINESS-001 | CLIENT-INTENT-DISCOVERY-PROVIDER-NEUTRAL-MVP-READINESS-001 |

---

## §0 Baseline (verified before writing)

| Item | Value | Matches K1-AUDIT §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes (plus K1-AUDIT itself, created after its own baseline) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes (K1-AUDIT §2) |
| K1-AUDIT | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | n/a (first recorded here) |
| K1-Q | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| K1-PREP | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| CODE-GAP-PO-QUESTIONNAIRE-001 (original K-1 questionnaire) | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` | Yes |
| PO-DEC (original K-1 decision) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| CONF-AUDIT | `2697ac30b550e8f4f300f0d92310f87b9212e110b676155533577d48a93db93a` | Yes |
| RECON-001 | `192df548aa8d71ffdb033648301a1ebd1fb727ba4a928cfb5028d9baa3b84939` | Yes |
| REQ-001 | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` | Yes (K1-DEC §2) |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes (K1-DEC §2) |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes (K1-DEC §2) |

Code files cited (read only; sha256 at HEAD, unmodified):

| File | sha256 |
|---|---|
| `packages/core-discovery/src/normalize.ts` | `e9fe465eee72e10eb42fb465f9a2b3fcad01f65af5ec4aeb413988563f4c5ca4` |
| `packages/core-research/src/intentSignal.ts` | `90db6d7d1e2a6b46ee81a96adc94e9d84928f7b94fc55f9783ce54e6b6b784ca` |
| `packages/core-research/src/intentSourceProviderContract.ts` | `313607c89efeefb35e0eaafd56b035294731f86e0cdffbbf593b1579c309fa5d` |
| `packages/core-research/src/intentSource.ts` | `0ef099cfd658db1a9007976c8f2e43891f59e2ceb49b8b883693875f1e9355cc` |
| `packages/core-research/src/intentSourceProviderContract.test.ts` | `d33606f6436b9e649b08b59e665fad891a258c6389310e4afad01a8a4d25b6c6` |

Record search: no existing record in `requirement/` decides subdomain, registrable-domain, public-suffix, alias,
affiliate / sister-company, redirect or internationalized-domain semantics, or defines phone-number or email
detection formats. (Searched for subdomain, registrable, public suffix, punycode, internationalized, alias, parent
company, sister, affiliate, phone, digit, E.164, extension.)

**Baseline: PASS.**

---

## §1 Scope

K-1 **implementation semantics** only: what remains unresolved, after K1-R1 / K1-R2 / K1-R3, for applying K1-B to free
text. Specifically:

1. domain matching (email domain vs attributed organization domain);
2. email detection / extraction;
3. phone detection / extraction;
4. application of K1-B within the privacy screen.

Out of scope: PD-1 and every other PD item; S14; contact identifiers other than email / phone (K1-DEC §3); personal
data other than names (K1-DEC §4); display / retention of quotes (R-6.2; PD-11).

---

## §2 Existing policy (decided; not reopened)

**K1-B** (PO-DEC §2): "An evidence item whose free-text quote contains a personal contact identifier is rejected."

**K1-R1** (K1-DEC §3), as recorded:
1. Identifiers in scope: "Email addresses and phone numbers in any form, including `mailto:`, `tel:` and `sms:`
   references."
2. Business contact identifier: "An email address whose domain is the **same normalized domain as the business website
   domain that identifies the attributed organization** under OQ-7", for both role inboxes and individual work
   addresses.
3. Personal contact identifier: "Every other email address and **every phone number**", including consumer / webmail
   domains, "any domain other than the attributed organization's normalized business-website domain (including
   third-party organizations' domains)", and "any phone number, including a publicly listed office or switchboard
   number".
4. "Public availability does not change the classification."

**K1-R2** (K1-DEC §4): a name alone is not a rejection ground; the quote is retained **verbatim** ("Names are not
masked, removed, rewritten or otherwise transformed"); name + personal contact identifier → rejected because of the
identifier.

**K1-R3** (K1-DEC §5): K1-B is part of the existing privacy screen referenced by OQ-3 item 4; failure → OQ-3 item 4
failed → `REJECTED`; no fifth OQ-3 condition.

**Explicit K1-DEC reservations relevant here** (K1-DEC §3 "does NOT decide"): "The technical normalization mechanics,
such as subdomains, aliases, parent / affiliate domains and phone-number detection (including CONTRACT-REC §6.4's
bare-digit-string limitation). Those belong to a future implementation authorization." K1-DEC §5: does not decide
"Where or how the screen is implemented".

**K1-AUDIT observation** (§7): whether "a parent company's or sister brand's domain counts as 'the same' organization
may carry product content". K1-AUDIT §8: implementation "would still require assumptions about email-domain
normalization, subdomains / aliases / affiliate domains, and identifier detection / extraction".

---

## §3 Existing implementation facts (code / records only; no governance status implied)

| # | Fact | Source |
|---|---|---|
| F-1 | Website domain normalization: lower-cased hostname with protocol, leading `www.`, port, path / query / fragment and a trailing dot stripped; unparsable or empty → `null` (no guessed identity). Hostname is taken from the WHATWG `URL` parser. No subdomain reduction, no public-suffix logic, no redirect resolution. | `normalize.ts` `normalizeDomain`; OQ-7 item 1 names "existing `normalizeCandidate` + `findOrCreateByDomain`" |
| F-2 | A provider result carries **one** business identity: `business: { name, website }` or null. No field carries additional / alias / affiliate domains. | CONTRACT-REC §2.1–§2.3 |
| F-3 | Existing email detection: `PERSONAL_EMAIL_PATTERN = /[^\s@/]+@[^\s@/]+\.[^\s@/]+/` (lexical, unanchored); `mailto:` / `tel:` / `sms:` detected only at **string start** (`/^\s*(mailto\|tel\|sms):/i`). | `intentSignal.ts:91–96` `isPersonalContactIdentifier` |
| F-4 | F-3 is applied only to strings **outside** the free-text keys `title`, `snippet`, `body`, `statement`, `evidence`, `basis`. Free text is not scanned. | `intentSourceProviderContract.ts:271–303`; CONTRACT-REC §3, §6 item 4 |
| F-5 | No phone-number value detection exists. Only phone-named keys and `tel:` references are rejected; "A phone number supplied as a bare digit string under a neutral key cannot be told apart from a numeric identifier". | CONTRACT-REC §6 item 4; `intentSource.ts:167–186` |
| F-6 | Violations are "rejected, never stripped"; `REJECTED` is a per-provider-result outcome; "One bad result never aborts the batch". | CONTRACT-REC §2, §3 |
| F-7 | Verbatim check: each evidence string must be contained (whitespace-collapsed, case-insensitive) in the result's own text (title + snippet, or title + body). | `intentSourceProviderContract.ts:343–353`; CONTRACT-REC §2 |
| F-8 | Persisted text: evidence → `research_signal_sources.source_quote` and `research_signals.signal`. `title`, `snippet`, `body`, `basis` are not persisted as such. | CONTRACT-REC §4; `intentSource.ts:30` |
| F-9 | An AI-platform signal carries `evidence[]` (several statements); a public notice carries `intentEvidence[]` (several verbatim excerpts). One provider result may therefore contain several evidence entries. | CONTRACT-REC §2.2, §2.3 |
| F-10 | Existing test accepts `procurement@college.example.edu` in a notice body whose business website is `https://college.example.edu` (titled "known limitation: free text is not PII-scanned"). The domain is identical to the normalized website domain, so the case is consistent with K1-R1 rule 2. | `intentSourceProviderContract.test.ts:578–582`; fixture `intentSourceProviderFixtures.ts:140–143` |
| F-11 | Two screens exist: the provider-contract screen (`normalizeProviderResult`) and the adapter-level screen (inside `normalizeIntentEvent`). | CONTRACT-REC §3; K1-AUDIT R3-F7 |

---

## §4 Topic audit — decided vs open

### 4.1 Domain matching

| Topic | Existing rule? | Source | Status |
|---|---|---|---|
| Exact domain (identical normalized host) | Yes — business | K1-R1 rule 2 ("same normalized domain"); F-1 | DECIDED |
| Website-side normalization (case, `www.`, trailing dot, port, path) | Yes | OQ-7 item 1 → F-1 | DECIDED |
| Email-side normalization (applying the same canonical form to the email domain) | No record | K1-AUDIT §7 (OPEN) | ENGINEERING (E-1), bounded by K1-R1 "same normalized domain" and by K1-I1 / K1-I2 |
| Subdomain of organization domain (e.g. website `acme.com`, email `x@mail.acme.com`) | No | K1-DEC §3 reservation; K1-AUDIT §7 | **OPEN → K1-I1** |
| Parent domain (e.g. website `shop.acme.com`, email `x@acme.com`) | No | K1-DEC §3 reservation ("parent … domains") | **OPEN → K1-I1** |
| `www` | Yes | F-1 | DECIDED (website side); email side E-1 |
| Country-code domains / public suffixes (e.g. `acme.co.in` vs `acme.com`) | No | — | Folded into K1-I1 (same-registrable-domain question) and K1-I2 (different domains); public-suffix data is E-11 |
| Sister company / affiliate / parent-company **different** domains | No (tension recorded: rule 3 "any domain other than" vs reservation of "aliases, parent / affiliate domains") | K1-DEC §3; K1-AUDIT §7 | **OPEN → K1-I2** |
| Alias / additional business domains of the same organization | No | K1-DEC §3 reservation; F-2 | **OPEN → K1-I2** |
| Third-party organizations' domains (e.g. a consultant's agency) | Yes — personal | K1-R1 rule 3; K1-AUDIT §7 "Not open" | DECIDED |
| Redirects | No record contemplates redirect resolution; anchor is "supplied by the source" (OQ-7 item 1); resolving redirects would require external HTTP | OQ-7 item 1; F-1 | NOT A PO QUESTION under current records (E-12) |
| Case / trailing-dot normalization | Yes (website); technical on email side | F-1 | DECIDED / E-1 |
| Internationalized domains | Website side: WHATWG `URL` hostname form (F-1). Email side: unspecified | F-1 | ENGINEERING (E-1) — comparison in one canonical form changes no policy |
| Multiple business domains per organization | Contract carries one website (F-2) | F-2 | **OPEN → K1-I2** |

### 4.2 Email detection

| Topic | Existing rule? | Status |
|---|---|---|
| Syntactically ordinary address `local@domain.tld` | K1-R1 rule 1 ("Email addresses … in any form") | DECIDED (in scope) |
| `mailto:` references | K1-R1 rule 1 | DECIDED (in scope); detection anywhere in free text is E-8 (F-3 only detects at string start) |
| Obfuscated renderings (`jane [at] gmail [dot] com`) | K1-R1 "in any form"; examples given are machine-readable URI forms only | **OPEN → K1-I3** |
| Malformed / partial (`jane@`, `@gmail.com`, `jane@gmail`) | None | **OPEN → K1-I3** |
| Lexical vs parser-based detection | None (F-3 is lexical, implementation only) | ENGINEERING (E-2) |
| Punctuation boundaries (trailing `.`, `,`, `)`, `>`, quotes) | None | ENGINEERING (E-2) |
| Multiple emails in one item | K1-R1 operational: "Any personal contact identifier means the item is rejected" | DECIDED |
| Local-part case, plus-addressing, role vs individual local part | K1-R1 classifies by domain only; rule 2 covers role and individual addresses | DECIDED (irrelevant to classification) |
| Internationalized local parts / domains | Classification by domain (K1-R1) | ENGINEERING (E-1, E-2) |
| Quoted text handling (address inside a quoted sentence) | K1-R2: quote verbatim, never altered | DECIDED (no stripping); detection E-2 |

### 4.3 Phone detection

| Topic | Existing rule? | Status |
|---|---|---|
| Office, switchboard, publicly listed, individual, messaging numbers | K1-R1 rule 3 "every phone number", "any phone number, including a publicly listed office or switchboard number"; K1-AUDIT R1-F5 | DECIDED (personal) |
| International / Indian / country-code / leading `+` / parentheses / spaces / hyphens / extensions | K1-R1 rule 1 "phone numbers in any form" | DECIDED (in scope); recognition is ENGINEERING (E-7) |
| `tel:` / `sms:` references | K1-R1 rule 1 | DECIDED; detection anywhere in free text is E-8 |
| Minimum / maximum digit counts, separator grammar | None | ENGINEERING (E-7), subject to K1-I4 |
| Bare digit strings and other numeric strings that may or may not be phone numbers (tender / reference numbers, dates, prices, IDs) | None. CONTRACT-REC §6 item 4 records they "cannot be told apart"; K1-DEC §3 reserves "phone-number detection (including … bare-digit-string limitation)" | **OPEN → K1-I4** (policy limb only: treatment of undeterminable cases) |
| Numbers spelled in words / obfuscated | K1-R1 "in any form" (same ambiguity as emails) | **OPEN → K1-I3** |

### 4.4 Application of K1-B

| Topic | Existing rule? | Source | Status |
|---|---|---|---|
| Rejection occurs on presence of a personal identifier (no threshold, no stripping, no masking) | Yes | K1-B; K1-R1 operational; K1-R2; CONTRACT-REC §3 | DECIDED |
| Interaction with verbatim retention | Quote never altered; item rejected instead | K1-R2 item 1; CONTRACT-REC §3 | DECIDED |
| Outcome | `REJECTED` via OQ-3 item 4 | K1-R3 | DECIDED |
| Carried by the existing privacy screen | Yes (membership) | K1-R3 | DECIDED |
| Physical placement (provider-contract screen vs adapter screen vs both) | Not decided; "Where or how the screen is implemented" excluded | K1-DEC §5; K1-AUDIT R3-F7 | ARCHITECTURE / ENGINEERING (E-9) |
| Unattributed items | No classification arises (already `UNATTRIBUTED`) | K1-R1 operational; OQ-3 item 2 | DECIDED |
| Identifiers outside free text | CONTRACT-REC §3 unchanged | K1-DEC §3 | DECIDED |
| Which free-text fields are screened | Three differing wordings (see K1-I5) | PO-DEC §2; K1-DEC §3 | **OPEN → K1-I5** |
| Unit of rejection (whole provider result vs a single evidence entry) | Two readable wordings (see K1-I6) | PO-DEC §2; K1-DEC §3; OQ-3 | **OPEN → K1-I6** |
| Ordering of checks (verbatim / attribution / privacy) | None; all failing paths already yield a non-signal outcome | OQ-3 | ENGINEERING (E-10) |
| Rejection message content (must not echo the identifier) | No governing record for free text; existing test pattern for authorization fields | `intentSourceProviderContract.test.ts:531` | ENGINEERING (E-13) |

---

## §5 Open policy questions (Product Owner only)

### K1-I1 — Same-family hosts: subdomain and parent-domain relationship

**Exact decision question.** For K1-R1 rule 2, when an email domain and the attributed organization's normalized
business-website domain are **different hosts where one is a subdomain of the other** (e.g. website `acme.com` with
email `x@mail.acme.com`; or website `shop.acme.com` with email `x@acme.com`), is the email address a business contact
identifier or a personal contact identifier?

**Why unresolved.** K1-R1 rule 2 requires "the same normalized domain". The website-side normalization (F-1) does not
reduce subdomains, so a literal reading gives "personal". But K1-DEC §3 expressly does **not** decide "subdomains, …
parent / affiliate domains", so the literal reading cannot be treated as the decided answer.

**Exact record proving it is unresolved.** K1-DEC §3 "What this decision does NOT decide", bullet 3; K1-AUDIT §7 row 1
and §8 ("Subdomains — DECIDED BUT IMPLEMENTATION DETAIL OPEN … may require product-level clarification").

**Policy consequence.** Determines whether evidence quoting an address at an organization's mail / departmental
subdomain (or at the parent host of a subdomain website) is rejected under K1-B. Effect on evidence volume is unknown
(EG-1).

**Existing governing evidence.** K1-R1 rules 2–3; OQ-7 item 1 (normalized website domain; F-1); OQ-7 item 3 (no
inference from company-name similarity or personal identifiers); DEC-003 §6.

**Existing decided constraints.** Classification never establishes or matches identity (K1-R1 operational; OQ-7
item 3). OQ-7 normalization is unchanged. Third-party domains remain personal (rule 3).

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** This is a policy question, not mechanics, because each
answer changes which items are rejected. A subdomain relationship is structurally determinable from the two strings
without inference; whether a parent-host match is equally acceptable is a separate limb the Product Owner may answer
differently.

**Candidate options.**
- **K1-I1-a** (record-supported reading): identical normalized host only; any subdomain or parent-host difference →
  personal. Source: literal K1-R1 rule 2 + F-1.
- **K1-I1-b** — ANALYST PROPOSAL — NOT A DECISION: an email domain that is a subdomain of the organization domain →
  business; parent host → personal.
- **K1-I1-c** — ANALYST PROPOSAL — NOT A DECISION: subdomain **and** parent host within the same registrable domain →
  business (requires public-suffix knowledge; see E-11).

No option is preferred. The Product Owner may answer in prose.

**Dependencies.** PD-1 (any implementation). EG-1 (volume). E-11 if registrable-domain logic is chosen.

**Implementation consequence.** Implementation must know which host relationships, if any, satisfy "same normalized
domain", and whether a registrable-domain (public-suffix) computation is required.

---

### K1-I2 — Different domains of the same or related organization (aliases, additional domains, parent company, sister brand, affiliate)

**Exact decision question.** For K1-R1, may an email domain that is **not** the attributed organization's normalized
business-website domain (and not in a subdomain relationship with it) ever be a business contact identifier because it
belongs to the same organization (alias / additional domain, other country-code domain) or a related one (parent
company, sister brand, affiliate)? If so, on what source-supplied basis?

**Why unresolved.** K1-R1 rule 3 classifies "addresses at any domain other than the attributed organization's
normalized business-website domain" as personal, yet K1-DEC §3 reserves "aliases, parent / affiliate domains" as
undecided. K1-AUDIT §7 records the item as OPEN and observes it "may carry product content".

**Exact record proving it is unresolved.** K1-DEC §3 "does NOT decide", bullet 3; K1-AUDIT §7 row 1.

**Policy consequence.** Determines rejection of evidence quoting, e.g., `x@acme.co.in` where the website is `acme.com`,
or a group-company address.

**Existing governing evidence.** K1-R1 rule 3; OQ-7 item 1 (identity anchor is "the normalized business website
domain supplied by the source", singular); OQ-7 item 3 ("No probabilistic or inferred matching … company-name
similarity"); F-2 (contract carries one website per result).

**Existing decided constraints.** No inference from company-name similarity (OQ-7 item 3). Any relationship between
domains could therefore only be recognized from data supplied by the source, and the current contract supplies none
(F-2). OQ-7 is not reopened.

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** Under current records, any "yes" answer would require
the source to supply additional domains — a provider-contract change within a future PD-1 scope — and must be
classification-only (never identity or unification, OQ-7).

**Candidate options.**
- **K1-I2-a** (record-supported reading): No — only the single source-supplied domain (subject to K1-I1); every other
  domain is personal (literal K1-R1 rule 3; F-2).
- **K1-I2-b** — ANALYST PROPOSAL — NOT A DECISION: Yes, but only for additional domains explicitly supplied by the
  source as part of the same business identity; never derived by inference.

No option is preferred.

**Dependencies.** PD-1; K1-I1 (subdomain cases excluded here); EG-1.

**Implementation consequence.** Whether the comparison set is exactly one domain or a source-supplied set, and whether a
contract field must exist for it.

---

### K1-I3 — Non-standard renderings of email addresses and phone numbers

**Exact decision question.** For K1-R1 rule 1 ("Email addresses and phone numbers in any form"), do the following count
as contact identifiers for K1-B: (i) **obfuscated** renderings (e.g. `jane [at] gmail [dot] com`, a number written in
words); (ii) **incomplete / malformed** fragments (e.g. `jane@`, `@gmail.com`, `jane@gmail`)?

**Why unresolved.** "In any form" is illustrated only by machine-readable URI forms (`mailto:`, `tel:`, `sms:`). No
record states whether human-obfuscated or incomplete renderings are "forms" of an identifier. Existing detection (F-3)
recognizes neither, and it is an implementation fact without governance status.

**Exact record proving it is unresolved.** K1-DEC §3 (rule 1 wording; "phone-number detection" reserved); K1-AUDIT §7
("Email / contact-identifier extraction from free text — OPEN") and §8.

**Policy consequence.** Whether evidence containing a deliberately obscured or partial contact detail is rejected.

**Existing governing evidence.** K1-R1 rule 1; DEC-003 §6; CONTRACT-REC §3 (F-3).

**Existing decided constraints.** Classification by domain (emails) and "every phone number personal" are unchanged.
No stripping or masking (K1-R2; CONTRACT-REC §3).

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** Limbs (i) and (ii) are distinct; an incomplete
fragment may lack a domain, so K1-R1 rule 2 could not classify it as business in any case.

**Candidate options.** `Options: NONE ESTABLISHED` in governing records. The Product Owner may answer each limb in
prose (e.g. in scope / not in scope).

**Dependencies.** PD-1; interacts with K1-I4 (uncertain cases).

**Implementation consequence.** Defines the recognition target set the detector must cover.

---

### K1-I4 — Treatment of strings that cannot be determined to be (or not to be) a contact identifier

**Exact decision question.** When a free-text string cannot be reliably determined to be a phone number (or email
address) — notably bare digit strings and other numeric sequences such as tender / reference numbers, dates or prices —
is the evidence item rejected (treat as an identifier) or retained (treat as not an identifier)?

**Why unresolved.** CONTRACT-REC §6 item 4 records that a bare digit string "cannot be told apart from a numeric
identifier". K1-DEC §3 reserves "phone-number detection (including CONTRACT-REC §6.4's bare-digit-string limitation)".
No record states which way uncertainty resolves.

**Exact record proving it is unresolved.** K1-DEC §3 "does NOT decide", bullet 3; PO-DEC §2 unresolved item 3; K1-AUDIT
§7 ("Phone-number detection (incl. bare digit strings) — OPEN").

**Policy consequence.** This is the over-rejection vs under-rejection trade-off of a privacy rule: one answer may reject
valid public evidence containing ordinary numbers; the other may retain some phone numbers in persisted quotes
(F-8). Neither consequence can be removed by choice of detection method alone.

**Existing governing evidence.** DEC-003 §6; K1-R1 rule 3; CONTRACT-REC §3, §6 item 4.

**Existing decided constraints.** Every phone number is personal (K1-R1). Reject, never strip (CONTRACT-REC §3;
K1-R2).

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** Only the direction of uncertainty is a Product Owner
matter. Formats, digit counts and libraries are engineering (E-7). The Product Owner may also choose to delegate the
threshold to implementation with a stated direction.

**Candidate options.**
- **K1-I4-a** — ANALYST PROPOSAL — NOT A DECISION: uncertain → treated as identifier (item rejected).
- **K1-I4-b** — ANALYST PROPOSAL — NOT A DECISION: uncertain → not treated as identifier (item retained).
- No record-supported option exists.

**Dependencies.** PD-1; EG-1 (prevalence of numeric strings in real quotes is unknown).

**Implementation consequence.** Sets the default branch for the detector's ambiguous cases and the test expectations
for them.

---

### K1-I5 — Which free-text fields K1-B screens

**Exact decision question.** Does K1-B apply to (a) only the evidence quote(s) persisted as `source_quote` (the
`evidence` / `statement` text), or (b) every free-text field of the provider result (`title`, `snippet`, `body`,
`statement`, `evidence`, `basis`)?

**Why unresolved.** The governing records use three different wordings:
- PO-DEC §2 (K1-B): "whose free-text **quote** contains";
- K1-DEC §3 decision preamble: "applying K1-B to a free-text **evidence field**";
- K1-DEC §3 operational interpretation: "Each email address in the **item's free-text fields**".
The code's free-text set (F-4) includes `basis` (authorization basis, not evidence) and `body` / `snippet` (source text
from which the quote is drawn, not persisted, F-8). No record reconciles these wordings.

**Exact record proving it is unresolved.** PO-DEC §2; K1-DEC §3 (both passages above). Not raised in K1-AUDIT; raised
here as a newly identified ambiguity.

**Policy consequence.** Under (a), a notice whose body lists a contact number outside the extracted quote is retained,
and the number is not persisted (F-8). Under (b), the same notice is rejected. Material effect on public RFP / notice
evidence (CONTRACT-REC §6 item 4 example).

**Existing governing evidence.** PO-DEC §2; K1-DEC §3; OQ-3 item 1 ("statement appears verbatim in the source
evidence"); CONTRACT-REC §3, §4 (F-4, F-8).

**Existing decided constraints.** Identifiers outside free text are already screened (CONTRACT-REC §3, unchanged).
Quote is never altered (K1-R2).

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** Whether `basis` belongs to either set is a sub-limb.

**Candidate options.**
- **K1-I5-a** (record-supported: K1-B wording "quote"; K1-R1 "free-text evidence field"): persisted evidence quote(s)
  only.
- **K1-I5-b** (record-supported: K1-R1 operational "item's free-text fields"; F-4): all free-text fields.
- The Product Owner may state another field set in prose.

**Dependencies.** PD-1; EG-1.

**Implementation consequence.** Defines the exact field list passed to the K1-B check.

---

### K1-I6 — Unit of rejection when one of several evidence entries contains a personal identifier

**Exact decision question.** When a provider result carries several evidence entries (F-9) and only one contains a
personal contact identifier, is (a) the whole provider result `REJECTED`, or (b) only the offending evidence entry
excluded, with the remaining entries evaluated normally?

**Why unresolved.** K1-B rejects "an evidence item"; K1-DEC §3 says the rule is "applied per evidence item" and that
"the item is rejected". "Evidence item" may denote the provider result (OQ-3's "source item"; F-6 per-result
`REJECTED`) or a single evidence entry (F-9). No record defines the term.

**Exact record proving it is unresolved.** PO-DEC §2 (K1-B wording); K1-DEC §3 operational interpretation; OQ-3
("for the source item itself"). No record defines "evidence item".

**Policy consequence.** Whether clean evidence from the same source item survives.

**Existing governing evidence.** OQ-3 (conditions apply "for the source item itself"; outcome `REJECTED`); K1-R3
(failure → OQ-3 item 4 failed → `REJECTED`); CONTRACT-REC §2 (F-6).

**Existing decided constraints.** OQ-3 text unchanged; reject, never strip.

**Analyst interpretation — ANALYST PROPOSAL — NOT A DECISION.** OQ-3's "source item" and K1-R3's use of the `REJECTED`
outcome (which exists only per provider result, F-6) lean toward (a); this is an interpretation, not a governing
statement, so the question is presented.

**Candidate options.**
- **K1-I6-a** (record-supported reading: OQ-3 "source item"; F-6): whole provider result rejected.
- **K1-I6-b** — ANALYST PROPOSAL — NOT A DECISION: offending entry excluded; other entries evaluated.

**Dependencies.** PD-1; K1-I5 (field scope).

**Implementation consequence.** Whether the check returns a result-level outcome or filters entries, and which tests
apply.

---

## §6 Engineering questions (no Product Owner decision required)

Each is implementable under existing policy plus the answers to K1-I1..K1-I6. None is elevated.

| # | Question | Governing bound | Why not a PO question |
|---|---|---|---|
| E-1 | Normalizing the email domain into the same canonical form as F-1 (case, trailing dot, `www.`, IDN representation) | K1-R1 "same normalized domain"; must not broaden matching beyond K1-I1 / K1-I2 answers | Representation only; changes no classification |
| E-2 | Email detection method (lexical pattern vs parser vs library), token boundaries and surrounding punctuation, quoted contexts | K1-R1 rule 1; K1-I3; K1-I4 | Method choice; policy set by K1-R1 + K1-I3/I4 |
| E-3 | Local-part handling (case, plus-addressing, role vs individual) | K1-R1 classifies by domain only | No classification effect |
| E-4 | Multiple identifiers in one item | K1-R1 operational ("Any personal contact identifier …") | Already decided: any one suffices |
| E-5 | Extracting the domain from `mailto:` references (incl. query parameters) | K1-R1 rules 1–2 | Parsing only |
| E-6 | Internationalized local parts | K1-R1 (domain-based) | Detection only |
| E-7 | Phone recognition: `+`, country codes, Indian / international formats, separators, parentheses, extensions, digit-count bounds; library vs pattern | K1-R1 "every phone number … in any form"; K1-I4 for ambiguous cases | Scope decided; method is engineering |
| E-8 | Detecting `mailto:` / `tel:` / `sms:` anywhere in free text (F-3 detects only at string start) | K1-R1 rule 1 | Rule already includes them |
| E-9 | Placement of the K1-B check (provider-contract screen, adapter screen, or both) | K1-R3 (must be part of the privacy screen; outcome `REJECTED`) | K1-DEC §5 leaves placement open; architecture, not policy |
| E-10 | Order of checks (verbatim, attribution, privacy) | OQ-3 (all non-signal outcomes) | No change to which items become signals, except the reported outcome label; see note |
| E-11 | Public-suffix data source, if K1-I1-c is chosen | K1-I1 answer; dependency changes need PD-1 scope | Data / library choice |
| E-12 | Redirect resolution | OQ-7 item 1 ("supplied by the source"); no external HTTP authorized | Not contemplated by any record; would need a separate proposal |
| E-13 | Rejection messages not echoing the identifier value | Existing test pattern (`intentSourceProviderContract.test.ts:531`) | Hygiene; no product content |
| E-14 | Updating the existing "free text is not PII-scanned" test (F-10) and adding fixtures | PD-1 scope | Test work; F-10 is already consistent with K1-R1 rule 2 |

Note on E-10: if an item fails both attribution and the privacy screen, the reported outcome (`UNATTRIBUTED` vs
`REJECTED`) depends on order. K1-R1 states no classification arises for unattributed items, which is consistent with
checking attribution first. Neither ordering makes the item a signal; this is recorded as engineering.

**Count: 14 engineering-only items.**

---

## §7 Dependencies

| Dependency | Status (per records) | Relevance |
|---|---|---|
| PD-1 implementation scope / authorization | PENDING (READINESS-001 §9) | Prerequisite to implementing anything here. **Not merged with K1-I1..K1-I6.** |
| EG-1 kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP | Volume effect of K1-I1, K1-I2, K1-I4, K1-I5 |
| PD-2, PD-3, PD-6, PD-8, PD-9 | PENDING | Not affected by these questions; not resolved here |
| S14 applicability (EG-5) | OPEN | Not affected; not resolved here |
| OQ-7 | DECIDED | Bounds K1-I1, K1-I2 (no inference; not reopened) |

---

## §8 Evidence gaps (established only)

| # | Gap | Source |
|---|---|---|
| EG-1 | Kinds and prevalence of personal data (including subdomain addresses, alternate domains and numeric strings) in real quotes | PO-DEC §2; K1-DEC §3, §6; K1-AUDIT §7 |
| EG-CR-4 | Bare digit strings cannot be distinguished from numeric identifiers by the current screen | CONTRACT-REC §6 item 4 |

No other gap is asserted.

---

## §9 Decision protocol

1. **Product Owner only.** Only the Product Owner (or an explicitly delegated Product Owner) answers K1-I1..K1-I6, in a
   separate, explicitly authorized decision round.
2. **No defaults.** An unanswered question remains `PENDING`. A partially answered question remains `PENDING` for its
   unanswered limb. Literal readings listed as "record-supported" options are not defaults.
3. **No ranking.** Options are listed without preference, unless the Product Owner requests ranking.
4. **Prose answers allowed.** Analyst proposals have no status unless the Product Owner adopts them in their own words.
5. **No implementation authorization.** Answers define semantics only. **Resolving implementation semantics does not
   authorize implementation.** PD-1 remains separate.
6. **No reopening.** K1-B, K1-R1, K1-R2, K1-R3, OQ-3, OQ-7, OQ-11 and DEC-003 stand as recorded. An answer that would
   require changing them is out of scope for this round and requires a separate record.

**Next step.** A separate questionnaire-generation step for K1-I1..K1-I6, followed by an explicitly authorized
Product Owner decision round. No questionnaire is created by this record.

---

## Authority and execution counters

```text
Record type: Product Owner decision PREPARATION

Proposed Product Owner questions: 6 (K1-I1..K1-I6) — all PENDING
Engineering-only items: 14 (E-1..E-14)
Topics found already DECIDED and excluded from the question list: see §4 (status DECIDED)

Product Owner decisions made: NONE
Prior K1 decisions changed: NONE
PD-1 decided: NO
Implementation authorization: NONE
Implementation performed: NONE
Validation: NONE
External research: NONE
Provider calls / external HTTP: 0

Files created: 1 (this record)
Existing records modified: 0
Code / test / schema / migration / API / UI / provider-integration changes: 0
Commits / pushes: 0
```
