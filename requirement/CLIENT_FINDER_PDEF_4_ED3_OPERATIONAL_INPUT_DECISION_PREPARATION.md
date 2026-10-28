# Client Finder / PDEF-4 — ED-3 Operational Input Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-ED3-OPERATIONAL-INPUT-DECISION-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only preparation record. **No implementation, instrumentation, validation, deployment, release, or
launch authority of any kind is granted by this document.** This record does not re-decide ED-3's architecture —
that architecture is already decided (§1 below) — and does not invent any operational value. It isolates and
classifies exactly one question: what is actually missing before ED-3 can be built, and who must supply it.

---

## 1. Baseline

| Item | Value |
|---|---|
| Branch | `feature/client-intent-discovery-complete` |
| HEAD | `af9ede93830f5e3e611195dc2451a470364def74` (unchanged by this record) |
| File created by this record | this file only |

---

## 2. The already-decided architecture (governing fact — not reopened here)

ED-3's engineering design is **already decided**, not a blocker and not an open question:

> "ED-3 | Bot/internal-traffic exclusion | **Option B** — narrow, known-identifier allowlist (internal IPs, known
> QA/test accounts) | The only mechanism that cannot, by construction, change who counts as 'qualified' under Q-1's
> decided terms (no eligibility criterion beyond funnel-entry + demonstrated intent). A behavioral heuristic
> (Option C) risks silently reopening Q-1 by excluding genuine visitors."
> — `requirement/CLIENT_FINDER_PDEF_4_INSTRUMENTATION_ENGINEERING_DESIGN_DECISION.md`, §7, row ED-3.

The implementation-conformance record independently confirms the same point, with a four-way disposition analysis
performed against the repository:

> "(D) a new Product Owner decision is required — no, **not for the mechanism itself.** Option B was already
> adopted under the Product Owner's delegated engineering-design authority. What is missing is not a design
> decision but an **operational input**: the actual list of internal IP ranges and/or known QA/test account
> identifiers to populate the allowlist with. No such list exists anywhere in this repository today, and this
> record does not invent one — inventing placeholder identifiers would produce a mechanism that silently excludes
> nothing (identical in effect to today's no-op) while *appearing* implemented, which is a worse state than the
> honest 'not yet built' this record states."
> — `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`, §3A, item (D).

That record's net finding: "ED-3 is correctly characterized as **a documented, designed-but-unimplemented gap, not
a blocker requiring a new PO ruling** — it requires an operational data input (the actual allowlist contents)
before the already-decided mechanism can be built." (§3A, "Net.")

This record does not reinterpret either of the above; it restates them as the governing basis for §3 and §4.

---

## 3. Repository fact: current implementation state (verified by reading the code)

- `grep` across `packages/core-launch-gates/src/*.ts` confirms no PCG-1/2/3A/3B/6 population query filters by
  visitor id, user id, IP address, or any identifier allowlist (conformance record §3A, item (A)).
- The data-collection routes that would need filtering are live, independent of whether any gate is read:
  `apps/web/app/api/payments/create-order/route.ts` (writes `orders`) and
  `apps/web/app/upsell/[productId]/page.tsx`'s `UpsellTracker` (writes exposure/`funnel_events` rows). An
  internal/QA visitor exercising these routes today is written into `orders`, `payments`, and `funnel_events`
  exactly like any other visitor, with no marker distinguishing them afterward (conformance record §3A, item (B)).
- No allowlist table, column, environment variable, or configuration key referencing an internal/QA
  identifier set exists anywhere in this repository as of this record (verified: no such table in
  `packages/db/prisma/schema.prisma`; no such key read in any `apps/web`/`apps/worker` config loader).
- Consequently: if `evaluateAllGates`/`recomputeBlockerGates` were wired to run today, every PCG-1/2/3A/3B/6 count
  would include any internal/QA traffic that flowed through the live routes — a real, present-tense gap, not a
  hypothetical one (conformance record §3A, item (C); §6 item 3).

---

## 4. The operational input, described by category only (not invented)

The missing input is, by category, **one or both of**:

- a) a set of internal/QA **IP ranges** (CIDR blocks) to exclude, and/or
- b) a set of **known QA/test account identifiers** (however this codebase identifies an authenticated account —
  e.g. a user id, if QA accounts are regular authenticated users) to exclude.

This record deliberately does **not** state an actual IP range, CIDR block, account id, cookie name, or any other
concrete value, because none exists in this repository and fabricating one here would misrepresent an invented
placeholder as a real operational fact — exactly the failure mode the conformance record's §3A already declined
to produce ("inventing placeholder identifiers would produce a mechanism that silently excludes nothing ... while
*appearing* implemented, which is a worse state than the honest 'not yet built'").

### 4.1 Values genuinely known from the repository

None. This record checked:

- `packages/db/prisma/schema.prisma` — no table or column representing an allowlist, internal-IP set, or
  QA-account flag.
- Environment/config loaders (`@acos/config`'s `loadEnv`, referenced by `apps/worker/src/index.ts`) — no
  `*_ALLOWLIST`, `*_INTERNAL_IPS`, `*_QA_ACCOUNTS`, or equivalently-named variable is read anywhere in
  `apps/web` or `apps/worker`.
- No `.env.example` or committed example-config entry names such a value.

**Finding: zero genuinely-known values exist in the repository for this input.** No placeholder or example value
found during this check is treated as a real operational value — none was found at all, placeholder or otherwise.

### 4.2 Values that must be supplied by the Product Owner / Operations / Security owner

- Internal/QA IP range(s) (CIDR notation), if this exclusion mechanism is to cover IP-based identification:
  _______________________________________________
- Known QA/test account identifier(s), if this exclusion mechanism is to cover account-based identification:
  _______________________________________________
- Confirmation of which of (a)/(b) above — one, both, or neither — is actually wanted for the allowlist's first
  implementation (ED-3's decided architecture permits either or both; this record does not select for the owner):
  _______________________________________________

---

## 5. Why this is not a new Product Owner policy decision

Per §2, the *architecture* (a narrow, known-identifier allowlist, Option B) is already decided and is not reopened
by this record. What remains is supplying concrete values into an already-decided mechanism — the same category of
act as supplying a real database connection string into an already-decided "read from Postgres" architecture. No
governing record is silent on *what kind* of mechanism to build; only the *values* are missing. Manufacturing a
Product-Owner-style options table with fabricated alternative architectures (e.g., "Option A: behavioral
heuristic," "Option B: allowlist," "Option C: no exclusion") would misrepresent an already-closed engineering
question as still open, and was exactly the alternative the engineering-design record's own rationale already
rejected when it chose Option B over a behavioral heuristic.

**This record therefore does not draft a Product Owner decision with selectable options.** Instead:

## 6. Implementation-authority dependency statement

**Engineering is blocked only on receiving the following operational values from Ops/Security (or, absent a
dedicated Ops/Security function, from the Product Owner acting in that capacity):**

1. The internal/QA IP range(s) (CIDR) to exclude, if IP-based exclusion is wanted — see §4.2.
2. The known QA/test account identifier(s) to exclude, if account-based exclusion is wanted — see §4.2.
3. Which of the above (one, both, or neither) should be implemented first.

**No new policy decision is needed.** Once these values are supplied, building the filter function against ED-1's
event store (as already specified) is ordinary implementation work under the existing authorization scope — it
does not require a new Product Owner ruling, a new engineering-design decision, or an amendment to any governing
record. Until the values are supplied, the honest, correct state remains "designed, not implemented" (conformance
record §3A), not a defect.

---

## 7. Effect on launch-qualification

ED-3's absence does not, by itself, change any gate's documented floor, window, or numerator/denominator
definition — it is a population-cleanliness gap (internal/QA traffic is counted like any other), not a formula
gap. The conformance record already flags it as "low risk at current scale, but a real gap before
launch-qualification use of PCG-1/2/3A/3B" (§6 item 3). This record does not reassess that risk rating; it only
isolates the exact values needed to close the gap.

---

## 8. Authority and status

This record carries no authority beyond documenting the dependency. It does not authorize building the allowlist
filter, does not authorize any schema or code change, and selects no operational value. It does not reopen ED-3's
architecture (§2) or the conformance record's disposition (§3A). It is superseded, for its single open item, the
moment Ops/Security/Product Owner supplies the values requested in §4.2/§6 — at which point building the
already-designed filter is ordinary, already-authorized implementation work, not a new decision gate.

**Status: PENDING — operational values required from Ops/Security (or Product Owner acting in that capacity).
No Product Owner policy decision is pending.**
