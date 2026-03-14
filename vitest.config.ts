import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 50,
      },
      exclude: [
        'scripts/**',
        'src/index.ts',
        'src/mcp/index.ts',
        'src/mcp/server.ts',
        'src/mcp/tools.ts', // mostly wiring, E2E tested
        'src/ops/detect-subject.ts', // unimplemented/stubbed
        'src/ops/remove-bg.ts' // heavy AI model, requires optional mocking
      ]
    },
    testTimeout: 30000,
  },
})
