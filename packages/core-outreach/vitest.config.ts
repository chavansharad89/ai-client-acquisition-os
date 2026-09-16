import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-outreach',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
