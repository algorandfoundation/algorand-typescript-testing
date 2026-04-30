import { AbsolutePath, LoggingContext, ptypes, SourceLocation, TypeResolver } from '@algorandfoundation/puya-ts'
import path from 'path'
import ts from 'typescript'
import { CodeError } from '../errors'
import type { TypeInfo } from '../impl/encoded-types'
import { instanceOfAny } from '../typescript-helpers'
import { normalisePath, ptypeToArc4EncodedType } from './helpers'
import { nodeFactory } from './node-factory'
import type { TransformerConfig } from './program-factory'
import {
  supportedAugmentedAssignmentBinaryOpString,
  supportedBinaryOpString,
  supportedPrefixUnaryOpString,
} from './supported-binary-op-string'

const { factory } = ts

const algotsModuleRegExp = /^("|')@algorandfoundation\/algorand-typescript(\/|"|')/
const algotsModuleSpecifier = '@algorandfoundation/algorand-typescript'
const testingInternalModuleSpecifier = (testingPackageName: string) => `${testingPackageName}/internal`
const algotsModulePaths = [
  algotsModuleSpecifier,
  '/puya-ts/packages/algo-ts/',
  `${path.sep}puya-ts${path.sep}packages${path.sep}algo-ts${path.sep}`,
]
const algotsTestingModulePaths = (testingPackageName: string) => [
  testingPackageName,
  `${path.sep}algorand-typescript-testing${path.sep}src${path.sep}`,
  `${path.sep}algorand-typescript-testing${path.sep}dist${path.sep}`,
]

const testingExamplePath = `${path.sep}algorand-typescript-testing${path.sep}examples${path.sep}`

type VisitorHelper = {
  config: TransformerConfig
  additionalStatements: ts.Statement[]
  resolveType(node: ts.Node): ptypes.PType
  resolveTypeParameters(node: ts.CallExpression): ptypes.PType[]
  sourceLocation(node: ts.Node): SourceLocation
  tryGetSymbol(node: ts.Node): ts.Symbol | undefined
}

type Context = ts.TransformationContext & { currentDirectory: string }

/** @internal */
export class SourceFileVisitor {
  private helper: VisitorHelper
  private context: Context

  constructor(
    context: ts.TransformationContext,
    private sourceFile: ts.SourceFile,
    program: ts.Program,
    config: TransformerConfig,
  ) {
    this.context = { ...context, currentDirectory: program.getCurrentDirectory() }
    const typeChecker = program.getTypeChecker()
    const loggingContext = LoggingContext.create()
    const programDir = AbsolutePath.resolve({ path: program.getCurrentDirectory() })
    const typeResolver = new TypeResolver(typeChecker, programDir)
    this.helper = {
      config,
      additionalStatements: [],
      resolveType(node: ts.Node): ptypes.PType {
        const sourceLocation = this.sourceLocation(node)
        try {
          return loggingContext.run(() => typeResolver.resolve(node, sourceLocation))
        } catch (e) {
          const err = e as Error
          if (
            err.constructor.name === 'CodeError' &&
            !['Classes must extend', 'is not supported', 'Unable to reflect'].some((s) => err.message.includes(s))
          ) {
            throw new Error(`${sourceLocation?.toString()}: ${err.message}`, { cause: err })
          }
          return ptypes.anyPType
        }
      },
      resolveTypeParameters(node: ts.CallExpression) {
        return loggingContext.run(() => typeResolver.resolveTypeParameters(node, this.sourceLocation(node)))
      },
      tryGetSymbol(node: ts.Node): ts.Symbol | undefined {
        const s = typeChecker.getSymbolAtLocation(node)
        return s && s.flags & ts.SymbolFlags.Alias ? typeChecker.getAliasedSymbol(s) : s
      },
      sourceLocation(node: ts.Node): SourceLocation {
        try {
          return SourceLocation.fromNode(node, programDir)
        } catch {
          return SourceLocation.None
        }
      },
    }
  }

  public result(): ts.SourceFile {
    const updatedSourceFile = ts.visitNode(this.sourceFile, this.visit) as ts.SourceFile
    return factory.updateSourceFile(updatedSourceFile, [
      ...nodeFactory.importHelpers(this.helper.config.testingPackageName),
      ...updatedSourceFile.statements,
      ...this.helper.additionalStatements,
    ])
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isImportDeclaration(node)) {
      return visitImportDeclaration(node, this.helper)
    }
    if (ts.isFunctionLike(node)) {
      return new FunctionOrMethodVisitor(this.context, this.helper, node).result()
    }
    if (ts.isClassDeclaration(node)) {
      return new ClassVisitor(this.context, this.helper, node).result()
    }

    // capture generic type info for variable initialising outside class and function declarations
    // e.g. `const x = new Uint<32>(42)
    if (ts.isVariableDeclaration(node) && node.initializer) {
      return visitVariableInitializer(node, this.context, this.helper)
    }

    return ts.visitEachChild(node, this.visit, this.context)
  }
}

const visitImportDeclaration = (node: ts.ImportDeclaration, helper: VisitorHelper): ts.ImportDeclaration => {
  const moduleSpecifier = node.moduleSpecifier.getText()
  if (node.importClause?.phaseModifier == ts.SyntaxKind.TypeKeyword || !algotsModuleRegExp.test(moduleSpecifier)) return node

  const namedBindings = node.importClause?.namedBindings
  // remove `arc4` from named bindings, as it is explicitly imported in the `importHelpers` method
  const nonTypeNamedBindings =
    namedBindings && ts.isNamedImports(namedBindings) ? namedBindings.elements.filter((e) => !e.isTypeOnly && e.name.text !== 'arc4') : []
  return factory.createImportDeclaration(
    node.modifiers,
    nonTypeNamedBindings.length
      ? factory.createImportClause(undefined, node.importClause?.name, factory.createNamedImports(nonTypeNamedBindings))
      : node.importClause,
    factory.createStringLiteral(
      moduleSpecifier
        .replace(algotsModuleSpecifier, testingInternalModuleSpecifier(helper.config.testingPackageName))
        .replace(/^("|')/, '')
        .replace(/("|')$/, ''),
    ),
    node.attributes,
  )
}

const visitVariableInitializer = (node: ts.VariableDeclaration, context: Context, helper: VisitorHelper): ts.VariableDeclaration => {
  const initializerNode = node.initializer
  if (!initializerNode) return node

  const updatedInitializer = new ExpressionVisitor(context, helper, initializerNode).result()
  if (updatedInitializer === initializerNode) return node
  return factory.updateVariableDeclaration(node, node.name, node.exclamationToken, node.type, updatedInitializer)
}

class ExpressionVisitor {
  constructor(
    private context: Context,
    private helper: VisitorHelper,
    private expressionNode: ts.Expression,
    private stubbedFunctionName?: string,
  ) {}

  public result(): ts.Expression {
    return this.visit(this.expressionNode) as ts.Expression
  }

  private visit = (node: ts.Node): ts.Node => {
    handleTypeInfoCapture: if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      if (!tryGetAlgoTsSymbolName(node.expression, this.helper)) break handleTypeInfoCapture

      const type = this.helper.resolveType(node)

      const isGeneric = isGenericType(type)
      const isArc4Encoded = isEncodedType(type)
      const info = isGeneric || isArc4Encoded ? getGenericTypeInfo(type) : undefined
      let updatedNode = node

      if (ts.isNewExpression(updatedNode)) {
        if (isEncodedType(type)) {
          updatedNode = nodeFactory.instantiateEncodedType(updatedNode, info)
        }
      }

      if (ts.isCallExpression(updatedNode)) {
        const stubbedFunctionName = this.stubbedFunctionName ?? tryGetStubbedFunctionName(updatedNode, this.helper)
        this.stubbedFunctionName = undefined
        let infoArg: TypeInfo | TypeInfo[] | undefined = info

        // the nodes which have been created or updated by the node factory will not have source location,
        // and we do not need to process them further
        const sourceLocation = this.helper.sourceLocation(updatedNode)
        if (sourceLocation === SourceLocation.None) break handleTypeInfoCapture

        if (['emit', 'encodeArc4', 'sizeOf', 'clone'].includes(stubbedFunctionName ?? '')) {
          infoArg = this.helper.resolveTypeParameters(updatedNode).map((t) => getGenericTypeInfo(t, sourceLocation))[0]
        } else if ('decodeArc4' === stubbedFunctionName) {
          const sourceType = ptypeToArc4EncodedType(type, sourceLocation)
          const sourceTypeInfo = getGenericTypeInfo(sourceType, sourceLocation)
          const targetTypeInfo = getGenericTypeInfo(type, sourceLocation)
          infoArg = [sourceTypeInfo, targetTypeInfo]
        }

        if (stubbedFunctionName) {
          if ('methodSelector' === stubbedFunctionName) {
            const typeParams = this.helper.resolveTypeParameters(updatedNode)
            updatedNode = nodeFactory.callMethodSelectorFunction(updatedNode, typeParams)
          } else if ('abiCall' === stubbedFunctionName) {
            const typeParams = this.helper.resolveTypeParameters(updatedNode)
            updatedNode = nodeFactory.callAbiCallFunction(updatedNode, typeParams)
          } else if (['begin', 'next'].includes(stubbedFunctionName)) {
            const typeParams = this.helper.resolveTypeParameters(updatedNode)
            updatedNode = nodeFactory.callItxnComposeFunction(updatedNode, typeParams)
          } else {
            updatedNode = nodeFactory.callStubbedFunction(updatedNode, infoArg)
          }
        }
      }
      return isGeneric
        ? nodeFactory.captureGenericTypeInfo(ts.visitEachChild(updatedNode, this.visit, this.context), JSON.stringify(info))
        : ts.visitEachChild(updatedNode, this.visit, this.context)
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }
}

class FunctionOrMethodVisitor {
  constructor(
    protected context: Context,
    protected helper: VisitorHelper,
    private funcNode: ts.SignatureDeclaration,
  ) {}
  protected visit = (node: ts.Node): ts.Node => {
    return ts.visitEachChild(this.updateNode(node), this.visit, this.context)
  }

  protected updateNode(node: ts.Node): ts.Node {
    if (ts.isSwitchStatement(node)) {
      return factory.updateSwitchStatement(node, nodeFactory.switchableValue(node.expression), node.caseBlock)
    }

    if (ts.isCaseClause(node)) {
      return factory.updateCaseClause(node, nodeFactory.switchableValue(node.expression), node.statements)
    }

    if (ts.isBinaryExpression(node)) {
      const opTokenText = supportedBinaryOpString(node.operatorToken.kind)
      if (opTokenText) {
        return nodeFactory.binaryOp(node.left, node.right, opTokenText)
      }
      const augmentedAssignmentOpTokenText = supportedAugmentedAssignmentBinaryOpString(node.operatorToken.kind)
      if (augmentedAssignmentOpTokenText) {
        return nodeFactory.augmentedAssignmentBinaryOp(node.left, node.right, augmentedAssignmentOpTokenText)
      }
    }
    if (ts.isPrefixUnaryExpression(node)) {
      const tokenText = supportedPrefixUnaryOpString(node.operator)
      if (tokenText) {
        return nodeFactory.prefixUnaryOp(node.operand, tokenText)
      }
    }

    /*
     * capture generic type info in test functions; e.g.
     * ```
     *   it('should work', () => {
     *     ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
     *       const box = Box<uint64>({key: Bytes('test-key')})
     *     })
     *   })
     * ```
     */
    if (ts.isVariableDeclaration(node) && node.initializer) {
      return visitVariableInitializer(node, this.context, this.helper)
    }

    /*
     * capture generic type info in test functions and swap arc4 types with implementation; e.g.
     * ```
     *  it('should work', () => {
     *   expect(() => new Uint<32>(2 ** 32)).toThrowError(`expected value <= ${2 ** 32 - 1}`)
     *   expect(Uint.fromBytes<Uint<32>>('').bytes).toEqual(Bytes())
     * })
     * ```
     */
    if (ts.isNewExpression(node)) {
      return new ExpressionVisitor(this.context, this.helper, node).result()
    }
    if (ts.isCallExpression(node)) {
      const stubbedFunctionName = tryGetStubbedFunctionName(node, this.helper)
      if (stubbedFunctionName) {
        return new ExpressionVisitor(this.context, this.helper, node, stubbedFunctionName).result()
      }
    }

    return node
  }

  public result(): ts.SignatureDeclaration {
    return ts.visitNode(this.funcNode, this.visit) as ts.SignatureDeclaration
  }
}

class ClassVisitor {
  private isArc4: boolean
  private _sourceFileName: string | undefined
  constructor(
    private context: Context,
    private helper: VisitorHelper,
    private classDec: ts.ClassDeclaration,
  ) {
    const classType = helper.resolveType(classDec)
    this.isArc4 = classType instanceof ptypes.ContractClassPType && classType.isARC4
  }

  public result(): ts.ClassDeclaration {
    return this.visit(this.classDec) as ts.ClassDeclaration
  }

  private get sourceFileName(): string {
    if (!this._sourceFileName) {
      this._sourceFileName = normalisePath(this.classDec.getSourceFile().fileName, this.context.currentDirectory)
    }
    return this._sourceFileName
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isMethodDeclaration(node)) {
      if (this.classDec.name && this.isArc4) {
        const methodType = this.helper.resolveType(node)
        if (methodType instanceof ptypes.FunctionPType) {
          const argTypes = methodType.parameters.map((p) => JSON.stringify(getGenericTypeInfo(p[1])))
          const returnType = JSON.stringify(getGenericTypeInfo(methodType.returnType))
          this.helper.additionalStatements.push(
            nodeFactory.attachMetaData(this.sourceFileName, this.classDec.name, node, argTypes, returnType),
          )
        }
      }

      return new FunctionOrMethodVisitor(this.context, this.helper, node).result()
    }

    if (ts.isCallExpression(node)) {
      return new ExpressionVisitor(this.context, this.helper, node).result()
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }
}

const isGenericType = (type: ptypes.PType): boolean =>
  instanceOfAny(
    type,
    ptypes.ARC4StructType,
    ptypes.ARC4TupleType,
    ptypes.BoxMapPType,
    ptypes.BoxPType,
    ptypes.DynamicArrayType,
    ptypes.GlobalMapType,
    ptypes.GlobalStateType,
    ptypes.LocalMapType,
    ptypes.LocalStateType,
    ptypes.StaticArrayType,
    ptypes.UFixedNxMType,
    ptypes.UintNType,
    ptypes.MutableTuplePType,
    ptypes.ReadonlyTuplePType,
    ptypes.MutableObjectPType,
    ptypes.ImmutableObjectPType,
  )

const isEncodedType = (type: ptypes.PType): boolean =>
  instanceOfAny(
    type,
    ptypes.ARC4StructType,
    ptypes.ARC4TupleType,
    ptypes.DynamicArrayType,
    ptypes.StaticArrayType,
    ptypes.UFixedNxMType,
    ptypes.UintNType,
    ptypes.ReferenceArrayType,
    ptypes.FixedArrayPType,
  ) ||
  type === ptypes.arc4StringType ||
  type === ptypes.arc4BooleanType

const getGenericTypeInfo = (type: ptypes.PType, sourceLocation?: SourceLocation): TypeInfo => {
  if (type instanceof ptypes.UnionPType) {
    throw new CodeError(
      `${sourceLocation}: Union types are not valid as a variable, parameter, return, or property type. Expression type is ${type.name}`,
    )
  }
  let typeName = type.name
  let genericArgs: TypeInfo[] | Record<string, TypeInfo> = []

  if (instanceOfAny(type, ptypes.LocalStateType, ptypes.GlobalStateType, ptypes.BoxPType)) {
    genericArgs.push(getGenericTypeInfo(type.contentType, sourceLocation))
  } else if (instanceOfAny(type, ptypes.BoxMapPType, ptypes.GlobalMapType, ptypes.LocalMapType)) {
    genericArgs.push(getGenericTypeInfo(type.keyType, sourceLocation))
    genericArgs.push(getGenericTypeInfo(type.contentType, sourceLocation))
  } else if (
    instanceOfAny(
      type,
      ptypes.StaticArrayType,
      ptypes.DynamicArrayType,
      ptypes.ArrayPType,
      ptypes.ReadonlyArrayPType,
      ptypes.ReferenceArrayType,
      ptypes.FixedArrayPType,
    )
  ) {
    genericArgs = {
      elementType: getGenericTypeInfo(type.elementType, sourceLocation),
      ...(instanceOfAny(type, ptypes.StaticArrayType, ptypes.FixedArrayPType) && {
        size: { name: type.arraySize.toString() },
      }),
    }
  } else if (type instanceof ptypes.UFixedNxMType) {
    genericArgs = { n: { name: type.n.toString() }, m: { name: type.m.toString() } }
  } else if (type instanceof ptypes.UintNType) {
    genericArgs.push({ name: type.n.toString() })
  } else if (type instanceof ptypes.ARC4StructType) {
    typeName = `Struct<${type.name}>`
    genericArgs = Object.fromEntries(
      Object.entries(type.fields)
        .map(([key, value]) => [key, getGenericTypeInfo(value, sourceLocation)])
        .filter((x) => !!x),
    )
  } else if (type instanceof ptypes.MutableObjectPType || type instanceof ptypes.ImmutableObjectPType) {
    typeName = type instanceof ptypes.MutableObjectPType ? `Object<${type.name}>` : `ReadonlyObject<${type.name}>`
    genericArgs = Object.fromEntries(
      Object.entries(type.properties)
        .map(([key, value]) => [key, getGenericTypeInfo(value, sourceLocation)])
        .filter((x) => !!x),
    )
  } else if (
    type instanceof ptypes.ARC4TupleType ||
    type instanceof ptypes.MutableTuplePType ||
    type instanceof ptypes.ReadonlyTuplePType
  ) {
    typeName =
      type instanceof ptypes.MutableTuplePType
        ? `MutableTuple<${type.name}>`
        : type instanceof ptypes.ReadonlyTuplePType
          ? `ReadonlyTuple<${type.name}>`
          : type.name
    genericArgs.push(...type.items.map((t) => getGenericTypeInfo(t, sourceLocation)))
  }

  const result: TypeInfo = { name: typeName }
  if (genericArgs.length || Object.keys(genericArgs).length) {
    result.genericArgs = genericArgs
  }
  return result
}

const stubbedFunctionNames = ['convertBytes', 'decodeArc4', 'encodeArc4', 'emit', 'methodSelector', 'sizeOf', 'abiCall', 'clone']
const tryGetStubbedFunctionName = (node: ts.CallExpression, helper: VisitorHelper): string | undefined => {
  if (node.expression.kind !== ts.SyntaxKind.Identifier && !ts.isPropertyAccessExpression(node.expression)) return undefined
  const identityExpression = ts.isPropertyAccessExpression(node.expression) ? node.expression.name : node.expression
  const functionName = tryGetAlgoTsSymbolName(identityExpression, helper)
  if (functionName === undefined) return undefined

  if (stubbedFunctionNames.includes(functionName)) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      const objectName = tryGetAlgoTsSymbolName(node.expression.expression, helper)
      return objectName !== undefined ? functionName : undefined
    }
    return functionName
  }

  if (['begin', 'next'].includes(functionName) && ts.isPropertyAccessExpression(node.expression)) {
    const objectExpression = node.expression.expression
    const objectName = tryGetAlgoTsSymbolName(objectExpression, helper)
    if (['itxnCompose'].includes(objectName || '')) return functionName
  }

  return undefined
}

const tryGetAlgoTsSymbolName = (node: ts.Node, helper: VisitorHelper): string | undefined => {
  const symbol = helper.tryGetSymbol(node)
  if (!symbol) return undefined

  const sourceFileName = symbol.valueDeclaration?.getSourceFile().fileName
  if (!sourceFileName) return undefined

  // If the symbol is from algorand-typescript package or testing example path, return its name
  if (algotsModulePaths.some((path) => sourceFileName.includes(path)) || sourceFileName.includes(testingExamplePath))
    return symbol.getName()

  // If the symbol is from algorand-typescript-testing package, return undefined as they do not need to be processed
  if (algotsTestingModulePaths(helper.config.testingPackageName).some((path) => sourceFileName.includes(path))) return undefined

  return symbol.getName()
}
