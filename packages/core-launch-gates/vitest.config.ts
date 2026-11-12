import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/core-launch-gates',
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
