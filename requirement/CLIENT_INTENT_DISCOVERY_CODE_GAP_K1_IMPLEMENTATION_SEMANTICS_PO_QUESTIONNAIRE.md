# CLIENT INTENT DISCOVERY — CODE-GAP K-1 IMPLEMENTATION SEMANTICS — PRODUCT OWNER DECISION QUESTIONNAIRE

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-QUESTIONNAIRE-001
**Date:** 2026-10-02
**Type:** Product Owner **decision questionnaire** (governance preparation). Not a decision record, not an
implementation plan, not an implementation authorization.
**Direct source:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_IMPLEMENTATION_SEMANTICS_PO_DECISION_PREPARATION.md`, "K1I-PREP").
**Author role:** governance questionnaire author.

> **This questionnaire answers, recommends, ranks and selects nothing, and infers no Product Owner preference.** The
> six questions are reproduced from K1I-PREP §5 without change of meaning. No option has been invented. Material
> labelled `ANALYST PROPOSAL — NOT A DECISION` is reference material from K1I-PREP and carries no approval.

> **Resolving implementation semantics does not authorize implementation.** PD-1 remains separate and PENDING.

Labels used throughout:

| Label | Meaning |
|---|---|
| **GOVERNING FACT** | Text of a governing record, or a code / implementation-record fact cited by K1I-PREP §3. An implementation fact carries no governance status. |
| **EXISTING DECISION** | A Product Owner decision already recorded, quoted. |
| **ANALYST PROPOSAL — NOT A DECISION** | Interpretation or option framed by the K1I-PREP analyst. |
| **RECORD-SUPPORTED OPTION** | An option K1I-PREP derives from the text of an existing record. It is **not a default**. |
| **PRODUCT OWNER ANSWER** | Blank (`NONE`) in this record. |

Abbreviations:

| Short form | Record ID / file |
|---|---|
| K1I-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001 |
| K1-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 |
| K1-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 |
| K1-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-QUESTIONNAIRE-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B) |
| OQ-DEC | OQ-PO-DEC-001 (OQ-3, OQ-7, OQ-11) |
| DEC-003 | INTENT-INTAKE-PO-DEC-003 |
| CONTRACT-REC | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| F-n / E-n / EG-n | Fact, engineering item and evidence-gap numbers of K1I-PREP §3, §6, §8 |

---

## §1 Scope

This questionnaire contains **only** K1-I1, K1-I2, K1-I3, K1-I4, K1-I5 and K1-I6.

Excluded: E-1..E-14 (listed in §8 for reference only); PD-1, PD-2, PD-3, PD-6, PD-8, PD-9; S14; K-1..K-7; K1-R1, K1-R2,
K1-R3; all other decided questions.

## §2 Baseline (verified before writing)

| Item | Value | Matches K1I-PREP §0 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |

| Record | sha256 (verified) | Matches |
|---|---|---|
| K1I-PREP | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes (as created) |
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| K1-PREP (residual) | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| PO-DEC (original K-1 decision) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| CODE-GAP-PO-QUESTIONNAIRE-001 (original K-1 questionnaire) | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` | Yes |
| CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 | `2697ac30b550e8f4f300f0d92310f87b9212e110b676155533577d48a93db93a` | Yes |
| CODE-GAP-RECON-001 | `192df548aa8d71ffdb033648301a1ebd1fb727ba4a928cfb5028d9baa3b84939` | Yes |
| REQ-001 (canonical) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

**Baseline: PASS.**

## §3 Decided starting point (not reconsidered)

- **K1-B** (PO-DEC §2): "An evidence item whose free-text quote contains a personal contact identifier is rejected."
- **K1-R1** (K1-DEC §3): email / phone "in any form, including `mailto:`, `tel:` and `sms:` references" are in scope; an
  email at "the **same normalized domain as the business website domain that identifies the attributed organization**
  under OQ-7" is business; "Every other email address and **every phone number**" is personal; public availability
  does not change classification.
- **K1-R2** (K1-DEC §4): a name alone is not a rejection ground; quotes are retained verbatim and never masked.
- **K1-R3** (K1-DEC §5): K1-B is part of the OQ-3 item 4 privacy screen; failure → `REJECTED`.
- **K1-DEC §3 reservation:** "The technical normalization mechanics, such as subdomains, aliases, parent / affiliate
  domains and phone-number detection (including CONTRACT-REC §6.4's bare-digit-string limitation)" are not decided.

---

## §4 Questions

## K1-I1 — Same-family hosts: subdomain and parent-domain relationship

### Decision question

For K1-R1 rule 2, when an email domain and the attributed organization's normalized business-website domain are
**different hosts where one is a subdomain of the other** (e.g. website `acme.com` with email `x@mail.acme.com`; or
website `shop.acme.com` with email `x@acme.com`), is the email address a business contact identifier or a personal
contact identifier?

### Why this remains unresolved

K1-R1 rule 2 requires "the same normalized domain". Website-side normalization (F-1) does not reduce subdomains, so a
literal reading gives "personal". But K1-DEC §3 expressly does **not** decide "subdomains, … parent / affiliate
domains", so the literal reading cannot be treated as the decided answer. Proving records: K1-DEC §3 "What this
decision does NOT decide", bullet 3; K1-AUDIT §7 row 1 and §8.

Policy consequence: whether evidence quoting an address at an organization's mail / departmental subdomain (or at the
parent host of a subdomain website) is rejected under K1-B. Volume effect unknown (EG-1).

### Existing governing constraints

- **GOVERNING FACT** — OQ-7 item 1: identity anchor is "the normalized business website domain supplied by the
  source" (existing `normalizeCandidate`).
- **GOVERNING FACT** (F-1, implementation) — website normalization lower-cases the hostname and strips protocol, a
  leading `www.`, port, path / query / fragment and a trailing dot. It does not reduce subdomains, apply public-suffix
  logic or resolve redirects.
- **GOVERNING FACT** — OQ-7 item 3: no inference from company-name similarity or personal identifiers.
- **GOVERNING FACT** — DEC-003 §6: "no personal email / phone harvesting".

### Existing Product Owner decisions

- K1-R1 rules 2–3 (as §3).
- Classification never establishes or matches identity (K1-R1 operational interpretation; OQ-7 item 3).
- Third-party organizations' domains are personal (K1-R1 rule 3; K1-AUDIT §7 "Not open").
- Not part of this question (already settled per K1I-PREP §4.1): a leading `www.` on the website side (F-1); an
  identical normalized host (business). Email-side canonical form is engineering (E-1).

**Distinction preserved:** *website identity* (OQ-7, unchanged) ≠ *email-domain classification* (this question) ≠
*domain-matching implementation* (E-1, E-11).

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — This is a policy question, not mechanics, because each answer changes which items
are rejected. A subdomain relationship is structurally determinable from the two strings without inference; whether a
parent-host match is equally acceptable is a separate limb the Product Owner may answer differently.

### Answer options

- **K1-I1-a** — RECORD-SUPPORTED OPTION (literal K1-R1 rule 2 + F-1; not a default): identical normalized host only;
  any subdomain or parent-host difference → personal.
- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I1-b:** an email domain that is a subdomain of the organization domain →
  business; parent host → personal.
- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I1-c:** subdomain **and** parent host within the same registrable domain →
  business (requires public-suffix knowledge; see E-11).

Options are unordered. The Product Owner may answer in prose, and may answer the subdomain and parent-host limbs
separately.

### Dependencies

PD-1 (any implementation); EG-1 (volume); E-11 only if registrable-domain logic is chosen.

### Implementation consequence

After an answer, it becomes known which host relationships, if any, satisfy "same normalized domain", and whether a
registrable-domain (public-suffix) computation is needed. Nothing is prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## K1-I2 — Different domains of the same or related organization (aliases, additional domains, parent company, sister brand, affiliate)

### Decision question

For K1-R1, may an email domain that is **not** the attributed organization's normalized business-website domain (and
not in a subdomain relationship with it) ever be a business contact identifier because it belongs to the same
organization (alias / additional domain, other country-code domain) or a related one (parent company, sister brand,
affiliate)? If so, on what source-supplied basis?

### Why this remains unresolved

K1-R1 rule 3 classifies "addresses at any domain other than the attributed organization's normalized business-website
domain" as personal, yet K1-DEC §3 reserves "aliases, parent / affiliate domains" as undecided. K1-AUDIT §7 records the
item as OPEN and observes it "may carry product content". Proving records: K1-DEC §3 "does NOT decide", bullet 3;
K1-AUDIT §7 row 1.

Policy consequence: rejection of evidence quoting, e.g., `x@acme.co.in` where the website is `acme.com`, or a
group-company address.

**Scope note.** This question asks what policy treatment applies when such a relationship exists or is claimed by the
source. It does **not** decide whether any particular domain is related to an organization. That is an
evidence / identity matter, governed by OQ-7 and not reopened.

### Existing governing constraints

- **GOVERNING FACT** — OQ-7 item 1: anchor is "the normalized business website domain supplied by the source"
  (singular).
- **GOVERNING FACT** — OQ-7 item 3: "No probabilistic or inferred matching … company-name similarity".
- **GOVERNING FACT** (F-2, implementation) — a provider result carries one business identity
  (`business: { name, website }` or null). No field carries additional, alias or affiliate domains.

### Existing Product Owner decisions

- K1-R1 rule 3 (as §3).
- No inference from company-name similarity (OQ-7 item 3). Any relationship between domains could therefore only be
  recognized from data supplied by the source, and the current contract supplies none (F-2).
- OQ-7 is not reopened.

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — Under current records, any "yes" answer would require the source to supply
additional domains. That is a provider-contract change within a future PD-1 scope, and it must be classification-only
(never identity or unification, OQ-7).

### Answer options

- **K1-I2-a** — RECORD-SUPPORTED OPTION (literal K1-R1 rule 3; F-2; not a default): No. Only the single
  source-supplied domain counts (subject to K1-I1); every other domain is personal.
- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I2-b:** Yes, but only for additional domains explicitly supplied by the
  source as part of the same business identity; never derived by inference.

Options are unordered. The Product Owner may answer in prose.

### Dependencies

PD-1; K1-I1 (subdomain cases are excluded from this question); EG-1.

### Implementation consequence

After an answer, it becomes known whether the comparison set is exactly one domain or a source-supplied set, and
whether a contract field would have to exist for it. Nothing is prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## K1-I3 — Non-standard renderings of email addresses and phone numbers

### Decision question

For K1-R1 rule 1 ("Email addresses and phone numbers in any form"), do the following count as contact identifiers for
K1-B: (i) **obfuscated** renderings (e.g. `jane [at] gmail [dot] com`, a number written in words); (ii)
**incomplete / malformed** fragments (e.g. `jane@`, `@gmail.com`, `jane@gmail`)?

Put plainly, the policy question is what treatment applies when an identifier is represented in an obfuscated or
incomplete form. How such forms are detected is engineering (E-2, E-7) and is not asked here.

### Why this remains unresolved

"In any form" is illustrated only by machine-readable URI forms (`mailto:`, `tel:`, `sms:`). No record states whether
human-obfuscated or incomplete renderings are "forms" of an identifier. Existing detection (F-3) recognizes neither, and
it is an implementation fact without governance status. Proving records: K1-DEC §3 (rule 1 wording; "phone-number
detection" reserved); K1-AUDIT §7 and §8.

Policy consequence: whether evidence containing a deliberately obscured or partial contact detail is rejected.

### Existing governing constraints

- **GOVERNING FACT** — DEC-003 §6: "no personal email / phone harvesting".
- **GOVERNING FACT** (F-3, implementation) — current detection is a lexical pattern for `local@domain.tld` plus
  `mailto:` / `tel:` / `sms:` at string start, applied outside free text only. It carries no governance status.

### Existing Product Owner decisions

- K1-R1 rule 1 (scope "in any form"), rule 2 (classification by domain), rule 3 (every phone number personal).
- No stripping or masking (K1-R2; CONTRACT-REC §3).

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — Limbs (i) and (ii) are distinct. An incomplete fragment may lack a domain, so
K1-R1 rule 2 could not classify it as business in any case.

### Answer options

`Options: NONE ESTABLISHED`

The Product Owner may answer each limb in prose.

### Dependencies

PD-1. Interacts with K1-I4 (uncertain cases), as recorded in K1I-PREP.

### Implementation consequence

After an answer, the set of renderings the detector must recognize becomes known. Nothing is prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## K1-I4 — Treatment of strings that cannot be determined to be (or not to be) a contact identifier

### Decision question

When a free-text string cannot be reliably determined to be a phone number (or email address) — notably bare digit
strings and other numeric sequences such as tender / reference numbers, dates or prices — is the evidence item
rejected (treat as an identifier) or retained (treat as not an identifier)?

**Policy (asked here):** what happens when classification is uncertain.
**Engineering (not asked here; E-2, E-7):** how confidence or classification is calculated, including formats, digit
counts, thresholds and libraries.

### Why this remains unresolved

CONTRACT-REC §6 item 4 records that a bare digit string "cannot be told apart from a numeric identifier". K1-DEC §3
reserves "phone-number detection (including CONTRACT-REC §6.4's bare-digit-string limitation)". No record states
which way uncertainty resolves. Proving records: K1-DEC §3 "does NOT decide", bullet 3; PO-DEC §2 unresolved item 3;
K1-AUDIT §7.

Policy consequence: this is the over-rejection vs under-rejection trade-off of a privacy rule. One answer may reject
valid public evidence containing ordinary numbers. The other may retain some phone numbers in persisted quotes (F-8).
Neither consequence can be removed by the choice of detection method alone.

### Existing governing constraints

- **GOVERNING FACT** — DEC-003 §6.
- **GOVERNING FACT** — CONTRACT-REC §3 ("rejected, never stripped"), §6 item 4 (bare-digit limitation).
- **GOVERNING FACT** (F-8, implementation) — evidence is persisted as `source_quote`.

### Existing Product Owner decisions

- Every phone number is personal (K1-R1 rule 3).
- Reject, never strip; quote never altered (K1-R2; CONTRACT-REC §3).

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — Only the direction of uncertainty is a Product Owner matter. The Product Owner
may also choose to delegate the threshold to implementation with a stated direction.

### Answer options

No record-supported option exists.

- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I4-a:** uncertain → treated as an identifier (item rejected).
- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I4-b:** uncertain → not treated as an identifier (item retained).

Options are unordered. The Product Owner may answer in prose.

### Dependencies

PD-1; EG-1 (prevalence of numeric strings in real quotes is unknown).

### Implementation consequence

After an answer, the default branch for ambiguous detector cases, and the test expectations for them, become known.
Nothing is prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## K1-I5 — Which free-text fields K1-B screens

### Decision question

Does K1-B apply to (a) only the evidence quote(s) persisted as `source_quote` (the `evidence` / `statement` text), or
(b) every free-text field of the provider result (`title`, `snippet`, `body`, `statement`, `evidence`, `basis`)?

### Why this remains unresolved

The governing records use three different wordings, and no record reconciles them:

| Wording | Source |
|---|---|
| "whose free-text **quote** contains" | PO-DEC §2 (K1-B) |
| "applying K1-B to a free-text **evidence field**" | K1-DEC §3 decision preamble |
| "Each email address in the **item's free-text fields**" | K1-DEC §3 operational interpretation |

The code's free-text set (F-4) includes `basis` (authorization basis, not evidence) and `body` / `snippet` (source text
from which the quote is drawn, not persisted, F-8). This ambiguity was identified in K1I-PREP and was not raised in
K1-AUDIT.

Policy consequence: under (a), a notice whose body lists a contact number outside the extracted quote is retained, and
the number is not persisted (F-8). Under (b), the same notice is rejected. This materially affects public RFP / notice
evidence, where contact information commonly appears in the body rather than in the quoted evidence field
(CONTRACT-REC §6 item 4 example).

### Existing governing constraints

- **GOVERNING FACT** — OQ-3 item 1: "the statement appears verbatim in the source evidence".
- **GOVERNING FACT** (F-4, implementation) — free-text keys: `title`, `snippet`, `body`, `statement`, `evidence`,
  `basis`; these are not currently scanned.
- **GOVERNING FACT** (F-8, implementation) — only evidence is persisted (`source_quote`, `research_signals.signal`).

### Existing Product Owner decisions

- K1-B wording (PO-DEC §2); K1-R1 wordings (K1-DEC §3), as tabulated above.
- Identifiers outside free text are already screened (CONTRACT-REC §3, unchanged per K1-DEC §3).
- The quote is never altered (K1-R2).

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — Whether `basis` belongs to either set is a sub-limb.

### Answer options

- **K1-I5-a** — RECORD-SUPPORTED OPTION (K1-B "quote"; K1-R1 "free-text evidence field"; not a default): persisted
  evidence quote(s) only.
- **K1-I5-b** — RECORD-SUPPORTED OPTION (K1-R1 operational "item's free-text fields"; F-4; not a default): all
  free-text fields.
- The Product Owner may state another field set in prose.

Options are unordered. This questionnaire does not resolve the ambiguity by selecting either wording.

### Dependencies

PD-1; EG-1.

### Implementation consequence

After an answer, the exact textual content subject to the K1-B check becomes known. How fields are traversed is
engineering and is not prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## K1-I6 — Unit of rejection when one of several evidence entries contains a personal identifier

### Decision question

When a provider result carries several evidence entries (F-9) and only one contains a personal contact identifier, is
(a) the whole provider result `REJECTED`, or (b) only the offending evidence entry excluded, with the remaining entries
evaluated normally?

### Why this remains unresolved

K1-B rejects "an evidence item". K1-DEC §3 says the rule is "applied per evidence item" and that "the item is
rejected". "Evidence item" may denote the provider result (OQ-3's "source item"; F-6 per-result `REJECTED`) or a single
evidence entry (F-9). **No record defines the term**, and this questionnaire assumes no definition. Proving records:
PO-DEC §2; K1-DEC §3 operational interpretation; OQ-3 ("for the source item itself").

Policy consequence: whether clean evidence from the same source item survives.

**Scope note.** K1I-PREP identifies no rejection unit broader than the provider result, and none is added here. Database
deletion, UI behavior, logging and other implementation mechanics are outside this question.

### Existing governing constraints

- **GOVERNING FACT** — OQ-3: conditions apply "for the source item itself"; outcomes include `REJECTED`.
- **GOVERNING FACT** (F-6, implementation) — `REJECTED` is a per-provider-result outcome; "One bad result never aborts
  the batch".
- **GOVERNING FACT** (F-9, implementation) — an AI-platform signal carries `evidence[]`; a public notice carries
  `intentEvidence[]`.

### Existing Product Owner decisions

- K1-R3: K1-B failure → OQ-3 item 4 failed → `REJECTED`.
- OQ-3 text unchanged; reject, never strip (CONTRACT-REC §3; K1-R2).

### Analyst interpretation

`ANALYST PROPOSAL — NOT A DECISION` — OQ-3's "source item" and K1-R3's use of the `REJECTED` outcome (which exists only
per provider result, F-6) lean toward (a). This is an interpretation, not a governing statement, so the question is
presented.

### Answer options

- **K1-I6-a** — RECORD-SUPPORTED OPTION (OQ-3 "source item"; F-6; not a default): whole provider result rejected.
- `ANALYST PROPOSAL — NOT A DECISION` — **K1-I6-b:** offending entry excluded; other entries evaluated.

Options are unordered. The Product Owner may answer in prose.

### Dependencies

PD-1; K1-I5 (field scope).

### Implementation consequence

After an answer, it becomes known whether the check yields a result-level outcome or excludes individual entries, and
which test expectations apply. Nothing is prescribed here.

### Product Owner answer

`NONE`

Product Owner answer: NONE

---

## §5 Engineering-only items — NOT Product Owner decisions

Copied from K1I-PREP §6. These remain engineering / design matters unless a later governance record determines
otherwise. They are **not** questionnaire questions and require no Product Owner answer.

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
| E-10 | Order of checks (verbatim, attribution, privacy) | OQ-3 (all non-signal outcomes) | No change to which items become signals, except the reported outcome label |
| E-11 | Public-suffix data source, if K1-I1-c is chosen | K1-I1 answer; dependency changes need PD-1 scope | Data / library choice |
| E-12 | Redirect resolution | OQ-7 item 1 ("supplied by the source"); no external HTTP authorized | Not contemplated by any record; would need a separate proposal |
| E-13 | Rejection messages not echoing the identifier value | Existing test pattern (`intentSourceProviderContract.test.ts:531`) | Hygiene; no product content |
| E-14 | Updating the existing "free text is not PII-scanned" test (F-10) and adding fixtures | PD-1 scope | Test work; F-10 is already consistent with K1-R1 rule 2 |

---

## §6 Dependency matrix

Only dependencies recorded in K1I-PREP §5 and §7 are shown. "Independent?" means independent of the other K1-I
questions.

| Question | Existing decision dependencies (bounding, not reopened) | Pending dependencies | Independent? |
|---|---|---|---|
| K1-I1 | K1-R1 rules 2–3; OQ-7 items 1, 3; DEC-003 §6 | PD-1; EG-1; E-11 (only if registrable-domain logic is chosen) | Yes |
| K1-I2 | K1-R1 rule 3; OQ-7 items 1, 3 | PD-1; EG-1 | No: depends on K1-I1 (subdomain cases excluded) |
| K1-I3 | K1-R1 rules 1–3; K1-R2; DEC-003 §6 | PD-1 | No: interacts with K1-I4 (as recorded) |
| K1-I4 | K1-R1 rule 3; K1-R2; CONTRACT-REC §3 | PD-1; EG-1 | Yes (no K1-I dependency recorded) |
| K1-I5 | K1-B; K1-R1; K1-R2; OQ-3 item 1 | PD-1; EG-1 | Yes |
| K1-I6 | K1-R3; OQ-3; K1-R2 | PD-1 | No: depends on K1-I5 (field scope) |

Not dependencies of any question: PD-2, PD-3, PD-6, PD-8, PD-9, S14 (K1I-PREP §7: not affected).

---

## §7 Evidence gaps (established only)

| # | Gap | Source |
|---|---|---|
| EG-1 | Kinds and prevalence of personal data (including subdomain addresses, alternate domains and numeric strings) in real quotes | PO-DEC §2; K1-DEC §3, §6; K1-AUDIT §7 |
| EG-CR-4 | Bare digit strings cannot be distinguished from numeric identifiers by the current screen | CONTRACT-REC §6 item 4 |

Neither gap is filled by this questionnaire. No external research is authorized.

---

## §8 Decision protocol

1. **Product Owner answers only.** Answers are recorded in a separate Product Owner decision record that cites this
   questionnaire. This questionnaire is not edited to hold answers.
2. **No default answers.** Silence, elapsed time, current code behavior and "record-supported" labels answer nothing.
3. **No ranking.** Options are unordered. No ranking was requested.
4. **No new substantive options.** None has been invented. Analyst proposals carry no approval unless the Product
   Owner adopts them in their own words.
5. **Prose answers allowed.** A question may be answered in prose and limb by limb.
6. **Partial answers.** An unanswered question, or an unanswered limb of one, remains PENDING.
7. **Existing decisions are not reopened.** K1-B, K1-R1, K1-R2, K1-R3, OQ-3, OQ-7, OQ-11 and DEC-003 stand. An answer
   that would require changing them is outside these questions.
8. **Answers do not authorize implementation.** PD-1 remains separate.

---

## §9 Non-decision boundary

This questionnaire does **NOT**:
- authorize implementation;
- authorize validation;
- authorize provider calls;
- authorize external research;
- resolve PD-1;
- resolve PD-2, PD-3, PD-6, PD-8 or PD-9;
- resolve S14;
- reopen K1-R1, K1-R2 or K1-R3;
- change the existing privacy-screen architecture.

---

## Closing block

> **This questionnaire prepares decisions only. It grants no implementation, validation, participant-contact,
> provider-call, external-research or deployment authority.**

```text
K1-I1: PENDING — Product Owner answer: NONE
K1-I2: PENDING — Product Owner answer: NONE
K1-I3: PENDING — Product Owner answer: NONE
K1-I4: PENDING — Product Owner answer: NONE
K1-I5: PENDING — Product Owner answer: NONE
K1-I6: PENDING — Product Owner answer: NONE

Engineering-only items (not questions): E-1..E-14 (14)

Product Owner decisions recorded: NONE
PD-1: PENDING (separate)

Implementation authorization: NONE
Validation authority: NONE
Participant-contact authority: NONE
Provider-call authorization: NONE
External research authorization: NONE
Deployment authority: NONE

Files created: 1 (this record)
Existing records modified: 0
Code / test / schema / migration / configuration changes: 0
Provider calls / external HTTP: 0
Commits / pushes: 0
```
