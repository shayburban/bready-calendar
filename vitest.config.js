import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// Test runner for the scheduling/time-correctness harness (spec §10).
// Mirrors the Vite alias so test files can import from '@/...'.
//
// The react() plugin gives component tests (e.g. the R19 T-window-guard) the
// SAME automatic JSX runtime the app build uses, so any loaded UI module that
// omits `import React` still transforms correctly. The pure node tests contain
// no JSX, so this transform is a pass-through for them — the default
// environment stays 'node' and only files with a `// @vitest-environment jsdom`
// pragma render in jsdom (keeps the node suite fast + unchanged).
export default defineConfig({
  plugins: [react()],
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
