# Phase 24 — R-70 / R-71 Final Decision & Scope Lock

**Status:** DECISION RECORD — IMPLEMENTATION ACCEPTED, BOUNDED
**Supersedes (for acceptance purposes only):** `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`'s
"PROPOSED — AWAITING EXPLICIT IMPLEMENTATION APPROVAL" state. That document is left
unmodified; this document records what was actually implemented and the decisions made
about it. Where the two differ, this document is authoritative for Phase 24's *current*
status; the scope-lock document remains the historical record of what was proposed before
implementation began.
**Basis:** the Phase 24 implementation (`packages/core-opportunity/src/adapters.ts`,
`packages/core-opportunity/src/service.ts`, `apps/worker/src/searchWorker/worker.ts`) and
the read-only architecture audit performed against that implementation in this session
(tracing `adapters.ts`, `service.ts`, `core-research/src/{schema,types,provenance,
sourceDocumentProvider,mapping,service,researcher,provider,anthropicResearchProvider}.ts`,
`core-discovery/src/{normalize,service}.ts`, `adapters.test.ts`, and four Postgres-gated
integration tests).
**Frozen:** Phases 18–23, unchanged by this document.

---

## 1. Scope of this document

This is a decision/scope-lock record, not a new implementation. It documents:
- what R-70 and R-71 actually guarantee, as implemented;
- what they do not guarantee, precisely;
- why a naive source-domain fix is not adopted now;
- what remains an open product decision (Scenario E);
- what is explicitly deferred, and to where.

No code, test, schema, or configuration change is made by this document.

---

## 2. R-70 — settled decision

```text
R-70 STATUS:
IMPLEMENTED — BOUNDED MVP CONTROL
```

> The implementation does **not** constitute a complete source-document-to-business
> attribution guarantee.

**Exact guarantee, as implemented** (`packages/core-opportunity/src/adapters.ts`,
`hasConflictingSource` / `conflictsWithBusiness` / `selfIdentifiedBusiness`):

```text
A Prospect's evidence set is excluded from offer/need detection when a persisted
signal or cited quote contains the supported leading self-identification mismatch
pattern.
```

No broader claim is made. In particular, this document does not claim that R-70 rejects
all wrong-business sources — the audit explicitly disproved that broader guarantee (§3).

---

## 3. R-70 — recorded limitation

### Not guaranteed

R-70 does **not** currently guarantee rejection of:

```text
1. Wrong-business sources with no self-identification.
2. Wrong-business sources whose name shares the relevant first token.
3. Wrong-business sources whose content is ambiguous.
4. Any attribution case that cannot be established from persisted signal/quote data.
```

These are the failure modes the audit actually traced through the implementation
(`adapters.ts`'s `LEADING_SELF_ID` regex and `primaryNameToken`'s first-word-only
comparison), not hypothetical additions:

- A source whose text never carries a leading `"Name. "`-shaped clause is invisible to
  the check by construction — silence is treated as a pass.
- Two businesses that share a first name-token (e.g. two businesses both starting with
  the same word) can defeat the mismatch comparison, because `primaryNameToken` compares
  only the first alphabetic token of each name.
- Any correspondence question the leading-clause pattern does not parse (subsidiary
  language, brand-name language, third-party mentions) is simply not evaluated either way.

---

## 4. Why domain matching is not the current fix

Traced through the implementation:

```text
sourceUrl
    ↓
constructed from normalizedDomain
    (packages/core-research/src/sourceDocumentProvider.ts:
     fetches exactly https://${target.normalizedDomain})
    ↓
normalizedDomain was already supplied by discovery
    (packages/core-discovery/src/normalize.ts: normalizedDomain is
     normalizeDomain(candidate.website), set once at Discovery time)
```

Therefore, at the point R-70 runs (Opportunity creation):

```text
persisted sourceUrl == target.normalizedDomain
```

by construction, in every case the current pipeline can produce — there is no second,
independently observed value for a domain comparison to disagree with. This is not
independent evidence that the source actually belongs to the business; it is an echo of
the same field.

The original incident this control exists for (a business name paired with the wrong
website) is a Discovery-time association defect. A comparison of the target's own domain
against a value derived from that same domain cannot detect that the pairing was wrong in
the first place — the audit found this would be **tautological** against the specific
incident that motivated R-70.

```text
Phase 24:
NO naive domain-equality fix
```

---

## 5. This is not a scraper decision

```text
Scraper:
NOT PART OF PHASE 24

Discovery provider:
UNCHANGED

Source acquisition:
UNCHANGED

Phase 18 homepage-only boundary:
UNCHANGED
```

A scraper, or an alternative source-acquisition mechanism, may be considered in a future,
separate architecture phase. It must not be described as the R-70 fix: acquisition (what
gets fetched) and attribution (whether what was fetched corresponds to the target
business) are different problems, and a scraper only addresses the former.

```text
A scraper is not inherently a source-attribution mechanism.
```

No claim is made that a scraper would reduce LLM cost — that would require separate
measurement this document does not perform.

---

## 6. Stronger future R-70 path — deferred candidate

**Candidate:**

```text
SOURCE DOCUMENT IDENTITY / ATTRIBUTION
```

Robust document-level attribution — judging whether the *actual fetched document*
corresponds to the target business, rather than relying on the document's own
self-identifying language — would need information the current architecture does not
retain past the research call: the full extracted source-document text is available only
in-memory, inside `researcher.ts`/`anthropicResearchProvider.ts`, and is discarded once
`research()` returns; it is never persisted. Making that information available where R-70
currently runs (`core-opportunity`, after persistence) would require extending what
Phase 18 persists — reopening a boundary Phase 24 does not currently touch.

```text
Status:
DEFERRED

Authorization:
NONE

Implementation:
NONE
```

No schema is designed here, and no migration requirement is specified beyond noting that
the Phase 18 persistence boundary would need explicit, separate re-opening before this
candidate could be implemented.

---

## 7. R-71 — final contract

**Settled guarantee:**

> A purely topical/descriptive claim must not become offer-eligible merely because a
> service keyword appears.

**Current excluded (topical) fields**, reproduced directly from the research schema
(`packages/core-research/src/schema.ts`) via `adapters.ts`'s `TOPICAL_FIELDS`:

```text
companySummary
businessModel
targetCustomers
```

**Current problem/opportunity fields** (offer-eligible):

```text
visibleProblems
growthOpportunities
aiOpportunities
websiteIssues
contentOpportunities
automationOpportunities
```

This taxonomy is confirmed directly from the research schema's own field structure — it is
not a new classification invented for R-71.

**Recorded limitation:**

> R-71 does not independently determine whether a problem-field claim is semantically
> relevant to the caller's specific service. Existing downstream keyword matching
> (`suggestOffers()`) still participates in that determination.

R-71 is not expanded by this document.

---

## 8. R-71 — future regression risk (recorded, not fixed)

```text
TOPICAL_FIELDS is currently an exclusion/denylist.

A future new topical research field could become offer-eligible unless
core-opportunity is updated at the same time.
```

This is a known future architectural improvement (e.g. deriving the topical/problem
distinction structurally rather than by an enumerated set), not Phase 24 scope.

---

## 9. Scenario E

```text
Scenario E:
OPEN PRODUCT DECISION
```

**Current behavior**, as implemented (`adapters.ts`'s `toOfferSignals` excludes only
`UNKNOWN`; `service.ts`'s `createOpportunityForOwner` sets `needDetected` from whatever
`suggestOffers()` returns over that classification-unfiltered set):

```text
INFERRED-only
→ needDetected = true
→ QUALIFIED
```

This is current, incidental behavior — a consequence of R-70/R-71 being applied identically
regardless of classification — not a settled product rule.

This document does not choose OBSERVED-only, does not decide INFERRED is sufficient, does
not invent a confidence threshold, and does not invent a corroboration rule.

**Unresolved product question, recorded verbatim:**

> Should INFERRED-only evidence, without corroborating OBSERVED evidence, be sufficient to
> reach QUALIFIED, and if so under what minimum confidence/corroboration condition?

---

## 10. Phase 24 acceptance state

| Area               | Status                | Scope                                |
| ------------------ | ---------------------- | ------------------------------------- |
| R-70               | IMPLEMENTED — BOUNDED  | Self-identification mismatch control  |
| R-71               | IMPLEMENTED            | Topic-vs-problem field gate           |
| Scenario E         | OPEN                   | Product decision required             |
| Discovery provider | FROZEN                 | No change                             |
| Source acquisition | FROZEN                 | No change                             |
| Scraper            | OUT OF SCOPE           | Future consideration                  |
| New provider       | OUT OF SCOPE           | None                                  |
| Additional LLM     | OUT OF SCOPE           | None                                  |
| Schema/migration   | OUT OF SCOPE           | None                                  |
| API spend          | NONE                   | Zero-cost verification                |
| Phase 18 boundary  | UNCHANGED              | No reopening                          |

---

## 11. Terminology constraint

Use:

```text
R-70:
IMPLEMENTED — BOUNDED MVP CONTROL
```

Do not use:

```text
R-70:
FULL SOURCE ATTRIBUTION
```

Do not claim:

```text
all wrong-business sources are rejected
```

The audit this document is based on explicitly disproved that broader guarantee (§3).

---

## 12. Future decisions required

Only the following three are recorded. None is decided by this document.

### Decision 1 — Stronger R-70 attribution

Whether to reopen the Phase 18 source-document persistence boundary to support stronger,
document-level attribution (§6).

### Decision 2 — Scenario E

Whether INFERRED-only evidence can qualify, and under what confidence/corroboration rule
(§9).

### Decision 3 — Future acquisition/cost architecture

Whether to investigate scraping or alternative source acquisition as a separate,
independent cost-reduction initiative (§5) — not as an R-70 fix.

---

## 13. Authorization state

```text
PHASE 24 — DECISION / SCOPE LOCK

R-70:
BOUNDED MVP CONTROL ACCEPTED

R-71:
IMPLEMENTED WITH EXPLICIT BOUNDARY

Scenario E:
OPEN PRODUCT DECISION

Stronger R-70 attribution:
DEFERRED

Scraper:
NOT PHASE 24

Production implementation:
NO NEW CODE (this document)

Commit:
NONE
```
