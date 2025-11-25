import { ptypes } from '@algorandfoundation/puya-ts'
import ts from 'typescript'
import type { TypeInfo } from '../impl/encoded-types'
import type { DeliberateAny } from '../typescript-helpers'
import { getPropertyNameAsString, trimGenericTypeName } from './helpers'

const factory = ts.factory
/** @internal */
export const nodeFactory = {
  importHelpers(testingPackageName: string) {
    return [
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier('runtimeHelpers'))),
        factory.createStringLiteral(`${testingPackageName}/runtime-helpers`),
        undefined,
      ),
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('arc4'))]),
        ),
        factory.createStringLiteral(`${testingPackageName}/internal`),
        undefined,
      ),
    ]
  },

  switchableValue(x: ts.Expression) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('runtimeHelpers'), factory.createIdentifier('switchableValue')),
      undefined,
      [x],
    )
  },
  binaryOp(left: ts.Expression, right: ts.Expression, op: string) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('runtimeHelpers'), factory.createIdentifier('binaryOp')),
      undefined,
      [left, right, factory.createStringLiteral(op)],
    )
  },
  augmentedAssignmentBinaryOp(left: ts.Expression, right: ts.Expression, op: string) {
    return factory.createAssignment(
      left,
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('runtimeHelpers'), factory.createIdentifier('binaryOp')),
        undefined,
        [left, right, factory.createStringLiteral(op.replace('=', ''))],
      ),
    )
  },

  prefixUnaryOp(operand: ts.Expression, op: string) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(factory.createIdentifier('runtimeHelpers'), factory.createIdentifier('unaryOp')),
      undefined,
      [operand, factory.createStringLiteral(op)],
    )
  },

  attachMetaData(
    sourceFileName: string,
    classIdentifier: ts.Identifier,
    method: ts.MethodDeclaration,
    argTypes: string[],
    returnType: string,
  ) {
    const methodName = getPropertyNameAsString(method.name)
    const metadata = factory.createObjectLiteralExpression([
      factory.createPropertyAssignment('methodName', methodName),
      factory.createPropertyAssignment(
        'argTypes',
        factory.createArrayLiteralExpression(argTypes.map((p) => factory.createStringLiteral(p))),
      ),
      factory.createPropertyAssignment('returnType', factory.createStringLiteral(returnType)),
    ])
    return factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(factory.createIdentifier('runtimeHelpers'), factory.createIdentifier('attachAbiMetadata')),
        undefined,
        [
          classIdentifier,
          methodName,
          metadata,
          factory.createStringLiteral(sourceFileName),
          factory.createStringLiteral(classIdentifier.text),
        ],
      ),
    )
  },

  captureGenericTypeInfo(x: ts.Expression, info: string) {
    return factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier('runtimeHelpers'),
        factory.createIdentifier('captureGenericTypeInfo'),
      ),
      undefined,
      [x, factory.createStringLiteral(info)],
    )
  },

  instantiateEncodedType(node: ts.NewExpression, typeInfo?: TypeInfo) {
    const infoString = JSON.stringify(typeInfo)
    const classIdentifier = node.expression.getText().replace('arc4.', '')
    return factory.createNewExpression(
      factory.createIdentifier(`arc4.${trimGenericTypeName(typeInfo?.name ?? classIdentifier)}`),
      node.typeArguments,
      [infoString ? factory.createStringLiteral(infoString) : undefined, ...(node.arguments ?? [])].filter((arg) => !!arg),
    )
  },

  callStubbedFunction(node: ts.CallExpression, typeInfo?: TypeInfo | TypeInfo[]) {
    const typeInfoArgs = typeInfo
      ? (Array.isArray(typeInfo) ? typeInfo : [typeInfo]).map((t) => factory.createStringLiteral(JSON.stringify(t)))
      : []

    return factory.updateCallExpression(node, node.expression, node.typeArguments, [...typeInfoArgs, ...(node.arguments ?? [])])
  },

  callMethodSelectorFunction(node: ts.CallExpression, typeParams: ptypes.PType[]) {
    if (typeParams.length === 1 && typeParams[0] instanceof ptypes.FunctionPType && typeParams[0].declaredIn) {
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('method', factory.createStringLiteral(typeParams[0].name)),
          factory.createPropertyAssignment('contract', factory.createStringLiteral(typeParams[0].declaredIn.fullName)),
        ]),
      ])
    } else if (
      node.arguments.length === 1 &&
      ts.isPropertyAccessExpression(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.arguments[0].expression)
    ) {
      const contractIdenifier = node.arguments[0].expression.expression
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [
        factory.createObjectLiteralExpression([
          factory.createPropertyAssignment('method', node.arguments[0]),
          factory.createPropertyAssignment('contract', contractIdenifier),
        ]),
      ])
    } else {
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [
        factory.createObjectLiteralExpression([factory.createPropertyAssignment('method', node.arguments[0])]),
      ])
    }
  },

  callAbiCallFunction(node: ts.CallExpression, typeParams: ptypes.PType[]) {
    if (typeParams.length === 1 && typeParams[0] instanceof ptypes.FunctionPType && typeParams[0].declaredIn) {
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [
        factory.createStringLiteral(typeParams[0].declaredIn.fullName),
        factory.createStringLiteral(typeParams[0].name),
        ...node.arguments,
      ])
    }
    return node
  },

  callItxnComposeFunction(node: ts.CallExpression, typeParams: ptypes.PType[]) {
    if (
      node.arguments.length === 2 &&
      ts.isPropertyAccessExpression(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.arguments[0].expression)
    ) {
      const contractIdenifier = node.arguments[0].expression.expression
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [...node.arguments, contractIdenifier])
    } else if (
      node.arguments.length === 1 &&
      typeParams.length === 1 &&
      typeParams[0] instanceof ptypes.FunctionPType &&
      typeParams[0].declaredIn
    ) {
      const contractIdentifier = factory.createStringLiteral(typeParams[0].declaredIn.fullName)
      const methodName = factory.createStringLiteral(typeParams[0].name)
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [...node.arguments, contractIdentifier, methodName])
    }
    return node
  },
} satisfies Record<string, (...args: DeliberateAny[]) => ts.Node | ts.Node[]>
