# CLIENT INTENT DISCOVERY — CODE-GAP K-1 RESIDUAL DECISIONS — CONFORMANCE AUDIT

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001
**Date:** 2026-10-01
**Type:** READ-ONLY conformance audit. Not a decision record, not an implementation plan, not an implementation
authorization.
**Audited record:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_RESIDUAL_PRODUCT_OWNER_DECISION.md`, "K1-DEC").
**Author role:** governance auditor / conformance reviewer.

> **This audit modifies no decision, makes no Product Owner decision, and resolves no disputed interpretation.** Where a
> decision is not directly supported by a cited record, that is recorded as a finding. The decision stands as recorded.

**Independence limitation.** K1-DEC was authored in the same working session (as delegated Product Owner) that produced
this audit. The findings are evidence-based, but this is not an independent review.

**Classification vocabulary:**

| Term | Meaning |
|---|---|
| DOCUMENTED FACT | Code or record text |
| EXISTING DECISION | Text of a governing decision predating K1-DEC |
| PO DECISION (K1-DEC) | A choice first made in K1-DEC |
| INTERPRETATION | A reading of existing text |
| NEW CONSEQUENCE | An effect flowing from K1-DEC |
| OPEN | Unresolved per a cited record |

**Abbreviations:**

| Short form | Record ID |
|---|---|
| K1-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-QUESTIONNAIRE-001 |
| K1-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-PREP-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 |
| OQ-DEC | OQ-PO-DEC-001 |

## §1 Scope

K1-R1, K1-R2 and K1-R3 as recorded in K1-DEC §3–§5, and nothing else.

## §2 Baseline (verified before writing)

| Item | Value |
|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); 13 untracked records under `requirement/` only |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | n/a (audited record) |
| K1-Q | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes (K1-DEC §2) |
| K1-PREP | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| CODE-GAP-PO-QUESTIONNAIRE-001 | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` | Yes |
| PO-DEC | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| CODE-GAP-RECON-001 | `192df548aa8d71ffdb033648301a1ebd1fb727ba4a928cfb5028d9baa3b84939` | Yes |
| CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 | `2697ac30b550e8f4f300f0d92310f87b9212e110b676155533577d48a93db93a` | Yes |
| REQ-001 (canonical) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |

**Baseline: PASS.**

**Recording accuracy.** K1-DEC records an answer for each of K1-R1, K1-R2 and K1-R3. Each answer is in prose, which
K1-Q permits because it records `Options: NONE ESTABLISHED`. No other question is answered, and K1-B is quoted unchanged.
Recording accuracy: PASS.

---

## §3 K1-R1 findings

### R1-F1 — Website-domain rule

- **Source text** — OQ-DEC OQ-7 item 1: "A prospective client is unified across providers **only by the existing
  organization identity anchor**: the normalized business website domain supplied by the source … within the owning
  user's Search."
- **What OQ-7 establishes (EXISTING DECISION).** The website domain is the anchor for **organization identity and
  cross-provider unification**.
- **What OQ-7 does not establish.** OQ-7 says nothing about classifying contact identifiers, and nothing about
  "business capacity" of an email address.
- **K1-DEC rationale.** It states "The only governing anchor of business capacity is the organization's business
  website domain. OQ-7 item 1 …"
- **Finding:** the website-domain rule is not directly supported by the cited governing record. It is an
  **extrapolation**. A PO decision (K1-DEC) applies OQ-7's identity anchor, by analogy, to a different purpose: contact
  classification.
- **Rationale overstatement.** OQ-7 is described as an anchor of "business capacity", which OQ-7 does not say.
- **Classification:** PO DECISION (new policy), built on an INTERPRETATION of OQ-7. It does not conflict with OQ-7.

### R1-F2 — Generic business inboxes (`info@company-domain`)

- No governing record classifies a generic or role inbox as a business identifier.
- The closest DOCUMENTED FACT is CONTRACT-REC §6 item 4: "a public RFP body may quote a business contact email; tested as
  accepted". This is an implementation record, listed under "Known open questions", and it does not define "business
  contact email".
- **Finding:** the decision is not directly supported by the cited governing record. It is a **new PO decision** derived
  from the R1-F1 domain rule.

### R1-F3 — Individual work addresses (`person@company-domain`)

- No governing record classifies an individual's address at the organization's domain as either business or personal.
- K1-DEC's rationale is an argument from absence: "No governing record classifies an individual's address at the
  organization's own domain as personal". The absence is accurate, but it does not establish the opposite.
- **Textual tension (recorded, not resolved).** OQ-7 item 3 lists "personal names, email, phone or any personal
  identifier" together as things identity is never inferred from. It groups "email" generally with personal
  identifiers, in an identity-inference context. CONTRACT-REC §3 (implementation) rejects every email value outside
  free-text fields "so a personal email can never serve as an identifier".
- Neither text classifies work addresses for K1-B purposes. Both use "email" without a personal / business distinction.
- **Finding:** the decision is not directly supported by the cited governing record. It is a **new PO decision**
  (domain-based), and the OQ-7 item 3 wording is an **open interpretation** relevant to it. The decision does not
  contradict OQ-7 (see R1-F7).

### R1-F4 — Other-company domains (e.g. `consultant@agency.com` in a quote about `client.com`)

- No governing record classifies such an address.
- K1-DEC's rationale: other domains "cannot be established as belonging to the attributed organization in its business
  capacity without inference that OQ-7 item 3 forbids".
- OQ-7 item 3 forbids inferring **the prospective client's identity** from email or phone. Classifying a third party's
  address as business or personal does not require inferring the client's identity.
- **Finding:** the decision is not directly supported by the cited governing record. K1-DEC decides this category as
  personal, so the category is **not open**: it is a **new PO decision**. The cited OQ-7 item 3 does not compel it, and
  the rationale overstates that record's reach.

### R1-F5 — Phone numbers ("every phone number is personal")

- **DEC-003 §6:** "no personal email / phone harvesting". The qualifier "personal" presupposes that non-personal phones
  can exist. DEC-003 does not classify business phone numbers.
- No governing record classifies public switchboards, reception numbers, office numbers, business messaging (e.g.
  WhatsApp) numbers or publicly listed business numbers.
- K1-DEC rule 3 expressly covers "any phone number, including a publicly listed office or switchboard number". Messaging
  numbers fall within "phone numbers in any form".
- **Classification:** an **explicit new PO policy**. It is not directly supported by DEC-003 §6. It is **not
  inconsistent** with an existing decision: it is stricter than DEC-003 requires, and no record requires business phone
  numbers to be accepted.
- **Definitional observation.** The rule includes within "personal contact identifier" numbers that are business in
  ordinary usage. Its scope is not ambiguous (it is absolute), but the label "personal" no longer tracks ordinary
  meaning for phones. A reader of K1-B alone could misread that scope.
- **Rationale overstatement.** As in R1-F4, OQ-7 item 3 is cited as if classifying a phone required identity inference.
  It does not.
- **NEW CONSEQUENCE.** Any evidence item whose free-text quote contains a phone number is rejected. Public RFP notices
  listing an office number fall within this. The volume effect is unknown (EG-1). K1-DEC records this in §3 and §6.

### R1-F6 — Public availability does not change classification

- No governing record states this explicitly. No record provides a public-availability exception either: DEC-003 §6,
  R-3.3, R-3A.3 and R-13.21 contain none.
- **Finding:** this is a **new PO statement**, consistent with the absence of any exception. It is not directly
  established by the cited governing records.

### R1-F7 — OQ-7 item 3 (no identity inference from personal identifiers)

- The domain rule compares an email's domain with the organization domain **already established from source-supplied
  identity** (OQ-7 item 1). It does not derive, change or match organization identity from the email.
- Items without source-supplied identity are already `UNATTRIBUTED` (OQ-3 item 2; OQ-7 item 4), so no classification
  arises for them.
- K1-DEC §3 states: "This classification is never used to establish, infer or match identity. OQ-7 item 3 is unchanged."
- Observation: OQ-7 normalizes the website domain. Applying the same normalization to email domains is not specified by
  any record (see §8).
- **Finding:** no contradiction with OQ-7 item 3. **PASS.**

**K1-R1 overall: FINDINGS.**
- Rules 2–4 (domain = business; all other email and all phones = personal; public availability irrelevant) are new
  Product Owner policy, not directly supported by the cited governing records.
- Two parts of the rationale overstate their sources:
  - OQ-7 is presented as an anchor of "business capacity".
  - OQ-7 item 3 is presented as compelling the treatment of other domains and phones.
- No conflict with an existing decision was found.

---

## §4 K1-R2 findings

### R2-F1 — Does K1-B concern contact identifiers only?

- K1-B text: "a personal contact identifier" (PO-DEC §2). PO-DEC §2 unresolved item 1 records that names are not
  covered by the K1-B wording.
- No governing record extends K1-B to names. CONTRACT-REC §3's rejection of "personal names" concerns structured
  **keys**, not free-text values, and is an implementation statement.
- **PASS.**

### R2-F2 — Does the verbatim requirement prohibit masking / rewriting?

- OQ-3 item 1 (EXISTING DECISION): "the statement appears verbatim in the source evidence". On its face, this concerns
  the relationship between the statement and the **source evidence**. It does not expressly address alteration of the
  persisted copy.
- OQ-3 item 3 (traceability, R-3.2) requires extracted intent to remain "traceable to and distinguishable from the
  original evidence". It supports retaining the original but does not expressly prohibit masking.
- PO-DEC §2 (a PO record) states that masking "would alter the verbatim statement, which OQ-3 item 1 (DECIDED) requires
  … Selecting it would require reopening OQ-3". This is a PO rationale, not OQ-3 text.
- CONTRACT-REC §3 "rejected, never stripped" is an implementation statement, cited by OQ-DEC OQ-8 among "Existing
  DECIDED constraints".
- **Finding:** K1-R2's "no masking / rewriting" is a valid PO decision consistent with these records. Its rationale
  ("Verbatim retention is required", citing OQ-3 item 1) **overstates OQ-3 item 1's text**. The prohibition rests on
  the PO-DEC §2 reading and on the reject-not-strip constraint, not on OQ-3 item 1 alone.

### R2-F3 — Does K1-R2 establish a broader rule for all personal data in quotes?

- K1-DEC §4 limits the decision to names. It states that it does not decide "other personal data inside quotes, such as
  home addresses, dates of birth or other personally identifying combinations".
- Item 4 (a name that forms part of an organization's name) is within the names scope.
- **PASS.** No broader rule was established.

### R2-F4 — "Names are never used to work out identity / infer anything about the individual": restatement or new?

| K1-DEC §4 item 5 statement | Source | Classification |
|---|---|---|
| Never used to establish, infer or match identity | OQ-7 item 3 ("identity is never inferred from … personal names …"; "No probabilistic or inferred matching"); OQ-3 item 2 ("identity is never inferred from a URL or from personal data") | **Restatement** of EXISTING DECISIONS |
| Never used to infer anything about the named individual | REQ-001 R-3.3 ("prohibits … inference about named individuals"); DEC-003 §6 ("no inference that a named individual uses an AI platform") | **Restatement** via R-3.3. DEC-003 §6 alone is narrower (AI-platform use only). Citing it for the broad form slightly overstates it. "Anything" is marginally broader than R-3.3's wording but within its evident scope. |
| Statement must be the potential client's; private personal-capacity needs excluded | OQ-3 item 1; OQ-11 items 1–2 | **Restatement** |

- **Finding:** item 5 introduces no new prohibition. One citation (DEC-003 §6 for the broad no-inference statement)
  overstates that record. The rule is carried by R-3.3.

**K1-R2 overall: PASS, with rationale findings R2-F2 and R2-F4 (citation overstatement only).**

---

## §5 K1-R3 findings

K1-DEC decision: "K1-B is part of the existing privacy screen referenced by OQ-3 item 4". Failure means OQ-3 item 4 is
failed and the outcome is `REJECTED`, with no fifth OQ-3 condition.

| # | K1-DEC reasoning point | Record text verified | Assessment |
|---|---|---|---|
| R3-F1 | OQ-3 item 4 "identifies the screen by its governing sources, 'DEC-003 §6; CONTRACT-REC §3'" | OQ-3 item 4: "the item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)" | **Supported as citation.** The parenthetical names the sources of the screen. Reading it as a definition of the screen's scope is an INTERPRETATION. |
| R3-F2 | DEC-003 §6 is K1-B's governing basis | PO-DEC §2 rationale cites DEC-003 §6 first; PO-DEC "Governing evidence" lists DEC-003 §6 | **Supported** by a PO record (rationale, not the selected-answer text) |
| R3-F3 | CONTRACT-REC files the free-text gap under "Privacy screen limits" | CONTRACT-REC §6 ("Known open questions") item 4: "**Privacy screen limits.** Free-text fields are not PII-scanned …" | **Supported as a DOCUMENTED FACT.** This is an implementation record's characterization of its own limits, so its governance weight is interpretive. |
| R3-F4 | Both reject rather than strip | CONTRACT-REC §3: "Violations are **rejected, never stripped**"; K1-B is a rejection rule (PO-DEC §2) | **Supported** |
| R3-F5 | Treating K1-B as separate "would add a fifth condition … in effect amending OQ-3" | OQ-3: "A Client Intent Signal is sufficient evidence of buying intent **only when all** of the following hold"; "An item failing any condition is not a Client Intent Signal" | **Not supported as stated.** "Only when all … hold" states **necessary** conditions and does not declare the list exhaustive of all rejection grounds. A separate rejection condition would not, on the text, amend OQ-3. The point overstates the record. |

**Additional observations:**

- **R3-F6 — "existing".** At the time of OQ-DEC (2026-09-30), the privacy screen as implemented exempted free-text
  fields (CONTRACT-REC §3, §6 item 4). Treating K1-B, decided later, as part of "the **existing** privacy screen" reads
  "existing" as referring to the screen's governing sources rather than to its state at that date.
  - No record fixes either reading. This is an INTERPRETATION by the Product Owner.
- **R3-F7 — architecture.** K1-DEC does not decide where the screen is implemented. No conflict with the current
  architecture was found: CONTRACT-REC §3 describes a provider-contract-level screen plus an adapter-level screen, and
  K1-DEC places no requirement on either.

**Finding:** the K1-R3 decision is an **explicit Product Owner clarification** (an interpretation of existing OQ-3 item 4
wording). It is consistent with, but **not compelled by**, the cited records.
- Points R3-F1 to R3-F4 are supported as stated or as citation.
- Point R3-F5 overstates OQ-3.
- The fact that DEC-003 §6 is K1-B's basis does not by itself prove membership of the OQ-3 screen. K1-DEC supplies that
  link by Product Owner clarification.
- No conflict with an existing decision.

**K1-R3 overall: FINDINGS** (R3-F5 rationale overstatement; decision is a PO clarification, not a pre-existing rule).

---

## §6 Decision-vs-evidence table

| Statement | Existing governing fact? | New PO decision? | Supported by cited record? | Open interpretation? |
|---|---|---|---|---|
| Website domain of the attributed organization = business email | No (OQ-7 anchors identity, not contact status) | **Yes** | Not directly; extrapolated from OQ-7 item 1 | Yes: OQ-7 used beyond its purpose (R1-F1) |
| Generic business inbox (`info@`) at that domain = business | No | **Yes** | Not directly | No (decided) |
| Individual work email at that domain = business | No | **Yes** | Not directly; argument from absence | Yes: OQ-7 item 3 groups "email" with personal identifiers (R1-F3) |
| All other email (webmail, other-company domains) = personal | No | **Yes** | Not directly; OQ-7 item 3 does not compel it | No (decided); rationale overstated (R1-F4) |
| All phone numbers = personal (incl. switchboards) | No (DEC-003 §6 covers "personal phone" only) | **Yes** (explicit new policy) | Not directly; not inconsistent | No (decided); definitional observation (R1-F5) |
| Public availability does not change classification | No (no exception exists; none stated) | **Yes** | Consistent with absence of exception | No |
| Name alone does not cause rejection | Partly: PO-DEC §2 records names as outside K1-B wording | **Yes** (rejection-ground question) | Yes (K1-B text; PO-DEC §2) | No |
| Names remain verbatim (no masking / rewrite) | Partly: PO-DEC §2 rationale; reject-not-strip constraint | **Yes** | Yes, via PO-DEC §2 and CONTRACT-REC §3; OQ-3 item 1 alone overstated | No (rationale overstated, R2-F2) |
| Names never used for identity / individual inference | **Yes** (OQ-7 item 3; OQ-3 item 2; R-3.3) | No (restatement) | Yes (DEC-003 §6 citation narrower) | No |
| K1-B is part of the OQ-3 item 4 privacy screen | No | **Yes** (PO clarification) | Consistent, not compelled; R3-F5 overstated | Yes: meaning of "existing" (R3-F6) |
| Failing K1-B → `REJECTED` outcome | Partly (OQ-3 outcome list includes `REJECTED`) | Yes (as consequence of K1-R3) | Yes | No |

## §7 Open questions (supported by a record as open)

| Item | Status | Supporting record |
|---|---|---|
| Subdomains, aliases, parent / affiliate domains for the email-domain comparison | OPEN, labelled implementation mechanics. **Audit observation:** whether, for example, a parent company's or sister brand's domain counts as "the same" organization may carry product content. | K1-DEC §3 "does NOT decide" |
| Normalization of email domains (OQ-7 specifies normalization of the website domain only) | OPEN | OQ-7 item 1; K1-DEC §3 |
| Phone-number detection (incl. bare digit strings) | OPEN (implementation) | CONTRACT-REC §6 item 4; K1-DEC §3 |
| Email / contact-identifier extraction from free text | OPEN (implementation mechanics) | K1-DEC §3 ("technical … mechanics … belong to a future implementation authorization") |
| Postal addresses, messaging handles, social-media profiles as contact identifiers | OPEN (not decided) | K1-DEC §3 |
| Other personal data in quotes (home address, date of birth, other combinations) | OPEN (not decided) | K1-DEC §4 |
| Display / retention / deletion of quotes containing names | OPEN | K1-DEC §4; R-6.2; PD-11 |
| Volume effect of K1-R1 rule 3 (phones; non-organization domains) | OPEN EVIDENCE GAP (EG-1) | K1-DEC §3, §6 |
| LinkedIn lead-form classification | OPEN (K6-C) | PO-DEC §6 |
| S14 applicability to lead-form responses (EG-5) | OPEN EVIDENCE GAP | PROVIDER-EVIDENCE-001 §7; CODE-GAP-RECON-001 §3 |
| CONTRACT-REC §6.3 non-persisted provenance (incl. integration `capturedAt`) | OPEN | CONTRACT-REC §6 item 3; PO-DEC §7 |
| PD-1, PD-2, PD-3, PD-6, PD-8, PD-9 | PENDING | READINESS-001 §9 |

**Not open (decided by K1-DEC):** other-company domains, public business phone numbers and individual professional
numbers. They are decided as personal, with the findings in §3.

## §8 Implementation-readiness assessment (no authorization)

| Topic | Classification | Note |
|---|---|---|
| Business-domain matching (email domain vs organization domain) | DECIDED BUT IMPLEMENTATION DETAIL OPEN | No record specifies how email domains are normalized |
| Subdomains | DECIDED BUT IMPLEMENTATION DETAIL OPEN | K1-DEC labels it mechanics; may require product-level clarification (§7) |
| Email aliases | DECIDED BUT IMPLEMENTATION DETAIL OPEN | As above |
| Phone numbers (classification) | DECIDED | All personal |
| Public switchboards | DECIDED | Personal (K1-DEC rule 3) |
| Contact extraction from free text | DECIDED BUT IMPLEMENTATION DETAIL OPEN | — |
| Identifier detection (phones, incl. bare digit strings; emails) | DECIDED BUT IMPLEMENTATION DETAIL OPEN | CONTRACT-REC §6 item 4 limitation |
| Names in quotes | DECIDED | No rejection ground; verbatim |
| K1-B outcome / placement in OQ-3 | DECIDED | `REJECTED` via OQ-3 item 4. Physical placement is not decided. |
| Volume impact of rejection rules | OPEN EVIDENCE GAP | EG-1 |
| Postal / handle / profile identifiers | NOT APPLICABLE to K1-B as decided | Open only if pursued (K1-DEC §3) |
| Implementation authorization | PENDING (PD-1) | Blocker |

**Assessment.**
- The three decisions are precise enough at **policy** level to state what is rejected and why.
- Implementation would still require assumptions about email-domain normalization, subdomains / aliases / affiliate
  domains, and identifier detection / extraction. None of these is fixed by any record, and any implementation
  authorization would need to specify them.
- **PD-1 remains PENDING.**
- **No implementation authorization has been granted by this audit.**

## §9 Governance status

- **Product Owner decisions preserved:** K1-R1, K1-R2 and K1-R3 stand exactly as recorded in K1-DEC. The findings above
  do not modify, replace or suspend them. Any revision would require a separate Product Owner record.
- **No decisions modified:** this audit changes no record.
- **No implementation performed.**
- **No implementation authorized.**

**Procedural note (not a product recommendation).** The rationale overstatements (R1-F1, R1-F4, R1-F5, R2-F2, R2-F4,
R3-F5) and the open interpretations (R1-F3, R3-F6) are recorded for the Product Owner. Whether to restate rationale in a
later record is a Product Owner matter. No such record is required for the decisions to remain in force.

```text
Audit type: READ-ONLY conformance audit

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / configuration / API / UI changes: 0
Database connections / writes: 0
Provider calls: 0
External HTTP / research: 0
Validation: 0
Participant contact: 0
Deployment: 0
Commits / pushes: 0

Product Owner decisions made or modified: NONE
Implementation authorization: NONE
Validation authority: NONE
Participant-contact authority: NONE
```
