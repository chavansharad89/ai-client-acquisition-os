# CLIENT INTENT DISCOVERY — CODE-GAP K-1 POLICY GAPS PG-1 … PG-4 — PRODUCT OWNER QUESTIONNAIRE

**Record ID:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-QUESTIONNAIRE-001
**Date:** 2026-10-02
**Type:** Product Owner questionnaire (governance only). Not a decision record, not an implementation authorization.
**Prepared from:** CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-POLICY-GAPS-PO-DEC-PREP-001
(`requirement/CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_POLICY_GAPS_PO_DECISION_PREPARATION.md`, "PG-PREP"), sha256
`9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d`.

> **No question in this record is answered. No option is selected, ranked or recommended. No default is assumed.**
> **An answer to any question does not authorize implementation. PD-1 remains PENDING.**

Abbreviations follow PG-PREP. K1-ESPEC = CLIENT-INTENT-DISCOVERY-CODE-GAP-K1-ENGINEERING-SPEC-PREP-001.

| Label | Meaning |
|---|---|
| **EXISTING RULE** | Decided governing text, quoted |
| **IMPLEMENTATION FACT** | Code / implementation-record text; no governance status |
| **ANALYST INTERPRETATION** | The analyst's reading; not a rule |
| `RECORD-SUPPORTED OPTION — NOT A DEFAULT` | Alternative whose categories an existing decided record establishes |
| `OPTIONS: NONE ESTABLISHED` | No record establishes alternatives |
| `ANALYST PROPOSAL — NOT A DECISION` | Analyst-drafted alternative, for concreteness only |

Options are unordered. Their order carries no meaning.

## §1 Scope

Exactly four questions: **PG-1, PG-2, PG-3, PG-4**. No other Product Owner question is posed.

K1-B, K1-R1, K1-R2, K1-R3 and K1-I1..K1-I6 **remain DECIDED** and are not reopened. The earlier K1 questionnaires
(K1-Q, K1I-Q) are not modified.

## §2 Baseline

Verified as PG-PREP §3: HEAD `2c2543b01bd9222536bbd1855f7f8537a0bb9fd0`; staged files 0; code fingerprint
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (empty). All source hashes are unchanged. Two hashes
were added for this round:

| Record | sha256 |
|---|---|
| K1-ESPEC | `60813758dab7540bf4cb7563a99afbc3dc700da0dc59befa481ba1de1bb21e3e` |
| PG-PREP | `9ae7fca776c6dd50edb6ca90fc41e6de89e4a9d7ec70b57a50e5662ca9ff8d5d` |

---

## PG-1 — Phone-number boundary

### Decision question (quoted from PG-PREP §4)

> **PG-1.** For purposes of K1-B, which of the following categories of phone-like strings are phone numbers
> (contact identifiers), and which are not: (a) a local number without area or trunk code (e.g. `555-0100`);
> (b) a national number without country code; (c) an extension by itself (e.g. `ext. 204`); (d) an unformatted run of
> bare digits with no `+`, separator, label or `tel:` reference, which no exclusion establishes as a date, price, amount
> or labelled reference number?

### Governing records

K1-DEC §3 (K1-R1 rules 1 and 3, and its non-decisions); K1I-DEC §5 (K1-I3), §6 (K1-I4); K1I-AUDIT I3-F2, I4-F3;
CONTRACT-REC §6 item 4; K1-ESPEC E-4, E-7, §9 PG-1.

### Existing rules

- K1-R1 rule 1: "Email addresses and phone numbers in any form, including `mailto:`, `tel:` and `sms:` references."
- K1-R1 rule 3: "**every phone number**" is personal.
- K1-I3 rule 2: a "fragment from which no complete … phone number can be read (e.g. … a phone number with digits
  masked by the source) is not, by itself, a ground for K1-B rejection."
- K1-I4: a string that "plausibly is a phone number" and that the system "cannot establish … is **not** one" is
  personal → `REJECTED`. "What counts as 'plausibly' and 'established' is an engineering specification matter."

### Analyst interpretation (not a rule)

- No record defines a complete phone number (K1I-AUDIT I3-F2).
- Categories (a)–(d) lie on the boundary between K1-I3 rule 2 and K1-I4, so the answer decides which provider results
  are rejected.
- The `core-payments` 8–15 digit validator is an input validator built for checkout. It is **not** a governing rule.
- E.164 is **not** assumed to be the Product Owner's definition.
- Whether to answer by category, or to confirm K1-I4's delegation to engineering, is itself the Product Owner's choice.

### Policy choice vs implementation consequence

| | |
|---|---|
| **Product Owner choice** | Which categories (a)–(d) are phone identifiers for K1-B |
| **Engineering question (not asked)** | How software detects those categories. No digit threshold is asked for or proposed. |
| **Implementation consequence** | A category answered "phone" must be detected; an in-scope occurrence rejects the whole provider result (K1-I6). A category answered "not a phone" must be excluded. K1-ESPEC §8 rows P4, P5, P7, P8, U2, U5 depend on the answer. |

### Answer options

`OPTIONS: NONE ESTABLISHED`

`ANALYST PROPOSAL — NOT A DECISION` — per category (a), (b), (c), (d), independently, one of:

| Value | Meaning |
|---|---|
| P-YES | phone number for K1-B |
| P-NO | not a phone number for K1-B (treated as a fragment, K1-I3 rule 2) |
| P-COND | phone number only when a condition stated by the Product Owner in prose is present |
| P-I4 | no category rule; K1-I4 and its delegation to engineering govern |

No default is assumed. This answer does not authorize implementation.

### Product Owner answer

Product Owner answer: NONE

---

## PG-2 — Treatment of `context.*` fields

### Decision question (quoted from PG-PREP §5)

> **PG-2.** For K1-I5, are the provider-supplied values `context.targetCustomer`, `context.geography` and
> `context.service` free text (K1-I5 rule 2) or structured fields and metadata (K1-I5 rule 4)?

### Governing records

K1I-DEC §7 (K1-I5 rules 2 and 4); CONTRACT-REC §3, §4; ADAPTER-REC §5; K1I-AUDIT I5-F2; K1-ESPEC §6, §9 PG-2.

### Existing rules

- K1-I5 rule 2: other free text "is in scope if the system persists it, displays it to a user, or passes it beyond the
  privacy screen as part of the signal, event or outcome".
- K1-I5 rule 4: "Structured fields and metadata: unchanged. They remain governed by the existing identifier screen
  (CONTRACT-REC §3) … K1-B adds nothing and removes nothing there."

### Implementation facts

- `IntentSourceContext` = `targetCustomer: string | null; geography: string | null; service: string | null;`
  (`intentSource.ts:97–101`). The values are optional on all three provider-result types (`context?:
  RawSourceContext`) and unbounded.
- They are carried on `NormalizedIntentEvent.context`. They are not persisted (ADAPTER-REC §5; CONTRACT-REC §4) and
  have no display consumer found.
- They are not in `FREE_TEXT_KEYS`, so today they pass the structured-field `checkIdentifier` screen: email, or
  `mailto:` / `tel:` / `sms:` at string start. No phone-value detection applies.
- No record classifies them as free text or structured.

### Policy choice vs implementation consequence

| If… | Consequence |
|---|---|
| free text (rule 2) | Passed onward → in scope. K1-B applies in full: a phone rejects the whole result; an email at the website host or a subdomain does not. |
| structured (rule 4) | The existing identifier screen applies unchanged: any email or leading `mailto:` / `tel:` / `sms:` rejects; no phone-value detection. |

Neither is presented as correct. K1-ESPEC §6 row `context.*` and §8 row L7 depend on the answer.

### Answer options

`RECORD-SUPPORTED OPTION — NOT A DEFAULT` (categories established by K1-I5):

| Option | Content |
|---|---|
| PG2-FT | free text (K1-I5 rule 2) |
| PG2-ST | structured fields / metadata (K1-I5 rule 4) |

`ANALYST PROPOSAL — NOT A DECISION`:

| Option | Content |
|---|---|
| PG2-MIX | per-field classification of `targetCustomer`, `geography`, `service` |

No default is assumed. This answer does not authorize implementation.

### Product Owner answer

Product Owner answer: NONE

---

## PG-3 — Text carried in the pushed-result proof

### Decision question (quoted from PG-PREP §6)

> **PG-3.** When `title`, `snippet`, `body` or `authorization.basis` are carried through the pushed-result proof path
> solely so that the system can re-check the result before saving, does that carriage count as "passed on" (K1-I5
> rule 2) or as transient use (K1-I5 rule 3)?

### Governing records

K1I-DEC §7 (K1-I5 rules 2 and 3); OQ-3 item 1; DEC-003 §6; INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001 (X1, factual
basis only, not reopened); K1-ESPEC §6, §9 PG-3.

### Existing rules

- K1-I5 rule 2: in scope if passed "beyond the privacy screen as part of the signal, event or outcome".
- K1-I5 rule 3: "Free text used only transiently — for example, to verify that a statement appears verbatim in the
  source (OQ-3 item 1) — and neither persisted, displayed nor passed on, is not screened by K1-B."

### Technical data movement (implementation facts; not in dispute)

- The ingress verifier keeps a "Private copy of the exact bytes the signature covers", "In memory only; never
  persisted (Q9)" (`providerAuthenticity.ts:171`, `:178`). The bytes are the whole result, including any `title`,
  `snippet`, `body` and `basis`.
- A `NORMALIZED` event's `intake.providerAuthenticity` carries the opaque proof to P3.
- P3 re-parses the bytes and re-runs normalization **only when a signal is FIRST_PARTY** (X1). Otherwise the bytes are
  not read.
- `title` / `snippet` / `body` belong to families that cannot carry FIRST_PARTY. `basis` belongs to AI-platform
  results.
- Nothing from the proof is persisted or displayed. Logs carry `externalId`, `field` and `reason` only.

### Analyst interpretation (not a rule)

The proof travels with the event past P2, but its only use is re-verification. Whether that is "passed on" or
"transient" is the policy meaning in question. K1-ESPEC's "Transient (PG-3)" label is engineering preparation, **not**
a decision.

### Policy choice vs implementation consequence

| If… | Consequence |
|---|---|
| "passed on" (rule 2) | For pushed results, K1-B also screens `title`, `snippet`, `body` and `basis`. An identifier there rejects the whole pushed result (K1-I6). |
| transient (rule 3) | Those fields stay unscreened on every path. Rule 3's "must not be extracted, stored, displayed or used" applies. |

K1-ESPEC §6 rows for these fields and §8 row L5 depend on the answer.

### Answer options

`RECORD-SUPPORTED OPTION — NOT A DEFAULT` (categories established by K1-I5):

| Option | Content |
|---|---|
| PG3-PASSED | carriage in the proof is "passed on" (rule 2) |
| PG3-TRANSIENT | carriage only for re-verification is transient (rule 3) |

`ANALYST PROPOSAL — NOT A DECISION`:

| Option | Content |
|---|---|
| PG3-READ | "passed on" only where the text is actually re-read after P2 (today: `basis` of FIRST_PARTY-bearing results); transient otherwise |

No default is assumed. This answer does not authorize implementation.

### Product Owner answer

Product Owner answer: NONE

---

## PG-4 — Non-provider intake

### Decision question (quoted from PG-PREP §7)

> **PG-4.** Does K1-B apply to intake input that does not originate from a provider result, and if so, what object is
> rejected?

### Governing records

PO-DEC §2 (K1-B); K1I-DEC §8 (K1-I6); K1-DEC §5 (K1-R3); OQ-DEC OQ-3 (item 4); DEC-003 §6; ADAPTER-REC §4;
K1I-AUDIT I6-F1; K1-ESPEC §7, §9 PG-4.

### Existing rules

- K1-B: "An evidence item whose free-text quote contains a personal contact identifier is rejected."
- K1-I6: "for K1-B, the 'evidence item' that is rejected is the source item (the provider result) as a whole. This
  defines the term for K1-B application only".
- K1-R3: K1-B is part of the OQ-3 item 4 privacy screen.
- OQ-3 item 4: "the item passes the existing privacy screen (DEC-003 §6; CONTRACT-REC §3)".
- DEC-003 §6: "no personal email / phone harvesting".

### Implementation facts

- `recordIntentIntakeForOwner` / `recordIntentSignalForOwner` (`apps/worker/src/searchWorker/intentIntake.ts:93`,
  `:151`) are exported and accept input with no provider result behind it. Their doc comment says "Not reachable from
  any HTTP path".
- The only runtime caller found is the OD-13 ingress, after provider normalization.
- The single-signal form already rejects FIRST_PARTY because "it has no provider result behind it (OD-7 item 3)".
- Intake validation rejects the whole intake event before any write (ADAPTER-REC §4).

### Analyst interpretation (not a rule)

K1-I6 defines the rejection object for provider results only. It does not decide whether K1-B reaches input without a
provider result, and it is not read here as including or excluding such input. A "yes" answer creates a K1-B rejection
boundary on an object K1-I6 did not define.

### Policy choice vs implementation consequence

| If… | Consequence |
|---|---|
| YES | K1 screening applies to the non-provider intake path. The rejected object is **not** automatically the provider-result object; the Product Owner must name it. A separate engineering mapping is required (extending K1-ESPEC E-9 / E-10). |
| NO | K1 stays bounded to provider-result processing. Non-provider intake keeps its existing validation only. |

The provider path is unaffected by either answer.

### Answer options

`OPTIONS: NONE ESTABLISHED`

`ANALYST PROPOSAL — NOT A DECISION` (unordered):

| Option | Content |
|---|---|
| PG4-NO | K1-B does not apply to non-provider intake |
| PG4-EVENT | K1-B applies; the whole intake event (every signal) is rejected |
| PG4-ENTRY | K1-B applies; the individual signal entry containing the identifier is rejected |
| PG4-OTHER | K1-B applies; the Product Owner names another object in prose |

No default is assumed. This answer does not authorize implementation.

### Product Owner answer

Product Owner answer: NONE

---

## §3 Dependencies (direct only)

| Question | Depends on | Reopens a prior decision? |
|---|---|---|
| PG-1 | K1-R1, K1-I3, K1-I4 | NO |
| PG-2 | K1-I5; CONTRACT-REC §3 via K1-I5 rule 4 | NO |
| PG-3 | K1-I5; factual basis OD-13 / X1 | NO |
| PG-4 | K1-B, K1-I6, K1-R3 | NO |

The four questions are independent of one another.

## §4 Answering protocol

- Answer each question in a separate Product Owner decision record. This questionnaire is not edited to record
  answers.
- Cite any option label used, and state the answer in the Product Owner's own words.
- A question may be answered with an alternative stated in prose.
- Answers must not reopen K1-B, K1-R1..K1-R3 or K1-I1..K1-I6. Any such change needs its own record.

## Governance status

```text
K1-B, K1-R1..K1-R3, K1-I1..K1-I6: DECIDED (not reopened)
Questions in this record: PG-1, PG-2, PG-3, PG-4 (only)
PG-1: NONE   PG-2: NONE   PG-3: NONE   PG-4: NONE
Defaults assumed: NONE   Options ranked or recommended: NONE

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
