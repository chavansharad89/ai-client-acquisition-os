// Search bounded-retry policy (R-34, Phase 17 scope-lock RESOLVED DECISIONS
// §2). Fixed by explicit product decision — not configurable via
// environment or deps, unlike apps/worker/src/metaEvents' own
// (independently configurable) attempt budget, which governs a different
// domain (Meta CAPI delivery) and must not be coupled to this one.

/**
 * Maximum automatic attempts per Search. On the attempt that reaches this
 * count, a failure is terminal (FAILED) rather than requeued to PENDING.
 * A worker crash (lease expiry) does not count against this budget — see
 * SearchRepository.releaseExpiredLeases.
 */
export const MAX_SEARCH_ATTEMPTS = 3;
