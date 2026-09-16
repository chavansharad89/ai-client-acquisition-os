import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/db',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
