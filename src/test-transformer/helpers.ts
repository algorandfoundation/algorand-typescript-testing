import ts from 'typescript'
import upath from 'upath'
import { TransformerError } from './errors'

/** @internal */
export const getPropertyNameAsString = (name: ts.PropertyName): ts.Identifier | ts.StringLiteral | ts.NoSubstitutionTemplateLiteral => {
  if (ts.isStringLiteralLike(name)) {
    return name
  }
  if (ts.isIdentifier(name)) {
    return ts.factory.createStringLiteral(name.text)
  }
  throw new TransformerError(`Node ${name.kind} cannot be converted to a static string`)
}

/** @internal */
export const trimGenericTypeName = (typeName: string) => typeName.replace(/<.*>/, '')

/**
 * @internal
 * Normalise a file path to only include relevant segments.
 *
 *  - Anything in /node_modules/ is truncated to <package-name>/path.ext
 *  - Anything in workingDirectory is truncated relative to the workingDirectory
 *  - Forward slashes are used to segment paths
 * @param filePath
 * @param workingDirectory
 */
export function normalisePath(filePath: string, workingDirectory: string): string {
  const localPackageName = /packages\/algo-ts\/dist\/(.*)$/.exec(filePath)
  if (localPackageName) {
    return `@algorandfoundation/algorand-typescript/${localPackageName[1]}`
  }
  const nodeModuleName = /.*\/node_modules\/(.*)$/.exec(filePath)
  if (nodeModuleName) {
    return nodeModuleName[1]
  }
  const cwd = upath.normalize(`${workingDirectory}/`)
  const normalizedPath = upath.normalize(filePath)
  const moduleName = normalizedPath.startsWith(cwd) ? normalizedPath.slice(cwd.length) : normalizedPath
  return moduleName.replaceAll('\\', '/')
}
