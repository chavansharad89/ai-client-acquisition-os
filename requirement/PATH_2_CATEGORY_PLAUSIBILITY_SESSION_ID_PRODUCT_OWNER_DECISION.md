# Path 2 — Category Plausibility

## Session ID Mechanism for D11-H / Companion Record — Product Owner Decision Record

**Decision ID:** SESSION-ID-PO-DEC-001
**Status:** **SESSION-ID-PO-DEC-001 — DECIDED** (2026-09-28)
**Previous status:** SESSION-ID-PO-DEC-001 — PENDING PRODUCT OWNER DECISION
**Selected option:** **A — Facilitator-assigned Session ID**
**Authority granted by this record:** the Session ID and session-date recording mechanism only (see §5)
**Preparation record:** `PATH_2_CATEGORY_PLAUSIBILITY_SESSION_ID_PRODUCT_OWNER_DECISION_PREPARATION.md` (sha256 `8c4c04d75c2f2d82…`), kept unchanged for traceability
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
SESSION ID MECHANISM ...... DECIDED (SESSION-ID-PO-DEC-001) — OPTION A
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — NOT PERFORMED
E1 / E2 / E3 .............. NOT AUTHORIZED BY THIS RECORD
A-11 ...................... NOT CLOSED BY THIS RECORD
```

This record decides the Session ID mechanism only. It is a governance decision. It changes no
code, test, schema, migration, configuration, dependency, or existing governance record.

The preparation record still reads "PENDING PRODUCT OWNER DECISION". Its text is not edited. This
record supersedes that status.

---

### 1. Decision Question

As prepared (preparation record §1):

> What authoritative mechanism should provide the Session ID for D11-H §1 and the Companion
> Record (§1, and as a key on every §2 row), when the governing records do not currently define
> a persisted session mechanism?

Including how Gate Audit §6 ("D11-H §1 Session ID is class F (facilitator entry)") and VS-PO-DEC-001
§9.7 ("Each value is taken as observed from the persisted rows, and none is created in advance")
are to be read together.

---

### 2. Ruling — Mechanism

**Option A — Facilitator-assigned Session ID.**

At session time, the facilitator/analyst shall assign a unique Session ID and record it in:

- D11-H §1;
- Companion §1;
- every applicable Companion §2 row.

No persisted validation-session entity is required.

A-12 decision §7.3's linkage rule applies unchanged: a Companion row whose keys do not resolve to
the D11-H record for the same Session ID is invalid.

---

### 3. Ruling — VS §9.7

#### 3.1 Session ID

For this session, the Product Owner rules that the phrase "taken as observed from the persisted
rows, and none is created in advance" does not require a pre-existing persisted validation-session
entity.

The Session ID is created/assigned by the facilitator at session time, not in advance, and then
recorded in the governing session artifacts.

The Session ID is **not** observed from a persisted validation-session row. No such row exists.

#### 3.2 Session date

The session date is likewise recorded at session time by the facilitator/analyst. It is not
required to originate from a pre-existing persisted validation-session entity.

#### 3.3 Distinction preserved

This record does not merge the two governing statements. They remain distinct:

```text
Gate Audit §6 ...... classification: D11-H §1 Session ID is facilitator entry (class F)
VS §9.7 ............ requirement: values are recorded at session time; none is created in advance
```

Under this ruling, the Session ID and the session date are facilitator entries made at session
time. Neither is described as observed from a persisted validation-session row. Neither Gate §6 nor
VS §9.7 is edited.

---

### 4. Implementation Impact

```text
Application implementation required = NO
Schema change required ............. = NO
Migration required ................. = NO
New dependency required ............ = NO
New AI agent required .............. = NO
```

No application code is modified under this record.

---

### 5. Authority Boundary

This record authorizes only the Session ID and session-date recording mechanism in §2 and §3.

It does **not** authorize:

- a validation session;
- participant contact;
- provider/API calls;
- Anthropic calls;
- provider retries;
- Google Places calls;
- Google Search;
- live-source fetching;
- database access (VS §9.4 unchanged);
- SQL queries;
- new schema;
- migrations;
- new application infrastructure;
- new dependencies;
- AI agents;
- determinations;
- browser validation;
- E1/E2/E3;
- A-11 closure.

No Session ID is generated, assigned or recorded by this record. Assignment happens only at session
time, within a separately authorized session.

This record does not modify VS-PO-DEC-001, P8-PO-DEC-001, D11-H, the Companion Record, the A-12
decision, the Gate Audit (§6 or §11.8), P9, or P10.

---

### 6. Status

```text
SESSION-ID-PO-DEC-001 ..... DECIDED — OPTION A
Implementation ............ NOT REQUIRED
Schema change ............. NOT REQUIRED
Validation session ........ NOT AUTHORIZED BY THIS RECORD
```

Remaining prerequisites outside this record:

- VS §4 P6 is satisfied only when the Session ID and session date are actually recorded during or
  after the session (VS §9.3(c)).
- Every other VS-PO-DEC-001 prerequisite and limit remains as recorded there.
- E1 re-authorization (VS §7) still requires its own authorization.

---

## STOP
