import { defineConfig } from 'vitest/config';

// Integration tests run against a real (ephemeral) Postgres — see
// docker-compose.test.yml and architecture §10. They deliberately use
// environment: 'node' and a longer default timeout since they involve
// real DB round-trips.
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    // Scoped to this directory. Unscoped, this glob is resolved from the
    // tests/ package root and also collects fixtures/, pipeline/ and
    // contract/ — so `pnpm test:integration` ran suites that are not
    // integration tests, and `pnpm test` ran ones that are.
    include: ['integration/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,

    // ONE FILE AT A TIME, on purpose.
    //
    // Every suite here opens connection pools against the SAME PostgreSQL
    // server, which ships with max_connections = 100. Run in parallel,
    // enough suites eventually ask for more than that and the failure is
    // `sorry, too many clients already` — landing on whichever test
    // happened to be running, in a different place each time. A payment
    // test suite that fails somewhere new on every run teaches people to
    // re-run it rather than read it, which is worse than it being slow.
    //
    // Serial execution makes the whole thing deterministic for a few
    // seconds of wall time. If that ever stops being an acceptable trade,
    // raise max_connections in docker-compose.test.yml rather than
    // turning this back on and hoping.
    fileParallelism: false,
  },
});
