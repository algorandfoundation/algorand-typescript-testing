import { LoggingContext, ptypes, SourceLocation, TypeResolver } from '@algorandfoundation/puya-ts'
import path from 'path'
import ts from 'typescript'
import type { TypeInfo } from '../encoders'
import { instanceOfAny } from '../typescript-helpers'
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

type VisitorHelper = {
  additionalStatements: ts.Statement[]
  resolveType(node: ts.Node): ptypes.PType
  resolveTypeParameters(node: ts.CallExpression): ptypes.PType[]
  sourceLocation(node: ts.Node): SourceLocation
  tryGetSymbol(node: ts.Node): ts.Symbol | undefined
}

export class SourceFileVisitor {
  private helper: VisitorHelper

  constructor(
    private context: ts.TransformationContext,
    private sourceFile: ts.SourceFile,
    program: ts.Program,
    private config: TransformerConfig,
  ) {
    const typeChecker = program.getTypeChecker()
    const loggingContext = LoggingContext.create()
    const typeResolver = new TypeResolver(typeChecker, program.getCurrentDirectory())
    this.helper = {
      additionalStatements: [],
      resolveType(node: ts.Node): ptypes.PType {
        try {
          return loggingContext.run(() => typeResolver.resolve(node, this.sourceLocation(node)))
        } catch {
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
        return SourceLocation.fromNode(node, program.getCurrentDirectory())
      },
    }
  }

  public result(): ts.SourceFile {
    const updatedSourceFile = ts.visitNode(this.sourceFile, this.visit) as ts.SourceFile
    return factory.updateSourceFile(updatedSourceFile, [
      nodeFactory.importHelpers(this.config.testingPackageName),
      ...updatedSourceFile.statements,
      ...this.helper.additionalStatements,
    ])
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isImportDeclaration(node)) {
      return new ImportDeclarationVisitor(this.context, this.helper, this.config, node).result()
    }
    if (ts.isFunctionLike(node)) {
      return new FunctionLikeDecVisitor(this.context, this.helper, node).result()
    }
    if (ts.isClassDeclaration(node)) {
      return new ClassVisitor(this.context, this.helper, node).result()
    }

    // capture generic type info for variable initialising outside class and function declarations
    // e.g. `const x = new UintN<32>(42)
    if (ts.isVariableDeclaration(node) && node.initializer) {
      return new VariableInitializerVisitor(this.context, this.helper, node).result()
    }

    return ts.visitEachChild(node, this.visit, this.context)
  }
}

class ImportDeclarationVisitor {
  constructor(
    private context: ts.TransformationContext,
    private helper: VisitorHelper,
    private config: TransformerConfig,
    private declarationNode: ts.ImportDeclaration,
  ) {}

  public result(): ts.ImportDeclaration {
    const moduleSpecifier = this.declarationNode.moduleSpecifier.getText()
    if (this.declarationNode.importClause?.isTypeOnly || !algotsModuleRegExp.test(moduleSpecifier)) return this.declarationNode

    const namedBindings = this.declarationNode.importClause?.namedBindings
    const nonTypeNamedBindings =
      namedBindings && ts.isNamedImports(namedBindings) ? (namedBindings as ts.NamedImports).elements.filter((e) => !e.isTypeOnly) : []
    return factory.createImportDeclaration(
      this.declarationNode.modifiers,
      nonTypeNamedBindings.length
        ? factory.createImportClause(false, this.declarationNode.importClause?.name, factory.createNamedImports(nonTypeNamedBindings))
        : this.declarationNode.importClause,
      factory.createStringLiteral(
        moduleSpecifier
          .replace(algotsModuleSpecifier, testingInternalModuleSpecifier(this.config.testingPackageName))
          .replace(/^("|')/, '')
          .replace(/("|')$/, ''),
      ),
      this.declarationNode.attributes,
    )
  }
}

class ExpressionVisitor {
  constructor(
    private context: ts.TransformationContext,
    private helper: VisitorHelper,
    private expressionNode: ts.Expression,
    private stubbedFunctionName?: string,
  ) {}

  public result(): ts.Expression {
    return this.visit(this.expressionNode) as ts.Expression
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      let type = this.helper.resolveType(node)

      // `voted = LocalState<uint64>()` is resolved to FunctionPType with returnType LocalState<uint64>
      if (type instanceof ptypes.FunctionPType) type = type.returnType

      const isGeneric = isGenericType(type)
      const needsToCaptureTypeInfo = isGeneric && isStateOrBoxType(type)
      const isArc4Encoded = isArc4EncodedType(type)
      const info = isGeneric || isArc4Encoded ? getGenericTypeInfo(type) : undefined
      let updatedNode = node

      if (ts.isNewExpression(updatedNode)) {
        if (isArc4EncodedType(type)) {
          updatedNode = nodeFactory.instantiateARC4EncodedType(updatedNode, info)
        }
      }

      if (ts.isCallExpression(updatedNode)) {
        const stubbedFunctionName = this.stubbedFunctionName ?? tryGetStubbedFunctionName(updatedNode, this.helper)
        this.stubbedFunctionName = undefined
        let infoArg: TypeInfo | TypeInfo[] | undefined = info
        if (isCallingEmit(stubbedFunctionName)) {
          infoArg = this.helper.resolveTypeParameters(updatedNode).map(getGenericTypeInfo)[0]
        } else if (isCallingDecodeArc4(stubbedFunctionName)) {
          const sourceType = ptypes.ptypeToArc4EncodedType(type, this.helper.sourceLocation(node))
          const sourceTypeInfo = getGenericTypeInfo(sourceType)
          const targetTypeInfo = getGenericTypeInfo(type)
          infoArg = [sourceTypeInfo, targetTypeInfo]
        } else if (isCallingEncodeArc4(stubbedFunctionName)) {
          infoArg = this.helper.resolveTypeParameters(updatedNode).map(getGenericTypeInfo)[0]
        } else if (isCallingArc4EncodedLength(stubbedFunctionName)) {
          infoArg = this.helper.resolveTypeParameters(updatedNode).map(getGenericTypeInfo)[0]
        }

        updatedNode = stubbedFunctionName
          ? isCallingMethodSelector(stubbedFunctionName)
            ? nodeFactory.callMethodSelectorFunction(updatedNode)
            : isCallingAbiCall(stubbedFunctionName)
              ? nodeFactory.callAbiCallFunction(updatedNode)
              : nodeFactory.callStubbedFunction(stubbedFunctionName, updatedNode, infoArg)
          : updatedNode
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
    private context: ts.TransformationContext,
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
    protected context: ts.TransformationContext,
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
     *   expect(() => new UintN<32>(2 ** 32)).toThrowError(`expected value <= ${2 ** 32 - 1}`)
     *   expect(UintN.fromBytes<UintN<32>>('').bytes).toEqual(Bytes())
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
    context: ts.TransformationContext,
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
    context: ts.TransformationContext,
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
    private context: ts.TransformationContext,
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
          this.helper.additionalStatements.push(nodeFactory.attachMetaData(this.classDec.name, node, methodType, argTypes, returnType))
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
    ptypes.TuplePType,
  )

const isStateOrBoxType = (type: ptypes.PType): boolean =>
  instanceOfAny(type, ptypes.BoxMapPType, ptypes.BoxPType, ptypes.GlobalStateType, ptypes.LocalStateType)

const isArc4EncodedType = (type: ptypes.PType): boolean =>
  instanceOfAny(
    type,
    ptypes.ARC4StructType,
    ptypes.ARC4TupleType,
    ptypes.DynamicArrayType,
    ptypes.StaticArrayType,
    ptypes.UFixedNxMType,
    ptypes.UintNType,
  ) ||
  type === ptypes.arc4StringType ||
  type === ptypes.arc4BooleanType

const getGenericTypeInfo = (type: ptypes.PType): TypeInfo => {
  let typeName = type?.name ?? type?.toString() ?? 'unknown'
  let genericArgs: TypeInfo[] | Record<string, TypeInfo> = []

  if (instanceOfAny(type, ptypes.LocalStateType, ptypes.GlobalStateType, ptypes.BoxPType)) {
    genericArgs.push(getGenericTypeInfo(type.contentType))
  } else if (type instanceof ptypes.BoxMapPType) {
    genericArgs.push(getGenericTypeInfo(type.keyType))
    genericArgs.push(getGenericTypeInfo(type.contentType))
  } else if (instanceOfAny(type, ptypes.StaticArrayType, ptypes.DynamicArrayType, ptypes.ArrayPType)) {
    const entries = []
    entries.push(['elementType', getGenericTypeInfo(type.elementType)])
    if (instanceOfAny(type, ptypes.StaticArrayType)) {
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
        .map(([key, value]) => [key, getGenericTypeInfo(value)])
        .filter((x) => !!x),
    )
  } else if (type instanceof ptypes.ARC4TupleType || type instanceof ptypes.TuplePType) {
    genericArgs.push(...type.items.map(getGenericTypeInfo))
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
  const functionSymbol = helper.tryGetSymbol(identityExpression)
  if (functionSymbol) {
    const sourceFileName = functionSymbol.valueDeclaration?.getSourceFile().fileName
    if (sourceFileName && !algotsModulePaths.some((s) => sourceFileName.includes(s))) return undefined
  }
  const functionName = functionSymbol?.getName() ?? identityExpression.text
  const stubbedFunctionNames = ['interpretAsArc4', 'decodeArc4', 'encodeArc4', 'emit', 'methodSelector', 'arc4EncodedLength', 'abiCall']
  return stubbedFunctionNames.includes(functionName) ? functionName : undefined
}

const isCallingDecodeArc4 = (functionName: string | undefined): boolean => ['decodeArc4'].includes(functionName ?? '')
const isCallingEncodeArc4 = (functionName: string | undefined): boolean => ['encodeArc4'].includes(functionName ?? '')
const isCallingArc4EncodedLength = (functionName: string | undefined): boolean => 'arc4EncodedLength' === (functionName ?? '')
const isCallingEmit = (functionName: string | undefined): boolean => 'emit' === (functionName ?? '')
const isCallingMethodSelector = (functionName: string | undefined): boolean => 'methodSelector' === (functionName ?? '')
const isCallingAbiCall = (functionName: string | undefined): boolean => 'abiCall' === (functionName ?? '')
