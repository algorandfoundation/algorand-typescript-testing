import type { biguint, BigUintCompat, bytes, BytesCompat, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { avmError, AvmError, avmInvariant, CodeError, InternalError } from '../errors'
import { nameOfType } from '../typescript-helpers'
import { base32ToUint8Array } from './base-32'

const MAX_UINT8 = 2 ** 8 - 1
const MAX_BYTES_SIZE = 4096

/** @internal */
export type StubBigUintCompat = BigUintCompat | BigUintCls | Uint64Cls
/** @internal */
export type StubBytesCompat = BytesCompat | BytesCls
/** @internal */
export type StubUint64Compat = Uint64Compat | Uint64Cls

/**
 * Create a uint64 with the default value of 0
 * @internal
 */
export function Uint64(): uint64
/**
 * @internal
 * Create a uint64 from a string literal
 */
export function Uint64(v: string): uint64
/**
 * @internal
 * Create a uint64 from a bigint literal
 */
export function Uint64(v: bigint): uint64
/**
 * @internal
 * Create a uint64 from a number literal
 */
export function Uint64(v: number): uint64
/**
 * @internal
 * Create a uint64 from a boolean value. True is 1, False is 0
 */
export function Uint64(v: boolean): uint64
export function Uint64(v?: Uint64Compat | string): uint64 {
  if (typeof v === 'string') {
    v = BigInt(v)
  }
  return Uint64Cls.fromCompat(v ?? 0).asAlgoTs()
}

/**
 * @internal
 * Create a biguint from a bigint literal
 */
export function BigUint(v: bigint): biguint
/**
 * @internal
 * Create a biguint from a boolean value (true = 1, false = 0)
 */
export function BigUint(v: boolean): biguint
/**
 * @internal
 * Create a biguint from a uint64 value
 */
export function BigUint(v: uint64): biguint
/**
 * @internal
 * Create a biguint from a number literal
 */
export function BigUint(v: number): biguint
/**
 * @internal
 * Create a biguint from a byte array interpreted as a big-endian number
 */
export function BigUint(v: bytes): biguint
/**
 * @internal
 * Create a biguint from a string literal containing the decimal digits
 */
export function BigUint(v: string): biguint
/**
 * @internal
 * Create a biguint with the default value of 0
 */
export function BigUint(): biguint
export function BigUint(v?: BigUintCompat | string): biguint {
  if (typeof v === 'string') v = BigInt(v)
  else if (v === undefined) v = 0n
  return BigUintCls.fromCompat(v).asAlgoTs()
}

type ToFixedBytesOptions<TLength extends uint64 = uint64> = {
  /**
   * The length for the bounded type
   */
  length: TLength
  /**
   * The strategy to use for converting to a fixed length bytes type (default: 'assert-length')
   *
   * - 'assert-length': Asserts that the byte sequence has the specified length and fails if it differs
   * - 'unsafe-cast': Reinterprets the byte sequence as a fixed length type without any checks. This will succeed even if the value
   *              is not of the specified length but will result in undefined behaviour for any code that makes use of this value.
   *
   */
  strategy?: 'assert-length' | 'unsafe-cast'
}

/**
 * Create a byte array from a string interpolation template and compatible replacements
 * @param value
 * @param replacements
 */
export function Bytes(value: TemplateStringsArray, ...replacements: BytesCompat[]): bytes<uint64>
/**
 * Create a byte array from a utf8 string
 */
export function Bytes(value: string): bytes<uint64>
/**
 * Create a byte array from a utf8 string
 */
export function Bytes<TLength extends uint64>(value: string, options: ToFixedBytesOptions<TLength>): bytes<TLength>
/**
 * No op, returns the provided byte array.
 */
export function Bytes(value: bytes): bytes<uint64>
/**
 * No op, returns the provided byte array.
 */
export function Bytes<TLength extends uint64>(value: bytes, options: ToFixedBytesOptions<TLength>): bytes<TLength>
/**
 * Create a byte array from a biguint value encoded as a variable length big-endian number
 */
export function Bytes(value: biguint): bytes<uint64>
/**
 * Create a byte array from a biguint value encoded as a variable length big-endian number
 */
export function Bytes<TLength extends uint64>(value: biguint, options: ToFixedBytesOptions<TLength>): bytes<TLength>
/**
 * Create a byte array from a uint64 value encoded as a a variable length 64-bit number
 */
export function Bytes(value: uint64): bytes<uint64>
/**
 * Create a byte array from a uint64 value encoded as a a variable length 64-bit number
 */
export function Bytes<TLength extends uint64 = 8>(value: uint64, options: ToFixedBytesOptions<TLength>): bytes<TLength>
/**
 * Create a byte array from an Iterable<uint64> where each item is interpreted as a single byte and must be between 0 and 255 inclusively
 */
export function Bytes(value: Iterable<uint64>): bytes<uint64>
/**
 * Create a byte array from an Iterable<uint64> where each item is interpreted as a single byte and must be between 0 and 255 inclusively
 */
export function Bytes<TLength extends uint64>(value: Iterable<uint64>, options: ToFixedBytesOptions<TLength>): bytes<TLength>
/**
 * Create an empty byte array
 */
export function Bytes(): bytes<uint64>
/**
 * Create an empty byte array
 */
export function Bytes<TLength extends uint64 = uint64>(options: ToFixedBytesOptions<TLength>): bytes<TLength>
export function Bytes<TLength extends uint64 = uint64>(
  value?: BytesCompat | TemplateStringsArray | biguint | uint64 | Iterable<number> | ToFixedBytesOptions<TLength>,
  ...replacements: [ToFixedBytesOptions<TLength>] | BytesCompat[] | undefined[]
): bytes<TLength> {
  // Handle the case where only options are provided (empty bytes with fixed length)
  if (isOptionsOnly(value)) {
    const options = value as ToFixedBytesOptions<TLength>
    const emptyBytes = new BytesCls(new Uint8Array(options.length))
    return emptyBytes.toFixed(options)
  }

  // Convert the input value to a BytesCls instance
  const result = convertValueToBytes(value, replacements)

  // Extract options from replacements if provided
  const options = isTemplateStringsArray(value) ? undefined : extractOptionsFromReplacements(replacements)

  // Return either fixed-length or variable-length bytes
  return options ? result.toFixed(options) : (result.asAlgoTs() as bytes<TLength>)
}

/**
 * @internal
 * Create a new bytes value from a hexadecimal encoded string
 * @param hex
 */
Bytes.fromHex = <TLength extends uint64 = uint64>(hex: string, options?: ToFixedBytesOptions<TLength>): bytes<TLength> => {
  return options ? BytesCls.fromHex(hex).toFixed(options) : (BytesCls.fromHex(hex).asAlgoTs() as bytes<TLength>)
}
/**
 * @internal
 * Create a new bytes value from a base 64 encoded string
 * @param b64
 */
Bytes.fromBase64 = <TLength extends uint64 = uint64>(b64: string, options?: ToFixedBytesOptions<TLength>): bytes<TLength> => {
  return options ? BytesCls.fromBase64(b64).toFixed(options) : (BytesCls.fromBase64(b64).asAlgoTs() as bytes<TLength>)
}

/**
 * @internal
 * Create a new bytes value from a base 32 encoded string
 * @param b32
 */
Bytes.fromBase32 = <TLength extends uint64 = uint64>(b32: string, options?: ToFixedBytesOptions<TLength>): bytes<TLength> => {
  return options ? BytesCls.fromBase32(b32).toFixed(options) : (BytesCls.fromBase32(b32).asAlgoTs() as bytes<TLength>)
}

/**
 * Helper function to check if the value parameter is options-only (for empty bytes with fixed length)
 */
function isOptionsOnly<TLength extends uint64>(
  value?: BytesCompat | TemplateStringsArray | biguint | uint64 | Iterable<number> | ToFixedBytesOptions<TLength>,
): value is ToFixedBytesOptions<TLength> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !isTemplateStringsArray(value) &&
    !(Symbol.iterator in value) &&
    !(value instanceof BigUintCls) &&
    !(value instanceof Uint64Cls) &&
    !(value instanceof BytesCls) &&
    !(value instanceof Uint8Array) &&
    Object.keys(value).length <= 2 &&
    Object.keys(value).includes('length')
  )
}

/**
 * Helper function to convert various input types to BytesCls
 */
function convertValueToBytes<TLength extends uint64>(
  value?: BytesCompat | TemplateStringsArray | biguint | uint64 | Iterable<number> | ToFixedBytesOptions<TLength>,
  replacements?: [ToFixedBytesOptions<TLength>] | BytesCompat[] | undefined[],
): BytesCls {
  if (value === undefined) {
    return new BytesCls(new Uint8Array(0))
  }

  if (isTemplateStringsArray(value)) {
    return BytesCls.fromInterpolation(value, replacements as BytesCompat[])
  }

  if (typeof value === 'bigint' || value instanceof BigUintCls) {
    return BigUintCls.fromCompat(value).toBytes()
  }

  if (typeof value === 'number' || value instanceof Uint64Cls) {
    return Uint64Cls.fromCompat(value).toBytes()
  }

  if (isIterable(value)) {
    return convertIterableToBytes(value)
  }

  // Default case: treat as BytesCompat
  return BytesCls.fromCompat(value as BytesCompat)
}

/**
 * Helper function to check if a value is iterable (but not string or Uint8Array)
 */
function isIterable(value: unknown): value is Iterable<number> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Symbol.iterator in value &&
    !isTemplateStringsArray(value) &&
    !(value instanceof Uint8Array) &&
    !(value instanceof BytesCls)
  )
}

/**
 * Helper function to convert an iterable of numbers to BytesCls
 */
function convertIterableToBytes(value: Iterable<number>): BytesCls {
  const valueItems = Array.from(value).map((v) => getNumber(v))
  const invalidValue = valueItems.find((v) => v < 0 || v > 255)
  if (invalidValue !== undefined) {
    throw new CodeError(`Cannot convert ${invalidValue} to a byte`)
  }
  return new BytesCls(new Uint8Array(valueItems))
}

/**
 * Helper function to extract options from the replacements parameter
 */
function extractOptionsFromReplacements<TLength extends uint64>(
  replacements: [ToFixedBytesOptions<TLength>] | BytesCompat[] | undefined[],
): ToFixedBytesOptions<TLength> | undefined {
  if (!replacements || replacements.length !== 1) {
    return undefined
  }

  const potentialOptions = replacements[0]
  // Check if the replacement looks like options
  if (
    typeof potentialOptions === 'object' &&
    potentialOptions !== null &&
    Object.keys(potentialOptions).length <= 2 &&
    Object.keys(potentialOptions).includes('length')
  ) {
    return potentialOptions as ToFixedBytesOptions<TLength>
  }

  return undefined
}

/**
 * @internal
 * Convert a StubUint64Compat value into a 'number' if possible.
 * This value may be negative
 * @param v
 */
export const getNumber = (v: StubUint64Compat): number => {
  if (typeof v == 'boolean') return v ? 1 : 0
  if (typeof v == 'number') return v
  if (typeof v == 'bigint') {
    avmInvariant(
      v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER),
      'value cannot be safely converted to a number',
    )
    return Number(v)
  }
  if (v instanceof Uint64Cls) return v.asNumber()
  throw new InternalError(`Cannot convert ${v} to number`)
}

/** @internal */
export const getUint8Array = (v: StubBytesCompat): Uint8Array => {
  return BytesCls.fromCompat(v).asUint8Array()
}

/** @internal */
export const isBytes = (v: unknown): v is StubBytesCompat => {
  if (typeof v === 'string') return true
  if (v instanceof BytesCls) return true
  return v instanceof Uint8Array
}

/** @internal */
export const isUint64 = (v: unknown): v is StubUint64Compat => {
  if (typeof v == 'number') return true
  if (typeof v == 'bigint') return true
  return v instanceof Uint64Cls
}

/** @internal */
export const checkUint64 = (v: bigint): bigint => {
  const u64 = BigInt.asUintN(64, v)
  if (u64 !== v) throw new AvmError(`Uint64 overflow or underflow`)
  return u64
}
/** @internal */
export const checkBigUint = (v: bigint): bigint => {
  const uBig = BigInt.asUintN(64 * 8, v)
  if (uBig !== v) throw new AvmError(`BigUint overflow or underflow`)
  return uBig
}

/** @internal */
export const checkBytes = (v: Uint8Array): Uint8Array => {
  if (v.length > MAX_BYTES_SIZE) {
    throw new AvmError(`Bytes length ${v.length} exceeds maximum length ${MAX_BYTES_SIZE}`)
  }
  return v
}

/**
 * Verifies that an object is an instance of a type based on its name rather than reference equality.
 *
 * This is useful in scenarios where a module loader has loaded a module twice and hence two instances of a
 * type do not have reference equality on their constructors.
 * @param subject The object to check
 * @param typeCtor The ctor of the type
 */
function isInstanceOfTypeByName(subject: unknown, typeCtor: { name: string }): boolean {
  if (subject === null || typeof subject !== 'object') return false

  let ctor = subject.constructor
  while (typeof ctor === 'function') {
    if (ctor.name === typeCtor.name) return true
    ctor = Object.getPrototypeOf(ctor)
  }
  return false
}

/** @internal */
export abstract class AlgoTsPrimitiveCls {
  static [Symbol.hasInstance](x: unknown): x is AlgoTsPrimitiveCls {
    return isInstanceOfTypeByName(x, AlgoTsPrimitiveCls)
  }

  abstract valueOf(): bigint | string
  abstract toBytes(): BytesCls
}

/** @internal */
export class Uint64Cls extends AlgoTsPrimitiveCls {
  readonly #value: bigint
  constructor(value: bigint | number | string) {
    super()
    this.#value = BigInt(value)
    checkUint64(this.#value)

    Object.defineProperty(this, 'uint64', {
      value: this.#value.toString(),
      writable: false,
      enumerable: true,
    })
  }
  static [Symbol.hasInstance](x: unknown): x is Uint64Cls {
    return isInstanceOfTypeByName(x, Uint64Cls)
  }
  static fromCompat(v: StubUint64Compat): Uint64Cls {
    if (typeof v == 'boolean') return new Uint64Cls(v ? 1n : 0n)
    if (typeof v == 'number') return new Uint64Cls(BigInt(v))
    if (typeof v == 'bigint') return new Uint64Cls(v)
    if (v instanceof Uint64Cls) return v
    throw new InternalError(`Cannot convert ${v} to uint64`)
  }

  valueOf(): bigint {
    return this.#value
  }

  toBytes(): BytesCls {
    return new BytesCls(encodingUtil.bigIntToUint8Array(this.#value, 8))
  }

  asAlgoTs(): uint64 {
    return this as unknown as uint64
  }

  asBigInt(): bigint {
    return this.#value
  }
  asNumber(): number {
    if (this.#value > Number.MAX_SAFE_INTEGER) {
      throw new AvmError('value cannot be safely converted to a number')
    }
    return Number(this.#value)
  }
  toString(): string {
    return this.#value.toString()
  }
}
/** @internal */
export class BigUintCls extends AlgoTsPrimitiveCls {
  readonly #value: bigint
  constructor(value: bigint) {
    super()
    this.#value = value
    Object.defineProperty(this, 'biguint', {
      value: value.toString(),
      writable: false,
      enumerable: true,
    })
  }
  valueOf(): bigint {
    return this.#value
  }

  toBytes(): BytesCls {
    return new BytesCls(encodingUtil.bigIntToUint8Array(this.#value))
  }

  asAlgoTs(): biguint {
    return this as unknown as biguint
  }

  asBigInt(): bigint {
    return this.#value
  }
  asNumber(): number {
    if (this.#value > Number.MAX_SAFE_INTEGER) {
      throw new AvmError('value cannot be safely converted to a number')
    }
    return Number(this.#value)
  }
  static [Symbol.hasInstance](x: unknown): x is BigUintCls {
    return isInstanceOfTypeByName(x, BigUintCls)
  }
  static fromCompat(v: StubBigUintCompat): BigUintCls {
    if (typeof v == 'boolean') return new BigUintCls(v ? 1n : 0n)
    if (typeof v == 'number') return new BigUintCls(BigInt(v))
    if (typeof v == 'bigint') return new BigUintCls(v)
    if (v instanceof Uint64Cls) return new BigUintCls(v.valueOf())
    if (v instanceof BytesCls) return v.toBigUint()
    if (v instanceof BigUintCls) return v
    throw new InternalError(`Cannot convert ${nameOfType(v)} to BigUint`)
  }
}

function isTemplateStringsArray(v: unknown): v is TemplateStringsArray {
  return Boolean(v) && Array.isArray(v) && typeof v[0] === 'string'
}

/** @internal */
export class BytesCls extends AlgoTsPrimitiveCls {
  readonly #v: Uint8Array
  constructor(
    v: Uint8Array,
    public readonly fixedLength?: number,
  ) {
    super()
    this.#v = v
    checkBytes(this.#v)
    // Add an enumerable property for debugging code to show
    Object.defineProperty(this, 'bytes', {
      value: encodingUtil.uint8ArrayToHex(this.#v),
      writable: false,
      enumerable: true,
    })
  }

  get length() {
    return new Uint64Cls(this.#v.length)
  }

  toBytes(): BytesCls {
    return this
  }

  at(i: StubUint64Compat): BytesCls {
    return new BytesCls(arrayUtil.arrayAt(this.#v, i))
  }

  slice(start?: StubUint64Compat, end?: StubUint64Compat): BytesCls {
    const sliced = arrayUtil.arraySlice(this.#v, start, end)
    return new BytesCls(sliced)
  }

  concat(other: StubBytesCompat): BytesCls {
    const otherArray = BytesCls.fromCompat(other).asUint8Array()
    const mergedArray = new Uint8Array(this.#v.length + otherArray.length)
    mergedArray.set(this.#v)
    mergedArray.set(otherArray, this.#v.length)
    return new BytesCls(mergedArray)
  }

  bitwiseAnd(other: StubBytesCompat): BytesCls {
    return this.bitwiseOp(other, (a, b) => a & b)
  }

  bitwiseOr(other: StubBytesCompat): BytesCls {
    return this.bitwiseOp(other, (a, b) => a | b)
  }

  bitwiseXor(other: StubBytesCompat): BytesCls {
    return this.bitwiseOp(other, (a, b) => a ^ b)
  }

  bitwiseInvert(): BytesCls {
    const result = new Uint8Array(this.#v.length)
    this.#v.forEach((v, i) => {
      result[i] = ~v & MAX_UINT8
    })
    return new BytesCls(result)
  }

  equals(other: StubBytesCompat): boolean {
    const otherArray = BytesCls.fromCompat(other).asUint8Array()
    if (this.#v.length !== otherArray.length) return false
    for (let i = 0; i < this.#v.length; i++) {
      if (this.#v[i] !== otherArray[i]) return false
    }
    return true
  }

  private bitwiseOp(other: StubBytesCompat, op: (a: number, b: number) => number): BytesCls {
    const otherArray = BytesCls.fromCompat(other).asUint8Array()
    const result = new Uint8Array(Math.max(this.#v.length, otherArray.length))
    for (let i = result.length - 1; i >= 0; i--) {
      const thisIndex = i - (result.length - this.#v.length)
      const otherIndex = i - (result.length - otherArray.length)
      result[i] = op(this.#v[thisIndex] ?? 0, otherArray[otherIndex] ?? 0)
    }
    return new BytesCls(result)
  }

  valueOf(): string {
    return encodingUtil.uint8ArrayToHex(this.#v)
  }

  toFixed<TNewLength extends uint64>(options: { length: TNewLength; strategy?: 'assert-length' | 'unsafe-cast' }): bytes<TNewLength> {
    if (options.strategy === undefined || options.strategy === 'assert-length') {
      if (this.#v.length !== options.length) {
        throw new CodeError(`Invalid bytes constant length of ${this.#v.length}, expected ${options.length}`)
      }
    }
    return new BytesCls(this.#v, options.length) as unknown as bytes<TNewLength>
  }
  static [Symbol.hasInstance](x: unknown): x is BytesCls {
    return isInstanceOfTypeByName(x, BytesCls)
  }

  static fromCompat(v: StubBytesCompat | Uint8Array | undefined): BytesCls {
    if (v === undefined) return new BytesCls(new Uint8Array())
    if (typeof v === 'string') return new BytesCls(encodingUtil.utf8ToUint8Array(v))
    if (v instanceof BytesCls) return v
    if (v instanceof Uint8Array) return new BytesCls(v)
    throw new InternalError(`Cannot convert ${nameOfType(v)} to bytes`)
  }

  static fromInterpolation(template: TemplateStringsArray, replacements: StubBytesCompat[]) {
    return template
      .flatMap((templateText, index) => {
        const replacement = replacements[index]
        if (replacement) {
          return [BytesCls.fromCompat(templateText), BytesCls.fromCompat(replacement)]
        }
        return [BytesCls.fromCompat(templateText)]
      })
      .reduce((a, b) => a.concat(b))
  }

  static fromHex(hex: string): BytesCls {
    return new BytesCls(encodingUtil.hexToUint8Array(hex))
  }

  static fromBase64(b64: string): BytesCls {
    return new BytesCls(encodingUtil.base64ToUint8Array(b64))
  }

  static fromBase32(b32: string): BytesCls {
    return new BytesCls(base32ToUint8Array(b32))
  }

  toUint64(): Uint64Cls {
    return new Uint64Cls(encodingUtil.uint8ArrayToBigInt(this.#v))
  }

  toBigUint(): BigUintCls {
    return new BigUintCls(encodingUtil.uint8ArrayToBigInt(this.#v))
  }

  toString(): string {
    return encodingUtil.uint8ArrayToUtf8(this.#v)
  }

  asAlgoTs(): bytes {
    return this as unknown as bytes
  }

  asUint8Array(): Uint8Array {
    return this.#v
  }
}

/** @internal */
export const arrayUtil = new (class ArrayUtil {
  arrayAt(arrayLike: Uint8Array, index: StubUint64Compat): Uint8Array
  arrayAt<T>(arrayLike: readonly T[], index: StubUint64Compat): T
  arrayAt<T>(arrayLike: readonly T[] | Uint8Array, index: StubUint64Compat): T | Uint8Array {
    const indexNum = getNumber(index)
    if (arrayLike instanceof Uint8Array) {
      const res = arrayLike.slice(indexNum, indexNum === -1 ? undefined : indexNum + 1)
      avmInvariant(res.length, 'Index out of bounds')
      return res
    }
    return arrayLike.at(indexNum) ?? avmError('Index out of bounds')
  }
  arraySlice(arrayLike: Uint8Array, start: undefined | StubUint64Compat, end: undefined | StubUint64Compat): Uint8Array
  arraySlice<T>(arrayLike: readonly T[], start: undefined | StubUint64Compat, end: undefined | StubUint64Compat): T[]
  arraySlice<T>(
    arrayLike: readonly T[] | Uint8Array,
    start: undefined | StubUint64Compat,
    end: undefined | StubUint64Compat,
  ): Uint8Array | T[] {
    const startNum = start === undefined ? undefined : getNumber(start)
    const endNum = end === undefined ? undefined : getNumber(end)
    if (arrayLike instanceof Uint8Array) {
      return arrayLike.slice(startNum, endNum)
    } else {
      return arrayLike.slice(startNum, endNum)
    }
  }
})()
