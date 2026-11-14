import { defineConfig } from 'vitest/config';

// Tests share one set of emulators, so files run one after another.
export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    include: ['*.test.ts'],
  },
});
