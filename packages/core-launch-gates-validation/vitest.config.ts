import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-launch-gates-validation',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
