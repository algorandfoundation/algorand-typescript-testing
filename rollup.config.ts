import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import type { RollupOptions } from 'rollup'

const config: RollupOptions = {
  input: {
    index: 'src/index.ts',
    'runtime-helpers': 'src/runtime-helpers.ts',
    'internal/index': 'src/internal/index.ts',
    'internal/arc4': 'src/internal/arc4.ts',
    'internal/op': 'src/internal/op.ts',
    'test-transformer/vitest-transformer': 'src/test-transformer/vitest-transformer.ts',
    'test-transformer/jest-transformer': 'src/test-transformer/jest-transformer.ts',
  },
  output: [
    {
      dir: 'dist',
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].mjs',
      preserveModules: false,
      sourcemap: true,
    },
  ],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
  },
  external: [/node_modules/, /tslib/],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.build.json',
    }),
    commonjs(),
    nodeResolve(),
    json(),
  ],
}

export default config
