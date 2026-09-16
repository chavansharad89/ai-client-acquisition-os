import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-capi',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
