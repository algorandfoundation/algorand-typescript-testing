import { registerPTypes, typeRegistry } from '@algorandfoundation/puya-ts'
import type ts from 'typescript'
import { SourceFileVisitor } from './visitors'

export interface TransformerConfig {
  includeExt: string[]
  testingPackageName: string
}
export const defaultTransformerConfig: TransformerConfig = {
  includeExt: ['.algo.ts', '.spec.ts', '.test.ts'],
  testingPackageName: '@algorandfoundation/algorand-typescript-testing',
}

export function programFactory(config: TransformerConfig, program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
  registerPTypes(typeRegistry)
  return (context) => {
    return (sourceFile) => {
      if (!config.includeExt.some((i) => sourceFile.fileName.endsWith(i))) return sourceFile
      return new SourceFileVisitor(context, sourceFile, program, config).result()
    }
  }
}
