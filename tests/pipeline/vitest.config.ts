import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'pipeline',
    environment: 'node',
    // Scoped to this directory. A bare '**/*.test.ts' is resolved from
    // the tests/ package root and swallows the integration suite, which
    // then runs twice — once here without a database.
    include: ['pipeline/**/*.test.ts'],
  },
});
