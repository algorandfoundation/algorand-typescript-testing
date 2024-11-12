import {
  anyPType,
  ARC4StructType,
  ARC4TupleType,
  BoxMapPType,
  BoxPType,
  ContractClassPType,
  DynamicArrayType,
  FunctionPType,
  GlobalStateType,
  LocalStateType,
  PType,
  SourceLocation,
  StaticArrayType,
  TypeResolver,
  UFixedNxMType,
  UintNType,
} from '@algorandfoundation/puya-ts'
import ts from 'typescript'
import type { TypeInfo } from '../encoders'
import { instanceOfAny } from '../typescript-helpers'
import { TransformerConfig } from './index'
import { nodeFactory } from './node-factory'
import {
  supportedAugmentedAssignmentBinaryOpString,
  supportedBinaryOpString,
  supportedPrefixUnaryOpString,
} from './supported-binary-op-string'

const { factory } = ts

type VisitorHelper = {
  additionalStatements: ts.Statement[]
  resolveType(node: ts.Node): PType
  sourceLocation(node: ts.Node): SourceLocation
}

export class SourceFileVisitor {
  private helper: VisitorHelper
  constructor(
    private context: ts.TransformationContext,
    private sourceFile: ts.SourceFile,
    program: ts.Program,
    private config: TransformerConfig,
  ) {
    const typeResolver = new TypeResolver(program.getTypeChecker(), program.getCurrentDirectory())

    this.helper = {
      additionalStatements: [],
      resolveType(node: ts.Node): PType {
        try {
          return typeResolver.resolve(node, this.sourceLocation(node))
        } catch {
          return anyPType
        }
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

class ExpressionVisitor {
  constructor(
    private context: ts.TransformationContext,
    private helper: VisitorHelper,
    private expressionNode: ts.Expression,
  ) {}

  public result(): ts.Expression {
    return this.visit(this.expressionNode) as ts.Expression
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      let type = this.helper.resolveType(node)

      // `voted = LocalState<uint64>()` is resolved to FunctionPType with returnType LocalState<uint64>
      if (type instanceof FunctionPType) type = type.returnType

      if (isGenericType(type)) {
        const info = getGenericTypeInfo(type)
        return nodeFactory.captureGenericTypeInfo(ts.visitEachChild(node, this.visit, this.context), JSON.stringify(info))
      }
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
    private isFunction?: boolean,
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
    if (this.isFunction && ts.isVariableDeclaration(node) && node.initializer) {
      return new VariableInitializerVisitor(this.context, this.helper, node).result()
    }

    /*
     * capture generic type info in test functions and swap arc4 types with implementation; e.g.
     * ```
     *  it('should work', () => {
     *   expect(() => new UintN<32>(2 ** 32)).toThrowError(`expected value <= ${2 ** 32 - 1}`)
     * })
     * ```
     */
    if (this.isFunction && ts.isNewExpression(node)) {
      return new ExpressionVisitor(this.context, this.helper, node).result()
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
    super(context, helper, true)
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
    this.isArc4 = classType instanceof ContractClassPType && classType.isARC4
  }

  public result(): ts.ClassDeclaration {
    return this.visit(this.classDec) as ts.ClassDeclaration
  }

  private visit = (node: ts.Node): ts.Node => {
    if (ts.isMethodDeclaration(node)) {
      if (this.classDec.name && this.isArc4) {
        const methodType = this.helper.resolveType(node)
        if (methodType instanceof FunctionPType) {
          this.helper.additionalStatements.push(nodeFactory.attachMetaData(this.classDec.name, node, methodType))
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

const isGenericType = (type: PType): boolean =>
  instanceOfAny(
    type,
    ARC4StructType,
    ARC4TupleType,
    BoxMapPType,
    BoxPType,
    DynamicArrayType,
    GlobalStateType,
    LocalStateType,
    StaticArrayType,
    UFixedNxMType,
    UintNType,
  )

const getGenericTypeInfo = (type: PType): TypeInfo => {
  const genericArgs: TypeInfo[] | Record<string, TypeInfo> = []

  if (instanceOfAny(type, LocalStateType, GlobalStateType, BoxPType)) {
    genericArgs.push(getGenericTypeInfo(type.contentType))
  } else if (type instanceof BoxMapPType) {
    genericArgs.push(getGenericTypeInfo(type.keyType))
    genericArgs.push(getGenericTypeInfo(type.contentType))
  } else if (instanceOfAny(type, StaticArrayType, DynamicArrayType)) {
    genericArgs.push(getGenericTypeInfo(type.elementType))
  } else if (type instanceof UFixedNxMType) {
    genericArgs.push({ name: type.n.toString() })
    genericArgs.push({ name: type.m.toString() })
  } else if (type instanceof UintNType) {
    genericArgs.push({ name: type.n.toString() })
  } else if (type instanceof ARC4StructType) {
    genericArgs.push(
      ...Object.fromEntries(
        Object.entries(type.fields)
          .map(([key, value]) => [key, getGenericTypeInfo(value)])
          .filter((x) => !!x),
      ),
    )
  } else if (type instanceof ARC4TupleType) {
    genericArgs.push(...type.items.map(getGenericTypeInfo))
  }

  const result: TypeInfo = { name: type?.name ?? type?.toString() ?? 'unknown' }
  if (genericArgs && (genericArgs.length || Object.keys(genericArgs).length)) {
    result.genericArgs = genericArgs
  }
  return result
}
