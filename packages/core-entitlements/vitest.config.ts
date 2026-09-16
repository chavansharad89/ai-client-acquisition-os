import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-entitlements',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
