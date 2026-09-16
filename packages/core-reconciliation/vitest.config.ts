import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-reconciliation',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
