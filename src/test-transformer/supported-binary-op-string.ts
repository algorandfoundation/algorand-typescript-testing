import type { BinaryOperator, PrefixUnaryOperator } from 'typescript'
import ts from 'typescript'

/** @internal */
export function supportedBinaryOpString(x: BinaryOperator): string | undefined {
  switch (x) {
    case ts.SyntaxKind.MinusToken:
      return '-'
    case ts.SyntaxKind.PlusToken:
      return '+'
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
      return '==='
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
      return '!=='
    case ts.SyntaxKind.GreaterThanToken:
      return '>'
    case ts.SyntaxKind.GreaterThanEqualsToken:
      return '>='
    case ts.SyntaxKind.GreaterThanGreaterThanToken:
      return '>>'
    case ts.SyntaxKind.LessThanToken:
      return '<'
    case ts.SyntaxKind.LessThanEqualsToken:
      return '<='
    case ts.SyntaxKind.LessThanLessThanToken:
      return '<<'
    case ts.SyntaxKind.AsteriskToken:
      return '*'
    case ts.SyntaxKind.AsteriskAsteriskToken:
      return '**'
    case ts.SyntaxKind.SlashToken:
      return '/'
    case ts.SyntaxKind.PercentToken:
      return '%'
    case ts.SyntaxKind.AmpersandToken:
      return '&'
    case ts.SyntaxKind.BarToken:
      return '|'
    case ts.SyntaxKind.CaretToken:
      return '^'
    case ts.SyntaxKind.AmpersandAmpersandEqualsToken:
    case ts.SyntaxKind.AmpersandAmpersandToken:
    case ts.SyntaxKind.AmpersandEqualsToken:
    case ts.SyntaxKind.BarBarEqualsToken:
    case ts.SyntaxKind.BarBarToken:
    case ts.SyntaxKind.BarEqualsToken:
    case ts.SyntaxKind.CaretEqualsToken:
    case ts.SyntaxKind.CommaToken:
    case ts.SyntaxKind.EqualsEqualsToken:
    case ts.SyntaxKind.EqualsToken:
    case ts.SyntaxKind.ExclamationEqualsToken:
    case ts.SyntaxKind.InKeyword:
    case ts.SyntaxKind.InstanceOfKeyword:
    case ts.SyntaxKind.QuestionQuestionEqualsToken:
    case ts.SyntaxKind.QuestionQuestionToken:
    case ts.SyntaxKind.GreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.LessThanLessThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken:
    case ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
      return undefined
  }
}

/** @internal */
export function supportedAugmentedAssignmentBinaryOpString(x: BinaryOperator): string | undefined {
  switch (x) {
    case ts.SyntaxKind.PlusEqualsToken:
      return '+='
    case ts.SyntaxKind.MinusEqualsToken:
      return '-='
    case ts.SyntaxKind.SlashEqualsToken:
      return '/='
    case ts.SyntaxKind.AsteriskEqualsToken:
      return '*='
    case ts.SyntaxKind.AsteriskAsteriskEqualsToken:
      return '**='
    case ts.SyntaxKind.PercentEqualsToken:
      return '%='
    default:
      return undefined
  }
}

/** @internal */
export function supportedPrefixUnaryOpString(x: PrefixUnaryOperator): string | undefined {
  switch (x) {
    case ts.SyntaxKind.TildeToken:
      return '~'
    default:
      return undefined
  }
}
