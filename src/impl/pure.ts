import type { biguint, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { Base64, Bytes, internal, Uint64 } from '@algorandfoundation/algorand-typescript'
import { BITS_IN_BYTE, MAX_BYTES_SIZE, MAX_UINT64, MAX_UINT8, UINT64_SIZE } from '../constants'
import { notImplementedError, testInvariant } from '../errors'
import { asBigUint, asBytes, asBytesCls, asMaybeBytesCls, asMaybeUint64Cls, asUint64Cls, binaryStringToBytes } from '../util'

export const addw = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): readonly [uint64, uint64] => {
  const uint64A = internal.primitives.Uint64Cls.fromCompat(a)
  const uint64B = internal.primitives.Uint64Cls.fromCompat(b)
  const sum = uint64A.asBigInt() + uint64B.asBigInt()
  return toUint128(sum)
}

export const base64Decode = (e: Base64, a: internal.primitives.StubBytesCompat): bytes => {
  const encoding = e === Base64.StdEncoding ? 'base64' : 'base64url'
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  const stringValue = bytesValue.toString()

  const bufferResult = Buffer.from(stringValue, encoding)
  if (bufferResult.toString(encoding) !== stringValue) {
    internal.errors.avmError('illegal base64 data')
  }

  const uint8ArrayResult = new Uint8Array(bufferResult)
  return Bytes(uint8ArrayResult)
}

export const bitLength = (a: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat): uint64 => {
  const uint64Cls = asMaybeUint64Cls(a)
  const bigUintCls = asMaybeBytesCls(a)?.toBigUint()
  const bigIntValue = (uint64Cls?.asBigInt() ?? bigUintCls?.asBigInt())!
  const binaryValue = bigIntValue === 0n ? '' : bigIntValue.toString(2)
  return Uint64(binaryValue.length)
}

export const bsqrt = (a: internal.primitives.StubBigUintCompat): biguint => {
  const bigUintClsValue = internal.primitives.BigUintCls.fromCompat(a)
  const bigintValue = internal.primitives.checkBigUint(bigUintClsValue.asBigInt())
  const sqrtValue = squareroot(bigintValue)
  return asBigUint(sqrtValue)
}

export const btoi = (a: internal.primitives.StubBytesCompat): uint64 => {
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  if (bytesValue.length.asAlgoTs() > BITS_IN_BYTE) {
    internal.errors.avmError(`btoi arg too long, got [${bytesValue.length.valueOf()}]bytes`)
  }
  return bytesValue.toUint64().asAlgoTs()
}

export const bzero = (a: internal.primitives.StubUint64Compat): bytes => {
  const size = internal.primitives.Uint64Cls.fromCompat(a).asBigInt()
  if (size > MAX_BYTES_SIZE) {
    internal.errors.avmError('bzero attempted to create a too large string')
  }
  return Bytes(new Uint8Array(Number(size)))
}

export const concat = (a: internal.primitives.StubBytesCompat, b: internal.primitives.StubBytesCompat): bytes => {
  const bytesA = internal.primitives.BytesCls.fromCompat(a)
  const bytesB = internal.primitives.BytesCls.fromCompat(b)
  return bytesA.concat(bytesB).asAlgoTs()
}

export const divmodw = (
  a: internal.primitives.StubUint64Compat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
  d: internal.primitives.StubUint64Compat,
): readonly [uint64, uint64, uint64, uint64] => {
  const i = uint128ToBigInt(a, b)
  const j = uint128ToBigInt(c, d)

  const div = i / j
  const mod = i % j
  return [...toUint128(div), ...toUint128(mod)]
}

export const divw = (
  a: internal.primitives.StubUint64Compat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
): uint64 => {
  const i = uint128ToBigInt(a, b)
  const j = internal.primitives.Uint64Cls.fromCompat(c).asBigInt()
  return Uint64(i / j)
}

export const exp = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): uint64 => {
  const base = internal.primitives.Uint64Cls.fromCompat(a).asBigInt()
  const exponent = internal.primitives.Uint64Cls.fromCompat(b).asBigInt()
  if (base === 0n && exponent === 0n) {
    throw internal.errors.codeError('0 ** 0 is undefined')
  }
  return Uint64(base ** exponent)
}

export const expw = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): readonly [uint64, uint64] => {
  const base = internal.primitives.Uint64Cls.fromCompat(a).asBigInt()
  const exponent = internal.primitives.Uint64Cls.fromCompat(b).asBigInt()
  if (base === 0n && exponent === 0n) {
    throw internal.errors.codeError('0 ** 0 is undefined')
  }
  return toUint128(base ** exponent)
}

type ExtractType = ((a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat) => bytes) &
  ((a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat, c: internal.primitives.StubUint64Compat) => bytes)
export const extract = ((
  a: internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
  c?: internal.primitives.StubUint64Compat,
): bytes => {
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  const bytesLength = bytesValue.length.asBigInt()

  const start = internal.primitives.Uint64Cls.fromCompat(b).asBigInt()
  const length = c !== undefined ? internal.primitives.Uint64Cls.fromCompat(c).asBigInt() : undefined
  const end = length !== undefined ? start + length : undefined

  if (start > bytesLength) {
    internal.errors.codeError(`extraction start ${start} is beyond length`)
  }
  if (end !== undefined && end > bytesLength) {
    internal.errors.codeError(`extraction end ${end} is beyond length`)
  }

  return bytesValue.slice(start, end).asAlgoTs()
}) as ExtractType

export const extractUint16 = (a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat): uint64 => {
  const result = extract(a, b, 2)
  const bytesResult = internal.primitives.BytesCls.fromCompat(result)
  return bytesResult.toUint64().asAlgoTs()
}

export const extractUint32 = (a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat): uint64 => {
  const result = extract(a, b, 4)
  const bytesResult = internal.primitives.BytesCls.fromCompat(result)
  return bytesResult.toUint64().asAlgoTs()
}

export const extractUint64 = (a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat): uint64 => {
  const result = extract(a, b, 8)
  const bytesResult = internal.primitives.BytesCls.fromCompat(result)
  return bytesResult.toUint64().asAlgoTs()
}

export const getBit = (
  a: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
): uint64 => {
  const binaryString = toBinaryString(internal.primitives.isUint64(a) ? asUint64Cls(a).toBytes().asAlgoTs() : asBytes(a))
  const index = internal.primitives.Uint64Cls.fromCompat(b).asNumber()
  const adjustedIndex = asMaybeUint64Cls(a) ? binaryString.length - index - 1 : index
  if (adjustedIndex < 0 || adjustedIndex >= binaryString.length) {
    internal.errors.codeError(`getBit index ${index} is beyond length`)
  }
  return binaryString[adjustedIndex] === '1' ? 1 : 0
}

export const getByte = (a: internal.primitives.StubBytesCompat, b: internal.primitives.StubUint64Compat): uint64 => {
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  const index = internal.primitives.Uint64Cls.fromCompat(b).asNumber()
  if (index >= bytesValue.length.asNumber()) {
    internal.errors.codeError(`getBytes index ${index} is beyond length`)
  }
  return bytesValue.at(index).toUint64().asAlgoTs()
}

export const itob = (a: internal.primitives.StubUint64Compat): bytes => {
  return asUint64Cls(a).toBytes().asAlgoTs()
}

export const len = (a: internal.primitives.StubBytesCompat): uint64 => {
  return asBytesCls(a).length.asAlgoTs()
}

export const mulw = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): readonly [uint64, uint64] => {
  const uint64A = internal.primitives.Uint64Cls.fromCompat(a)
  const uint64B = internal.primitives.Uint64Cls.fromCompat(b)
  const product = uint64A.asBigInt() * uint64B.asBigInt()
  return toUint128(product)
}

export const replace = (
  a: internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubBytesCompat,
): bytes => {
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  const index = internal.primitives.Uint64Cls.fromCompat(b).asNumber()
  const replacement = internal.primitives.BytesCls.fromCompat(c)

  const valueLength = bytesValue.length.asNumber()
  const replacementLength = replacement.length.asNumber()

  if (index + replacementLength > valueLength) {
    internal.errors.codeError(`expected value <= ${valueLength}, got: ${index + replacementLength}`)
  }
  return bytesValue
    .slice(0, index)
    .concat(replacement)
    .concat(bytesValue.slice(index + replacementLength, valueLength))
    .asAlgoTs()
}

type selectType = ((
  a: internal.primitives.StubBytesCompat,
  b: internal.primitives.StubBytesCompat,
  c: internal.primitives.StubUint64Compat,
) => bytes) &
  ((a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat, c: internal.primitives.StubUint64Compat) => uint64)
export const select = ((
  a: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat,
  c: internal.primitives.StubUint64Compat,
): uint64 | bytes => {
  const uint64A = asMaybeUint64Cls(a)
  const uint64B = asMaybeUint64Cls(b)
  const bytesA = asMaybeBytesCls(a)
  const bytesB = asMaybeBytesCls(b)
  const bigIntC = internal.primitives.Uint64Cls.fromCompat(c).asBigInt()

  return (bigIntC !== 0n ? (uint64B ?? bytesB)! : (uint64A ?? bytesA)!).asAlgoTs()
}) as selectType

type SetBitType = ((
  target: internal.primitives.StubBytesCompat,
  n: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
) => bytes) &
  ((
    target: internal.primitives.StubUint64Compat,
    n: internal.primitives.StubUint64Compat,
    c: internal.primitives.StubUint64Compat,
  ) => uint64)

export const setBit = ((
  a: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
) => {
  const uint64Cls = asMaybeUint64Cls(a)
  const indexParam = internal.primitives.Uint64Cls.fromCompat(b).asNumber()
  const bit = internal.primitives.Uint64Cls.fromCompat(c).asNumber()
  if (uint64Cls) {
    const binaryString = toBinaryString(uint64Cls?.toBytes().asAlgoTs())
    const index = binaryString.length - indexParam - 1
    const newBytes = doSetBit(binaryString, index, bit)
    return newBytes.toUint64().asAlgoTs()
  } else {
    const bytesCls = asMaybeBytesCls(a)
    testInvariant(bytesCls, 'a must be uint64 or bytes')
    const binaryString = toBinaryString(bytesCls.asAlgoTs())
    const newBytes = doSetBit(binaryString, indexParam, bit)
    return newBytes.asAlgoTs()
  }
}) as SetBitType

export const setByte = (
  a: internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
): bytes => {
  const binaryString = toBinaryString(internal.primitives.BytesCls.fromCompat(a).asAlgoTs())

  const byteIndex = internal.primitives.Uint64Cls.fromCompat(b).asNumber()
  const bitIndex = byteIndex * BITS_IN_BYTE

  const replacementNumber = internal.primitives.Uint64Cls.fromCompat(c)
  const replacement = toBinaryString(replacementNumber.toBytes().at(-1).asAlgoTs())

  if (bitIndex >= binaryString.length) {
    internal.errors.codeError(`setByte index ${byteIndex} is beyond length`)
  }
  if (replacementNumber.valueOf() > MAX_UINT8) {
    internal.errors.codeError(`setByte value ${replacementNumber.asNumber()} > ${MAX_UINT8}`)
  }
  const updatedString = binaryString.slice(0, bitIndex) + replacement + binaryString.slice(bitIndex + replacement.length)
  const updatedBytes = binaryStringToBytes(updatedString)
  return updatedBytes.asAlgoTs()
}

export const shl = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): uint64 => {
  const uint64A = internal.primitives.Uint64Cls.fromCompat(a)
  const uint64B = internal.primitives.Uint64Cls.fromCompat(b)
  const bigIntA = uint64A.asBigInt()
  const bigIntB = uint64B.asBigInt()
  if (bigIntB >= UINT64_SIZE) {
    internal.errors.codeError(`shl value ${bigIntB} >= ${UINT64_SIZE}`)
  }
  const shifted = (bigIntA * 2n ** bigIntB) % 2n ** BigInt(UINT64_SIZE)
  return Uint64(shifted)
}

export const shr = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): uint64 => {
  const uint64A = internal.primitives.Uint64Cls.fromCompat(a)
  const uint64B = internal.primitives.Uint64Cls.fromCompat(b)
  const bigIntA = uint64A.asBigInt()
  const bigIntB = uint64B.asBigInt()
  if (bigIntB >= UINT64_SIZE) {
    internal.errors.codeError(`shr value ${bigIntB} >= ${UINT64_SIZE}`)
  }
  const shifted = bigIntA / 2n ** bigIntB
  return Uint64(shifted)
}

export const sqrt = (a: internal.primitives.StubUint64Compat): uint64 => {
  const bigIntValue = internal.primitives.Uint64Cls.fromCompat(a).asBigInt()
  const sqrtValue = squareroot(bigIntValue)
  return Uint64(sqrtValue)
}

export const substring = (
  a: internal.primitives.StubBytesCompat,
  b: internal.primitives.StubUint64Compat,
  c: internal.primitives.StubUint64Compat,
): bytes => {
  const bytesValue = internal.primitives.BytesCls.fromCompat(a)
  const start = internal.primitives.Uint64Cls.fromCompat(b).asBigInt()
  const end = internal.primitives.Uint64Cls.fromCompat(c).asBigInt()
  if (start > end) {
    internal.errors.codeError('substring end before start')
  }
  if (end > bytesValue.length.asNumber()) {
    internal.errors.codeError('substring range beyond length of string')
  }
  return bytesValue.slice(start, end).asAlgoTs()
}

export const JsonRef = new Proxy({} as typeof op.JsonRef, {
  get: (_target, prop) => {
    notImplementedError(`JsonRef.${prop.toString()}`)
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

const uint128ToBigInt = (a: internal.primitives.StubUint64Compat, b: internal.primitives.StubUint64Compat): bigint => {
  const bigIntA = internal.primitives.Uint64Cls.fromCompat(a).asBigInt()
  const bigIntB = internal.primitives.Uint64Cls.fromCompat(b).asBigInt()
  return (bigIntA << 64n) + bigIntB
}

const toBinaryString = (a: bytes): string => {
  return [...internal.primitives.BytesCls.fromCompat(a).asUint8Array()].map((x) => x.toString(2).padStart(BITS_IN_BYTE, '0')).join('')
}

const doSetBit = (binaryString: string, index: number, bit: number): internal.primitives.BytesCls => {
  if (index < 0 || index >= binaryString.length) {
    internal.errors.codeError(`setBit index ${index < 0 ? binaryString.length - index : index} is beyond length`)
  }
  if (bit !== 0 && bit !== 1) {
    internal.errors.codeError(`setBit value > 1`)
  }
  const updatedString = binaryString.slice(0, index) + bit.toString() + binaryString.slice(index + 1)
  return binaryStringToBytes(updatedString)
}
