import typescript from '@rollup/plugin-typescript'
import type { RollupOptions } from 'rollup'
import { puyaTsTransformer } from '../src/test-transformer/vitest-transformer'

// This config allows you to build the example contracts with the test transformer applied to verify the output statically

const config: RollupOptions = {
  input: [
    'examples/arc4-simple-voting/contract.algo.ts',
    'examples/auction/contract.algo.ts',
    'examples/calculator/contract.algo.ts',
    'examples/hello-world-abi/contract.algo.ts',
    'examples/hello-world/contract.algo.ts',
    'examples/htlc-logicsig/signature.algo.ts',
    'examples/marketplace/contract.algo.ts',
    'examples/precompiled/precompiled-factory.algo.ts',
    'examples/precompiled/precompiled-typed.algo.ts',
    'examples/proof-of-attendance/contract.algo.ts',
    'examples/scratch-storage/contract.algo.ts',
    'examples/simple-voting/contract.algo.ts',
    'examples/tealscript/example.algo.ts',
    'examples/voting/contract.algo.ts',
    'examples/zk-whitelist/contract.algo.ts',
  ],
  output: [
    {
      dir: 'examples/debug-out',
      format: 'es',
      exports: 'named',
      entryFileNames: '[name].mjs',
      preserveModules: true,
      sourcemap: true,
    },
  ],
  external: [/node_modules/, /tslib/, /@algorandfoundation\/algorand-typescript/],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      transformers: {
        before: [puyaTsTransformer({})],
      },
    }),
  ],
}

export default config
