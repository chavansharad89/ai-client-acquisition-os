import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/db-index-deploy',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
