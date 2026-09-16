// apps/worker entrypoint
// -----------------------------------------------------------------------
// Intended shape (architecture §8 Retry Architecture):
//
//   1. loadEnv() at boot, fail fast on missing config.
//   2. Poll loop: every WORKER_POLL_INTERVAL_MS, SELECT a batch of
//      outbox_events rows using `FOR UPDATE SKIP LOCKED` (safe for
//      multiple worker replicas), ordered by created_at.
//   3. For each row, dispatch by event_type to the matching dispatcher
//      (capiDispatcher, deliveryDispatcher), and update status/attempts/
//      next_attempt_at based on the result (see dispatchers/ for the
//      backoff contract).
//   4. Emit metrics: outbox backlog size, dispatch success/failure
//      counts, per architecture §11 observability requirements.
//
// NOT IMPLEMENTED — Phase 2. This file intentionally only documents the
// intended control flow; wiring it up is deferred until core-capi and
// the outbox repository functions exist.
// -----------------------------------------------------------------------

function main(): never {
  throw new Error('apps/worker: poll loop not implemented (Phase 2)');
}

main();
