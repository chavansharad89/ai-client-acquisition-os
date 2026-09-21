import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-followup-preparation',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
