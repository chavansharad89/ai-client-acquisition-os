import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-subscriptions',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
