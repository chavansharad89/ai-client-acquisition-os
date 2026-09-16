// shared-types
// -----------------------------------------------------------------------
// DTOs and Zod schemas shared between apps/web and apps/worker (request/
// response shapes, outbox payload shapes). Deliberately empty beyond
// placeholders below — real DTOs get added alongside the Phase 1 work
// that needs them, so they don't drift out of sync with actual usage.
// -----------------------------------------------------------------------

/**
 * TODO(Phase 1): define CreateOrderRequest/Response DTOs here once
 * apps/web/app/api/payments/create-order/route.ts is implemented, and
 * import them from both the route and core-payments so the wire
 * contract only has one source of truth.
 */
export type Placeholder = never;
