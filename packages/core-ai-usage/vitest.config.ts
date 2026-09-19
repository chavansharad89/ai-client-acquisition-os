import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-ai-usage',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
