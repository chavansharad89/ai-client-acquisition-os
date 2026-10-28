# CLIENT INTENT DISCOVERY

## Code-Gap K-1 Implementation Semantics K1-I1 … K1-I6 — Product Owner Decision (Questionnaire Answers)

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-001
**Date:** 2026-10-02
**Type:** Product Owner decision record (governance only). Not an implementation authorization.

> **These Product Owner decisions define policy semantics only. They do not authorize implementation.**
> **PD-1 remains the separate implementation-authorization decision.**

Abbreviations:

| Short form | Record ID / file |
|---|---|
| K1I-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-QUESTIONNAIRE-001 |
| K1I-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001 |
| K1-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 (K1-R1, K1-R2, K1-R3) |
| K1-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B) |
| OQ-DEC | OQ-PO-DEC-001 (OQ-3, OQ-7, OQ-11) |
| DEC-003 | INTENT-INTAKE-PO-DEC-003 |
| CONTRACT-REC | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| ADAPTER-REC | INTENT-SOURCE-ADAPTER-IMPL-REC-001 |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical) |
| F-n / E-n / EG-n | Fact / engineering item / evidence gap numbers of K1I-PREP §3, §6, §8 |

**Classification of statements in this record:**

| Label | Meaning |
|---|---|
| **GOVERNING FACT** | Already established by a cited record (decision text, or an implementation-record / code fact, identified as such) |
| **PO POLICY (this record)** | A new rule first decided here |
| **ENGINEERING** | How code implements the policy. **Not decided here.** |

---

## §1 Authority and scope

This record contains the Product Owner decisions for **K1-I1, K1-I2, K1-I3, K1-I4, K1-I5 and K1-I6** of K1I-Q, and for
nothing else.

- **Decision maker.** Claude Code acted as Product Owner for this decision round, under explicit delegation from the
  repository owner in session on 2026-10-02. The delegation is limited to K1-I1..K1-I6. It grants no implementation,
  validation, provider-call, research or participant-contact authority.
- **Options.** Where an answer coincides with an option listed in K1I-Q, the option label is cited. Each answer is
  stated in the Product Owner's own words. No `ANALYST PROPOSAL — NOT A DECISION` text is adopted by reference. Where
  an answer is a new Product Owner policy rather than an existing rule, it says so.
- **Reserved items filled, not reopened.** K1-DEC §3 expressly left "subdomains, aliases, parent / affiliate domains and
  phone-number detection" undecided. K1-I1..K1-I4 decide the **policy** content of those reservations. K1-R1, K1-R2 and
  K1-R3 are not reopened, amended or superseded.

## §2 Baseline (verified before deciding)

| Item | Value | Matches K1I-Q §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |
| Target file / record ID pre-existence | Neither existed | — |

| Record | sha256 (verified; unchanged) |
|---|---|
| K1I-Q | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` |
| K1I-PREP | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` |
| K1-DEC | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` |
| K1-AUDIT | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` |
| K1-Q (residual questionnaire) | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` |
| PO-DEC (original K-1 decision) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` |
| REQ-001 (canonical) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` |

**Baseline: PASS.**

**Decided starting point (unchanged):**
- K1-B: "An evidence item whose free-text quote contains a personal contact identifier is rejected." (PO-DEC §2)
- K1-R1: business email = "the **same normalized domain as the business website domain that identifies the attributed
  organization** under OQ-7"; "Every other email address and **every phone number**" = personal; public availability
  irrelevant (K1-DEC §3).
- K1-R2: name alone is not a ground; quotes verbatim, never masked (K1-DEC §4).
- K1-R3: K1-B is part of the OQ-3 item 4 privacy screen; failure → `REJECTED` (K1-DEC §5).

---

## §3 K1-I1 — Same-family hosts: subdomain and parent-domain relationship

### Decision (PO POLICY, this record)

For K1-R1 rule 2, the email domain is compared with the **website host** that the source supplied as the attributed
organization's identity (OQ-7 item 1, normalized as OQ-7 already provides):

1. **Identical host → business.** (Already decided by K1-R1 rule 2; restated.)
2. **Subdomain of that host → business.** An email domain that lies **below** the organization's normalized website
   host (e.g. website `acme.com`, email `x@mail.acme.com` or `x@sales.acme.com`), at any depth, is a business contact
   identifier.
3. **Parent host → personal.** An email domain that lies **above** the organization's normalized website host (e.g.
   website `shop.acme.com`, email `x@acme.com`) is a personal contact identifier.
4. **Sibling or any other host → personal.** An email domain that shares an ancestor with the website host but lies
   neither at nor below it (e.g. website `shop.acme.com`, email `x@mail.acme.com`) is a personal contact identifier.
5. **No registrable-domain equivalence.** Two hosts are not treated as the same because they share a registrable domain
   or public suffix. Only rules 1–2 produce "business".

Relation to K1I-Q options: rule 2 coincides with the subdomain limb of K1-I1-b; rule 3 with the parent-host limb of
K1-I1-a / K1-I1-b. K1-I1-c is not selected.

### Rationale

- **The source-supplied host is the boundary.** OQ-7 item 1 makes the website domain "supplied by the source" the only
  organization anchor. A subdomain is wholly contained within that supplied host; recognizing it is a structural
  comparison of two strings, not an inference. OQ-7 item 3's ban on inferred matching is therefore not engaged.
- **Above the supplied host, the anchor says nothing.** No record establishes that the parent of a supplied host belongs
  to the organization. A supplied host may itself sit beneath a domain operated by another party, and treating the
  parent as business would extend the anchor beyond what the source supplied. Sibling hosts are excluded for the same
  reason.
- **Consistent with K1-R1's conservative default.** K1-R1 classifies everything not shown to be within the
  organization's own domain as personal. Rules 3–5 keep that default; rule 2 recognizes only addresses that sit inside
  the supplied identity.
- **Registrable-domain equivalence rejected.** It would admit parent and sibling hosts (rules 3–4) and require
  external public-suffix knowledge to define "the organization", which no record contemplates.

### Governing evidence

GOVERNING FACT: OQ-7 items 1, 3; K1-R1 rules 2–3 and operational interpretation (K1-DEC §3); K1-DEC §3 reservation;
K1-AUDIT §7 row 1, §8; F-1 (website normalization does not reduce subdomains); DEC-003 §6.

### Operational policy meaning

- Business email ⇔ email domain equals, or is a subdomain of, the attributed organization's normalized website host.
- Every other email domain is personal under K1-R1 rule 3.
- **Website identity is unchanged.** This rule is used for K1-B classification only. It does not change OQ-7
  normalization, organization identity, unification or `findOrCreateByDomain`; a subdomain website remains its own
  identity anchor.

### Explicit non-decisions

- Email-domain canonical form (case, trailing dot, `www.`, IDN representation): E-1.
- Public-suffix data or libraries (E-11; not required by this answer), DNS, redirects (E-12).
- How "below" / "above" is computed.
- Implementation consequence: engineering specification required; no implementation choice is made by this decision.

---

## §4 K1-I2 — Different domains of the same or related organization

### Decision (PO POLICY, this record)

**No.** An email domain that is neither the attributed organization's normalized website host nor a subdomain of it
(K1-I1) is a **personal** contact identifier, whether the relationship is established or merely claimed. This applies
to every category:

| Category | Treatment |
|---|---|
| Alternate official / additional domain of the same organization | Personal |
| Alias domain | Personal |
| Other country-code or top-level variant (e.g. `acme.co.in` for website `acme.com`) | Personal |
| Parent-company domain | Personal |
| Sister-company / sister-brand domain | Personal |
| Affiliate / group-company domain | Personal |
| A relationship asserted in the evidence text itself | Does not change the classification |

Relation to K1I-Q options: coincides with **K1-I2-a**. K1-I2-b is not selected.

**Future change.** Recognizing any additional domain as business would require a separate Product Owner record. It
would also need a source-supplied basis that the current contract does not carry (F-2); that is not decided here.

### Rationale

- **One anchor.** OQ-7 item 1 defines organization identity by "the normalized business website domain supplied by the
  source", singular. The contract carries exactly one website per result (F-2). No source-supplied basis for any second
  domain exists.
- **No inference.** OQ-7 item 3 prohibits matching by "company-name similarity" or other inference. Recognizing aliases,
  sisters or affiliates without a source-supplied basis would be exactly that.
- **Claims are not identity.** A relationship asserted inside the evidence text is not source-supplied identity under
  OQ-3 item 2 / OQ-7 item 1.
- **K1-R1 rule 3 already points this way**, and this answer resolves K1-DEC §3's reservation in the same direction
  without reopening it.
- **Not decided on volume grounds.** EG-1 is open. A later Product Owner record may revisit this if evidence warrants.

### Governing evidence

GOVERNING FACT: OQ-7 items 1, 3; OQ-3 item 2; K1-R1 rule 3; K1-DEC §3 reservation; K1-AUDIT §7 row 1; F-2;
CONTRACT-REC §2.

### Operational policy meaning

The comparison set for business classification is exactly one host (plus its subdomains, K1-I1). Nothing else is
business. Whether any particular domain is "really" related to an organization is never determined for K1-B purposes.

### Explicit non-decisions

- Whether any specific domain is related to any organization.
- Any domain-discovery mechanism, contract field or storage of organizational relationships.
- Any change to OQ-7 identity or unification.
- Implementation consequence: none beyond K1-I1; no implementation choice is made by this decision.

---

## §5 K1-I3 — Non-standard renderings of email addresses and phone numbers

### Decision (PO POLICY, this record)

1. **Complete identifier in a non-standard rendering → in scope.** Any rendering that conveys a complete email address
   or phone number is a contact identifier "in any form" (K1-R1 rule 1) and is classified under K1-R1 and K1-I1 / K1-I2
   exactly as the conventional form would be. Examples: `jane [at] gmail [dot] com` (personal); `info (at) acme (dot)
   com` where the website is `acme.com` (business); a phone number written in words or with inserted characters
   (personal).
2. **Fragment that does not convey a complete identifier → not a contact identifier for K1-B.** A fragment from which no
   complete email address or phone number can be read (e.g. `jane@`, `@gmail.com`, a phone number with digits masked
   by the source) is not, by itself, a ground for K1-B rejection.
3. **Undetermined.** Where it cannot be determined whether a rendering conveys a complete identifier (e.g. `jane@gmail`)
   or how a conveyed email's domain is to be classified, **K1-I4 applies**.

### Rationale

- **"In any form" is about the identifier, not its typography.** DEC-003 §6 prohibits "personal email / phone
  harvesting". An obfuscated but complete address is as usable, and as harvestable, as a conventional one. Excluding it
  would let formatting defeat the rule.
- **A fragment is not a contact identifier.** If a complete address or number cannot be read from it, there is nothing
  that can be used to contact anyone. Treating fragments as identifiers would extend K1-B beyond "contact identifier",
  which this round may not do.
- **Domain-based classification still governs.** An obfuscated business address remains business; K1-R1 is not
  redefined.
- **Other personal data is not addressed.** Fragments may still be personal data of another kind; K1-DEC §4 leaves that
  undecided, and so does this record.

### Governing evidence

GOVERNING FACT: K1-R1 rule 1 ("in any form"); DEC-003 §6; REQ-001 R-3.3, R-3A.3; K1-DEC §3, §4 non-decisions; F-3
(current detection covers neither form; implementation fact only).

### Operational policy meaning

The policy target set is "every complete email address or phone number, however rendered". Fragments are outside the
target set. Uncertain cases go to K1-I4.

### Explicit non-decisions

- How obfuscated forms, fragments or completeness are detected (E-2, E-7).
- Treatment of non-contact personal data (K1-DEC §4).
- Implementation consequence: engineering specification required; no implementation choice is made by this decision.

---

## §6 K1-I4 — Strings that cannot be determined to be (or not to be) a contact identifier

### Decision (PO POLICY, this record)

**Uncertainty resolves toward privacy.** When a string within K1-B scope (K1-I5) plausibly is a phone number or email
address and the system cannot establish that it is **not** one, it is treated as a **personal** contact identifier and
the item is `REJECTED` under K1-B (via K1-R3).

- No new outcome is created. There is no "unresolved", "review" or "held" state. The existing `REJECTED` outcome applies.
- A string the system establishes is **not** a contact identifier (for example, because it is evidently a date, price,
  amount or labelled reference number) is not uncertain and causes no rejection.
- What counts as "plausibly" and "established" is an engineering specification matter (E-2, E-7).

Relation to K1I-Q options: coincides with **K1-I4-a**. K1-I4-b is not selected.

### Rationale

- **The two errors are not symmetric.** Under reject-never-strip (CONTRACT-REC §3) and verbatim retention (K1-R2), an
  accepted uncertain string that is in fact a phone number would be persisted verbatim in `source_quote` (F-8). That is
  the result DEC-003 §6 and REQ-001 R-3A.3 prohibit. Losing one evidence item is not prohibited by any record.
- **Consistent with K1-R1's conservative default** (every phone number personal; public availability irrelevant).
- **No new outcome.** A review / unresolved state would add an outcome beyond OQ-3's existing `NO_INTENT_EVIDENCE`,
  `UNATTRIBUTED` and `REJECTED`, which this round may not do.
- **Over-rejection is bounded.** The rule applies only to plausible identifiers, not to every number. Its volume effect
  is unknown (EG-1, CONTRACT-REC §6 item 4). If evidence later shows material loss of valid evidence, a separate Product
  Owner record may revisit this.

### Governing evidence

GOVERNING FACT: DEC-003 §6; REQ-001 R-3A.3, R-13.21; K1-R1 rule 3; K1-R2; K1-R3; OQ-3 outcome sentence; CONTRACT-REC §3,
§6 item 4; F-8; EG-1.

### Operational policy meaning

Detector ambiguity on a plausible identifier is a privacy-screen failure. Clearly non-identifier numbers are not.

### Explicit non-decisions

- Thresholds, digit counts, formats, regexes, libraries, scoring (E-2, E-7).
- Any manual-review process or new outcome.
- Implementation consequence: engineering specification required; no implementation choice is made by this decision.

---

## §7 K1-I5 — Which textual content K1-B screens

### Decision (PO POLICY, this record)

K1-B applies to the following textual content of a provider result:

1. **Always in scope: the evidence statements.** Every verbatim statement offered as intent evidence (the `evidence` /
   `statement` entries of the item) — the text that becomes the Client Intent Signal's evidence and is persisted as
   `source_quote` / `research_signals.signal` (F-8).
2. **In scope if retained: any other free text.** Any other free-text content of the item (title, snippet, notice / RFP
   body, authorization `basis`, or any other free-text field) **is in scope if the system persists it, displays it to a
   user, or passes it beyond the privacy screen as part of the signal, event or outcome**.
3. **Out of scope: transient free text.** Free text used only transiently — for example, to verify that a statement
   appears verbatim in the source (OQ-3 item 1) — and neither persisted, displayed nor passed on, is not screened by
   K1-B.
4. **Structured fields and metadata:** unchanged. They remain governed by the existing identifier screen (CONTRACT-REC
   §3): an email / `mailto:` / `tel:` / `sms:` value is rejected. K1-B adds nothing and removes nothing there.

**Contact identifier outside the evidence statement.** A personal contact identifier that appears only in transient
free text (e.g. a contact line in an RFP body, outside the quoted evidence) **does not cause K1-B rejection**. That
identifier must not be extracted, stored, displayed or used. This restates DEC-003 §6 ("no personal email / phone
harvesting"); it is not a new rule. If the same text is retained (rule 2), K1-B applies to it.

Relation to K1I-Q options: rule 1 coincides with **K1-I5-a**. Rules 2–3 are the Product Owner's own field set,
permitted by K1I-Q ("The Product Owner may state another field set in prose"). K1-I5-b is not selected.

### Rationale

- **K1-B's own wording is "free-text quote".** The decided rule targets the quote. K1-R1's "free-text evidence field"
  points the same way. K1-R1's "item's free-text fields" is read, for scope, through rules 1–2. This settles field
  scope without reopening K1-R1's classification rule.
- **The prohibited act is harvesting.** DEC-003 §6 prohibits harvesting personal email / phone. Text that is retained,
  displayed or passed on can be harvested; text used only for a containment check and discarded cannot. Rule 2 closes
  the gap if any free text is ever retained.
- **Avoids rejecting on unretained context.** Public notices commonly carry contact lines in the body (CONTRACT-REC §6
  item 4 example). Rejecting the whole item for text the system never keeps would discard valid business evidence and
  protect nothing.
- **Verbatim integrity preserved.** Nothing is stripped or masked (K1-R2; CONTRACT-REC §3). An identifier inside the
  evidence statement still rejects the item.

### Governing evidence

GOVERNING FACT: PO-DEC §2 (K1-B "free-text quote"); K1-DEC §3 (both wordings); OQ-3 item 1; DEC-003 §6; REQ-001 R-3.3,
R-3A.3; CONTRACT-REC §3, §4, §6 item 4; F-4, F-8.

### Operational policy meaning

Screened text = evidence statements + any other free text the system retains, displays or passes on. Unscreened text =
free text used only transiently, from which nothing may be extracted or kept.

### Explicit non-decisions

- Which current fields in fact meet the "retained / displayed / passed on" test, and how fields are traversed (E-9,
  E-14 and implementation work).
- Any change to persistence of `title`, `snippet`, `body` or `basis`.
- Implementation consequence: engineering specification required, including a field-by-field mapping against rules
  1–3; no implementation choice is made by this decision.

---

## §8 K1-I6 — Unit of rejection

### Decision (PO POLICY, this record)

When K1-B is triggered by any in-scope content (K1-I5) of a provider result, **the whole provider result — the source
item — becomes `REJECTED`**. The other evidence entries of that result are not evaluated into signals.

The rejection is **not broader** than the source item:
- other provider results in the same batch are unaffected ("One bad result never aborts the batch", CONTRACT-REC §2);
- any existing Company, Prospect, Opportunity or signal created from **other** source items is unaffected;
- future results from the same source or about the same organization are evaluated independently.

Relation to K1I-Q options: coincides with **K1-I6-a**. K1-I6-b is not selected.

**Defining "evidence item" for K1-B:** for K1-B, the "evidence item" that is rejected is the source item (the provider
result) as a whole. This defines the term for K1-B application only; no other record's terminology is changed.

### Rationale

- **OQ-3 evaluates the source item.** OQ-3's conditions apply "for the source item itself", and an item failing any
  condition is not a Client Intent Signal. K1-R3 places K1-B inside OQ-3 item 4. A failure therefore fails the source
  item.
- **`REJECTED` is a source-item outcome.** It exists per provider result (F-6). K1-R3 maps K1-B failure to it.
- **Partial acceptance would be stripping.** Removing the offending entry and accepting the rest alters the item that
  was supplied. That is the "strip" mode the privacy screen excludes ("rejected, never stripped", CONTRACT-REC §3).
- **Matches existing intake semantics.** ADAPTER-REC §4 records "One invalid entry rejects the whole event" and "whole
  event validated before any write" (implementation fact, consistent).

### Governing evidence

GOVERNING FACT: OQ-3 (conditions "for the source item itself"; outcome sentence); K1-R3; CONTRACT-REC §2, §3; ADAPTER-REC
§4 (implementation fact); F-6, F-9; PO-DEC §2; K1-DEC §3.

### Operational policy meaning

Logical object that becomes `REJECTED`: the provider result / source item. Nothing smaller is accepted from it, and
nothing larger is rejected.

### Explicit non-decisions

- Database deletion, transaction behavior, UI messaging, logging, retry behavior, provider-level API behavior,
  rejection-message wording (E-13), check ordering (E-10).
- Implementation consequence: engineering specification required; no implementation choice is made by this decision.

---

## §9 Cross-question consistency

| Pair / constraint | Relationship | Result |
|---|---|---|
| K1-I1 ↔ K1-I2 | K1-I1 decides hosts at, below and above the supplied website host. K1-I2 decides every domain outside that host family and all claimed relationships. Business = identical host or subdomain; everything else personal. No domain falls in both or neither. | Consistent |
| K1-I3 ↔ K1-I4 | K1-I3 classifies complete renderings (in scope) and fragments (out of scope). Anything K1-I3 cannot place goes to K1-I4, which resolves toward rejection. K1-I3 rule 3 hands off explicitly. | Consistent |
| K1-I5 ↔ K1-I6 | K1-I5 says what text can trigger K1-B; K1-I6 says what is rejected once triggered (whole source item). An identifier only in transient free text triggers nothing (K1-I5 rule 3), so K1-I6 is not engaged. | Consistent |
| K1-I4 ↔ K1-I5 | Uncertainty rejection (K1-I4) applies only to in-scope text (K1-I5). | Consistent |
| vs K1-R1 | "Personal contact identifier" is not redefined. K1-I1 and K1-I3 fill K1-DEC §3's reserved items. Business remains domain-based; all phone numbers remain personal; public availability remains irrelevant. | No conflict |
| vs K1-R2 | No masking, stripping or rewriting anywhere; names untouched. | No conflict |
| vs K1-R3 | Every rejection is the existing `REJECTED` outcome via OQ-3 item 4; no new outcome or condition. | No conflict |
| vs OQ-7 | Website identity, normalization and unification unchanged; no inference introduced. | No conflict |
| Implementation | No decision authorizes implementation. | Confirmed |

---

## §10 Engineering boundary

E-1 through E-14 (K1I-PREP §6; K1I-Q §5) **remain engineering-only** and are not decided here:

E-1 email-domain canonical form; E-2 email detection method / boundaries / punctuation; E-3 local-part handling; E-4
multiple identifiers (already decided by K1-R1); E-5 `mailto:` domain extraction; E-6 internationalized local parts; E-7
phone recognition formats / bounds / library; E-8 URI-scheme detection anywhere in text; E-9 placement of the check;
E-10 order of checks; E-11 public-suffix data (not required by K1-I1 as decided); E-12 redirect resolution; E-13
rejection-message content; E-14 test updates and fixtures.

These decisions constrain the engineering specification. For example, E-1 must not broaden matching beyond K1-I1 /
K1-I2, E-2 / E-7 must implement K1-I3 / K1-I4, and E-9 must yield the K1-I6 unit. **No implementation choice is made.**

## §11 Remaining dependencies

| Dependency | Status | Relevance |
|---|---|---|
| PD-1 implementation scope / authorization | **PENDING** (READINESS-001 §9) | Prerequisite to any implementation of K1-B, K1-R1..R3, K1-I1..I6 |
| PD-2 evidence-class representation | PENDING | Not affected |
| PD-3 service-category vocabulary / matching beyond D3 | PENDING | Not affected |
| PD-6 expressed vs observed time | PENDING | Not affected |
| PD-8 new source family | PENDING | Not affected |
| PD-9 provider authorization | PENDING | Not affected |
| S14 applicability to LinkedIn lead-form responses (EG-5) | OPEN EVIDENCE GAP | Not affected |
| EG-1 kinds / prevalence of personal data in real quotes | OPEN EVIDENCE GAP | Volume effect of K1-I1, K1-I2, K1-I4 and K1-I6 unknown |
| CONTRACT-REC §6 item 4 bare-digit limitation (EG-CR-4) | OPEN (implementation) | Engineering input to K1-I4 |

None is resolved by this record.

## §12 Explicit non-decisions

This round does **not** decide:
- implementation authorization (PD-1);
- validation authorization;
- provider calls or provider authorization;
- external research;
- participant contact;
- engineering implementation details (E-1..E-14);
- unrelated privacy policy, including personal data other than email / phone contact identifiers (K1-DEC §3, §4
  non-decisions stand);
- previously decided K1-R1, K1-R2, K1-R3 (not reopened);
- PD-2, PD-3, PD-6, PD-8, PD-9, S14;
- any change to OQ-3, OQ-7, OQ-11, DEC-003, CONTRACT-REC or ADAPTER-REC.

---

## Implementation boundary

**These Product Owner decisions define policy semantics only. They do not authorize implementation.**
**PD-1 remains the separate implementation-authorization decision.**

```text
K1-I1: DECIDED — identical website host or any subdomain of it = business; parent, sibling and other hosts = personal; no registrable-domain equivalence
K1-I2: DECIDED — alias / additional / ccTLD-variant / parent-company / sister / affiliate domains = personal, whether established or claimed (K1-I2-a)
K1-I3: DECIDED — complete identifiers in any rendering (incl. obfuscated) in scope; fragments conveying no complete identifier not a K1-B ground; undetermined → K1-I4
K1-I4: DECIDED — plausible identifier not established as non-identifier → treated as personal → REJECTED; no new outcome (K1-I4-a)
K1-I5: DECIDED — evidence statements always screened; other free text screened if persisted, displayed or passed on; transient-only text not screened (no extraction or use permitted); structured fields unchanged
K1-I6: DECIDED — the whole provider result (source item) is REJECTED; nothing broader (K1-I6-a)

Existing decisions reopened / amended / superseded: NONE
Engineering items decided: NONE (E-1..E-14 remain engineering-only)

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
