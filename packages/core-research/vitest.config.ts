import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-research',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
