import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { name: '@acos/config', environment: 'node', include: ['src/**/*.test.ts'] },
});
