import type ts from 'typescript'
import type { DeliberateAny } from '../typescript-helpers'
import type { TransformerConfig } from './program-factory'
import { defaultTransformerConfig, programFactory } from './program-factory'

const createProgramFactory = (config: TransformerConfig) => {
  return (program: ts.Program): ts.TransformerFactory<ts.SourceFile> => {
    return programFactory(config, program)
  }
}

// Typescript.d.ts typings require a TransformerFactory however rollup plugin supports a program transformer
// https://github.com/rollup/plugins/blob/master/packages/typescript/src/customTransformers.ts
function programTransformer(config: Partial<TransformerConfig>) {
  return {
    type: 'program',
    factory: createProgramFactory({ ...defaultTransformerConfig, ...config }),
  }
}
programTransformer.type = 'program'
programTransformer.factory = createProgramFactory(defaultTransformerConfig)

/**
 * TypeScript transformer for Algorand TypeScript smart contracts and testing files
 * which is mainly responsible for swapping in stub implementations of op codes,
 * and capturing TypeScript type information for the Node.js runtime.
 *
 * Call directly to use the default configuration, or invoke it with a partial
 * `TransformerConfig` to override defaults.
 *
 * **Config options**
 *
 * | Property | Type | Default | Description |
 * | --- | --- | --- | --- |
 * | `includeExt` | `string[]` | `['.algo.ts', '.algo.spec.ts', '.algo.test.ts']` | File extensions to process. |
 * | `testingPackageName` | `string` | `'@algorandfoundation/algorand-typescript-testing'` | Package name used when injecting testing imports. |
 *
 * @example
 * ```ts
 * // Use as before stage transformer with custom config in vitest.config.mts
 * import typescript from '@rollup/plugin-typescript'
 * import { defineConfig } from 'vitest/config'
 * import { puyaTsTransformer } from '@algorandfoundation/algorand-typescript-testing/vitest-transformer'
 *
 * export default defineConfig({
 *   esbuild: {},
 *   plugins: [
 *     typescript({
 *       tsconfig: './tsconfig.json',
 *       transformers: {
 *         before: [puyaTsTransformer],
 *       },
 *     }),
 *   ],
 * })
 * ```
 */
export const puyaTsTransformer: ts.TransformerFactory<ts.SourceFile> &
  ((config: Partial<TransformerConfig>) => ts.TransformerFactory<ts.SourceFile>) = programTransformer as DeliberateAny
