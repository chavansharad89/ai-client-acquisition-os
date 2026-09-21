import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-outreach-preparation',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
