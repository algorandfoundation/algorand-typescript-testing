import { BigUintCompat, Bytes, bytes, internal, StringCompat, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { BitSize, Bool, Byte, Str, UFixedNxM, UintN } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import assert from 'assert'
import { ABI_RETURN_VALUE_LOG_PREFIX, BITS_IN_BYTE, UINT64_SIZE } from '../constants'
import { TypeInfo } from '../encoders'
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
  private typeInfo: TypeInfo

  constructor(typeInfoString: string, v?: CompatForArc4Int<N>) {
    super(v)
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

  static fromBytesImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): UintNImpl<BitSize> {
    const result = new UintNImpl<BitSize>(typeInfo)
    result.value = asUint8Array(value)
    return result
  }

  static fromLogImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): UintNImpl<BitSize> {
    const bytesValue = asBytesCls(value)
    assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
    return UintNImpl.fromBytesImpl(typeInfo, bytesValue.slice(4))
  }
}

const regExpNxM = (maxPrecision: number) => new RegExp(`^\\d*\\.?\\d{0,${maxPrecision}}$`)
const trimTrailingDecimalZeros = (v: string) => v.replace(/(\d+\.\d*?)0+$/, '$1').replace(/\.$/, '')
export class UFixedNxMImpl<N extends BitSize, M extends number> extends UFixedNxM<N, M> {
  private value: Uint8Array
  private typeInfo: TypeInfo
  private bitSize: N
  private precision: M

  constructor(typeInfoString: string, v: `${number}.${number}`) {
    super(v)
    this.typeInfo = JSON.parse(typeInfoString)
    this.bitSize = parseInt((this.typeInfo.genericArgs as TypeInfo[])![0].name, 10) as N
    this.precision = parseInt((this.typeInfo.genericArgs as TypeInfo[])![1].name, 10) as M

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

  equals(other: UFixedNxM<DeliberateAny, DeliberateAny>): boolean {
    const otherImpl = other as UFixedNxMImpl<DeliberateAny, DeliberateAny>
    return this.bitSize === otherImpl.bitSize && this.precision === otherImpl.precision && this.value === otherImpl.value
  }

  static fromBytesImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): UFixedNxM<BitSize, number> {
    const result = new UFixedNxMImpl<BitSize, number>(typeInfo, '0.0')
    result.value = asUint8Array(value)
    return result
  }

  static fromLogImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): UFixedNxM<BitSize, number> {
    const bytesValue = asBytesCls(value)
    assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
    return UFixedNxMImpl.fromBytesImpl(typeInfo, bytesValue.slice(4))
  }
}

export class ByteImpl extends Byte {
  private value: UintNImpl<8>

  constructor(typeInfoString: string, v: CompatForArc4Int<8>) {
    super(v)
    this.value = new UintNImpl<8>(typeInfoString, v)
  }

  get native() {
    return this.value.native
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  static fromBytesImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): Byte {
    return UintNImpl.fromBytesImpl(typeInfo, value) as Byte
  }

  static fromLogImpl(typeInfo: string, value: internal.primitives.StubBytesCompat): Byte {
    return UintNImpl.fromLogImpl(typeInfo, value) as Byte
  }
}

export class StrImpl extends Str {
  private value: Uint8Array

  constructor(s?: StringCompat) {
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

  static fromBytesImpl(bytes: internal.primitives.StubBytesCompat): StrImpl {
    const strValue = new StrImpl()
    strValue.value = asUint8Array(bytes)
    return strValue
  }

  static fromLogImpl(value: internal.primitives.StubBytesCompat): StrImpl {
    const bytesValue = asBytesCls(value)
    assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
    return StrImpl.fromBytesImpl(bytesValue.slice(4))
  }
}
const TRUE_BIGINT_VALUE = 128n
const FALSE_BIGINT_VALUE = 0n

export class BoolImpl extends Bool {
  private value: Uint8Array

  constructor(v?: boolean) {
    super(v)
    this.value = encodingUtil.bigIntToUint8Array(v ? TRUE_BIGINT_VALUE : FALSE_BIGINT_VALUE, 1)
  }

  get native(): boolean {
    return encodingUtil.uint8ArrayToBigInt(this.value) === TRUE_BIGINT_VALUE
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  static fromBytesImpl(value: internal.primitives.StubBytesCompat): BoolImpl {
    const result = new BoolImpl()
    result.value = asUint8Array(value)
    return result
  }

  static fromLogImpl(value: internal.primitives.StubBytesCompat): BoolImpl {
    const bytesValue = asBytesCls(value)
    assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
    return BoolImpl.fromBytesImpl(bytesValue.slice(4))
  }
}
