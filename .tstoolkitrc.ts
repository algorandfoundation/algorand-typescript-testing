import type { TsToolkitConfig } from '@makerx/ts-toolkit'

const config: TsToolkitConfig = {
  packageConfig: {
    srcDir: 'src',
    outDir: 'dist',
    moduleType: 'module',
    exportTypes: 'module',
    main: 'index.ts',
    exports: {
      '.': 'index.ts',
      './runtime-helpers': 'runtime-helpers.ts',
      './internal': 'internal/index.ts',
      './internal/arc4': 'internal/arc4.ts',
      './internal/op': 'internal/op.ts',
      './vitest-transformer': 'test-transformer/vitest-transformer.ts',
      './jest-transformer': 'test-transformer/jest-transformer.ts',
    },
  },
}
export default config
