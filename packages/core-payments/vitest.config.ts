import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-payments',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
