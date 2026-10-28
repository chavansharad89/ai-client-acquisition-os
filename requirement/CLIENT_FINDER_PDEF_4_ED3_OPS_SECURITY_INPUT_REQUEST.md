# Client Finder / PDEF-4 — ED-3 Operational Input Request (to Ops/Security)

**Record ID:** `CLIENT-FINDER-PDEF-4-ED3-OPS-SECURITY-INPUT-REQUEST-001`
**Date:** 2026-10-05
**Addressed to:** Ops/Security (or, absent a dedicated Ops/Security function, the Product Owner acting in that
capacity).
**Companion to:** `CLIENT-FINDER-PDEF-4-ED3-OPERATIONAL-INPUT-DECISION-PREPARATION-001` (full analysis; this
document extracts only the request itself so it can be sent as-is).
**Type:** Operational-data request. **Grants no implementation, decision, deployment, release, or launch
authority.** Requests facts; decides nothing; invents no value.

---

## 1. What this is

PDEF-4's launch-gate instrumentation (PCG-1/2/3A/3B) needs to exclude internal/QA traffic from its visitor,
buyer, and conversion counts before those counts can be trusted for a launch decision. The exclusion
*mechanism* is already engineering-decided — a narrow, known-identifier allowlist (not a behavioral heuristic) —
so this request is **not** asking you to choose a design. It is asking you to supply the concrete values that
mechanism needs, which do not exist anywhere in this codebase today.

## 2. What is needed from you

Please supply **one or both** of the following (either is sufficient to start; both gives fuller coverage):

1. **Internal/QA IP range(s), in CIDR notation** — e.g. office/VPN egress ranges, internal test infrastructure —
   that should be excluded from visitor/conversion counts:
   `PRODUCT_OWNER_SUPPLIED_IP_CIDR: [PENDING INPUT]`

2. **Known QA/test account identifier(s)** — however accounts are identified in this system (e.g. user id,
   email) — for accounts used for internal testing that should be excluded:
   `PRODUCT_OWNER_SUPPLIED_QA_ACCOUNT_IDENTIFIER: [PENDING INPUT]`

3. **Which of the above should be implemented first**, if you'd rather phase it: IP-based, account-based, both
   at once, or neither right now:
   `IMPLEMENTATION_PRIORITY: [PENDING INPUT]`

**Note (2026-10-06):** Per `CLIENT_FINDER_PDEF_4_ED3_SOLO_OPERATOR_AUTHORITY_CONFIRMATION.md`, no dedicated
Ops/Security function exists for this project; the Product Owner/operator (Sharad Chavan) is supplying the three
fields above personally, in the capacity this document's own addressee line (§"Addressed to") already
contemplates. The three placeholder lines above are left as `[PENDING INPUT]` until the Product Owner/operator
fills in the actual values — no value is guessed or inferred here.

## 3. What happens with this input

Once supplied, engineering builds the already-designed allowlist filter against these values as ordinary
implementation work — no further Product Owner or engineering-design decision is required. No code or schema
change is made until these values are received; no placeholder or example value is used in the interim.

## 4. Why this can't be filled in without you

This repository has no org chart, infrastructure inventory, or account registry engineering can read these
values from — they are operational facts only Ops/Security (or whoever administers this system's
infrastructure/accounts) can supply. Nothing here is being withheld by engineering; it genuinely does not exist
in the repository to look up.

## 5. Scope note

This request does not reopen ED-3's architecture, does not affect PCG-4/5/6 (monitoring gates, unaffected by
ED-3), and does not by itself authorize deployment, release, or launch — those remain governed separately
(`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §9).

---

**Status: SENT/PENDING — awaiting §2 values from Ops/Security (no dedicated Ops/Security function exists; the
Product Owner/operator is supplying them personally per the addressee clause above and
`CLIENT_FINDER_PDEF_4_ED3_SOLO_OPERATOR_AUTHORITY_CONFIRMATION.md`). No code, schema, or governance change occurs
until the §2 fields are filled in with actual values.**
