# CLIENT INTENT DISCOVERY

## Code-Gap K-1 Residual Questions K1-R1, K1-R2, K1-R3 — Product Owner Decision (Questionnaire Answers)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001
**Date:** 2026-10-01
**Type:** Product Owner decision record (governance only). Not an implementation authorization.

> **These Product Owner decisions do not authorize implementation.** No existing decision is reopened, amended,
> superseded or reinterpreted. K1-B and K-1..K-7 (CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001) stand as recorded.

Abbreviations:

| Short form | Record ID |
|---|---|
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 |
| K1-QUESTIONNAIRE | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-QUESTIONNAIRE-001 |
| K1-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-PREP-001 |
| CONFORMANCE-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-CONFORMANCE-AUDIT-001 |
| RECON-001 | CLIENT-INTENT-DISCOVERY-CODE-GAP-RECON-001 |

---

## §1 Decision authority

This record is the Product Owner decision for **K1-R1**, **K1-R2** and **K1-R3** of K1-QUESTIONNAIRE, and for nothing
else.

- **Decision maker.** Claude Code acted as Product Owner for this decision round, under explicit delegation from the
  repository owner in session on 2026-10-01. The delegation is limited to K1-R1..K1-R3 and grants no implementation
  authority.
- **Options.** K1-QUESTIONNAIRE records `Options: NONE ESTABLISHED` for all three questions. The answers below are
  therefore stated in prose, as the Product Owner's own decisions, each grounded in cited records.
- **Analyst material.** No "ANALYST PROPOSAL — NOT A DECISION" material is adopted as such.

## §2 Baseline (verified before deciding)

| Item | Value |
|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` |
| Staged files | 0 |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) |
| Target file / record ID pre-existence | Neither existed |

| Record | sha256 (verified; unchanged) |
|---|---|
| K1-QUESTIONNAIRE | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` |
| K1-PREP | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` |
| CODE-GAP-PO-QUESTIONNAIRE-001 (original K questionnaire) | `a121911994ed695917bf2fcea726a236cb3434acec6f0b1692d3af21c6b20751` |
| PO-DEC | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` |
| RECON-001 | `192df548aa8d71ffdb033648301a1ebd1fb727ba4a928cfb5028d9baa3b84939` |
| CONFORMANCE-AUDIT | `2697ac30b550e8f4f300f0d92310f87b9212e110b676155533577d48a93db93a` |
| REQ-001 (canonical) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| OQ-PO-DEC-001 | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| OQ-1-2-8-PO-DEC-001 | `21c815851d37bc3dd5a7e1cdb21799e2e03c7cb24c0eda1446bcba09a992f548` |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |

**Decided starting point (unchanged):** K1-B, "An evidence item whose free-text quote contains a personal contact
identifier is rejected." (PO-DEC §2).

---

## §3 K1-R1 — Personal vs business / professional contact-identifier boundary

**Question (K1-QUESTIONNAIRE §3):** "For applying the decided K1-B rule …, where does the boundary lie between a
**personal** contact identifier and a **business / professional** contact identifier?"

### Decision

For the purpose of applying K1-B to a free-text evidence field of an evidence item attributed to an organization under
OQ-7:

1. **Identifiers in scope.** Email addresses and phone numbers in any form, including `mailto:`, `tel:` and `sms:`
   references. These are the contact-identifier forms named by DEC-003 §6 ("personal email / phone") and screened by
   CONTRACT-REC §3.
2. **Business contact identifier.** An email address whose domain is the **same normalized domain as the business website
   domain that identifies the attributed organization** under OQ-7 (the source-supplied organization identity anchor for
   that same evidence item). This applies equally to:
   - a generic or role inbox at that domain (e.g. `info@`, `procurement@`); and
   - an individual's work address at that domain.
3. **Personal contact identifier.** Every other email address and **every phone number**. This includes, for example:
   - addresses at consumer / webmail domains;
   - addresses at any domain other than the attributed organization's normalized business-website domain (including
     third-party organizations' domains);
   - any phone number, including a publicly listed office or switchboard number.
4. **Public availability does not change the classification.** An identifier is not "business" because it is public.

### Reasoning

- **DEC-003 §6 (DECIDED)** prohibits "personal email / phone harvesting". It does not define "personal".
- **The governing records draw the personal / business line by capacity.**
  - OQ-11 item 1 admits "a sole trader or freelancer acting in a business capacity and identified by a business website,
    not by personal identifiers".
  - OQ-11 item 2 excludes "a private individual acting in a personal capacity".
- **The only governing anchor of business capacity is the organization's business website domain.** OQ-7 item 1: "the
  normalized business website domain supplied by the source". An address at that domain is issued under the
  organization's own business identity, so it is a business contact identifier.
  - No governing record classifies an individual's address at the organization's own domain as personal.
  - Concerns specific to the named individual are governed by K1-R2 and by the unchanged prohibitions on inference about
    named individuals (DEC-003 §6; REQ-001 R-3.3).
- **Phone numbers.** No governing record provides any source-supplied means of tying a phone number to an organization's
  business identity.
  - OQ-7 identity is domain-only.
  - OQ-7 item 3 forbids inferring identity "from … email, phone or any personal identifier".
  - A phone number therefore cannot be established as a business contact identifier, and it is treated as personal for
    K1-B. This is the conservative reading of DEC-003 §6 ("no personal … phone harvesting").
- **Other email domains** likewise cannot be established as belonging to the attributed organization in its business
  capacity without inference that OQ-7 item 3 forbids.
- **Implementation records are not adopted.** CONTRACT-REC §6 item 4 ("a public RFP body may quote a business contact
  email; tested as accepted") and the code comment "Free-text fields may quote a business contact" are implementation
  facts. They are consistent with rule 2 only where the quoted address is at the attributed organization's domain, and
  they are not adopted as governing.

### Governing evidence

DEC-003 §6; OQ-PO-DEC-001 OQ-7 items 1, 3, 4 and OQ-11 items 1–2; REQ-001 R-3.3, R-13.21; PO-DEC §2 (K1-B; unresolved
item 2); CONTRACT-REC §3, §6 item 4 (implementation facts only); K1-QUESTIONNAIRE §3; K1-PREP §C.1.

### Operational interpretation

The rule is a deterministic check, applied per evidence item:
- Each email address in the item's free-text fields is compared, by domain, with the attributed organization's
  normalized business-website domain. A match means business; anything else means personal.
- Every phone number is personal.
- Any personal contact identifier means the item is rejected under K1-B. The rejection outcome is fixed by K1-R3 (§5).
- An item with no attributed organization is already not a Client Intent Signal (OQ-3 item 2; `UNATTRIBUTED`), so no
  classification arises for it.
- This classification is never used to establish, infer or match identity. OQ-7 item 3 is unchanged.

### What this decision does NOT decide

- Contact identifiers other than email and phone (e.g. postal addresses, messaging handles, social-media profiles).
- Personal data that is not a contact identifier. Names are covered by K1-R2. Other categories are not decided.
- The technical normalization mechanics, such as subdomains, aliases, parent / affiliate domains and phone-number
  detection (including CONTRACT-REC §6.4's bare-digit-string limitation). Those belong to a future implementation
  authorization.
- How often rule 3 will reject otherwise valid evidence. EG-1 (kinds / prevalence of personal data in real quotes)
  remains open. Any later revision would require a separate Product Owner record.
- Any identifier handling outside free-text fields. CONTRACT-REC §3 behavior is unchanged.
- Any change to OQ-7, OQ-11 or DEC-003.

---

## §4 K1-R2 — Names inside otherwise verbatim evidence quotes

**Question (K1-QUESTIONNAIRE §4):** "How are names of individuals appearing inside an otherwise verbatim free-text
evidence quote to be treated?"

### Decision

1. **Name alone: no rejection.** A person's name appearing inside an otherwise valid verbatim quote does **not** cause
   rejection under K1-B and is not, by itself, a ground for rejection. The quote is retained **verbatim**. Names are not
   masked, removed, rewritten or otherwise transformed.
2. **Name + personal contact identifier.** The item is rejected under K1-B **because of the personal contact identifier**
   (as classified under K1-R1), not because of the name.
3. **Name + business contact identifier.** This is not a ground for rejection, either by reason of the name or by reason of
   that identifier (K1-R1).
4. **Name as part of an organization's name or business identity** (e.g. a business named after its owner). This is not
   a ground for rejection.
5. **Unchanged constraints that continue to govern names** (restated, not newly decided):
   - A name in a quote is never used to establish, infer or match identity (OQ-7 item 3; OQ-3 item 2).
   - A name is never used to infer anything about the named individual (DEC-003 §6; REQ-001 R-3.3).
   - The statement must be expressed by the potential client, which is an organization or a person acting in a business
     capacity (OQ-3 item 1; OQ-11 items 1–2). A quote expressing a private individual's personal-capacity need remains
     outside Client Intent Discovery under OQ-11 item 2.

**Answer to the specific question:** No. The presence of a person's name alone does not cause rejection under K1-B.

### Reasoning

- **K1-B is limited to contact identifiers.** Its wording concerns "a personal contact identifier", and PO-DEC §2 records
  that names are not covered by it. Treating a name as a K1-B rejection ground would extend K1-B, which is not reopened.
- **Verbatim retention is required.** OQ-3 item 1 (DECIDED) requires the statement to appear verbatim, and OQ-3 item 3 /
  R-3.2 require traceability to the original evidence. PO-DEC §2 records that masking "would alter the verbatim statement
  … Selecting it would require reopening OQ-3." Masking or rewriting names is therefore excluded.
- **No governing record prohibits the presence of names in evidence.** DEC-003 §6 and R-3.3 prohibit *inference* about
  named individuals, and that prohibition is preserved by item 5. Neither prohibits a name's presence in a public
  business statement.
- **OQ-11 contemplates names in business identities.** Sole traders and freelancers acting in a business capacity are
  admitted, and their business identity may include a personal name. Rejecting on names alone would conflict with that
  admission.
- **Structured name fields are a separate matter.** CONTRACT-REC §3 rejects "personal names" as structured keys. That
  concerns names supplied as identifier fields, not names inside a free-text statement, and it is unchanged.

### Governing evidence

PO-DEC §2 (K1-B; unresolved item 1; K1-C rationale); OQ-PO-DEC-001 OQ-3 items 1–3, OQ-7 item 3, OQ-11 items 1–2; DEC-003
§6; REQ-001 R-3.2, R-3.3, R-3A.3; CONTRACT-REC §3 (implementation fact); K1-QUESTIONNAIRE §4; K1-PREP §C.2.

### Operational interpretation

- Names in free-text quotes are left untouched and are not screened as a rejection ground.
- Rejection of an item containing a name occurs only if the item fails K1-B (via K1-R1) or another existing condition.
- No downstream use of a quoted name for identity, matching or individual-level inference is permitted.

### What this decision does NOT decide

- Treatment of other personal data inside quotes, such as home addresses, dates of birth or other personally identifying
  combinations. No governing record establishes them for this question, and they are not decided.
- Display, retention or deletion of quotes containing names (R-6.2; OQ-8 provider terms; PD-11).
- Any change to CONTRACT-REC §3 structured-key screening.
- Any change to OQ-3, OQ-7, OQ-11 or DEC-003.

---

## §5 K1-R3 — Relationship of K1-B to the OQ-3 item 4 privacy screen

**Question (K1-QUESTIONNAIRE §5):** "Is K1-B part of the existing privacy screen referenced by OQ-3 item 4, or is K1-B a
separate rejection condition?"

### Decision

**K1-B is part of the existing privacy screen referenced by OQ-3 item 4.**

The relationship established is exactly this:
- The K1-B condition, applied as defined by K1-R1, is a component of "the existing privacy screen (DEC-003 §6;
  CONTRACT-REC §3)" referenced by OQ-3 item 4.
- An evidence item that fails K1-B therefore fails OQ-3 item 4 ("privacy compliance").
- It is not a Client Intent Signal, and the existing `REJECTED` outcome applies (OQ-3: "existing outcomes
  `NO_INTENT_EVIDENCE`, `UNATTRIBUTED` or `REJECTED` apply").
- K1-B does **not** add a fifth OQ-3 condition. The OQ-3 text is unchanged.

### Reasoning

The decision does not rest on the shared word "privacy" or on PO-DEC rationale wording. It rests on four structural
points in the records:

1. **Common governing source.** OQ-3 item 4 identifies the screen by its governing sources, "DEC-003 §6; CONTRACT-REC §3".
   K1-B's governing basis is DEC-003 §6 ("no personal email / phone harvesting"), as recorded in PO-DEC §2. K1-B
   therefore applies a source that OQ-3 item 4 already names as constituting the screen.
2. **The gap K1-B closes was already recorded as a limit of the screen.** CONTRACT-REC §6 item 4 records the free-text
   exemption under the heading "**Privacy screen limits.**", among the record's known open questions. The deficiency
   K1-B addresses was characterized, before K1-B, as a limit of the privacy screen itself, not as a gap in some other
   condition.
3. **Same mode of operation.** The screen operates by rejection ("Violations are **rejected, never stripped**",
   CONTRACT-REC §3). K1-B is a rejection rule (PO-DEC §2) and, under K1-R2, the quote is never altered.
4. **No amendment of OQ-3.** OQ-3 defines sufficiency as "**all** of the following" four conditions. Treating K1-B as a
   separate condition would add a fifth condition outside that list, in effect amending OQ-3. Treating it as part of
   item 4's screen requires no change to OQ-3.

### Governing evidence

OQ-PO-DEC-001 OQ-3 (items 1–4 and outcome sentence), OQ-8 (cited DECIDED constraint "CONTRACT-REC §3–§4 (privacy
screen; …)"); DEC-003 §6; PO-DEC §2; CONTRACT-REC §3, §6 item 4; READINESS-001 §5 "Privacy-screen outcome" row (readiness
statement, consistent); CONFORMANCE-AUDIT O-2, §8 item 5; K1-QUESTIONNAIRE §5; K1-PREP §C.3.

### Operational interpretation

- A future implementation authorization covering K1-B must treat K1-B as part of the privacy-screen condition (OQ-3
  item 4), with outcome `REJECTED`.
- This discharges the CONFORMANCE-AUDIT §8 item 5 requirement that the relationship be stated explicitly. It
  authorizes nothing.

### What this decision does NOT decide

- Where or how the screen is implemented (adapter level, provider-contract level or elsewhere), or any privacy
  architecture change.
- Whether or how CONTRACT-REC or any other implementation record is updated.
- Any other component of the privacy screen. All other components are unchanged.
- Any change to the OQ-3 text or conditions.

---

## §6 Dependencies remaining open

| Dependency | Status (per records) | Relevance |
|---|---|---|
| PD-1 implementation scope / authorization | PENDING (READINESS-001 §9) | Prerequisite to any implementation, including K1-B / K1-R1..K1-R3 |
| PD-2 evidence-class representation | PENDING | K-4 (unchanged) |
| PD-3 service-category vocabulary / matching beyond D3 | PENDING | K-2 (unchanged) |
| PD-6 expressed vs observed time | PENDING | K-3 / K-7 related (unchanged) |
| PD-8 new source family | PENDING | K-5, K-6/A1 (unchanged) |
| PD-9 provider authorization | PENDING | K-6/A1 (unchanged) |
| S14 applicability to LinkedIn lead-form responses (EG-5) | OPEN EVIDENCE GAP (PROVIDER-EVIDENCE-001 §7; RECON-001 §3) | K-6/A1 (unchanged) |
| EG-1 kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP | Impact of K1-R1 rule 3 (phones; non-organization domains) on evidence volume is unknown |
| EG-4 authorization basis for non-AI-platform FIRST_PARTY sources | OPEN EVIDENCE GAP | K-6/A1 (unchanged) |
| CONTRACT-REC §6.3 non-persisted provenance (incl. `capturedAt`) | Open question | K-7 (unchanged) |

## §7 Explicit non-decisions

This round did **not** decide:
- implementation authorization (PD-1);
- validation;
- participant contact;
- provider access or provider authorization;
- LinkedIn lead-form classification (K-6/A1 remains K6-C);
- S14 applicability;
- any unrelated privacy policy, including personal data other than email / phone contact identifiers and names inside
  free-text quotes;
- PD-2, PD-3, PD-6, PD-8 or PD-9.

## §8 Implementation boundary

**These Product Owner decisions do not authorize implementation.** PD-1 remains a separate prerequisite.

```text
K1-R1: DECIDED — email at the attributed organization's normalized business-website domain = business; all other email and all phone numbers = personal (K1-B applies)
K1-R2: DECIDED — name alone is not a rejection ground; quote retained verbatim; rejection only via K1-B identifier or other existing condition
K1-R3: DECIDED — K1-B is part of the OQ-3 item 4 privacy screen; failure → REJECTED; OQ-3 unchanged

Existing decisions reopened / amended / superseded: NONE

Implementation authorization: NONE
Production / test / schema / migration / API / UI / requirement changes: NONE
Validation authority: NONE
Participant / outreach contact authority: NONE
Provider-call authorization: NONE
External research authorization: NONE
Database authority: NONE
Deployment authority: NONE

Files created: 1 (this record)
Existing records modified: 0
Provider calls / external HTTP: 0
Commits / pushes: 0
```
