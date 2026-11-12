import type { ServiceProfileFields, ServiceProfileRepository, StoredServiceProfile } from '@acos/core-service-profile';

/**
 * K5-D2 (CF-PCG4-CATEGORY-PLAUSIBILITY-TEST-COVERAGE-PO-DEC-001,
 * requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md, Option
 * B — selected): test-only construction of a historical-style
 * ServiceProfile — one carrying a real, caller-chosen `targetCustomer`,
 * which no production caller can supply for a NEW search
 * (`createServiceProfile()`'s public `NewSearchServiceProfileInput`
 * accepts only `service`+`geography` — unchanged, not touched here).
 * This helper is reachable only from test code; it adds no new
 * production API, flag, or parameter.
 *
 * Exists purely so PCG-4/category-plausibility integration coverage can
 * keep exercising the real target-customer-match/category-plausibility
 * write paths end-to-end — both gated on
 * `parseTargetSegments(search.parameters.targetCustomer).length > 0`
 * (@acos/core-research) — which a NEW, system-defaulted search can
 * never satisfy.
 *
 * Calls the repository layer directly, exactly the way
 * `createServiceProfile()` itself does internally
 * (`deps.profiles.create(userId, fields, now)`) — bypassing only
 * `applySystemServiceProfileDefaults()`. The returned profile's `id`
 * is then passed into the existing, unmodified `@acos/core-search`
 * `createSearch()` the same way any real profile's id would be:
 * `createSearch()` already snapshots the profile's own fields
 * (including `targetCustomer`) into the Search's `parameters` at
 * creation time, so no change to `createSearch()` is needed either.
 */
export async function createHistoricalServiceProfile(
  profiles: ServiceProfileRepository,
  userId: string,
  fields: ServiceProfileFields,
  now: Date = new Date(),
): Promise<StoredServiceProfile> {
  return profiles.create(userId, fields, now);
}
