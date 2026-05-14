import type { biguint, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { Base64 } from '@algorandfoundation/algorand-typescript'
import { BITS_IN_BYTE, MAX_BYTES_SIZE, MAX_UINT64, MAX_UINT8, UINT64_SIZE } from '../constants'
import { AvmError, CodeError, invariant, NotImplementedError } from '../errors'
import {
  asBigUint,
  asBigUintCls,
  asBytes,
  asBytesCls,
  asMaybeBytesCls,
  asMaybeUint64Cls,
  asNumber,
  asUint64BigInt,
  asUint64Bytes,
  asUint64Cls,
  asUint8Array,
  binaryStringToBytes,
} from '../util'
import type { BytesCls, StubBigUintCompat, StubBytesCompat, StubUint64Compat } from './primitives'
import { Bytes, checkBigUint, Uint64 } from './primitives'

const BYTES_IN_UINT64 = UINT64_SIZE / BITS_IN_BYTE

/** @internal */
export const addw = (a: StubUint64Compat, b: StubUint64Compat): readonly [uint64, uint64] => {
  const uint64A = asUint64BigInt(a)
  const uint64B = asUint64BigInt(b)
  const sum = uint64A + uint64B
  return toUint128(sum)
}

/** @internal */
export const base64Decode = (e: Base64, a: StubBytesCompat): bytes => {
  const encoding = e === Base64.StdEncoding ? 'base64' : 'base64url'
  const stringValue = asBytesCls(a).toString()

  const bufferResult = Buffer.from(stringValue, encoding)
  if (bufferResult.toString(encoding) !== stringValue) {
    throw new AvmError('illegal base64 data')
  }

  const uint8ArrayResult = new Uint8Array(bufferResult)
  return Bytes(uint8ArrayResult)
}

/** @internal */
export const bitLength = (a: StubUint64Compat | StubBytesCompat): uint64 => {
  const uint64BigInt = asMaybeUint64Cls(a)?.asBigInt()
  const bytesBigInt = asMaybeBytesCls(a)?.toBigUint()?.asBigInt()
  const bigIntValue = uint64BigInt ?? bytesBigInt
  invariant(bigIntValue !== undefined, 'value must be uint64 or bytes')

  if (bigIntValue === 0n) {
    return 0
  }
  return bigIntValue.toString(2).length
}

/** @internal */
export const bsqrt = (a: StubBigUintCompat): biguint => {
  const bigintValue = checkBigUint(asBigUintCls(a).asBigInt())
  const sqrtValue = squareroot(bigintValue)
  return asBigUint(sqrtValue)
}

/** @internal */
export const btoi = (a: StubBytesCompat): uint64 => {
  const bytesValue = asBytesCls(a)
  if (bytesValue.length.asAlgoTs() > BYTES_IN_UINT64) {
    throw new AvmError(`btoi arg too long, got ${bytesValue.length.valueOf()} bytes`)
  }
  return bytesValue.toUint64().asAlgoTs()
}

/** @internal */
export const bzero = (a: StubUint64Compat): bytes => {
  const size = asUint64BigInt(a)
  if (size > MAX_BYTES_SIZE) {
    throw new AvmError('bzero attempted to create a too large string')
  }
  return Bytes(new Uint8Array(Number(size)))
}

/** @internal */
export const concat = (a: StubBytesCompat, b: StubBytesCompat): bytes => {
  return asBytes(a).concat(asBytes(b))
}

/** @internal */
export const divmodw = (
  a: StubUint64Compat,
  b: StubUint64Compat,
  c: StubUint64Compat,
  d: StubUint64Compat,
): readonly [uint64, uint64, uint64, uint64] => {
  const i = uint128ToBigInt(a, b)
  const j = uint128ToBigInt(c, d)

  const div = i / j
  const mod = i % j
  return [...toUint128(div), ...toUint128(mod)]
}

/** @internal */
export const divw = (a: StubUint64Compat, b: StubUint64Compat, c: StubUint64Compat): uint64 => {
  const i = uint128ToBigInt(a, b)
  const j = asUint64BigInt(c)
  return Uint64(i / j)
}

/** @internal */
export const exp = (a: StubUint64Compat, b: StubUint64Compat): uint64 => {
  const base = asUint64BigInt(a)
  const exponent = asUint64BigInt(b)
  if (base === 0n && exponent === 0n) {
    throw new CodeError('0 ** 0 is undefined')
  }
  return Uint64(base ** exponent)
}

/** @internal */
export const expw = (a: StubUint64Compat, b: StubUint64Compat): readonly [uint64, uint64] => {
  const base = asUint64BigInt(a)
  const exponent = asUint64BigInt(b)
  if (base === 0n && exponent === 0n) {
    throw new CodeError('0 ** 0 is undefined')
  }
  return toUint128(base ** exponent)
}

type ExtractType = ((a: StubBytesCompat, b: StubUint64Compat) => bytes) &
  ((a: StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat) => bytes)
/** @internal */
export const extract = ((a: StubBytesCompat, b: StubUint64Compat, c?: StubUint64Compat): bytes => {
  const bytesValue = asBytesCls(a)
  const bytesLength = bytesValue.length.asBigInt()

  const start = asUint64BigInt(b)
  const length = c !== undefined ? asUint64BigInt(c) : undefined
  const end = length !== undefined ? start + length : undefined

  if (start > bytesLength) {
    throw new CodeError(`extraction start ${start} is beyond length`)
  }
  if (end !== undefined && end > bytesLength) {
    throw new CodeError(`extraction end ${end} is beyond length`)
  }

  return bytesValue.slice(start, end).asAlgoTs()
}) as ExtractType

/** @internal */
export const extractUint16 = (a: StubBytesCompat, b: StubUint64Compat): uint64 => {
  const result = extract(a, b, 2)
  const bytesResult = asBytesCls(result)
  return bytesResult.toUint64().asAlgoTs()
}

/** @internal */
export const extractUint32 = (a: StubBytesCompat, b: StubUint64Compat): uint64 => {
  const result = extract(a, b, 4)
  const bytesResult = asBytesCls(result)
  return bytesResult.toUint64().asAlgoTs()
}

/** @internal */
export const extractUint64 = (a: StubBytesCompat, b: StubUint64Compat): uint64 => {
  const result = extract(a, b, 8)
  const bytesResult = asBytesCls(result)
  return bytesResult.toUint64().asAlgoTs()
}

/** @internal */
export const getBit = (a: StubUint64Compat | StubBytesCompat, b: StubUint64Compat): boolean => {
  const aAsUint64 = asMaybeUint64Cls(a)
  const aAsBytes = asMaybeBytesCls(a)

  const source = aAsUint64 ?? aAsBytes
  invariant(source, 'a must be uint64 or bytes')
  const binaryString = toBinaryString(source.toBytes())

  const index = asNumber(b)
  const adjustedIndex = aAsUint64 ? binaryString.length - index - 1 : index
  if (adjustedIndex < 0 || adjustedIndex >= binaryString.length) {
    throw new CodeError(`getBit index ${index} is beyond length`)
  }
  return binaryString[adjustedIndex] === '1'
}

/** @internal */
export const getByte = (a: StubBytesCompat, b: StubUint64Compat): uint64 => {
  const bytesValue = asBytesCls(a)
  const index = asNumber(b)
  if (index >= bytesValue.length.asNumber()) {
    throw new CodeError(`getByte index ${index} is beyond length`)
  }
  return bytesValue.at(index).toUint64().asAlgoTs()
}

/** @internal */
export const itob = (a: StubUint64Compat): bytes => {
  return asUint64Bytes(a).asAlgoTs()
}

/** @internal */
export const len = (a: StubBytesCompat): uint64 => {
  return asBytesCls(a).length.asAlgoTs()
}

/** @internal */
export const mulw = (a: StubUint64Compat, b: StubUint64Compat): readonly [uint64, uint64] => {
  const product = asUint64BigInt(a) * asUint64BigInt(b)
  return toUint128(product)
}

/** @internal */
export const replace = (a: StubBytesCompat, b: StubUint64Compat, c: StubBytesCompat): bytes => {
  const bytesValue = asBytesCls(a)
  const index = asNumber(b)
  const replacement = asBytesCls(c)

  const valueLength = bytesValue.length.asNumber()
  const replacementLength = replacement.length.asNumber()

  if (index + replacementLength > valueLength) {
    throw new CodeError(`expected value <= ${valueLength}, got: ${index + replacementLength}`)
  }
  return bytesValue
    .slice(0, index)
    .concat(replacement)
    .concat(bytesValue.slice(index + replacementLength))
    .asAlgoTs()
}

type SelectType = ((a: StubBytesCompat, b: StubBytesCompat, c: StubUint64Compat) => bytes) &
  ((a: StubUint64Compat, b: StubUint64Compat, c: StubUint64Compat) => uint64)
/** @internal */
export const select = ((
  a: StubUint64Compat | StubBytesCompat,
  b: StubUint64Compat | StubBytesCompat,
  c: StubUint64Compat,
): uint64 | bytes => {
  const choiceA = asMaybeUint64Cls(a) ?? asMaybeBytesCls(a)
  const choiceB = asMaybeUint64Cls(b) ?? asMaybeBytesCls(b)
  invariant(choiceA, 'a must be uint64 or bytes')
  invariant(choiceB, 'b must be uint64 or bytes')

  return (asUint64BigInt(c) !== 0n ? choiceB : choiceA).asAlgoTs()
}) as SelectType

type SetBitType = ((target: StubBytesCompat, n: StubUint64Compat, c: StubUint64Compat) => bytes) &
  ((target: StubUint64Compat, n: StubUint64Compat, c: StubUint64Compat) => uint64)
/** @internal */
export const setBit = ((a: StubUint64Compat | StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat) => {
  const uint64Cls = asMaybeUint64Cls(a)
  const indexParam = asNumber(b)
  const bit = asNumber(c)
  if (uint64Cls) {
    const binaryString = toBinaryString(uint64Cls.toBytes())
    const index = binaryString.length - indexParam - 1
    const newBytes = doSetBit(binaryString, index, bit)
    return newBytes.toUint64().asAlgoTs()
  } else {
    const bytesCls = asMaybeBytesCls(a)
    invariant(bytesCls, 'a must be uint64 or bytes')
    const binaryString = toBinaryString(bytesCls)
    const newBytes = doSetBit(binaryString, indexParam, bit)
    return newBytes.asAlgoTs()
  }
}) as SetBitType

/** @internal */
export const setByte = (a: StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat): bytes => {
  const binaryString = toBinaryString(a)

  const byteIndex = asNumber(b)
  const bitIndex = byteIndex * BITS_IN_BYTE

  const replacementNumber = asUint64Cls(c)
  if (replacementNumber.valueOf() > MAX_UINT8) {
    throw new CodeError(`setByte value ${replacementNumber.valueOf()} > ${MAX_UINT8}`)
  }

  const replacement = toBinaryString(replacementNumber.toBytes().at(-1))
  if (bitIndex >= binaryString.length) {
    throw new CodeError(`setByte index ${byteIndex} is beyond length`)
  }

  const updatedString = binaryString.slice(0, bitIndex) + replacement + binaryString.slice(bitIndex + replacement.length)
  const updatedBytes = binaryStringToBytes(updatedString)
  return updatedBytes.asAlgoTs()
}

/** @internal */
export const shl = (a: StubUint64Compat, b: StubUint64Compat): uint64 => {
  const bigIntA = asUint64BigInt(a)
  const bigIntB = asUint64BigInt(b)
  if (bigIntB >= UINT64_SIZE) {
    throw new CodeError(`shl value ${bigIntB} >= ${UINT64_SIZE}`)
  }
  const shifted = (bigIntA << bigIntB) & MAX_UINT64
  return Uint64(shifted)
}

/** @internal */
export const shr = (a: StubUint64Compat, b: StubUint64Compat): uint64 => {
  const bigIntA = asUint64BigInt(a)
  const bigIntB = asUint64BigInt(b)
  if (bigIntB >= UINT64_SIZE) {
    throw new CodeError(`shr value ${bigIntB} >= ${UINT64_SIZE}`)
  }
  const shifted = bigIntA >> bigIntB
  return Uint64(shifted)
}

/** @internal */
export const sqrt = (a: StubUint64Compat): uint64 => {
  const bigIntValue = asUint64BigInt(a)
  const sqrtValue = squareroot(bigIntValue)
  return Uint64(sqrtValue)
}

/** @internal */
export const substring = (a: StubBytesCompat, b: StubUint64Compat, c: StubUint64Compat): bytes => {
  const bytesValue = asBytesCls(a)
  const start = asUint64BigInt(b)
  const end = asUint64BigInt(c)
  if (start > end) {
    throw new CodeError('substring end before start')
  }
  if (end > bytesValue.length.asNumber()) {
    throw new CodeError('substring range beyond length of string')
  }
  return bytesValue.slice(start, end).asAlgoTs()
}

/** @internal */
export const JsonRef = new Proxy({} as typeof op.JsonRef, {
  get: (_target, prop) => {
    throw new NotImplementedError(`JsonRef.${prop.toString()}`)
  },
})

const squareroot = (x: bigint): bigint => {
  let lo = 0n,
    hi = x
  while (lo <= hi) {
    const mid = (lo + hi) / 2n
    if (mid * mid > x) hi = mid - 1n
    else lo = mid + 1n
  }
  return hi
}

const toUint128 = (value: bigint): [uint64, uint64] => {
  const cf = value >> 64n
  const rest = value & MAX_UINT64
  return [Uint64(cf), Uint64(rest)]
}

const uint128ToBigInt = (a: StubUint64Compat, b: StubUint64Compat): bigint => {
  const bigIntA = asUint64BigInt(a)
  const bigIntB = asUint64BigInt(b)
  return (bigIntA << 64n) + bigIntB
}

const toBinaryString = (a: StubBytesCompat): string => {
  return [...asUint8Array(a)].map((x) => x.toString(2).padStart(BITS_IN_BYTE, '0')).join('')
}

const doSetBit = (binaryString: string, index: number, bit: number): BytesCls => {
  if (index < 0 || index >= binaryString.length) {
    throw new CodeError(`setBit index ${index < 0 ? binaryString.length - index - 1 : index} is beyond length`)
  }
  if (bit !== 0 && bit !== 1) {
    throw new CodeError(`setBit value > 1`)
  }
  const updatedString = binaryString.slice(0, index) + bit.toString() + binaryString.slice(index + 1)
  return binaryStringToBytes(updatedString)
}
