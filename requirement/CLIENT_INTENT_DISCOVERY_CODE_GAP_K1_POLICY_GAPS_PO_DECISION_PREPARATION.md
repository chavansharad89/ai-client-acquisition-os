# CLIENT INTENT DISCOVERY — CODE-GAP K-1 POLICY GAPS PG-1 … PG-4 — PRODUCT OWNER DECISION PREPARATION

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-DEC-PREP-001
**Date:** 2026-10-02
**Type:** Product Owner decision **preparation** (governance only). Not a decision record, not an audit, not an
implementation plan, not an implementation authorization.
**Author role:** Governance / Decision-Preparation Analyst.
**Source of the questions:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 §9
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_PREPARATION.md`, "K1-ESPEC").

> **This record makes no Product Owner decision.** It does not answer, rank or recommend any option, and it
> establishes no default. **PD-1 remains PENDING. No implementation is authorized.**

**Abbreviations** (as in the governing records):

| Short form | Record ID / file |
|---|---|
| K1-ESPEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001 |
| K1I-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-001 (K1-I1..K1-I6) |
| K1I-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-DEC-CONFORMANCE-AUDIT-001 |
| K1I-Q | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-QUESTIONNAIRE-001 |
| K1I-PREP | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-IMPL-SEMANTICS-PO-DEC-PREP-001 |
| K1-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-PO-DEC-001 (K1-R1, K1-R2, K1-R3) |
| K1-AUDIT | CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-RESIDUAL-DEC-CONFORMANCE-AUDIT-001 |
| PO-DEC | CLIENT-INTENT-DISCOVERY-CODE-GAP-PO-DEC-001 (K1-B) |
| OQ-DEC | OQ-PO-DEC-001 (OQ-3, OQ-7, OQ-11) |
| DEC-003 | INTENT-INTAKE-PO-DEC-003 (`INTENT_INTAKE_MVP_AI_PLATFORM_FIRST_PARTY_AUTHORIZATION_DECISION.md`) |
| CONTRACT-REC | INTENT-SOURCE-PROVIDER-CONTRACT-REC-001 |
| ADAPTER-REC | INTENT-SOURCE-ADAPTER-IMPL-REC-001 |
| REQ-001 | `CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (canonical) |

**Labels used in this record:**

| Label | Meaning |
|---|---|
| **EXISTING RULE** | Text of a decided governing record, quoted |
| **IMPLEMENTATION FACT** | Code or implementation-record text; no governance status |
| **ANALYST OBSERVATION** | The analyst's reading; not a rule and not a decision |
| `RECORD-SUPPORTED OPTION — NOT A DEFAULT` | An alternative whose categories are established by an existing decided record |
| `OPTIONS: NONE ESTABLISHED` | No existing record establishes alternatives |
| `ANALYST PROPOSAL — NOT A DECISION` | An analyst-drafted alternative, offered only to make the question concrete |

Options are listed in no order of preference. Their order carries no meaning.

---

## §1 Purpose

This record prepares exactly four remaining Product Owner questions, identified in K1-ESPEC §9:

- **PG-1** — phone-number boundary;
- **PG-2** — treatment of `context.*` fields;
- **PG-3** — whether text carried in the pushed-result proof is "passed on";
- **PG-4** — whether K1-B applies to non-provider intake.

It prepares nothing else. K1-B, K1-R1..K1-R3 and K1-I1..K1-I6 **remain DECIDED** and are background constraints only.

## §2 Authority boundary

- This record makes **no** Product Owner decision. It answers, selects, ranks and recommends nothing, and it
  establishes no default.
- It does not reopen, amend or reinterpret K1-B, K1-R1, K1-R2, K1-R3 or K1-I1..K1-I6.
- It does not modify K1-ESPEC. K1-ESPEC's current classifications, e.g. "Transient" for `title` / `snippet` / `body` /
  `basis`, are engineering preparation and **are not decisions**.
- It grants **no** implementation, validation, provider-call, external-research, participant-contact, database or
  deployment authority.

## §3 Baseline (verified before writing)

| Item | Value | Matches K1-ESPEC §2 |
|---|---|---|
| Branch / HEAD | `feature/client-intent-discovery-complete` / `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0` | Yes |
| Staged files | 0 | Yes |
| Working tree | `M requirement/CLIENT_INTENT_DISCOVERY_REQUIREMENT.md` (pre-existing; hash unchanged); untracked records under `requirement/` only | Yes (plus K1-ESPEC itself) |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty) | Yes |
| Target files / record IDs pre-existence | Neither file nor ID existed | — |

| Record | sha256 (verified) | Matches recorded value |
|---|---|---|
| K1-ESPEC (engineering-spec preparation) | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` | n/a (first recording; K1-ESPEC records no hash of itself) |
| K1I-DEC (K1 PO decision) | `9d5a7e752b49747ce5a5ceac5da42651908d5fc175f8019e00d4ab7c749a5d71` | Yes |
| K1I-AUDIT (K1 conformance audit) | `bb33d7a72b03f6674ed8019951c4b2393d5c31e96c107ebef1616de9b2f3ef92` | Yes |
| K1I-Q (K1 questionnaire) | `5660c18e0347e94de7320940ded55025ef9db92e256a2878b129a220a59324e4` | Yes |
| K1I-PREP (K1 preparation) | `73b60186fa621392c149cfd49f3334422221cff4f851949e791080492c61b831` | Yes |
| K1-DEC (residual K1 decision) | `151d7280cd8bff3a4fc2a2ffafc401f649df89a54525bcc8baced5eb2ed879fc` | Yes |
| K1-AUDIT (residual K1 audit) | `311150305494d15272d5ff4a04c1301882509d5fd98ab1eed5e000227aa41d5a` | Yes |
| K1-Q (residual questionnaire) | `3984032033a14ff119a06a096642525571bcf1fc3101c98735b9571c238a8262` | Yes |
| K1-PREP (residual preparation) | `4a12683500d6fc2e5f4c81670d15c034e444e5605dab21edd45db40000c1f2b4` | Yes |
| PO-DEC (K1-B) | `d6a23d6eed9c366b35e7d50f342bbd9c3186b10ed48a727dab26a7f043ed4e70` | Yes |
| REQ-001 (canonical requirement) | `ccf88646c6400b099e3f56de28450a736225c0c700d7d130ac74fa736a2ca1b1` | Yes |
| OQ-DEC | `152a9ec976f55d0207f265aa2ef60cdef8f0410aa2f68b30f90e5f11857834fc` | Yes |
| DEC-003 | `5d77fe841e7b6320a9e8467c5b53ccc39b3b87773eddf53da981b29363da4c41` | Yes |
| CONTRACT-REC | `8c5a889034c6f635d5516894ff387d2e9a28a5aededf94ad0ede2c04afe1f459` | Yes |
| ADAPTER-REC | `93143a015334cc1d7be3f188d084583017b74b38c675c8d3396f315f1d6dcce5` | Yes |
| READINESS-001 | `a2aec7c6e23da464528c84a706f9c56aa80ef04633932da3ab20b8304b9deb26` | Yes |

**Baseline: PASS.**

**Decided background (not reopened):**

| Decision | Status | Relevance here |
|---|---|---|
| K1-B (PO-DEC §2) | DECIDED | "An evidence item whose free-text quote contains a personal contact identifier is rejected." |
| K1-R1 (K1-DEC §3) | DECIDED | Email / phone boundary; "every phone number" personal |
| K1-R2 (K1-DEC §4) | DECIDED | Names alone not a ground; quotes verbatim |
| K1-R3 (K1-DEC §5) | DECIDED | K1-B is part of the OQ-3 item 4 privacy screen; failure → `REJECTED` |
| K1-I1 / K1-I2 | DECIDED | Website host and its subdomains business; everything else personal |
| K1-I3 | DECIDED | Complete renderings in scope; fragments not a ground; undetermined → K1-I4 |
| K1-I4 | DECIDED | Plausible, not-established-otherwise identifier → personal → `REJECTED` |
| K1-I5 | DECIDED | Evidence statements always; other free text by lifecycle; structured fields unchanged |
| K1-I6 | DECIDED | Whole provider result `REJECTED` |

---

## §4 PG-1 — Phone-number boundary

### Question

> **PG-1.** For purposes of K1-B, which of the following categories of phone-like strings are phone numbers
> (contact identifiers), and which are not: (a) a local number without area or trunk code (e.g. `555-0100`);
> (b) a national number without country code; (c) an extension by itself (e.g. `ext. 204`); (d) an unformatted run of
> bare digits with no `+`, separator, label or `tel:` reference, which no exclusion establishes as a date, price, amount
> or labelled reference number?

### Policy question vs engineering question

| | Content | Who decides |
|---|---|---|
| **Policy question** | Which **categories** (a)–(d) K1-B treats as phone identifiers, as fragments (K1-I3 rule 2), or as strings to which K1-I4 applies | Product Owner (this question) |
| **Engineering question** | How software recognizes each category: patterns, separators, digit counting, exclusion recognizers, libraries | Engineering (K1-ESPEC E-4, E-7). **Not asked and not answered here.** |

This question does not ask for a digit threshold and none is proposed. If the Product Owner chooses to state a numeric
bound, it would be the Product Owner's own wording.

### Governing context

- **EXISTING RULE — K1-R1 rule 1:** "Email addresses and phone numbers in any form, including `mailto:`, `tel:` and
  `sms:` references."
- **EXISTING RULE — K1-R1 rule 3:** personal includes "**every phone number**" and "any phone number, including a
  publicly listed office or switchboard number".
- **EXISTING RULE — K1-I3 rule 1:** "Any rendering that conveys a complete email address or phone number" is in scope.
- **EXISTING RULE — K1-I3 rule 2:** "A fragment from which no complete email address or phone number can be read (e.g.
  `jane@`, `@gmail.com`, a phone number with digits masked by the source) is not, by itself, a ground for K1-B
  rejection."
- **EXISTING RULE — K1-I4:** a string that "plausibly is a phone number" and that the system "cannot establish … is
  **not** one" is treated as personal and `REJECTED`. "A string the system establishes is **not** a contact identifier
  (for example, because it is evidently a date, price, amount or labelled reference number) is not uncertain."
  "What counts as 'plausibly' and 'established' is an engineering specification matter (E-2, E-7)."
- **EXISTING RULE — K1-DEC §3, "What this decision does NOT decide":** "phone-number detection (including CONTRACT-REC
  §6.4's bare-digit-string limitation)".
- **Audit findings (record text, no decision status):**
  - K1I-AUDIT I3-F2: "'Complete' is undefined for phone numbers … Open cases include a local number without area code,
    a number without country code, and an extension alone."
  - K1I-AUDIT I4-F3: the threshold "materially determines rejection volume".
- **IMPLEMENTATION FACT — CONTRACT-REC §6 item 4:** "A phone number supplied as a bare digit string under a neutral key
  cannot be told apart from a numeric identifier".
- **IMPLEMENTATION FACT:** no phone-value detection exists in `packages/core-research`.
  - `packages/core-payments/src/schemas.ts:22` (`/^\+?[1-9]\d{7,14}$/`) is a module-private **input validator** for a
    customer-supplied phone field, built for checkout. It is **not** a governing rule and is not offered as one.
  - The test fixture value `'555-0100'` under the key `telephone` (`intentSourceProviderContract.test.ts:547`) is
    rejected by **key**, not by value. It is not evidence of any value rule.
- **No record** adopts E.164 or any numbering standard as the Product Owner's definition of a phone number.

**ANALYST OBSERVATION.** K1I-DEC delegated "plausibly" to engineering. K1-ESPEC §9 nonetheless classified this as a Product
Owner gap: categories (a)–(d) sit on the boundary between K1-I3 rule 2 (no ground) and K1-I4 (rejection), so the
answer decides which provider results are rejected. Whether the Product Owner answers PG-1 or confirms the K1-I4
delegation is itself the Product Owner's choice.

### Engineering consequence (no choice implied)

- For any category answered "phone identifier", K1-ESPEC E-4 / E-7 step 6 must detect it, and an occurrence in
  in-scope text rejects the whole provider result (K1-I6).
- For any category answered "not a phone identifier", K1-ESPEC must exclude it, and its tests must assert no rejection.
- For any category answered "K1-I4 applies", engineering defines detection within the K1-I4 direction, and tests
  record the resulting behavior.
- K1-ESPEC §8 rows P4, P5, P7, P8, U2 and U5 have no expected value until PG-1 is answered.

### Dependencies

K1-R1 (rules 1, 3); K1-I3 (rule 2 boundary); K1-I4. Reopens none of them.

### Answer options

`OPTIONS: NONE ESTABLISHED` — no existing record establishes alternatives for categories (a)–(d).

`ANALYST PROPOSAL — NOT A DECISION` — an answer form, offered only to make the question concrete. For **each** category
(a), (b), (c) and (d) independently, the Product Owner may state one of:

| Value | Meaning |
|---|---|
| P-YES | The category is a phone number (contact identifier) for K1-B |
| P-NO | The category is not a phone number for K1-B (treated like a fragment under K1-I3 rule 2) |
| P-COND | The category is a phone number only when a condition the Product Owner states in prose is present (e.g. a label, a `+`, separators) |
| P-I4 | No category rule; K1-I4 and its delegation to engineering govern |

Any combination across (a)–(d) is possible. The table is unordered and implies no preference or default.

Product Owner answer: NONE

---

## §5 PG-2 — Treatment of `context.*` fields

### Question

> **PG-2.** For K1-I5, are the provider-supplied values `context.targetCustomer`, `context.geography` and
> `context.service` free text (K1-I5 rule 2) or structured fields and metadata (K1-I5 rule 4)?

### Verified repository definitions (IMPLEMENTATION FACT)

| Definition | Location | Content |
|---|---|---|
| `IntentSourceContext` | `packages/core-research/src/intentSource.ts:97–101` | `targetCustomer: string \| null; geography: string \| null; service: string \| null;` |
| `RawSourceContext` | `packages/core-research/src/intentSourceAdapters.ts:21` | `Partial<IntentSourceContext>` |
| adapter mapping | `intentSourceAdapters.ts:23–29` | each value copied or `null` |
| provider contracts | `intentSourceProviderContract.ts:115`, `:167`, `:185` | optional `context?: RawSourceContext` on all three provider-result types |
| event | `intentSource.ts:156–164`, `:380–384` | `NormalizedIntentEvent.context`, trimmed via `optionalText`; carried on the outcome |
| screen | `intentSourceProviderContract.ts:272`, `:292` | `context` keys are not in `FREE_TEXT_KEYS`, so each value passes through `checkIdentifier` (email pattern, or `mailto:` / `tel:` / `sms:` at string start). No phone-value detection |
| persistence / display | ADAPTER-REC §5 table row "externalId, context, privacy flags | yes | not persisted"; CONTRACT-REC §4 | not persisted; no display consumer found |
| record description | ADAPTER-REC: "the context (target customer, geography, service)" | no record classifies these values as free text or structured |

No schema, column, enum or length limit constrains these values. They are unbounded optional strings.

### Governing context

- **EXISTING RULE — K1-I5 rule 2:** "Any other free-text content of the item (title, snippet, notice / RFP body,
  authorization `basis`, or any other free-text field) **is in scope if the system persists it, displays it to a user,
  or passes it beyond the privacy screen as part of the signal, event or outcome**."
- **EXISTING RULE — K1-I5 rule 4:** "Structured fields and metadata: unchanged. They remain governed by the existing
  identifier screen (CONTRACT-REC §3): an email / `mailto:` / `tel:` / `sms:` value is rejected. K1-B adds nothing and
  removes nothing there."
- **EXISTING RULE — CONTRACT-REC §3 (Values):** "any string outside the free-text fields (`title`, `snippet`, `body`,
  `statement`, `evidence`, `basis`) that is an email address or a `mailto:` / `tel:` / `sms:` reference is rejected."
  The CONTRACT-REC list is an implementation record, and K1-I5 rule 4 keeps its behavior.
- K1I-AUDIT I5-F2 (record text): "`context` | Carried forward; not a free-text key, so already screened by the
  identifier screen". This states the implementation; it decides no classification.

### Consequences (neutral)

| If the Product Owner answers… | Then |
|---|---|
| **Free text (rule 2)** | The K1-I5 lifecycle test applies. The values are passed onward on `NormalizedIntentEvent.context`, so they are in scope. K1-B applies in full: K1-R1 classification, K1-I1..K1-I4. A phone number rejects the whole result (K1-I6). An email at the website host or a subdomain does not. The existing CONTRACT-REC §3 value check for these keys would no longer be the governing screen; how the two interact is engineering. |
| **Structured (rule 4)** | The existing structured-field identifier screen applies, unchanged. Any email address (business or personal) and any `mailto:` / `tel:` / `sms:` at the start of the value rejects the result. No phone-value detection applies (CONTRACT-REC §6 item 4 limitation unchanged). K1-B adds nothing. |

Neither consequence is presented as correct.

### Engineering consequence (no choice implied)

K1-ESPEC §6 row `context.*` and §8 row L7 stay open until PG-2 is answered.

### Dependencies

K1-I5 (rules 2 and 4). The rule-4 branch depends on CONTRACT-REC §3 as preserved by K1-I5 rule 4. Reopens neither.

### Answer options

`RECORD-SUPPORTED OPTION — NOT A DEFAULT` — K1-I5 itself establishes the two categories:

| Option | Content |
|---|---|
| PG2-FT | `context.*` values are free text (K1-I5 rule 2) |
| PG2-ST | `context.*` values are structured fields / metadata (K1-I5 rule 4) |

`ANALYST PROPOSAL — NOT A DECISION`:

| Option | Content |
|---|---|
| PG2-MIX | A per-field answer: the Product Owner classifies `targetCustomer`, `geography` and `service` individually |

Unordered; no default.

Product Owner answer: NONE

---

## §6 PG-3 — Text carried in the pushed-result proof

### Question

> **PG-3.** When `title`, `snippet`, `body` or `authorization.basis` are carried through the pushed-result proof path
> solely so that the system can re-check the result before saving, does that carriage count as "passed on" (K1-I5
> rule 2) or as transient use (K1-I5 rule 3)?

### Technical data movement (IMPLEMENTATION FACT)

1. **Ingress.** A pushed result arrives at the OD-13 ingress (`apps/web/src/server/intentIngress.ts`).
   `verifyProviderEnvelope` keeps a "Private copy of the exact bytes the signature covers"
   (`providerAuthenticity.ts:171`) in a process-local `WeakMap`: "In memory only; never persisted (Q9)" (`:178`).
   The bytes are the whole result, including any `title`, `snippet`, `body` and `authorization.basis`.
2. **P2.** `normalizeVerifiedProviderResult` parses the result from those bytes and normalizes it. A `NORMALIZED`
   event's `intake.providerAuthenticity` carries the opaque proof (`intentSourceProviderContract.ts:637–642`). The
   proof exposes no text; its state is reachable only through module functions.
3. **P3.** `recordIntentIntakeForOwner` runs `requireExactProviderResultForIntake`
   (`intentSourceProviderContract.ts:690–741`).
   - When **any signal is FIRST_PARTY**, it re-parses the verified bytes and re-runs the same normalization at the
     original receipt time (X1, INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001).
   - Otherwise it returns without reading the bytes (`providerAuthenticity.ts:362`; contract `:701–702`).
4. **Not persisted, not displayed.** "Nothing here is persisted: the signature, raw bytes and verification outcome live
   only in memory for the life of the VerifiedProviderResult" (`providerAuthenticity.ts:24–27`). Ingress logs carry
   `externalId`, `field` and `reason` only.
5. **Which text is present by family.**
   - `title` / `snippet` (web) and `title` / `body` (notice) exist only for results that cannot carry FIRST_PARTY, so
     the bytes travel with the proof but are not re-read at P3.
   - `authorization.basis` exists on AI-platform results and is re-read at P3 when FIRST_PARTY is present.

### Product Owner meaning (the question)

K1-I5 rule 2 includes text the system "passes … beyond the privacy screen as part of the signal, event or outcome".
K1-I5 rule 3 excludes "Free text used only transiently — for example, to verify that a statement appears verbatim in
the source (OQ-3 item 1) — and neither persisted, displayed nor passed on". The proof physically travels with the event
past P2. Its only use is re-verification. Which of the two rules that is, is the question. The movement facts above
are not in dispute; only their policy meaning is.

**Not a decision:** K1-ESPEC §6 marks these fields "Transient (PG-3)". That is engineering preparation, not an answer.

### Engineering consequence (no choice implied)

| If… | Then |
|---|---|
| "passed on" (rule 2) | For pushed results, K1-B screens `title`, `snippet`, `body` and `basis` in addition to evidence statements. An identifier in, e.g., an RFP body contact line rejects the whole pushed result (K1-I6). Results not pushed are unaffected. |
| "transient" (rule 3) | Those fields remain unscreened on every path. K1-I5 rule 3's "must not be extracted, stored, displayed or used" continues to apply to them. |

K1-ESPEC §6 rows for these fields and §8 row L5 depend on the answer.

### Dependencies

K1-I5 (rules 2 and 3). The factual basis is OD-13 Option B and X1 (INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001); PG-3 does
not reopen them.

### Answer options

`RECORD-SUPPORTED OPTION — NOT A DEFAULT` — K1-I5 establishes the two categories:

| Option | Content |
|---|---|
| PG3-PASSED | Text carried in the proof is "passed on" (K1-I5 rule 2) |
| PG3-TRANSIENT | Text carried in the proof only for re-verification is transient (K1-I5 rule 3) |

`ANALYST PROPOSAL — NOT A DECISION`:

| Option | Content |
|---|---|
| PG3-READ | Text counts as "passed on" only where it is actually re-read after P2 (today: `basis` of FIRST_PARTY-bearing results), and is transient otherwise |

Unordered; no default.

Product Owner answer: NONE

---

## §7 PG-4 — Non-provider intake

### Question

> **PG-4.** Does K1-B apply to intake input that does not originate from a provider result, and if so, what object is
> rejected?

### Governing context

- **EXISTING RULE — K1-B (PO-DEC §2):** "An evidence item whose free-text quote contains a personal contact identifier
  is rejected."
- **EXISTING RULE — K1-I6 (K1I-DEC §8):** "for K1-B, the 'evidence item' that is rejected is the source item (the
  provider result) as a whole. This defines the term for K1-B application only; no other record's terminology is
  changed."
- **EXISTING RULE — K1-R3:** K1-B is part of the OQ-3 item 4 privacy screen.
- **EXISTING RULE — OQ-3:** conditions hold "for the source item itself". Item 4: "the item passes the existing privacy
  screen (DEC-003 §6; CONTRACT-REC §3)".
- **EXISTING RULE — DEC-003 §6:** "no personal email / phone harvesting".
- **K1I-AUDIT I6-F1:** "No record establishes that OQ-3's 'source item' is the provider result."
- **IMPLEMENTATION FACTS:**
  - `recordIntentIntakeForOwner` and `recordIntentSignalForOwner` (`apps/worker/src/searchWorker/intentIntake.ts:93`,
    `:151`) are exported from `@acos/worker` (`index.ts:9–10`). They accept a `RecordIntentIntakeInput` /
    `RecordIntentSignalInput` (`intentSignal.ts`) with no provider result behind it.
  - The doc comment says "Not reachable from any HTTP path".
  - The only runtime caller found is the OD-13 ingress, which calls `recordIntentIntakeForOwner` only after provider
    normalization (`apps/web/src/server/intentIngressIntake.ts:58`).
  - The single-signal form already rejects FIRST_PARTY because "it has no provider result behind it (OD-7 item 3)"
    (`intentIntake.ts:147–150`). So the code already distinguishes provider-derived from non-provider intake for
    another rule.
  - Intake validation (`toIntentIntakeInput`) rejects the whole intake event before any write (ADAPTER-REC §4).

**K1-I6 does not settle this question.** K1-I6 defines the rejection object for provider results. It says nothing about
input without a provider result, and this record does not read it as either including or excluding such input.

### Consequences (neutral)

| If the Product Owner answers… | Then |
|---|---|
| **YES — K1-B applies** | K1 screening applies to the non-provider intake path. The rejected object is **not** automatically the provider-result object, because none exists. The Product Owner would need to name the object (e.g. the intake event with all its signals, or something else). This creates a K1-B rejection boundary on an object K1-I6 did not define. A separate engineering mapping would be required, and K1-ESPEC E-9 / E-10 would need extending. |
| **NO — K1-B does not apply** | K1 stays bounded to provider-result processing. Non-provider intake keeps only its existing validation (no free-text value screening). |

### Engineering consequence (no choice implied)

K1-ESPEC §7 and §9 record that any K1-B check outside the provider contract waits on PG-4. The provider path is not
affected by either answer.

### Dependencies

K1-B; K1-I6 (definition limited to provider results); K1-R3 / OQ-3 item 4 (screen membership). Reopens none of them.

### Answer options

`OPTIONS: NONE ESTABLISHED` — no existing record establishes alternatives for non-provider intake.

`ANALYST PROPOSAL — NOT A DECISION` (unordered):

| Option | Content |
|---|---|
| PG4-NO | K1-B does not apply to intake input that does not originate from a provider result |
| PG4-EVENT | K1-B applies; the rejected object is the whole intake event (every signal in the input) |
| PG4-ENTRY | K1-B applies; the rejected object is the individual signal entry containing the identifier |
| PG4-OTHER | K1-B applies; the Product Owner names another object in prose |

**ANALYST OBSERVATION.** For provider results, K1-I6 did not select entry-level rejection (K1-I6-b). That decision is
bounded to provider results. It neither requires nor forbids PG4-ENTRY here, but PG4-ENTRY would be a rejection
boundary different from the provider-result one.

Product Owner answer: NONE

---

## §8 Dependency matrix (direct dependencies only)

| Question | Depends on | Does it reopen a prior decision? |
|---|---|---|
| PG-1 | K1-R1 (rules 1, 3), K1-I3 (rule 2), K1-I4 | NO |
| PG-2 | K1-I5 (rules 2, 4); CONTRACT-REC §3 as preserved by K1-I5 rule 4 | NO |
| PG-3 | K1-I5 (rules 2, 3); factual basis OD-13 Option B / X1 | NO |
| PG-4 | K1-B, K1-I6, K1-R3 (OQ-3 item 4) | NO |

PG-1..PG-4 are independent of one another. None needs another's answer first.

## §9 Evidence gaps (already established only)

| ID | Gap | Established in | Relevance |
|---|---|---|---|
| EG-1 | Kinds and prevalence of personal data in real quotes | PO-DEC §2; K1-DEC §3, §6; K1-AUDIT §7; K1I-PREP §8 | Volume effect of PG-1, PG-2 and PG-3 answers unknown |
| EG-CR-4 | Bare digit strings cannot be distinguished from numeric identifiers by the current screen | CONTRACT-REC §6 item 4; K1I-PREP §8 | PG-1 category (d) |

No new evidence gap is created.

## §10 Engineering boundary

- K1-ESPEC is preserved unchanged. Its E-1..E-13, §6 matrix, §8 test matrix and §10 engineering choices are not
  modified, adopted or overruled here.
- Detection methods, patterns, digit counting, exclusion recognizers, placement, ordering, messages and tests remain
  engineering matters. The questions above ask only for policy categories and meanings.
- A Product Owner answer to any PG-n would be an input to a later revision of the engineering specification. It would
  not be an implementation authorization.

## §11 Implementation authorization

**PD-1 remains PENDING.**

**No implementation is authorized.** Answering PG-1..PG-4 would not authorize implementation, validation, provider
calls, external research or participant contact.

```text
Record type: PRODUCT OWNER DECISION PREPARATION (governance only)

K1-B, K1-R1..K1-R3, K1-I1..K1-I6: DECIDED (not reopened)
New Product Owner questions: PG-1, PG-2, PG-3, PG-4 (only)
PG-1: Product Owner answer: NONE
PG-2: Product Owner answer: NONE
PG-3: Product Owner answer: NONE
PG-4: Product Owner answer: NONE
Defaults established: NONE   Options ranked or recommended: NONE

PD-1: PENDING
Implementation authorization: NONE
Validation authorization: NONE
Provider calls: NONE
External research: NONE
Participant contact: NONE

Files created: 1 (this record)
Existing records modified: 0
Production / test / schema / migration / API / UI changes: 0
Commits / pushes: 0
```
