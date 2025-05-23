import type { ptypes } from '@algorandfoundation/puya-ts'
import ts from 'typescript'
import type { TypeInfo } from '../impl/encoded-types'
import type { DeliberateAny } from '../typescript-helpers'
import { getPropertyNameAsString, trimGenericTypeName } from './helpers'

const factory = ts.factory
export const nodeFactory = {
  importHelpers(testingPackageName: string) {
    return factory.createImportDeclaration(
      undefined,
      factory.createImportClause(false, undefined, factory.createNamespaceImport(factory.createIdentifier('runtimeHelpers'))),
      factory.createStringLiteral(`${testingPackageName}/runtime-helpers`),
      undefined,
    )
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
    classIdentifier: ts.Identifier,
    method: ts.MethodDeclaration,
    functionType: ptypes.FunctionPType,
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
        [classIdentifier, methodName, metadata],
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

  instantiateARC4EncodedType(node: ts.NewExpression, typeInfo?: TypeInfo) {
    const infoString = JSON.stringify(typeInfo)
    const classIdentifier = node.expression.getText().replace('arc4.', '')
    return factory.createNewExpression(
      factory.createIdentifier(`runtimeHelpers.${trimGenericTypeName(typeInfo?.name ?? classIdentifier)}Impl`),
      node.typeArguments,
      [infoString ? factory.createStringLiteral(infoString) : undefined, ...(node.arguments ?? [])].filter((arg) => !!arg),
    )
  },

  callStubbedFunction(functionName: string, node: ts.CallExpression, typeInfo?: TypeInfo | TypeInfo[]) {
    const typeInfoArgs = typeInfo
      ? (Array.isArray(typeInfo) ? typeInfo : [typeInfo]).map((t) => factory.createStringLiteral(JSON.stringify(t)))
      : undefined
    const updatedPropertyAccessExpression = factory.createPropertyAccessExpression(
      factory.createIdentifier('runtimeHelpers'),
      `${functionName}Impl`,
    )

    return factory.createCallExpression(
      updatedPropertyAccessExpression,
      node.typeArguments,
      [...(typeInfoArgs ?? []), ...(node.arguments ?? [])].filter((arg) => !!arg),
    )
  },

  callMethodSelectorFunction(node: ts.CallExpression) {
    if (
      node.arguments.length === 1 &&
      ts.isPropertyAccessExpression(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.arguments[0].expression)
    ) {
      const contractIdenifier = node.arguments[0].expression.expression
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [...node.arguments, contractIdenifier])
    }
    return node
  },

  callAbiCallFunction(node: ts.CallExpression) {
    if (
      node.arguments.length === 2 &&
      ts.isPropertyAccessExpression(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.arguments[0].expression)
    ) {
      const contractIdenifier = node.arguments[0].expression.expression
      return factory.updateCallExpression(node, node.expression, node.typeArguments, [...node.arguments, contractIdenifier])
    }
    return node
  },
} satisfies Record<string, (...args: DeliberateAny[]) => ts.Node>
