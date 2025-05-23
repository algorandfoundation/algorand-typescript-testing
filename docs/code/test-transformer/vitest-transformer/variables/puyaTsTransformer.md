[**@algorandfoundation/algorand-typescript-testing**](../../../README.md)

***

[@algorandfoundation/algorand-typescript-testing](../../../README.md) / [test-transformer/vitest-transformer](../README.md) / puyaTsTransformer

# Variable: puyaTsTransformer

> `const` **puyaTsTransformer**: `ts.TransformerFactory`\<`ts.SourceFile`\> & (`config`) => `ts.TransformerFactory`\<`ts.SourceFile`\>

Defined in: [src/test-transformer/vitest-transformer.ts:54](https://github.com/algorandfoundation/algorand-typescript-testing/blob/main/src/test-transformer/vitest-transformer.ts#L54)

TypeScript transformer for Algorand TypeScript smart contracts and testing files
which is mainly responsilbe for swapping in stub implementations of op codes,
and capturing TypeScript type information for the Node.js runtime.

*

## Param

Configuration options

## Param

File extensions to process

## Param

Package name for testing imports

## Example

```ts
// Use as before stage transformer with custom config in vitest.config.mts
import typescript from '@rollup/plugin-typescript'
import { defineConfig } from 'vitest/config'
import { puyaTsTransformer } from '@algorandfoundation/algorand-typescript-testing/vitest-transformer'

export default defineConfig({
  esbuild: {},
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      transformers: {
        before: [puyaTsTransformer],
      },
    }),
  ],
})
```
