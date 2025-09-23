import { LoggingContext, ptypes, SourceLocation, TypeResolver } from '@algorandfoundation/puya-ts'
import path from 'path'
import ts from 'typescript'
import { CodeError } from '../errors'
import type { TypeInfo } from '../impl/encoded-types'
import { instanceOfAny } from '../typescript-helpers'
import { normalisePath } from './helpers'
import { nodeFactory } from './node-factory'
import type { TransformerConfig } from './program-factory'
import {
  supportedAugmentedAssignmentBinaryOpString,
  supportedBinaryOpString,
  supportedPrefixUnaryOpString,
} from './supported-binary-op-string'

const { factory } = ts

const algotsModuleRegExp = new RegExp(/^("|')@algorandfoundation\/algorand-typescript(\/|"|')/)
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
  additionalStatements: ts.Statement[]
  resolveType(node: ts.Node): ptypes.PType
  resolveTypeParameters(node: ts.CallExpression): ptypes.PType[]
  sourceLocation(node: ts.Node): SourceLocation
  tryGetSymbol(node: ts.Node): ts.Symbol | undefined
  getConfig(): TransformerConfig
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
    const typeResolver = new TypeResolver(typeChecker, program.getCurrentDirectory())
    this.helper = {
      additionalStatements: [],
      resolveType(node: ts.Node): ptypes.PType {
        const sourceLocation = this.sourceLocation(node)
        try {
          return loggingContext.run(() => typeResolver.resolve(node, sourceLocation!))
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
          return SourceLocation.fromNode(node, program.getCurrentDirectory())
        } catch {
          return SourceLocation.None
        }
      },
      getConfig(): TransformerConfig {
        return config
      },
    }
  }

  public result(): ts.SourceFile {
    const updatedSourceFile = ts.visitNode(this.sourceFile, this.visit) as ts.SourceFile
    return factory.updateSourceFile(updatedSourceFile, [
      ...nodeFactory.importHelpers(this.helper.getConfig().testingPackageName),
      ...updatedSourceFile.statements,
      ...this.helper.additionalStatements,
    ])
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isImportDeclaration(node)) {
      return new ImportDeclarationVisitor(node, this.helper).result()
    }
    if (ts.isFunctionLike(node)) {
      return new FunctionLikeDecVisitor(this.context, this.helper, node).result()
    }
    if (ts.isClassDeclaration(node)) {
      return new ClassVisitor(this.context, this.helper, node).result()
    }

    // capture generic type info for variable initialising outside class and function declarations
    // e.g. `const x = new Uint<32>(42)
    if (ts.isVariableDeclaration(node) && node.initializer) {
      return new VariableInitializerVisitor(this.context, this.helper, node).result()
    }

    return ts.visitEachChild(node, this.visit, this.context)
  }
}

class ImportDeclarationVisitor {
  constructor(
    private declarationNode: ts.ImportDeclaration,
    private helper: VisitorHelper,
  ) {}

  public result(): ts.ImportDeclaration {
    const moduleSpecifier = this.declarationNode.moduleSpecifier.getText()
    if (this.declarationNode.importClause?.isTypeOnly || !algotsModuleRegExp.test(moduleSpecifier)) return this.declarationNode

    const namedBindings = this.declarationNode.importClause?.namedBindings
    // remove `arc4` from named bindings, as it is explicitly imported in the `importHelpers` method
    const nonTypeNamedBindings =
      namedBindings && ts.isNamedImports(namedBindings)
        ? (namedBindings as ts.NamedImports).elements.filter((e) => !e.isTypeOnly && e.name.getText() !== 'arc4')
        : []
    return factory.createImportDeclaration(
      this.declarationNode.modifiers,
      nonTypeNamedBindings.length
        ? factory.createImportClause(false, this.declarationNode.importClause?.name, factory.createNamedImports(nonTypeNamedBindings))
        : this.declarationNode.importClause,
      factory.createStringLiteral(
        moduleSpecifier
          .replace(algotsModuleSpecifier, testingInternalModuleSpecifier(this.helper.getConfig().testingPackageName))
          .replace(/^("|')/, '')
          .replace(/("|')$/, ''),
      ),
      this.declarationNode.attributes,
    )
  }
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
      const needsToCaptureTypeInfo = isGeneric && isStateOrBoxType(type)
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

        if (
          isCallingEmit(stubbedFunctionName) ||
          isCallingEncodeArc4(stubbedFunctionName) ||
          isCallingSizeOf(stubbedFunctionName) ||
          isCallingClone(stubbedFunctionName)
        ) {
          infoArg = this.helper.resolveTypeParameters(updatedNode).map((t) => getGenericTypeInfo(t, sourceLocation))[0]
        } else if (isCallingDecodeArc4(stubbedFunctionName)) {
          const sourceType = ptypes.ptypeToArc4EncodedType(type, sourceLocation)
          const sourceTypeInfo = getGenericTypeInfo(sourceType, sourceLocation)
          const targetTypeInfo = getGenericTypeInfo(type, sourceLocation)
          infoArg = [sourceTypeInfo, targetTypeInfo]
        }

        if (stubbedFunctionName) {
          if (isCallingMethodSelector(stubbedFunctionName)) {
            updatedNode = nodeFactory.callMethodSelectorFunction(updatedNode)
          } else if (isCallingAbiCall(stubbedFunctionName)) {
            const typeParams = this.helper.resolveTypeParameters(updatedNode)
            updatedNode = nodeFactory.callAbiCallFunction(updatedNode, typeParams)
          } else if (isCallingItxnCompose(stubbedFunctionName)) {
            updatedNode = nodeFactory.callItxnComposeFunction(updatedNode)
          } else {
            updatedNode = nodeFactory.callStubbedFunction(updatedNode, infoArg)
          }
        }
      }
      return needsToCaptureTypeInfo
        ? nodeFactory.captureGenericTypeInfo(ts.visitEachChild(updatedNode, this.visit, this.context), JSON.stringify(info))
        : ts.visitEachChild(updatedNode, this.visit, this.context)
    }
    return ts.visitEachChild(node, this.visit, this.context)
  }
}
class VariableInitializerVisitor {
  constructor(
    private context: Context,
    private helper: VisitorHelper,
    private declarationNode: ts.VariableDeclaration,
  ) {}

  public result(): ts.VariableDeclaration {
    const initializerNode = this.declarationNode.initializer
    if (!initializerNode) return this.declarationNode

    const updatedInitializer = new ExpressionVisitor(this.context, this.helper, initializerNode).result()
    if (updatedInitializer === initializerNode) return this.declarationNode
    return factory.updateVariableDeclaration(
      this.declarationNode,
      this.declarationNode.name,
      this.declarationNode.exclamationToken,
      this.declarationNode.type,
      updatedInitializer,
    )
  }
}

class FunctionOrMethodVisitor {
  constructor(
    protected context: Context,
    protected helper: VisitorHelper,
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
      return new VariableInitializerVisitor(this.context, this.helper, node).result()
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
}

class FunctionLikeDecVisitor extends FunctionOrMethodVisitor {
  constructor(
    context: Context,
    helper: VisitorHelper,
    private funcNode: ts.SignatureDeclaration,
  ) {
    super(context, helper)
  }

  public result(): ts.SignatureDeclaration {
    return ts.visitNode(this.funcNode, this.visit) as ts.SignatureDeclaration
  }
}
class MethodDecVisitor extends FunctionOrMethodVisitor {
  constructor(
    context: Context,
    helper: VisitorHelper,
    private methodNode: ts.MethodDeclaration,
  ) {
    super(context, helper)
  }

  public result(): ts.MethodDeclaration {
    return ts.visitNode(this.methodNode, this.visit) as ts.MethodDeclaration
  }
}

class ClassVisitor {
  private isArc4: boolean
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

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isMethodDeclaration(node)) {
      if (this.classDec.name && this.isArc4) {
        const methodType = this.helper.resolveType(node)
        if (methodType instanceof ptypes.FunctionPType) {
          const argTypes = methodType.parameters.map((p) => JSON.stringify(getGenericTypeInfo(p[1])))
          const returnType = JSON.stringify(getGenericTypeInfo(methodType.returnType))
          const sourceFileName = normalisePath(this.classDec.parent.getSourceFile().fileName, this.context.currentDirectory)
          this.helper.additionalStatements.push(nodeFactory.attachMetaData(sourceFileName, this.classDec.name, node, argTypes, returnType))
        }
      }

      return new MethodDecVisitor(this.context, this.helper, node).result()
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
    ptypes.GlobalStateType,
    ptypes.LocalStateType,
    ptypes.StaticArrayType,
    ptypes.UFixedNxMType,
    ptypes.UintNType,
    ptypes.MutableTuplePType,
    ptypes.ReadonlyTuplePType,
    ptypes.MutableObjectPType,
    ptypes.ImmutableObjectPType,
  )

const isStateOrBoxType = (type: ptypes.PType): boolean =>
  instanceOfAny(type, ptypes.BoxMapPType, ptypes.BoxPType, ptypes.GlobalStateType, ptypes.LocalStateType)

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
  let typeName = type?.name ?? type?.toString() ?? 'unknown'
  let genericArgs: TypeInfo[] | Record<string, TypeInfo> = []

  if (instanceOfAny(type, ptypes.LocalStateType, ptypes.GlobalStateType, ptypes.BoxPType)) {
    genericArgs.push(getGenericTypeInfo(type.contentType, sourceLocation))
  } else if (type instanceof ptypes.BoxMapPType) {
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
    const entries = []
    entries.push(['elementType', getGenericTypeInfo(type.elementType, sourceLocation)])
    if (instanceOfAny(type, ptypes.StaticArrayType, ptypes.FixedArrayPType)) {
      entries.push(['size', { name: type.arraySize.toString() }])
    }
    genericArgs = Object.fromEntries(entries)
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
  if (genericArgs && (genericArgs.length || Object.keys(genericArgs).length)) {
    result.genericArgs = genericArgs
  }
  return result
}

const tryGetStubbedFunctionName = (node: ts.CallExpression, helper: VisitorHelper): string | undefined => {
  if (node.expression.kind !== ts.SyntaxKind.Identifier && !ts.isPropertyAccessExpression(node.expression)) return undefined
  const identityExpression = ts.isPropertyAccessExpression(node.expression)
    ? (node.expression as ts.PropertyAccessExpression).name
    : (node.expression as ts.Identifier)
  const functionName = tryGetAlgoTsSymbolName(identityExpression, helper)
  if (functionName === undefined) return undefined
  const stubbedFunctionNames = ['convertBytes', 'decodeArc4', 'encodeArc4', 'emit', 'methodSelector', 'sizeOf', 'abiCall', 'clone']

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
  if (algotsTestingModulePaths(helper.getConfig().testingPackageName).some((path) => sourceFileName.includes(path))) return undefined

  return symbol.getName()
}

const isCallingDecodeArc4 = (functionName: string | undefined): boolean => 'decodeArc4' === (functionName ?? '')
const isCallingEncodeArc4 = (functionName: string | undefined): boolean => 'encodeArc4' === (functionName ?? '')
const isCallingSizeOf = (functionName: string | undefined): boolean => 'sizeOf' === (functionName ?? '')
const isCallingEmit = (functionName: string | undefined): boolean => 'emit' === (functionName ?? '')
const isCallingMethodSelector = (functionName: string | undefined): boolean => 'methodSelector' === (functionName ?? '')
const isCallingAbiCall = (functionName: string | undefined): boolean => ['abiCall'].includes(functionName ?? '')
const isCallingItxnCompose = (functionName: string | undefined): boolean => ['begin', 'next'].includes(functionName ?? '')
const isCallingClone = (functionName: string | undefined): boolean => 'clone' === (functionName ?? '')
