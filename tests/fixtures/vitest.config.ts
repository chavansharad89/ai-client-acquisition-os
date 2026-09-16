import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'fixtures',
    environment: 'node',
    // Scoped to this directory, and it must stay that way. A bare
    // '**/*.test.ts' is resolved from the tests/ package root, so it
    // collected integration/ and contract/ as well — which meant
    // `pnpm test` silently ran the whole integration suite, needing a
    // database it never asked for and blurring the line between the two
    // commands. tests/pipeline/testPolicy.test.ts asserts this stays
    // scoped.
    include: ['fixtures/**/*.test.ts'],
  },
});
