import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'vitest/config'
import { puyaTsTransformer } from './src/test-transformer/vitest-transformer'

export default defineConfig({
  esbuild: {},
  test: {
    setupFiles: 'vitest.setup.ts',
    testTimeout: 20_000,
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      transformers: {
        before: [puyaTsTransformer],
      },
    }),
  ],
})
