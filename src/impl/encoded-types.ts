import { Account, BigUintCompat, Bytes, bytes, internal, StringCompat, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import {
  Address,
  ARC4Encoded,
  BitSize,
  Bool,
  Byte,
  DynamicArray,
  DynamicBytes,
  StaticArray,
  StaticBytes,
  Str,
  Struct,
  Tuple,
  UFixedNxM,
  UintN,
} from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { decodeAddress } from 'algosdk'
import assert from 'assert'
import { ABI_RETURN_VALUE_LOG_PREFIX, BITS_IN_BYTE, UINT64_SIZE } from '../constants'
import { fromBytes, TypeInfo } from '../encoders'
import { DeliberateAny } from '../typescript-helpers'
import { asBigUint, asBigUintCls, asBytesCls, asUint64, asUint8Array, conactUint8Arrays, uint8ArrayToNumber } from '../util'

const ABI_LENGTH_SIZE = 2
const maxBigIntValue = (bitSize: number) => 2n ** BigInt(bitSize) - 1n
const maxBytesLength = (bitSize: number) => Math.floor(bitSize / BITS_IN_BYTE)
const encodeLength = (length: number) => new internal.primitives.BytesCls(encodingUtil.bigIntToUint8Array(BigInt(length), ABI_LENGTH_SIZE))
type CompatForArc4Int<N extends BitSize> = N extends 8 | 16 | 32 | 64 ? Uint64Compat : BigUintCompat
export class UintNImpl<N extends BitSize> extends UintN<N> {
  private value: Uint8Array
  private bitSize: N
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<N>) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.bitSize = UintNImpl.getMaxBitsLength(this.typeInfo) as N

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
    const result = new UintNImpl<BitSize>(typeInfo)
    result.value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return parseInt((typeInfo.genericArgs as TypeInfo[])![0].name, 10) as BitSize
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    return `uint${this.getMaxBitsLength(t)}`
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

  constructor(typeInfo: TypeInfo | string, v: `${number}.${number}`) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const genericArgs = this.typeInfo.genericArgs as uFixedNxMGenericArgs
    this.bitSize = UFixedNxMImpl.getMaxBitsLength(this.typeInfo) as N
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
    const result = new UFixedNxMImpl<BitSize, number>(typeInfo, '0.0')
    result.value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    const genericArgs = typeInfo.genericArgs as uFixedNxMGenericArgs
    return parseInt(genericArgs.n.name, 10) as BitSize
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = t.genericArgs as uFixedNxMGenericArgs
    return `ufixed${genericArgs.n.name}x${genericArgs.m.name}`
  }
}

export class ByteImpl extends Byte {
  private value: UintNImpl<8>

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<8>) {
    super(v)
    this.value = new UintNImpl<8>(typeInfo, v)
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
    const result = new ByteImpl(typeInfo)
    result.value = uintNValue
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return UintNImpl.getMaxBitsLength(typeInfo)
  }
}

export class StrImpl extends Str {
  private value: Uint8Array

  constructor(_typeInfo: TypeInfo | string, s?: StringCompat) {
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
      throw new internal.errors.CodeError(`Expected expression of type Str, got ${(other as object).constructor.name}`)
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
    const result = new StrImpl(typeInfo)
    result.value = asUint8Array(bytesValue)
    return result
  }
}

const TRUE_BIGINT_VALUE = 128n
const FALSE_BIGINT_VALUE = 0n
export class BoolImpl extends Bool {
  private value: Uint8Array

  constructor(_typeInfo: TypeInfo | string, v?: boolean) {
    super(v)
    this.value = encodingUtil.bigIntToUint8Array(v ? TRUE_BIGINT_VALUE : FALSE_BIGINT_VALUE, 1)
  }

  get native(): boolean {
    return encodingUtil.uint8ArrayToBigInt(this.value) === TRUE_BIGINT_VALUE
  }

  equals(other: this): boolean {
    if (!(other instanceof BoolImpl)) {
      throw new internal.errors.CodeError(`Expected expression of type Bool, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
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
    const result = new BoolImpl(typeInfo)
    result.value = asUint8Array(bytesValue)
    return result
  }
}

const areAllARC4Encoded = <T extends ARC4Encoded>(items: T[]): items is T[] => items.every((item) => item instanceof ARC4Encoded)
const checkItemTypeName = (type: TypeInfo, value: ARC4Encoded) => {
  const typeName = trimGenericTypeName(type.name)
  const validTypeNames = [typeName, `${typeName}Impl`]
  assert(validTypeNames.includes(value.constructor.name), `item must be of type ${typeName}, not ${value.constructor.name}`)
}
type StaticArrayGenericArgs = { elementType: TypeInfo; size: TypeInfo }
const arrayProxyHandler = <TItem>() => ({
  get(target: { items: TItem[] }, prop: PropertyKey) {
    const idx = prop ? parseInt(prop.toString(), 10) : NaN
    if (!isNaN(idx)) {
      if (idx < target.items.length) return target.items[idx]
      internal.errors.avmError('Index out of bounds')
    } else if (prop === Symbol.iterator) {
      return target.items[Symbol.iterator].bind(target.items)
    } else if (prop === 'entries') {
      return target.items.entries.bind(target.items)
    } else if (prop === 'at') {
      return (index: Uint64Compat): TItem => {
        return internal.primitives.arrayUtil.arrayAt(target.items, index)
      }
    }
    return Reflect.get(target, prop)
  },
  set(target: { items: TItem[]; setItem: (index: number, value: TItem) => void }, prop: PropertyKey, value: TItem) {
    const idx = prop ? parseInt(prop.toString(), 10) : NaN
    if (!isNaN(idx)) {
      if (idx < target.items.length) {
        target.setItem(idx, value)
        return true
      }
      internal.errors.avmError('Index out of bounds')
    }

    return Reflect.set(target, prop, value)
  },
})
export class StaticArrayImpl<TItem extends ARC4Encoded, TLength extends number> extends StaticArray<TItem, TLength> {
  private value?: TItem[]
  private uint8ArrayValue?: Uint8Array
  private typeInfo: TypeInfo
  private size: number
  genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength })
  constructor(typeInfo: TypeInfo | string, ...items: TItem[])
  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    super(...items)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as StaticArrayGenericArgs

    this.size = parseInt(this.genericArgs.size.name, 10)
    if (items.length && items.length !== this.size) {
      throw new internal.errors.CodeError(`expected ${this.size} items, not ${items.length}`)
    }

    assert(areAllARC4Encoded(items), 'expected ARC4 type')

    items.forEach((item) => {
      checkItemTypeName(this.genericArgs.elementType, item)
    })

    this.value = items.length ? items : undefined

    return new Proxy(this, arrayProxyHandler<TItem>()) as StaticArrayImpl<TItem, TLength>
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? encode(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticArrayImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.size
  }

  get items(): TItem[] {
    if (this.uint8ArrayValue) {
      const childTypes = Array(this.size).fill(this.genericArgs.elementType)
      this.value = decode(this.uint8ArrayValue, childTypes) as TItem[]
      this.uint8ArrayValue = undefined
      return this.value
    } else if (this.value) {
      this.uint8ArrayValue = undefined
      return this.value
    }
    throw new internal.errors.CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): StaticArrayImpl<TItem, TLength> {
    return StaticArrayImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as StaticArrayImpl<TItem, TLength>
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StaticArrayImpl<ARC4Encoded, number> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new StaticArrayImpl(typeInfo)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    const genericArgs = typeInfo.genericArgs as StaticArrayGenericArgs
    const arraySize = parseInt(genericArgs.size.name, 10)
    const childTypes = Array(arraySize).fill(genericArgs.elementType)
    let i = 0
    let size = 0
    if (genericArgs.elementType.name === 'Bool') {
      while (i < childTypes.length) {
        const after = findBoolTypes(childTypes, i, 1)
        const boolNum = after + 1
        size += Math.floor(boolNum / BITS_IN_BYTE)
        size += boolNum % BITS_IN_BYTE ? 1 : 0
        i += after + 1
      }
    } else {
      size = getMaxLengthOfStaticContentType(genericArgs.elementType) * arraySize
    }
    return size
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = t.genericArgs as StaticArrayGenericArgs
    return `${getArc4TypeName(genericArgs.elementType)}[${genericArgs.size.name}]`
  }
}

export class AddressImpl extends Address {
  private typeInfo: TypeInfo
  private value: StaticArrayImpl<ByteImpl, 32>

  constructor(typeInfo: TypeInfo | string, value?: Account | string | bytes) {
    super(value)
    let uint8ArrayValue: Uint8Array
    if (value === undefined) {
      uint8ArrayValue = new Uint8Array(32)
    } else if (typeof value === 'string') {
      uint8ArrayValue = decodeAddress(value).publicKey
    } else if (internal.primitives.isBytes(value)) {
      uint8ArrayValue = internal.primitives.getUint8Array(value)
    } else {
      uint8ArrayValue = internal.primitives.getUint8Array(value.bytes)
    }
    internal.errors.avmInvariant(uint8ArrayValue.length === 32, 'Addresses should be 32 bytes')

    this.value = StaticArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as StaticArrayImpl<ByteImpl, 32>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as AddressImpl
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof AddressImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return 32
  }

  get native(): Account {
    return Account(this.value.bytes)
  }

  get items(): ByteImpl[] {
    return this.value.items
  }

  setItem(_index: number, _value: ByteImpl): void {
    throw new internal.errors.CodeError('Address is immutable')
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): AddressImpl {
    const staticArrayValue = StaticArrayImpl.fromBytesImpl(value, typeInfo, prefix) as StaticArrayImpl<ByteImpl, 32>
    const result = new AddressImpl(typeInfo)
    result.value = staticArrayValue
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    return StaticArrayImpl.getMaxBytesLength(typeInfo)
  }
}

type DynamicArrayGenericArgs = { elementType: TypeInfo }
const readLength = (value: Uint8Array): readonly [number, Uint8Array] => {
  const length = Number(encodingUtil.uint8ArrayToBigInt(value.slice(0, ABI_LENGTH_SIZE)))
  const data = value.slice(ABI_LENGTH_SIZE)
  return [length, data]
}
export class DynamicArrayImpl<TItem extends ARC4Encoded> extends DynamicArray<TItem> {
  private value?: TItem[]
  private uint8ArrayValue?: Uint8Array
  private typeInfo: TypeInfo
  genericArgs: DynamicArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[]) {
    super(...items)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as DynamicArrayGenericArgs

    assert(areAllARC4Encoded(items), 'expected ARC4 type')

    items.forEach((item) => {
      checkItemTypeName(this.genericArgs.elementType, item)
    })
    this.value = items

    return new Proxy(this, arrayProxyHandler<TItem>()) as DynamicArrayImpl<TItem>
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? this.encodeWithLength(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof DynamicArrayImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.items.length
  }

  get items(): TItem[] {
    if (this.uint8ArrayValue) {
      const [length, data] = readLength(this.uint8ArrayValue)
      const childTypes = Array(length).fill(this.genericArgs.elementType)
      this.value = decode(data, childTypes) as TItem[]
      this.uint8ArrayValue = undefined
      return this.value
    } else if (this.value) {
      this.uint8ArrayValue = undefined
      return this.value
    }
    throw new internal.errors.CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): DynamicArrayImpl<TItem> {
    return DynamicArrayImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as DynamicArrayImpl<TItem>
  }

  push(...values: TItem[]) {
    const items = this.items
    items.push(...values)
  }

  pop(): TItem {
    const items = this.items
    const popped = items.pop()
    if (popped === undefined) internal.errors.avmError('The array is empty')
    return popped
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): DynamicArrayImpl<ARC4Encoded> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new DynamicArrayImpl(typeInfo)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = t.genericArgs as DynamicArrayGenericArgs
    return `${getArc4TypeName(genericArgs.elementType)}[]`
  }

  private encodeWithLength(items: TItem[]) {
    return conactUint8Arrays(encodeLength(items.length).asUint8Array(), encode(items))
  }
}

export class TupleImpl<TTuple extends [ARC4Encoded, ...ARC4Encoded[]]> extends Tuple<TTuple> {
  private value?: TTuple
  private uint8ArrayValue?: Uint8Array
  private typeInfo: TypeInfo
  genericArgs: TypeInfo[]

  constructor(typeInfo: TypeInfo | string)
  constructor(typeInfo: TypeInfo | string, ...items: TTuple) {
    super(...items)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = Object.values(this.typeInfo.genericArgs as Record<string, TypeInfo>)

    assert(areAllARC4Encoded(items), 'expected ARC4 type')

    items.forEach((item, index) => {
      checkItemTypeName(this.genericArgs[index], item)
    })
    this.value = items.length ? items : undefined
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? encode(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof TupleImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): TTuple['length'] & uint64 {
    return this.items.length
  }

  get native(): TTuple {
    return this.items
  }

  at<TIndex extends keyof TTuple>(index: TIndex): TTuple[TIndex] {
    return this.items[index]
  }

  private get items(): TTuple {
    if (this.uint8ArrayValue) {
      this.value = decode(this.uint8ArrayValue, this.genericArgs) as TTuple
      this.uint8ArrayValue = undefined
      return this.value
    } else if (this.value) {
      this.uint8ArrayValue = undefined
      return this.value
    }
    throw new internal.errors.CodeError('value is not set')
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): TupleImpl<[ARC4Encoded, ...ARC4Encoded[]]> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new TupleImpl(typeInfo)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    const genericArgs = Object.values(typeInfo.genericArgs as Record<string, TypeInfo>)
    let i = 0
    let size = 0

    while (i < genericArgs.length) {
      const childType = genericArgs[i]
      if (childType.name === 'Bool') {
        const after = findBoolTypes(genericArgs, i, 1)
        const boolNum = after + 1
        size += Math.floor(boolNum / BITS_IN_BYTE)
        size += boolNum % BITS_IN_BYTE ? 1 : 0
        i += after
      } else {
        size += getMaxLengthOfStaticContentType(childType)
      }
      i += 1
    }
    return size
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = Object.values(t.genericArgs as Record<string, TypeInfo>)
    return `(${genericArgs.map(getArc4TypeName).join(',')})`
  }
}

type StructConstraint = Record<string, ARC4Encoded>
export class StructImpl<T extends StructConstraint> extends (Struct<StructConstraint> as DeliberateAny) {
  private uint8ArrayValue?: Uint8Array
  private typeInfo: TypeInfo
  genericArgs: Record<string, TypeInfo>

  constructor(typeInfo: TypeInfo | string, value: T = {} as T) {
    super(value)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as Record<string, TypeInfo>

    Object.keys(this.genericArgs).forEach((key) => {
      Object.defineProperty(this, key, {
        value: value[key],
        writable: true,
        enumerable: true,
      })
    })

    return new Proxy(this, {
      get(target, prop) {
        const originalValue = Reflect.get(target, prop)
        if (originalValue === undefined && target.uint8ArrayValue && Object.keys(target.genericArgs).includes(prop.toString())) {
          return target.items[prop.toString()]
        }
        return originalValue
      },
      set(target, prop, value) {
        if (target.uint8ArrayValue && Object.keys(target.genericArgs).includes(prop.toString())) {
          target.decodeAsProperties()
        }
        return Reflect.set(target, prop, value)
      },
    })
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? encode(Object.values(this.items)))
  }

  get items(): T {
    this.decodeAsProperties()
    const result = {} as StructConstraint
    Object.keys(this.genericArgs).forEach((key) => {
      result[key] = (this as unknown as StructConstraint)[key]
    })
    return result as T
  }

  private decodeAsProperties() {
    if (this.uint8ArrayValue) {
      const values = decode(this.uint8ArrayValue, Object.values(this.genericArgs))
      Object.keys(this.genericArgs).forEach((key, index) => {
        ;(this as unknown as StructConstraint)[key] = values[index]
      })
      this.uint8ArrayValue = undefined
    }
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StructImpl<StructConstraint> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new StructImpl(typeInfo)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = Object.values(t.genericArgs as Record<string, TypeInfo>)
    return `(${genericArgs.map(getArc4TypeName).join(',')})`
  }
}

export class DynamicBytesImpl extends DynamicBytes {
  private typeInfo: TypeInfo
  private value: DynamicArrayImpl<ByteImpl>

  constructor(typeInfo: TypeInfo | string, value?: bytes | string) {
    super(value)
    const uint8ArrayValue = conactUint8Arrays(encodeLength(value?.length ?? 0).asUint8Array(), asUint8Array(value ?? new Uint8Array()))
    this.value = DynamicArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as DynamicArrayImpl<ByteImpl>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as DynamicBytesImpl
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof DynamicBytesImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.value.length
  }

  get native(): bytes {
    return this.value.bytes.slice(ABI_LENGTH_SIZE)
  }

  get items(): ByteImpl[] {
    return this.value.items
  }

  setItem(_index: number, _value: ByteImpl): void {
    throw new internal.errors.CodeError('DynamicBytes is immutable')
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): DynamicBytesImpl {
    const dynamicArrayValue = DynamicArrayImpl.fromBytesImpl(value, typeInfo, prefix) as DynamicArrayImpl<ByteImpl>
    const result = new DynamicBytesImpl(typeInfo)
    result.value = dynamicArrayValue
    return result
  }

  static getArc4TypeName = (_t: TypeInfo): string => {
    return 'byte[]'
  }
}

export class StaticBytesImpl extends StaticBytes {
  private value: StaticArrayImpl<ByteImpl, number>
  private typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, value?: bytes | string) {
    super(value)
    const uint8ArrayValue = asUint8Array(value ?? new Uint8Array())
    this.value = StaticArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as StaticArrayImpl<ByteImpl, number>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as StaticBytesImpl
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticBytesImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new internal.errors.CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.value.length
  }

  get native(): bytes {
    return this.value.bytes
  }

  get items(): ByteImpl[] {
    return this.value.items
  }

  setItem(_index: number, _value: ByteImpl): void {
    throw new internal.errors.CodeError('StaticBytes is immutable')
  }

  static fromBytesImpl(
    value: internal.primitives.StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StaticBytesImpl {
    const staticArrayValue = StaticArrayImpl.fromBytesImpl(value, typeInfo, prefix) as StaticArrayImpl<ByteImpl, number>
    const result = new StaticBytesImpl(typeInfo)
    result.value = staticArrayValue
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    return StaticArrayImpl.getMaxBytesLength(typeInfo)
  }

  static getArc4TypeName = (t: TypeInfo): string => {
    const genericArgs = t.genericArgs as StaticArrayGenericArgs
    return `byte[${genericArgs.size.name}]`
  }
}

const decode = (value: Uint8Array, childTypes: TypeInfo[]) => {
  let i = 0
  let arrayIndex = 0
  const valuePartitions: Uint8Array[] = []
  const dynamicSegments: Array<Array<number>> = [] // Store the start and end of a dynamic element

  while (i < childTypes.length) {
    const childType = childTypes[i]
    if (holdsDynamicLengthContent(childType)) {
      // Decode the size of the dynamic element
      const dynamicIndex = uint8ArrayToNumber(value.slice(arrayIndex, arrayIndex + ABI_LENGTH_SIZE))
      if (dynamicSegments.length) {
        dynamicSegments.at(-1)![1] = dynamicIndex
      }
      // Since we do not know where the current dynamic element ends,
      // put a placeholder and update later
      dynamicSegments.push([dynamicIndex, -1])
      valuePartitions.push(new Uint8Array())
      arrayIndex += ABI_LENGTH_SIZE
    } else if (childType.name === 'Bool') {
      const before = findBoolTypes(childTypes, i, -1)
      let after = findBoolTypes(childTypes, i, 1)

      if (before % 8 != 0) {
        throw new internal.errors.CodeError('"expected before index should have number of bool mod 8 equal 0"')
      }
      after = Math.min(7, after)
      const bits = uint8ArrayToNumber(value.slice(arrayIndex, arrayIndex + 1))
      Array(after + 1)
        .fill(0)
        .forEach((_, j) => {
          const mask = 128 >> j
          valuePartitions.push(
            mask & bits ? encodingUtil.bigIntToUint8Array(TRUE_BIGINT_VALUE) : encodingUtil.bigIntToUint8Array(FALSE_BIGINT_VALUE),
          )
        })
      i += after
      arrayIndex += 1
    } else {
      const currLen = getMaxLengthOfStaticContentType(childType)
      valuePartitions.push(value.slice(arrayIndex, arrayIndex + currLen))
      arrayIndex += currLen
    }

    if (arrayIndex >= value.length && i != childTypes.length - 1) {
      throw new internal.errors.CodeError('input string is not long enough to be decoded')
    }
    i += 1
  }

  if (dynamicSegments.length > 0) {
    dynamicSegments.at(-1)![1] = value.length
    arrayIndex = value.length
  }
  if (arrayIndex < value.length) {
    throw new internal.errors.CodeError('input string was not fully consumed')
  }

  // Check dynamic element partitions
  let segmentIndex = 0
  childTypes.forEach((childType, index) => {
    if (holdsDynamicLengthContent(childType)) {
      const [segmentStart, segmentEnd] = dynamicSegments[segmentIndex]
      valuePartitions[index] = value.slice(segmentStart, segmentEnd)
      segmentIndex += 1
    }
  })

  const values: ARC4Encoded[] = []
  childTypes.forEach((childType, index) => {
    values.push(getArc4Encoder<ARC4Encoded>(childType)(valuePartitions[index], childType))
  })
  return values
}

const findBoolTypes = (values: TypeInfo[], index: number, delta: number): number => {
  // Helper function to find consecutive booleans from current index in a tuple.
  let until = 0
  const length = values.length
  while (true) {
    const curr = index + delta * until
    if (values[curr].name === 'Bool') {
      if ((curr != length - 1 && delta > 0) || (curr > 0 && delta < 0)) {
        until += 1
      } else {
        break
      }
    } else {
      until -= 1
      break
    }
  }
  return until
}

const getMaxLengthOfStaticContentType = (type: TypeInfo): number => {
  switch (trimGenericTypeName(type.name)) {
    case 'Address':
      return AddressImpl.getMaxBytesLength(type)
    case 'Byte':
      return ByteImpl.getMaxBitsLength(type) / BITS_IN_BYTE
    case 'UintN':
      return UintNImpl.getMaxBitsLength(type) / BITS_IN_BYTE
    case 'UFixedNxM':
      return UFixedNxMImpl.getMaxBitsLength(type) / BITS_IN_BYTE
    case 'StaticArray':
      return StaticArrayImpl.getMaxBytesLength(type)
    case 'StaticBytes':
      return StaticBytesImpl.getMaxBytesLength(type)
    case 'Tuple':
      return TupleImpl.getMaxBytesLength(type)
  }
  throw new internal.errors.CodeError(`unsupported type ${type.name}`)
}

const encode = (values: ARC4Encoded[]) => {
  const length = values.length
  const heads = []
  const tails = []
  const dynamicLengthTypeIndex = []
  let i = 0
  const valuesLengthBytes = values instanceof DynamicArray ? encodeLength(length).asUint8Array() : new Uint8Array()
  while (i < length) {
    const value = values[i]
    assert(value instanceof ARC4Encoded, `expected ARC4 type ${value.constructor.name}`)
    dynamicLengthTypeIndex.push(isDynamicLengthType(value))
    if (dynamicLengthTypeIndex.at(-1)) {
      heads.push(asUint8Array(Bytes.fromHex('0000')))
      tails.push(asUint8Array(value.bytes))
    } else {
      if (value instanceof Bool) {
        const before = findBool(values, i, -1)
        let after = findBool(values, i, 1)
        if (before % 8 != 0) {
          throw new internal.errors.CodeError('"expected before index should have number of bool mod 8 equal 0"')
        }
        after = Math.min(7, after)
        const consecutiveBools = values.slice(i, i + after + 1) as Bool[]
        const compressedNumber = compressMultipleBool(consecutiveBools)
        heads.push(new Uint8Array([compressedNumber]))
        i += after
      } else {
        heads.push(asUint8Array(value.bytes))
      }
      tails.push(new Uint8Array())
    }
    i += 1
  }

  // Adjust heads for dynamic types
  let headLength = 0
  heads.forEach((head) => {
    // If the element is not a placeholder, append the length of the element
    headLength += head.length
  })

  // Correctly encode dynamic types and replace placeholder
  let tailCurrLength = 0
  for (let i = 0; i < heads.length; i++) {
    if (dynamicLengthTypeIndex[i]) {
      const headValue = headLength + tailCurrLength
      heads[i] = asUint8Array(encodeLength(headValue))
    }
    tailCurrLength += tails[i].length
  }

  return conactUint8Arrays(valuesLengthBytes, ...heads, ...tails)
}

const findBool = (values: ARC4Encoded[], index: number, delta: number) => {
  let until = 0
  const length = values.length
  while (true) {
    const curr = index + delta * until
    if (values[curr] instanceof Bool) {
      if ((curr !== length - 1 && delta > 0) || (curr > 0 && delta < 0)) {
        until += 1
      } else {
        break
      }
    } else {
      until -= 1
      break
    }
  }
  return until
}

const compressMultipleBool = (values: Bool[]): number => {
  let result = 0
  if (values.length > 8) {
    throw new Error('length of list should not be greater than 8')
  }
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value.native) {
      result |= 1 << (7 - i)
    }
  }
  return result
}

const trimGenericTypeName = (typeName: string) => typeName.replace(/<.*>/, '')

const isDynamicLengthType = (value: ARC4Encoded) =>
  value instanceof StrImpl ||
  (value instanceof StaticArrayImpl && holdsDynamicLengthContent(value)) ||
  (value instanceof TupleImpl && value.genericArgs.some(holdsDynamicLengthContent)) ||
  (value instanceof StructImpl && Object.values(value.genericArgs).some(holdsDynamicLengthContent)) ||
  value instanceof DynamicArrayImpl ||
  value instanceof DynamicBytesImpl

const holdsDynamicLengthContent = (value: StaticArrayImpl<ARC4Encoded, number> | DynamicArrayImpl<ARC4Encoded> | TypeInfo): boolean => {
  const itemTypeName = trimGenericTypeName(
    value instanceof StaticArrayImpl || value instanceof DynamicArrayImpl ? value.genericArgs.elementType.name : value.name,
  )
  return (
    itemTypeName === 'Str' ||
    itemTypeName === 'DynamicArray' ||
    itemTypeName === 'DynamicBytes' ||
    (itemTypeName === 'StaticArray' &&
      holdsDynamicLengthContent(((value as StaticArrayImpl<ARC4Encoded, number>).genericArgs as StaticArrayGenericArgs).elementType)) ||
    ((itemTypeName === 'Tuple' || itemTypeName === 'Struct') &&
      Object.values(value.genericArgs as Record<string, TypeInfo>).some(holdsDynamicLengthContent))
  )
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
  Address: AddressImpl.fromBytesImpl,
  Bool: BoolImpl.fromBytesImpl,
  Byte: ByteImpl.fromBytesImpl,
  Str: StrImpl.fromBytesImpl,
  'UintN<.*>': UintNImpl.fromBytesImpl,
  'UFixedNxM<.*>': UFixedNxMImpl.fromBytesImpl,
  'StaticArray<.*>': StaticArrayImpl.fromBytesImpl,
  'DynamicArray<.*>': DynamicArrayImpl.fromBytesImpl,
  Tuple: TupleImpl.fromBytesImpl,
  Struct: StructImpl.fromBytesImpl,
  DynamicBytes: DynamicBytesImpl.fromBytesImpl,
  'StaticBytes<.*>': StaticBytesImpl.fromBytesImpl,
}
export const getArc4Encoder = <T>(typeInfo: TypeInfo, encoders?: Record<string, fromBytes<DeliberateAny>>): fromBytes<T> => {
  const encoder = Object.entries(encoders ?? arc4Encoders).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (!encoder) {
    throw new Error(`No encoder found for type ${typeInfo.name}`)
  }
  return encoder as fromBytes<T>
}

export const getArc4TypeName = (typeInfo: TypeInfo): string | undefined => {
  const map = {
    Address: 'address',
    Bool: 'bool',
    Byte: 'byte',
    Str: 'string',
    'UintN<.*>': UintNImpl.getArc4TypeName,
    'UFixedNxM<.*>': UFixedNxMImpl.getArc4TypeName,
    'StaticArray<.*>': StaticArrayImpl.getArc4TypeName,
    'DynamicArray<.*>': DynamicArrayImpl.getArc4TypeName,
    Tuple: TupleImpl.getArc4TypeName,
    Struct: StructImpl.getArc4TypeName,
    DynamicBytes: DynamicBytesImpl.getArc4TypeName,
    'StaticBytes<.*>': StaticBytesImpl.getArc4TypeName,
  }
  const name = Object.entries(map).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (typeof name === 'string') return name
  else if (typeof name === 'function') return name(typeInfo)
  return undefined
}
