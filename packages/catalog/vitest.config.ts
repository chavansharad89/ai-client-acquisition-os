import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/catalog',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
});
