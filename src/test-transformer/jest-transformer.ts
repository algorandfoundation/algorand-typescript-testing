import type ts from 'typescript'
import type { TransformerConfig } from './program-factory'
import { defaultTransformerConfig, programFactory } from './program-factory'

const createProgramFactory = (config: TransformerConfig) => {
  // ts-jest passes a TsCompilerInstance as program parameter
  // https://github.com/kulshekhar/ts-jest/tree/main/src/transformers#transformer
  return (compilerInstance: { program: ts.Program }): ts.TransformerFactory<ts.SourceFile> => {
    return programFactory(config, compilerInstance.program)
  }
}

// exporting values needed by ts-jest for a transformer to work
// https://github.com/kulshekhar/ts-jest/tree/main/src/transformers#transformer
export const name = 'puyaTsTransformer'
export const version = '0.1.0'

/**
 * Factory function that creates TypeScript program transformers for Jest.
 * Used by ts-jest to transform TypeScript files during test execution.
 * Initialized with default transformer configuration.
 *
 * @type {(tsJestConfig?: TsJestTransformerOptions) => TsJestTransformer;}
 *
 * @example
 * ```ts
 * // Use as before stage transformer with custom config in jest.config.ts
 * import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'
 *
 * const presetConfig = createDefaultEsmPreset({})
 * const jestConfig: JestConfigWithTsJest = {
 *   ...presetConfig,
 *   transform: {
 *     '^.+\\.tsx?$': [
 *       'ts-jest',
 *       {
 *         useESM: true,
 *         astTransformers: {
 *           before: ['node_modules/@algorandfoundation/algorand-typescript-testing/test-transformer/jest-transformer.mjs'],
 *         },
 *       },
 *     ],
 *   },
 *   extensionsToTreatAsEsm: ['.ts'],
 * }
 * export default jestConfig
 * ```
 */
export const factory = createProgramFactory(defaultTransformerConfig)
