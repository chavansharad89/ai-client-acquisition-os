import { defineConfig } from 'vitest/config';

// Contract tests assert our types/parsers still match the last known-good
// real payload shape from Razorpay/Meta. See architecture §10 — these are
// meant to fail loudly (and require a conscious update) when an external
// API changes shape, rather than silently drifting.
export default defineConfig({
  test: {
    name: 'contract',
    environment: 'node',
    include: ['contract/**/*.contract.test.ts'],
  },
});
