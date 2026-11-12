import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // No .tsx file in this project imports React (Next's own bundler has
  // used the automatic JSX runtime since Next 13, regardless of
  // tsconfig's "jsx": "preserve"). Vitest's esbuild transform otherwise
  // defaults to the classic runtime and throws "React is not defined" —
  // confirmed pre-existing (not introduced by this change) by testing
  // components/access/TopicDetails.tsx, an already-passing production
  // component, directly in isolation; it only "works" today as a side
  // effect of being pulled in through page.test.ts's heavier next/*
  // import graph. This line makes every .tsx component directly
  // unit-testable, matching Next's actual runtime behavior.
  esbuild: {
    jsx: 'automatic',
  },
  // Mirrors tsconfig.json's "@/*" -> "./*" and components.json's aliases.
  // Nothing tested before components/ui/* imported via "@/...", so this
  // was never previously needed — relative-import files are unaffected.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    name: '@acos/web',
    environment: 'node',
    include: ['app/**/*.test.ts', 'src/**/*.test.ts', 'components/**/*.test.ts'],
  },
});
