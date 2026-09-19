import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-opportunity',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
