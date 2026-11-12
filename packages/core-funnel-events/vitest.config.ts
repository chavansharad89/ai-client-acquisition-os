import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-funnel-events',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
