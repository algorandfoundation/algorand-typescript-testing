import { BigUintCompat, Bytes, bytes, internal, StringCompat, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded, BitSize, Bool, Byte, Str, UFixedNxM, UintN } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import assert from 'assert'
import { ABI_RETURN_VALUE_LOG_PREFIX, BITS_IN_BYTE, UINT64_SIZE } from '../constants'
import { fromBytes, TypeInfo } from '../encoders'
import { DeliberateAny } from '../typescript-helpers'
import { asBigUint, asBigUintCls, asBytesCls, asUint64, asUint8Array } from '../util'

const ABI_LENGTH_SIZE = 2
const maxBigIntValue = (bitSize: number) => 2n ** BigInt(bitSize) - 1n
const maxBytesLength = (bitSize: number) => Math.floor(bitSize / BITS_IN_BYTE)
const encodeLength = (length: number) => new internal.primitives.BytesCls(encodingUtil.bigIntToUint8Array(BigInt(length), ABI_LENGTH_SIZE))
type CompatForArc4Int<N extends BitSize> = N extends 8 | 16 | 32 | 64 ? Uint64Compat : BigUintCompat
export class UintNImpl<N extends BitSize> extends UintN<N> {
  private value: Uint8Array
  private bitSize: N
  typeInfo: TypeInfo

  constructor(typeInfoString: string, v?: CompatForArc4Int<N>) {
    super()
    this.typeInfo = JSON.parse(typeInfoString)
    this.bitSize = parseInt((this.typeInfo.genericArgs as TypeInfo[])![0].name, 10) as N

    assert([8, 16, 32, 64, 128, 256, 512].includes(this.bitSize), `Invalid bit size ${this.bitSize}`)

    const bigIntValue = asBigUintCls(v ?? 0n).valueOf()
    const maxValue = maxBigIntValue(this.bitSize)
    assert(bigIntValue <= maxValue, `expected value <= ${maxValue}, got: ${bigIntValue}`)

    this.value = encodingUtil.bigIntToUint8Array(bigIntValue, maxBytesLength(this.bitSize))
  }

  get native() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this.value)
    return (this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)) as UintN<N>['native']
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  equals(other: this): boolean {
    if (!(other instanceof UintNImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): UintNImpl<BitSize> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const typeInfoString = typeof typeInfo === 'string' ? typeInfo : JSON.stringify(typeInfo)
    const result = new UintNImpl<BitSize>(typeInfoString)
    result.value = asUint8Array(bytesValue)
    return result
  }
}

const regExpNxM = (maxPrecision: number) => new RegExp(`^\\d*\\.?\\d{0,${maxPrecision}}$`)
const trimTrailingDecimalZeros = (v: string) => v.replace(/(\d+\.\d*?)0+$/, '$1').replace(/\.$/, '')
type uFixedNxMGenericArgs = { n: TypeInfo; m: TypeInfo }
export class UFixedNxMImpl<N extends BitSize, M extends number> extends UFixedNxM<N, M> {
  private value: Uint8Array
  private bitSize: N
  private precision: M
  private typeInfo: TypeInfo

  constructor(typeInfoString: string, v: `${number}.${number}`) {
    super(v)
    this.typeInfo = JSON.parse(typeInfoString)
    const genericArgs = this.typeInfo.genericArgs as uFixedNxMGenericArgs
    this.bitSize = parseInt(genericArgs.n.name, 10) as N
    this.precision = parseInt(genericArgs.m.name, 10) as M

    const trimmedValue = trimTrailingDecimalZeros(v)
    assert(regExpNxM(this.precision).test(trimmedValue), `expected positive decimal literal with max of ${this.precision} decimal places`)

    const bigIntValue = BigInt(trimmedValue.replace('.', ''))
    const maxValue = maxBigIntValue(this.bitSize)
    assert(bigIntValue <= maxValue, `expected value <= ${maxValue}, got: ${bigIntValue}`)

    this.value = encodingUtil.bigIntToUint8Array(bigIntValue, maxBytesLength(this.bitSize))
  }

  get native() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this.value)
    return (this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)) as UFixedNxM<N, M>['native']
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  equals(other: this): boolean {
    if (!(other instanceof UFixedNxMImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): UFixedNxM<BitSize, number> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const typeInfoString = typeof typeInfo === 'string' ? typeInfo : JSON.stringify(typeInfo)
    const result = new UFixedNxMImpl<BitSize, number>(typeInfoString, '0.0')
    result.value = asUint8Array(bytesValue)
    return result
  }
}

export class ByteImpl extends Byte {
  private value: UintNImpl<8>

  constructor(typeInfoString: string, v?: CompatForArc4Int<8>) {
    super(v)
    this.value = new UintNImpl<8>(typeInfoString, v)
  }

  get native() {
    return this.value.native
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof ByteImpl) || JSON.stringify(this.value.typeInfo) !== JSON.stringify(other.value.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.value.typeInfo.name}, got ${other.value.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): ByteImpl {
    const uintNValue = UintNImpl.fromBytesImpl(value, typeInfo, prefix) as UintNImpl<8>
    const typeInfoString = typeof typeInfo === 'string' ? typeInfo : JSON.stringify(typeInfo)
    const result = new ByteImpl(typeInfoString)
    result.value = uintNValue
    return result
  }
}

export class StrImpl extends Str {
  private value: Uint8Array

  constructor(_typeInfoString: string, s?: StringCompat) {
    super()
    const bytesValue = asBytesCls(s ?? '')
    const bytesLength = encodeLength(bytesValue.length.asNumber())
    this.value = asUint8Array(bytesLength.concat(bytesValue))
  }
  get native(): string {
    return encodingUtil.uint8ArrayToUtf8(this.value.slice(ABI_LENGTH_SIZE))
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  equals(other: this): boolean {
    if (!(other instanceof StrImpl)) {
      throw new internal.errors.CodeError(`Expected expression of type ${Str}, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StrImpl {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const typeInfoString = typeof typeInfo === 'string' ? typeInfo : JSON.stringify(typeInfo)
    const result = new StrImpl(typeInfoString)
    result.value = asUint8Array(bytesValue)
    return result
  }
}
const TRUE_BIGINT_VALUE = 128n
const FALSE_BIGINT_VALUE = 0n

export class BoolImpl extends Bool {
  private value: Uint8Array

  constructor(_typeInfoString: string, v?: boolean) {
    super(v)
    this.value = encodingUtil.bigIntToUint8Array(v ? TRUE_BIGINT_VALUE : FALSE_BIGINT_VALUE, 1)
  }

  get native(): boolean {
    return encodingUtil.uint8ArrayToBigInt(this.value) === TRUE_BIGINT_VALUE
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): BoolImpl {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const typeInfoString = typeof typeInfo === 'string' ? typeInfo : JSON.stringify(typeInfo)
    const result = new BoolImpl(typeInfoString)
    result.value = asUint8Array(bytesValue)
    return result
  }
}

export function interpretAsArc4Impl<T extends ARC4Encoded>(
  typeInfoString: string,
  bytes: internal.primitives.StubBytesCompat,
  prefix: 'none' | 'log' = 'none',
): T {
  const typeInfo = JSON.parse(typeInfoString)
  return getArc4Encoder<T>(typeInfo)(bytes, typeInfo, prefix)
}

export const arc4Encoders: Record<string, fromBytes<DeliberateAny>> = {
  Bool: BoolImpl.fromBytesImpl,
  Byte: ByteImpl.fromBytesImpl,
  Str: StrImpl.fromBytesImpl,
  'UintN<.*>': UintNImpl.fromBytesImpl,
  'UFixedNxM<.*>': UFixedNxMImpl.fromBytesImpl,
}
export const getArc4Encoder = <T>(typeInfo: TypeInfo, encoders?: Record<string, fromBytes<DeliberateAny>>): fromBytes<T> => {
  const encoder = Object.entries(encoders ?? arc4Encoders).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (!encoder) {
    throw new Error(`No encoder found for type ${typeInfo.name}`)
  }
  return encoder as fromBytes<T>
}
