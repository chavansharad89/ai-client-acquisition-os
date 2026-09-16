import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-acquisition',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
