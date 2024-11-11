import { FunctionPType } from '@algorandfoundation/puya-ts'
import ts from 'typescript'
import { TypeInfo } from '../encoders'
import type { DeliberateAny } from '../typescript-helpers'
import { getPropertyNameAsString } from './helpers'

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

  attachMetaData(classIdentifier: ts.Identifier, method: ts.MethodDeclaration, functionType: FunctionPType) {
    const methodName = getPropertyNameAsString(method.name)
    const metadata = factory.createObjectLiteralExpression([
      factory.createPropertyAssignment('methodName', methodName),
      factory.createPropertyAssignment('methodSelector', methodName),
      factory.createPropertyAssignment(
        'argTypes',
        factory.createArrayLiteralExpression(functionType.parameters.map((p) => factory.createStringLiteral(p[1].fullName))),
      ),
      factory.createPropertyAssignment('returnType', factory.createStringLiteral(functionType.returnType.fullName)),
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
    return factory.createNewExpression(
      factory.createIdentifier(`runtimeHelpers.${node.expression.getText().replace('arc4.', '')}Impl`),
      node.typeArguments,
      [infoString ? factory.createStringLiteral(infoString) : undefined, ...(node.arguments ?? [])].filter((arg) => !!arg),
    )
  },

  callARC4EncodedStaticMethod(node: ts.CallExpression, typeInfo?: TypeInfo) {
    const propertyAccessExpression = node.expression as ts.PropertyAccessExpression
    const infoString = JSON.stringify(typeInfo)
    const updatedPropertyAccessExpression = factory.createPropertyAccessExpression(
      factory.createIdentifier(`runtimeHelpers.${propertyAccessExpression.expression.getText().replace('arc4.', '')}Impl`),
      `${propertyAccessExpression.name.getText()}Impl`,
    )

    return factory.createCallExpression(
      updatedPropertyAccessExpression,
      node.typeArguments,
      [infoString ? factory.createStringLiteral(infoString) : undefined, ...(node.arguments ?? [])].filter((arg) => !!arg),
    )
  },
} satisfies Record<string, (...args: DeliberateAny[]) => ts.Node>
