import type { bytes } from '@algorandfoundation/algorand-typescript'
import { randomBytes } from 'crypto'
import { BITS_IN_BYTE, MAX_BYTES_SIZE, MAX_UINT512, MAX_UINT8, UINT512_SIZE } from './constants'
import { AssertError, AvmError, InternalError } from './errors'
import type { StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './impl/primitives'
import { BigUintCls, Bytes, BytesCls, Uint64Cls } from './impl/primitives'
import type { DeliberateAny } from './typescript-helpers'

export const nameOfType = (x: unknown) => {
  if (typeof x === 'object') {
    if (x === null) return 'Null'
    if (x === undefined) return 'undefined'
    if ('constructor' in x) {
      return x.constructor.name
    }
  }
  return typeof x
}

export function* iterBigInt(start: bigint, end: bigint): Generator<bigint> {
  for (let i = start; i < end; i++) {
    yield BigInt(i)
  }
}

export const asBigInt = (v: StubUint64Compat): bigint => asUint64Cls(v).asBigInt()

export const asNumber = (v: StubUint64Compat): number => asUint64Cls(v).asNumber()

export const asUint64Cls = (val: StubUint64Compat) => Uint64Cls.fromCompat(val)

export const asBigUintCls = (val: StubBigUintCompat | Uint8Array) =>
  BigUintCls.fromCompat(val instanceof Uint8Array ? asBytes(val) : Array.isArray(val) ? asBytes(new Uint8Array(val)) : val)

export const asBytesCls = (val: StubBytesCompat | Uint8Array) => BytesCls.fromCompat(val)

export const asUint64 = (val: StubUint64Compat) => asUint64Cls(val).asAlgoTs()

export const asBigUint = (val: StubBigUintCompat | Uint8Array) => asBigUintCls(val).asAlgoTs()

export const asBytes = (val: StubBytesCompat | Uint8Array) => asBytesCls(val).asAlgoTs()

export const asUint8Array = (val: StubBytesCompat | Uint8Array) => asBytesCls(val).asUint8Array()

export const asMaybeUint64Cls = (val: DeliberateAny, throwsOverflow: boolean = true) => {
  try {
    return Uint64Cls.fromCompat(val)
  } catch (e) {
    if (e instanceof InternalError) {
      // swallow error and return undefined
    } else if (!throwsOverflow && e instanceof AvmError && e.message.includes('overflow')) {
      // swallow overflow error and return undefined
    } else {
      throw e
    }
  }
  return undefined
}

export const asMaybeBigUintCls = (val: DeliberateAny) => {
  try {
    return BigUintCls.fromCompat(val)
  } catch (e) {
    if (e instanceof InternalError) {
      // swallow error and return undefined
    } else {
      throw e
    }
  }
  return undefined
}
export const asMaybeBytesCls = (val: DeliberateAny) => {
  try {
    return BytesCls.fromCompat(val)
  } catch (e) {
    if (e instanceof InternalError) {
      // swallow error and return undefined
    } else {
      throw e
    }
  }
  return undefined
}

export const binaryStringToBytes = (s: string): BytesCls =>
  BytesCls.fromCompat(new Uint8Array(s.match(/.{1,8}/g)!.map((x) => parseInt(x, 2))))

export const getRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const getRandomBigInt = (min: number | bigint, max: number | bigint): bigint => {
  const bigIntMin = BigInt(min)
  const bigIntMax = BigInt(max)
  const randomValue = [...Array(UINT512_SIZE / BITS_IN_BYTE).keys()]
    .map(() => getRandomNumber(0, MAX_UINT8))
    .reduce((acc, x) => acc * 256n + BigInt(x), 0n)
  return (randomValue % (bigIntMax - bigIntMin)) + bigIntMin
}

export const getRandomBytes = (length: number): BytesCls => asBytesCls(Bytes(randomBytes(length)))

export const flattenAsBytes = (arr: StubBytesCompat | StubBytesCompat[]): bytes => {
  return (Array.isArray(arr) ? arr : [arr]).map((x) => asBytes(x)).reduce((acc, x) => acc.concat(x), Bytes())
}

const NoValue = Symbol('no-value')
type LazyInstance<T> = () => T
export const Lazy = <T>(factory: () => T): LazyInstance<T> => {
  let val: T | typeof NoValue = NoValue

  return () => {
    if (val === NoValue) {
      val = factory()
    }
    return val
  }
}

const ObjectReferenceSymbol = Symbol('ObjectReference')
const objectRefIter = iterBigInt(1001n, MAX_UINT512)
export const getObjectReference = (obj: DeliberateAny): bigint => {
  const tryGetReference = (obj: DeliberateAny): bigint | undefined => {
    const s = Object.getOwnPropertySymbols(obj).find((s) => s.toString() === ObjectReferenceSymbol.toString())
    return s ? obj[s] : ObjectReferenceSymbol in obj ? obj[ObjectReferenceSymbol] : undefined
  }
  const existingRef = tryGetReference(obj)
  if (existingRef !== undefined) {
    return existingRef
  }
  const ref = objectRefIter.next().value
  Object.defineProperty(obj, ObjectReferenceSymbol, {
    value: ref,
    enumerable: false,
    writable: false,
  })

  return ref
}

export const combineIntoMaxBytePages = (pages: bytes[]): bytes[] => {
  const combined = pages.reduce((acc, x) => acc.concat(x), asBytesCls(''))
  const totalPages = (asNumber(combined.length) + MAX_BYTES_SIZE - 1) / MAX_BYTES_SIZE
  const result = [] as bytes[]
  for (let i = 0; i < totalPages; i++) {
    const start = i * MAX_BYTES_SIZE
    const end = Math.min((i + 1) * MAX_BYTES_SIZE, asNumber(combined.length))
    const page = combined.slice(start, end)
    result.push(page.asAlgoTs())
  }
  return result
}

export const conactUint8Arrays = (...values: Uint8Array[]): Uint8Array => {
  const result = new Uint8Array(values.reduce((acc, value) => acc + value.length, 0))
  let index = 0
  for (const value of values) {
    result.set(value, index)
    index += value.length
  }
  return result
}

export const uint8ArrayToNumber = (value: Uint8Array): number => {
  return value.reduce((acc, x) => acc * 256 + x, 0)
}

/**
 * Runtime assertion function that throws if condition is falsy.
 *
 * @param {unknown} condition - The condition to assert
 * @param {string} [message] - Optional error message if assertion fails
 * @throws {AssertError} Throws if condition is falsy
 *
 * @example
 * ```ts
 * const value: string | undefined = "test";
 * assert(value !== undefined);
 *
 * assert(false, "This will throw"); // throws AssertError: This will throw
 * ```
 */
export function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new AssertError(message ?? 'Assertion failed')
  }
}

/**
 * Simulates Algorand Virtual Machine's 'err' opcode by throwing an error.
 * Used to halt program execution with an optional error message.
 *
 * @param {string} [message] - Optional error message. Defaults to "err opcode executed"
 * @throws {AvmError} Always throws an AvmError
 * @returns {never} Function never returns normally
 *
 * @example
 * ```ts
 * if (amount < 0) {
 *   err("Invalid amount"); // Throws AvmError: Invalid amount
 * }
 * ```
 */
export function err(message?: string): never {
  throw new AvmError(message ?? 'err opcode executed')
}
