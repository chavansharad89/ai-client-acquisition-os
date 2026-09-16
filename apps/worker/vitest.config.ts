import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/worker',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
