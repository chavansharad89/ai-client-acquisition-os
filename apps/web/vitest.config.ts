import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: '@acos/web',
    environment: 'node',
    include: ['app/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
