import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const pick = <T extends object, U extends keyof T>(object: T, ...props: U[]): Partial<T> => {
  return Object.entries(object).reduce<Partial<T>>((acc, [key, value]) => {
    if (props.includes(key as U)) acc[key as U] = value
    return acc
  }, {})
}

const standardSectionWhitelist = [
  'name',
  'version',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'author',
  'contributors',
  'funding',
  'browser',
  'bin',
  'man',
  'directories',
  'repository',
  'config',
  'dependencies',
  'peerDependencies',
  'peerDependenciesMeta',
  'bundleDependencies',
  'optionalDependencies',
  'overrides',
  'engines',
  'os',
  'cpu',
  'private',
  'publishConfig',
]

const distFields = {
  main: './index.mjs',
  module: './index.mjs',
  type: 'module',
  types: './index.d.ts',
  exports: {
    '.': {
      types: './index.d.ts',
      import: './index.mjs',
    },
    './runtime-helpers': {
      types: './runtime-helpers.d.ts',
      import: './runtime-helpers.mjs',
    },
    './internal': {
      types: './internal/index.d.ts',
      import: './internal/index.mjs',
    },
    './internal/arc4': {
      types: './internal/arc4.d.ts',
      import: './internal/arc4.mjs',
    },
    './internal/op': {
      types: './internal/op.d.ts',
      import: './internal/op.mjs',
    },
    './vitest-transformer': {
      types: './test-transformer/vitest-transformer.d.ts',
      import: './test-transformer/vitest-transformer.mjs',
    },
    './jest-transformer': {
      types: './test-transformer/jest-transformer.d.ts',
      import: './test-transformer/jest-transformer.mjs',
    },
  },
}

const inputFolder = '.'
const outputFolder = join('.', 'dist')

const packageJson = JSON.parse(readFileSync(join(inputFolder, 'package.json'), 'utf-8'))
const output = {
  scripts: {},
  files: ['**'],
  ...pick(packageJson, ...(standardSectionWhitelist as (keyof typeof packageJson)[])),
  ...distFields,
}
writeFileSync(join(outputFolder, 'package.json'), `${JSON.stringify(output, undefined, 2)}\n`, 'utf-8')
