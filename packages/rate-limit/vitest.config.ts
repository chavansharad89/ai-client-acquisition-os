import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { name: '@acos/rate-limit', environment: 'node', include: ['src/**/*.test.ts'] },
});
