import { defineConfig } from 'vitest/config';
import path from 'path';

// Test runner for the scheduling/time-correctness harness (spec §10).
// Mirrors the Vite alias so test files can import from '@/...'.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    // Property-based + DST tests can run long sweeps; give them headroom.
    testTimeout: 20000,
    globals: false,
  },
});
