import { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { MAX_UINT64 } from './constants'
import { AvmError, CodeError, InternalError } from './errors'
import { Uint64BackedCls } from './impl/base'
import type { TypeInfo } from './impl/encoded-types'
import { AlgoTsPrimitiveCls, BigUintCls, BytesCls, checkBigUint, checkBytes, Uint64Cls } from './impl/primitives'
import { AccountCls } from './impl/reference'
import { nameOfType, type DeliberateAny } from './typescript-helpers'
import { flattenAsBytes } from './util'

/** @internal */
export { attachAbiMetadata } from './abi-metadata'
/** @internal */
export { FixedBytes } from './impl/primitives'

/** @internal */
export function switchableValue(x: unknown): bigint | string | boolean {
  if (typeof x === 'boolean') return x
  if (typeof x === 'bigint') return x
  if (typeof x === 'string') return x
  if (x instanceof AlgoTsPrimitiveCls) return x.valueOf()
  throw new InternalError(`Cannot convert ${nameOfType(x)} to switchable value`)
}

type BinaryOps = '+' | '-' | '*' | '**' | '/' | '%' | '>' | '>=' | '<' | '<=' | '===' | '!==' | '<<' | '>>' | '&' | '|' | '^'
type UnaryOps = '~'

function tryGetBigInt(value: unknown): bigint | undefined {
  if (typeof value == 'bigint') return value
  if (typeof value == 'number' && Number.isInteger(value)) return BigInt(value)
  if (value instanceof Uint64Cls) return value.valueOf()
  if (value instanceof BigUintCls) return value.valueOf()
  return undefined
}

/** @internal */
export function binaryOp(left: unknown, right: unknown, op: BinaryOps) {
  if (left instanceof ARC4Encoded && right instanceof ARC4Encoded) {
    return arc4EncodedOp(left, right, op)
  }
  if (left instanceof AccountCls && right instanceof AccountCls) {
    return accountBinaryOp(left, right, op)
  }
  if (left instanceof Uint64BackedCls && right instanceof Uint64BackedCls) {
    return uint64BackedClsBinaryOp(left, right, op)
  }
  if (left instanceof BigUintCls || right instanceof BigUintCls) {
    return bigUintBinaryOp(left, right, op)
  }
  if (left instanceof Uint64Cls || right instanceof Uint64Cls) {
    return uint64BinaryOp(left, right, op)
  }
  if (left instanceof BytesCls || right instanceof BytesCls) {
    return bytesBinaryOp(left, right, op)
  }
  const lbi = tryGetBigInt(left)
  const rbi = tryGetBigInt(right)
  if (lbi !== undefined && rbi !== undefined) {
    const result = defaultBinaryOp(lbi, rbi, op)

    if (typeof result === 'boolean') {
      return result
    }

    if (typeof left === 'number' && typeof right === 'number' && result <= Number.MAX_SAFE_INTEGER) {
      return Number(result)
    }

    return result
  }
  return defaultBinaryOp(left, right, op)
}

/** @internal */
export function unaryOp(operand: unknown, op: UnaryOps) {
  if (operand instanceof Uint64Cls) {
    return uint64UnaryOp(operand, op)
  }
  return defaultUnaryOp(operand, op)
}

function arc4EncodedOp(left: ARC4Encoded, right: ARC4Encoded, op: BinaryOps): DeliberateAny {
  const hasEqualsMethod = (x: ARC4Encoded) => Object.hasOwn(x, 'equals') && typeof (x as DeliberateAny).equals === 'function'
  const compareEquality = (x: ARC4Encoded, y: ARC4Encoded) =>
    hasEqualsMethod(x) ? (x as DeliberateAny).equals(y) : (y as DeliberateAny).equals(x)
  switch (op) {
    case '===':
      return compareEquality(left, right)
    case '!==':
      return !compareEquality(left, right)
    default:
      throw new InternalError(`Unsupported operator ${op}`)
  }
}

function accountBinaryOp(left: AccountCls, right: AccountCls, op: BinaryOps): DeliberateAny {
  switch (op) {
    case '===':
    case '!==':
      return bytesBinaryOp(left.bytes, right.bytes, op)
    default:
      throw new InternalError(`Unsupported operator ${op}`)
  }
}
function uint64BackedClsBinaryOp(left: Uint64BackedCls, right: Uint64BackedCls, op: BinaryOps): DeliberateAny {
  switch (op) {
    case '===':
    case '!==':
      return uint64BinaryOp(left.uint64, right.uint64, op)
    default:
      throw new InternalError(`Unsupported operator ${op}`)
  }
}
function uint64BinaryOp(left: DeliberateAny, right: DeliberateAny, op: BinaryOps): DeliberateAny {
  const lbi = Uint64Cls.fromCompat(left).valueOf()
  const rbi = Uint64Cls.fromCompat(right).valueOf()
  const result = (function () {
    switch (op) {
      case '+':
        return lbi + rbi
      case '-':
        return lbi - rbi
      case '*':
        return lbi * rbi
      case '**':
        if (lbi === 0n && rbi === 0n) {
          throw new CodeError('0 ** 0 is undefined')
        }
        return lbi ** rbi
      case '/':
        return lbi / rbi
      case '%':
        return lbi % rbi
      case '>>':
        if (rbi > 63n) {
          throw new CodeError('expected shift <= 63')
        }
        return (lbi >> rbi) & MAX_UINT64
      case '<<':
        if (rbi > 63n) {
          throw new CodeError('expected shift <= 63')
        }
        return (lbi << rbi) & MAX_UINT64
      case '>':
        return lbi > rbi
      case '<':
        return lbi < rbi
      case '>=':
        return lbi >= rbi
      case '<=':
        return lbi <= rbi
      case '===':
        return lbi === rbi
      case '!==':
        return lbi !== rbi
      case '&':
        return lbi & rbi
      case '|':
        return lbi | rbi
      case '^':
        return lbi ^ rbi
      default:
        throw new InternalError(`Unsupported operator ${op}`)
    }
  })()
  return typeof result === 'boolean' ? result : new Uint64Cls(result)
}

function bigUintBinaryOp(left: DeliberateAny, right: DeliberateAny, op: BinaryOps): DeliberateAny {
  const lbi = checkBigUint(BigUintCls.fromCompat(left).valueOf())
  const rbi = checkBigUint(BigUintCls.fromCompat(right).valueOf())
  const result = (function () {
    switch (op) {
      case '+':
        return lbi + rbi
      case '-':
        return lbi - rbi
      case '*':
        return lbi * rbi
      case '**':
        if (lbi === 0n && rbi === 0n) {
          throw new CodeError('0 ** 0 is undefined')
        }
        return lbi ** rbi
      case '/':
        return lbi / rbi
      case '%':
        return lbi % rbi
      case '>>':
        throw new CodeError('BigUint does not support >> operator')
      case '<<':
        throw new CodeError('BigUint does not support << operator')
      case '>':
        return lbi > rbi
      case '<':
        return lbi < rbi
      case '>=':
        return lbi >= rbi
      case '<=':
        return lbi <= rbi
      case '===':
        return lbi === rbi
      case '!==':
        return lbi !== rbi
      case '&':
        return lbi & rbi
      case '|':
        return lbi | rbi
      case '^':
        return lbi ^ rbi
      default:
        throw new InternalError(`Unsupported operator ${op}`)
    }
  })()
  if (typeof result === 'boolean') {
    return result
  }

  if (result < 0) {
    throw new AvmError('BigUint underflow')
  }
  return new BigUintCls(result)
}

function bytesBinaryOp(left: DeliberateAny, right: DeliberateAny, op: BinaryOps): DeliberateAny {
  const lbb = checkBytes(BytesCls.fromCompat(flattenAsBytes(left)).asUint8Array())
  const rbb = checkBytes(BytesCls.fromCompat(flattenAsBytes(right)).asUint8Array())
  const lbi = encodingUtil.uint8ArrayToBigInt(lbb)
  const rbi = encodingUtil.uint8ArrayToBigInt(rbb)

  const result = (function () {
    switch (op) {
      case '>':
        return lbi > rbi
      case '<':
        return lbi < rbi
      case '>=':
        return lbi >= rbi
      case '<=':
        return lbi <= rbi
      case '===':
        return lbi === rbi
      case '!==':
        return lbi !== rbi
      default:
        throw new InternalError(`Unsupported operator ${op}`)
    }
  })()
  return result
}

function defaultBinaryOp(left: DeliberateAny, right: DeliberateAny, op: BinaryOps): DeliberateAny {
  switch (op) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '**':
      if (left === 0n && right === 0n) {
        throw new CodeError('0 ** 0 is undefined')
      }
      return left ** right
    case '/':
      return left / right
    case '%':
      return left % right
    case '>>':
      if (typeof left === 'bigint' && typeof right === 'bigint') {
        if (right > 63n) {
          throw new CodeError('expected shift <= 63')
        }
        return (left >> right) & MAX_UINT64
      }
      return left >> right
    case '<<':
      if (typeof left === 'bigint' && typeof right === 'bigint') {
        if (right > 63n) {
          throw new CodeError('expected shift <= 63')
        }
        return (left << right) & MAX_UINT64
      }
      return left << right
    case '>':
      return left > right
    case '<':
      return left < right
    case '>=':
      return left >= right
    case '<=':
      return left <= right
    case '===':
      return left === right
    case '!==':
      return left !== right
    case '&':
      return left & right
    case '|':
      return left | right
    case '^':
      return left ^ right
    default:
      throw new InternalError(`Unsupported operator ${op}`)
  }
}

function uint64UnaryOp(operand: DeliberateAny, op: UnaryOps): DeliberateAny {
  const obi = Uint64Cls.fromCompat(operand).valueOf()
  switch (op) {
    case '~':
      return ~obi & MAX_UINT64
    default:
      throw new InternalError(`Unsupported operator ${op}`)
  }
}

function defaultUnaryOp(_operand: DeliberateAny, op: UnaryOps): DeliberateAny {
  throw new InternalError(`Unsupported operator ${op}`)
}

const genericTypeMap = new WeakMap<DeliberateAny, TypeInfo>()
/** @internal */
export function captureGenericTypeInfo(target: DeliberateAny, t: string) {
  genericTypeMap.set(target, JSON.parse(t))
  return target
}

/** @internal */
export function getGenericTypeInfo(target: DeliberateAny): TypeInfo | undefined {
  return genericTypeMap.get(target)
}
