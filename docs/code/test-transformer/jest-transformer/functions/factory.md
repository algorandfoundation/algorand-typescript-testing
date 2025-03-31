[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [test-transformer/jest-transformer](../README.md) / factory

# Function: factory()

> **factory**(`compilerInstance`): `TransformerFactory`\<`SourceFile`\>

Defined in: [src/test-transformer/jest-transformer.ts:49](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-transformer/jest-transformer.ts#L49)

Factory function that creates TypeScript program transformers for Jest.
Used by ts-jest to transform TypeScript files during test execution.
Initialized with default transformer configuration.

## Parameters

### compilerInstance

#### program

`Program`

## Returns

`TransformerFactory`\<`SourceFile`\>

## Example

```ts
// Use as before stage transformer with custom config in jest.config.ts
import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const presetConfig = createDefaultEsmPreset({})
const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        astTransformers: {
          before: ['node_modules/@algorandfoundation/algorand-typescript-testing/test-transformer/jest-transformer.mjs'],
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
}
export default jestConfig
```
