import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { name: '@acos/observability', environment: 'node', include: ['src/**/*.test.ts'] },
});
