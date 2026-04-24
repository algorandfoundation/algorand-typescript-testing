import type { SourceLocation } from '@algorandfoundation/puya-ts'
import { ptypes } from '@algorandfoundation/puya-ts'
import ts from 'typescript'
import upath from 'upath'
import { CodeError } from '../errors'
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

/** @internal */
export function ptypeToArc4EncodedType(ptype: ptypes.ReadonlyTuplePType, sourceLocation: SourceLocation): ptypes.ARC4TupleType
export function ptypeToArc4EncodedType(ptype: ptypes.MutableTuplePType, sourceLocation: SourceLocation): ptypes.ARC4TupleType
export function ptypeToArc4EncodedType(ptype: ptypes.ImmutableObjectPType, sourceLocation: SourceLocation): ptypes.ARC4StructType
export function ptypeToArc4EncodedType(ptype: ptypes.ArrayPType, sourceLocation: SourceLocation): ptypes.DynamicArrayType
export function ptypeToArc4EncodedType(ptype: ptypes.ReadonlyArrayPType, sourceLocation: SourceLocation): ptypes.DynamicArrayType
export function ptypeToArc4EncodedType(ptype: ptypes.FixedArrayPType, sourceLocation: SourceLocation): ptypes.StaticArrayType
export function ptypeToArc4EncodedType<T extends ptypes.ARC4EncodedType>(ptype: T, sourceLocation: SourceLocation): T
export function ptypeToArc4EncodedType(ptype: ptypes.PType, sourceLocation: SourceLocation): ptypes.ARC4EncodedType
export function ptypeToArc4EncodedType(ptype: ptypes.PType, sourceLocation: SourceLocation): ptypes.ARC4EncodedType {
  if (ptype instanceof ptypes.ARC4EncodedType) return ptype
  if (ptype.equals(ptypes.boolPType)) return ptypes.arc4BooleanType
  if (ptype.equals(ptypes.uint64PType)) return new ptypes.UintNType({ n: 64n })
  if (ptype.equals(ptypes.biguintPType)) return new ptypes.UintNType({ n: 512n })
  if (ptype instanceof ptypes.BytesPType)
    return ptype.length === null ? ptypes.DynamicBytesType : new ptypes.StaticBytesType({ length: ptype.length })
  if (ptype.equals(ptypes.stringPType)) return ptypes.arc4StringType
  if (ptype.equals(ptypes.assetPType)) return ptypes.arc4Uint64
  if (ptype.equals(ptypes.applicationPType)) return ptypes.arc4Uint64
  if (ptype.equals(ptypes.accountPType)) return ptypes.arc4AddressAlias
  if (ptype instanceof ptypes.TransientType) {
    throw new CodeError(ptype.expressionMessage)
  }
  if (ptype instanceof ptypes.ArrayPType)
    return new ptypes.DynamicArrayType({
      elementType: ptypeToArc4EncodedType(ptype.elementType, sourceLocation),
      immutable: ptype.immutable,
    })
  if (ptype instanceof ptypes.ReadonlyArrayPType)
    return new ptypes.DynamicArrayType({
      elementType: ptypeToArc4EncodedType(ptype.elementType, sourceLocation),
      immutable: ptype.immutable,
    })
  if (ptype instanceof ptypes.FixedArrayPType)
    return new ptypes.StaticArrayType({
      elementType: ptypeToArc4EncodedType(ptype.elementType, sourceLocation),
      arraySize: ptype.arraySize,
      immutable: ptype.immutable,
    })

  if (ptype instanceof ptypes.ReadonlyTuplePType)
    return new ptypes.ARC4TupleType({ types: ptype.items.map((i) => ptypeToArc4EncodedType(i, sourceLocation)) })
  if (ptype instanceof ptypes.MutableTuplePType)
    return new ptypes.ARC4TupleType({ types: ptype.items.map((i) => ptypeToArc4EncodedType(i, sourceLocation)) })

  if (ptype instanceof ptypes.ImmutableObjectPType)
    return new ptypes.ARC4StructType({
      name: ptype.alias?.name ?? ptype.name,
      module: ptype.module,
      description: ptype.description,
      fields: ptype.properties.map((p) => ({ ...p, ptype: ptypeToArc4EncodedType(p.ptype, sourceLocation) })),
      frozen: true,
    })
  if (ptype instanceof ptypes.MutableObjectPType)
    return new ptypes.ARC4StructType({
      name: ptype.alias?.name ?? ptype.name,
      module: ptype.module,
      description: ptype.description,
      fields: ptype.properties.map((p) => ({ ...p, ptype: ptypeToArc4EncodedType(p.ptype, sourceLocation) })),
      frozen: false,
    })

  throw new CodeError(`${ptype} cannot be encoded to an ARC4 type`)
}
