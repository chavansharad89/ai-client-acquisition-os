# PATH 2 — CATEGORY PLAUSIBILITY

## Session ID Mechanism for D11-H / Companion Record — Product Owner Decision Preparation

**Decision ID (reserved):** SESSION-ID-PO-DEC-001
**Status:** **PENDING PRODUCT OWNER DECISION**
**Parent records:** `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md`
(VS-PO-DEC-001) §4 P6, §9.3(c), §9.7; `PATH_2_CATEGORY_PLAUSIBILITY_P8_PARTICIPANT_BLINDING_PRODUCT_OWNER_DECISION.md`
(P8-PO-DEC-001) §3.4
**Repository HEAD at drafting:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
SESSION ID MECHANISM ...... PARTIALLY DEFINED — OPEN (P8-PO-DEC-001 §3.4)
VALIDATION SESSION ........ AUTHORIZED WITHIN VS-PO-DEC-001 §9 LIMITS — NOT YET PERFORMED
```

This record prepares a decision. It makes no decision, ranks no option and recommends nothing.
It does not modify VS-PO-DEC-001, P8-PO-DEC-001, D11-H, the Companion Record, the A-12 decision,
or the Gate Audit. No earlier Session ID decision or preparation record exists.

---

## 1. Decision question

> What authoritative mechanism should provide the Session ID for D11-H §1 and the Companion
> Record (§1, and as a key on every §2 row), when the governing records do not currently define
> a persisted session mechanism?

This includes how the following two statements are to be read together:

```text
Gate Audit §6 ...... D11-H §1 Session ID is class F (facilitator entry)
VS-PO-DEC-001 §9.7 . "Each value is taken as observed from the persisted rows,
                      and none is created in advance"
```

## 2. What the records establish

### 2.1 Defined

| Fact | Source |
|---|---|
| D11-H §1 has a "Session ID" field, blank until the session | D11-H §1 |
| Companion §1 has a "Session ID" field that must match D11-H §1 | Companion §1 |
| Every Companion row must carry Session ID as a key; a row whose keys "do not resolve to the D11-H record for the same Session ID is invalid" | A-12 decision §7.3 |
| A Session ID and session date must be recorded in D11-H §1 and mirrored in Companion §1 | VS §4 P6 |
| P6 is satisfied during or after the session, not before | VS §9.3(c) |
| The facilitator/analyst records the Session ID at session time | VS §9.7 |
| The Session ID is required before E1 can be re-authorized | VS §7 item 1 |

### 2.2 Not defined

- Who or what creates the Session ID.
- Where its authoritative value originates.
- Where it is persisted before it is written into D11-H and the Companion.
- How the facilitator obtains it.
- Whether manually generating or assigning one is authorized.

### 2.3 Conflict / ambiguity

- Gate Audit §6 classes the field as facilitator entry (F). This is an audit classification, not
  an authorization.
- VS §9.7 says values are "taken as observed from the persisted rows" and "none is created in
  advance". No persisted row carries a Session ID.
- The same §9.7 sentence also covers the **session date**, which likewise has no persisted-row
  source.
- No record states which of Gate §6 and VS §9.7 governs where they differ.

### 2.4 Repository facts (read-only inspection)

- No `session_id`, `validation_session` or `validationSession` exists in any migration, package,
  application or test source. There is no persisted validation-session entity.
- The only "session" in the application is the login/authentication session (migration 0012,
  `core-identity`). Its raw token is a secret credential and is stored only as a hash. It is not a
  validation Session ID and is not considered as one here.
- The application does generate and persist identifiers the authorized Opportunity detail page
  shows: Opportunity ID, Search ID, Prospect ID and Determination ID. Each is already a separate
  Companion key.

## 3. Options

Listed without ranking. Each describes consequences only.

### Option A — Facilitator-assigned identifier

- **Mechanism:** at session time, the facilitator/analyst assigns a unique Session ID and records
  it in D11-H §1 and Companion §1 (and on every §2 row).
- **Consequences:**
  - It matches Gate §6's facilitator-entry classification.
  - It is not "taken as observed from the persisted rows" (VS §9.7). It is also not "created in
    advance" if assigned at session time.
  - Its uniqueness and format rest on the facilitator. Nothing in the application records or
    checks it.
- **Implementation impact:** no implementation. No schema change.
- **Governance impact:** a governance clarification is required on how VS §9.7's
  "taken as observed from the persisted rows" applies to the Session ID (and to the session date).
  VS §9.10 withholds changes to D11-H's structure; this option needs none.

### Option B — Existing application-generated identifier

- **Mechanism:** no dedicated application mechanism for a validation Session ID exists. The only
  possible existing source is to **designate** an already-persisted identifier, observable through
  the authorized application surface, as the Session ID.
- **Consequences:**
  - The value would be observed from persisted rows, as VS §9.7 describes.
  - The authorized session allows up to 2 Searches, so it may involve two Search IDs and several
    Opportunity/Prospect/Determination IDs. A designation would need a rule saying which one
    identifies the session.
  - The designated value would duplicate a key the Companion already carries separately.
  - The value exists only after the application creates it during the session. That is consistent
    with VS §9.3(c).
  - Login session tokens are excluded: they are secret and unrelated.
- **Implementation impact:** existing mechanism sufficient (the values are already shown on the
  Opportunity detail page and Search page). No schema change.
- **Governance impact:** a Product Owner designation rule is required. A-12 §7.3's linkage rule
  still applies unchanged.

### Option C — New persisted validation-session mechanism

- **Mechanism:** a first-class validation-session identifier created and persisted by the
  application.
- **Likely schema impact:** a new table or column, and a migration. How Searches or
  determinations are associated with the session would also need defining.
- **Application impact:** creating, persisting and displaying the identifier through an
  authorized surface. It must not create a human direct-database path (VS §9.4).
- **Governance impact:** VS-PO-DEC-001 §9.10 withholds "any code, test, schema, migration or
  configuration change", so this needs separate implementation and schema authorization. It must
  be implemented and conformance-checked before the session.
- **Implementation impact:** implementation authorization required; schema authorization
  required.

### Other mechanisms

The governing records support no other materially different mechanism.

## 4. Impact summary

| Option | No implementation | Existing mechanism sufficient | Implementation authorization required | Schema authorization required | Governance clarification required |
|---|---|---|---|---|---|
| A | Yes | — | No | No | Yes (VS §9.7 reading) |
| B | Yes | Yes | No | No | Yes (designation rule) |
| C | No | No | Yes | Yes | Yes (VS §9.10 withholds it) |

## 5. Product Owner questions

1. Which mechanism provides the Session ID for D11-H §1 and the Companion Record: facilitator
   assignment (A), designation of an existing application identifier (B), or a new persisted
   mechanism (C)?
2. How does VS §9.7's "taken as observed from the persisted rows, and none is created in advance"
   apply to the Session ID, and to the session date that the same sentence covers?
3. Only if B: which existing identifier, and which one when the session has two Searches?
4. Only if C: is implementation and schema work authorized, and under what limits?

## 6. What this record does NOT authorize

- no validation session;
- no participant contact;
- no provider calls;
- no Google Places calls;
- no live fetching;
- no database access (VS §9.4 unchanged);
- no code changes;
- no schema changes;
- no Session ID may be generated, assigned or recorded under this record.

## 7. Product Owner decision

```text
STATUS ............ PENDING
OPTION SELECTED ... —
```

## STOP
