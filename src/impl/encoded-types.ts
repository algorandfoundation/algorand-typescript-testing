import type {
  Account as AccountType,
  BigUintCompat,
  bytes,
  NTuple,
  StringCompat,
  uint64,
  Uint64Compat,
} from '@algorandfoundation/algorand-typescript'
import type { BitSize } from '@algorandfoundation/algorand-typescript/arc4'
import {
  Address,
  ARC4Encoded,
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
import assert from 'assert'
import {
  ABI_RETURN_VALUE_LOG_PREFIX,
  ALGORAND_ADDRESS_BYTE_LENGTH,
  ALGORAND_CHECKSUM_BYTE_LENGTH,
  BITS_IN_BYTE,
  UINT512_SIZE,
  UINT64_SIZE,
} from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import type { fromBytes, TypeInfo } from '../encoders'
import { AvmError, avmInvariant, CodeError } from '../errors'
import type { DeliberateAny } from '../typescript-helpers'
import {
  asBigInt,
  asBigUint,
  asBigUintCls,
  asBytes,
  asBytesCls,
  asUint64,
  asUint8Array,
  conactUint8Arrays,
  uint8ArrayToNumber,
} from '../util'
import type { StubBytesCompat } from './primitives'
import { AlgoTsPrimitiveCls, arrayUtil, BigUintCls, Bytes, BytesCls, getUint8Array, isBytes, Uint64Cls } from './primitives'
import { Account, AccountCls, ApplicationCls, AssetCls } from './reference'
import type { ApplicationCallTransaction } from './transactions'

const ABI_LENGTH_SIZE = 2
const maxBigIntValue = (bitSize: number) => 2n ** BigInt(bitSize) - 1n
const maxBytesLength = (bitSize: number) => Math.floor(bitSize / BITS_IN_BYTE)
const encodeLength = (length: number) => new BytesCls(encodingUtil.bigIntToUint8Array(BigInt(length), ABI_LENGTH_SIZE))

type CompatForArc4Int<N extends BitSize> = N extends 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 ? Uint64Compat : BigUintCompat
const validBitSizes = [...Array(64).keys()].map((x) => (x + 1) * 8)
export class UintNImpl<N extends BitSize> extends UintN<N> {
  private value: Uint8Array
  private bitSize: N
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<N>) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.bitSize = UintNImpl.getMaxBitsLength(this.typeInfo) as N

    assert(validBitSizes.includes(this.bitSize), `Invalid bit size ${this.bitSize}`)

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
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
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
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: `${number}.${number}`) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const genericArgs = this.typeInfo.genericArgs as uFixedNxMGenericArgs
    this.bitSize = UFixedNxMImpl.getMaxBitsLength(this.typeInfo) as N
    this.precision = parseInt(genericArgs.m.name, 10) as M

    const trimmedValue = trimTrailingDecimalZeros(v ?? '0.0')
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
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
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
  typeInfo: TypeInfo
  private value: UintNImpl<8>

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<8>) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
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
      throw new CodeError(`Expected expression of type ${this.value.typeInfo.name}, got ${other.value.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): ByteImpl {
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
  typeInfo: TypeInfo
  private value: Uint8Array

  constructor(typeInfo: TypeInfo | string, s?: StringCompat) {
    super()
    const bytesValue = asBytesCls(s ?? '')
    const bytesLength = encodeLength(bytesValue.length.asNumber())
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
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
      throw new CodeError(`Expected expression of type Str, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): StrImpl {
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
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: boolean) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.value = encodingUtil.bigIntToUint8Array(v ? TRUE_BIGINT_VALUE : FALSE_BIGINT_VALUE, 1)
  }

  get native(): boolean {
    return encodingUtil.uint8ArrayToBigInt(this.value) === TRUE_BIGINT_VALUE
  }

  equals(other: this): boolean {
    if (!(other instanceof BoolImpl)) {
      throw new CodeError(`Expected expression of type Bool, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  static fromBytesImpl(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): BoolImpl {
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
  get(target: { items: readonly TItem[] }, prop: PropertyKey) {
    const idx = prop ? parseInt(prop.toString(), 10) : NaN
    if (!isNaN(idx)) {
      if (idx >= 0 && idx < target.items.length) return target.items[idx]
      throw new AvmError('Index out of bounds')
    } else if (prop === Symbol.iterator) {
      return target.items[Symbol.iterator].bind(target.items)
    } else if (prop === 'entries') {
      return target.items.entries.bind(target.items)
    } else if (prop === 'at') {
      return (index: Uint64Compat): TItem => {
        return arrayUtil.arrayAt(target.items, index)
      }
    }
    return Reflect.get(target, prop)
  },
  set(target: { items: TItem[]; setItem: (index: number, value: TItem) => void }, prop: PropertyKey, value: TItem) {
    const idx = prop ? parseInt(prop.toString(), 10) : NaN
    if (!isNaN(idx)) {
      if (idx >= 0 && idx < target.items.length) {
        target.setItem(idx, value)
        return true
      }
      throw new AvmError('Index out of bounds')
    }

    return Reflect.set(target, prop, value)
  },
})
const isInitialisingFromBytesSymbol = Symbol('IsInitialisingFromBytes')
export class StaticArrayImpl<TItem extends ARC4Encoded, TLength extends number> extends StaticArray<TItem, TLength> {
  private value?: NTuple<TItem, TLength>
  private uint8ArrayValue?: Uint8Array
  private size: number
  typeInfo: TypeInfo
  genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength })
  constructor(typeInfo: TypeInfo | string, ...items: TItem[])
  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    // if first item is the symbol, we are initialising from bytes
    // so we don't need to pass the items to the super constructor
    const isInitialisingFromBytes = items.length === 1 && (items[0] as DeliberateAny) === isInitialisingFromBytesSymbol
    super(...(isInitialisingFromBytes ? [] : (items as DeliberateAny)))

    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as StaticArrayGenericArgs
    this.size = parseInt(this.genericArgs.size.name, 10)

    // if we are not initialising from bytes, we need to check and set the items
    if (!isInitialisingFromBytes) {
      if (items.length && items.length !== this.size) {
        throw new CodeError(`expected ${this.size} items, not ${items.length}`)
      }

      assert(areAllARC4Encoded(items), 'expected ARC4 type')

      items.forEach((item) => {
        checkItemTypeName(this.genericArgs.elementType, item)
      })

      if (items.length) {
        this.value = items as NTuple<TItem, TLength>
      } else {
        this.uint8ArrayValue = new Uint8Array(StaticArrayImpl.getMaxBytesLength(this.typeInfo))
      }
    }
    return new Proxy(this, arrayProxyHandler<TItem>()) as StaticArrayImpl<TItem, TLength>
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? encode(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticArrayImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.size
  }

  get items(): NTuple<TItem, TLength> {
    if (this.uint8ArrayValue) {
      const childTypes = Array(this.size).fill(this.genericArgs.elementType)
      this.value = decode(this.uint8ArrayValue, childTypes) as NTuple<TItem, TLength>
      this.uint8ArrayValue = undefined
      return this.value
    } else if (this.value) {
      this.uint8ArrayValue = undefined
      return this.value
    }
    throw new CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): StaticArrayImpl<TItem, TLength> {
    return StaticArrayImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as StaticArrayImpl<TItem, TLength>
  }

  concat(other: Parameters<InstanceType<typeof StaticArray>['concat']>[0]): DynamicArrayImpl<TItem> {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as TItem)
      next = otherEntries.next()
    }
    return new DynamicArrayImpl<TItem>(
      { name: `DynamicArray<${this.genericArgs.elementType.name}>`, genericArgs: { elementType: this.genericArgs.elementType } },
      ...items,
    )
  }

  get native(): NTuple<TItem, TLength> {
    return this.items
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StaticArrayImpl<ARC4Encoded, number> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    // pass the symbol to the constructor to let it know we are initialising from bytes
    const result = new StaticArrayImpl<ARC4Encoded, number>(typeInfo, isInitialisingFromBytesSymbol as DeliberateAny)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    const genericArgs = typeInfo.genericArgs as StaticArrayGenericArgs
    const arraySize = parseInt(genericArgs.size.name, 10)
    const childTypes = Array(arraySize).fill(genericArgs.elementType)
    let i = 0
    let size = 0
    if (['Bool', 'boolean'].includes(genericArgs.elementType.name)) {
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
  typeInfo: TypeInfo
  private value: StaticArrayImpl<ByteImpl, 32>

  constructor(typeInfo: TypeInfo | string, value?: AccountType | string | bytes) {
    super(value)
    let uint8ArrayValue: Uint8Array
    if (value === undefined) {
      uint8ArrayValue = new Uint8Array(32)
    } else if (typeof value === 'string') {
      uint8ArrayValue = encodingUtil.base32ToUint8Array(value).slice(0, ALGORAND_ADDRESS_BYTE_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH)
    } else if (isBytes(value)) {
      uint8ArrayValue = getUint8Array(value)
    } else {
      uint8ArrayValue = getUint8Array(value.bytes)
    }
    avmInvariant(uint8ArrayValue.length === 32, 'Addresses should be 32 bytes')

    this.value = StaticArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as StaticArrayImpl<ByteImpl, 32>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as AddressImpl
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof AddressImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return 32
  }

  get native(): AccountType {
    return Account(this.value.bytes)
  }

  get items(): readonly ByteImpl[] {
    return this.value.items
  }

  setItem(_index: number, _value: ByteImpl): void {
    throw new CodeError('Address is immutable')
  }

  static fromBytesImpl(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): AddressImpl {
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
  typeInfo: TypeInfo
  genericArgs: DynamicArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[]) {
    super(...(items as TItem[]))
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
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
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
    throw new CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): DynamicArrayImpl<TItem> {
    return DynamicArrayImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as DynamicArrayImpl<TItem>
  }

  get native(): TItem[] {
    return this.items
  }

  push(...values: TItem[]) {
    const items = this.items
    items.push(...values)
  }

  pop(): TItem {
    const items = this.items
    const popped = items.pop()
    if (popped === undefined) throw new AvmError('The array is empty')
    return popped
  }

  concat(other: Parameters<InstanceType<typeof DynamicArray>['concat']>[0]): DynamicArrayImpl<TItem> {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as TItem)
      next = otherEntries.next()
    }
    return new DynamicArrayImpl<TItem>(this.typeInfo, ...items)
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
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
  typeInfo: TypeInfo
  genericArgs: TypeInfo[]

  constructor(typeInfo: TypeInfo | string, ...items: TTuple) {
    // if first item is the symbol, we are initialising from bytes
    // so we don't need to pass the items to the super constructor
    const isInitialisingFromBytes = items.length === 1 && (items[0] as DeliberateAny) === isInitialisingFromBytesSymbol
    super(...(isInitialisingFromBytes ? ([] as DeliberateAny) : items))
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = Object.values(this.typeInfo.genericArgs as Record<string, TypeInfo>)

    // if we are not initialising from bytes, we need to check and set the items
    if (!isInitialisingFromBytes) {
      assert(areAllARC4Encoded(items), 'expected ARC4 type')

      items.forEach((item, index) => {
        checkItemTypeName(this.genericArgs[index], item)
      })
      if (items.length) {
        this.value = items
      } else {
        this.uint8ArrayValue = new Uint8Array(TupleImpl.getMaxBytesLength(this.typeInfo))
      }
    }
  }

  get bytes(): bytes {
    return Bytes(this.uint8ArrayValue ?? encode(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof TupleImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
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
    throw new CodeError('value is not set')
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): TupleImpl<[ARC4Encoded, ...ARC4Encoded[]]> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    // pass the symbol to the constructor to let it know we are initialising from bytes
    const result = new TupleImpl(typeInfo, isInitialisingFromBytesSymbol as DeliberateAny)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    const genericArgs = Object.values(typeInfo.genericArgs as Record<string, TypeInfo>)
    let i = 0
    let size = 0

    while (i < genericArgs.length) {
      const childType = genericArgs[i]
      if (['Bool', 'boolean'].includes(childType.name)) {
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

  get native(): T {
    return this.items
  }

  copy(): StructImpl<T> {
    return StructImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as StructImpl<T>
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
    value: StubBytesCompat | Uint8Array,
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

  static getMaxBytesLength(typeInfo: TypeInfo): number {
    const genericArgs = Object.values(typeInfo.genericArgs as Record<string, TypeInfo>)
    let i = 0
    let size = 0

    while (i < genericArgs.length) {
      const childType = genericArgs[i]
      if (['Bool', 'boolean'].includes(childType.name)) {
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
}

export class DynamicBytesImpl extends DynamicBytes {
  typeInfo: TypeInfo
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
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
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
    throw new CodeError('DynamicBytes is immutable')
  }

  concat(other: Parameters<InstanceType<typeof DynamicBytes>['concat']>[0]): DynamicBytesImpl {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as ByteImpl)
      next = otherEntries.next()
    }
    const concatenatedBytes = items
      .map((item) => item.bytes)
      .reduce((acc, curr) => conactUint8Arrays(acc, asUint8Array(curr)), new Uint8Array())
    return new DynamicBytesImpl(this.typeInfo, asBytes(concatenatedBytes))
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
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
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, value?: bytes | string) {
    super(value)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const uint8ArrayValue = asUint8Array(value ?? new Uint8Array(StaticBytesImpl.getMaxBytesLength(this.typeInfo)))
    this.value = StaticArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as StaticArrayImpl<ByteImpl, number>
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as StaticBytesImpl
  }

  get bytes(): bytes {
    return this.value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticBytesImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
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
    throw new CodeError('StaticBytes is immutable')
  }

  concat(other: Parameters<InstanceType<typeof StaticBytes>['concat']>[0]): DynamicBytesImpl {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as ByteImpl)
      next = otherEntries.next()
    }
    const concatenatedBytes = items
      .map((item) => item.bytes)
      .reduce((acc, curr) => conactUint8Arrays(acc, asUint8Array(curr)), new Uint8Array())
    return new DynamicBytesImpl(this.typeInfo, asBytes(concatenatedBytes))
  }

  static fromBytesImpl(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): StaticBytesImpl {
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
    } else if (['Bool', 'boolean'].includes(childType.name)) {
      const before = findBoolTypes(childTypes, i, -1)
      let after = findBoolTypes(childTypes, i, 1)

      if (before % 8 != 0) {
        throw new CodeError('"expected before index should have number of bool mod 8 equal 0"')
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
      throw new CodeError('input string is not long enough to be decoded')
    }
    i += 1
  }

  if (dynamicSegments.length > 0) {
    dynamicSegments.at(-1)![1] = value.length
    arrayIndex = value.length
  }
  if (arrayIndex < value.length) {
    throw new CodeError('input string was not fully consumed')
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
    if (['Bool', 'boolean'].includes(values[curr].name)) {
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
    case 'uint64':
      return UINT64_SIZE / BITS_IN_BYTE
    case 'biguint':
      return UINT512_SIZE / BITS_IN_BYTE
    case 'boolean':
      return 8
    case 'Bool':
      return 1
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
    case 'Struct':
      return StructImpl.getMaxBytesLength(type)
    default:
      throw new CodeError(`unsupported type ${type.name}`)
  }
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
          throw new CodeError('"expected before index should have number of bool mod 8 equal 0"')
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
  bytes: StubBytesCompat,
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
  'Tuple(<.*>)?': TupleImpl.fromBytesImpl,
  'Struct(<.*>)?': StructImpl.fromBytesImpl,
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
    'Tuple(<.*>)?': TupleImpl.getArc4TypeName,
    'Struct(<.*>)?': StructImpl.getArc4TypeName,
    DynamicBytes: DynamicBytesImpl.getArc4TypeName,
    'StaticBytes<.*>': StaticBytesImpl.getArc4TypeName,
  }
  const name = Object.entries(map).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (typeof name === 'string') return name
  else if (typeof name === 'function') return name(typeInfo)
  return undefined
}

export function decodeArc4Impl<T>(sourceTypeInfoString: string, bytes: StubBytesCompat, prefix: 'none' | 'log' = 'none'): T {
  const sourceTypeInfo = JSON.parse(sourceTypeInfoString)
  const encoder = getArc4Encoder(sourceTypeInfo)
  const source = encoder(bytes, sourceTypeInfo, prefix)
  return getNativeValue(source) as T
}

export function encodeArc4Impl<T>(_targetTypeInfoString: string | undefined, source: T): bytes {
  const arc4Encoded = getArc4Encoded(source)
  return arc4Encoded.bytes
}

const getNativeValue = (value: DeliberateAny): DeliberateAny => {
  const native = (value as DeliberateAny).native
  if (Array.isArray(native)) {
    return native.map((item) => getNativeValue(item))
  } else if (native instanceof AlgoTsPrimitiveCls) {
    return native
  } else if (typeof native === 'object') {
    return Object.fromEntries(Object.entries(native).map(([key, value]) => [key, getNativeValue(value)]))
  }
  return native
}

export const getArc4Encoded = (value: DeliberateAny): ARC4Encoded => {
  if (value instanceof ARC4Encoded) {
    return value
  }
  if (value instanceof AccountCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apat.indexOf(value)
    return new UintNImpl({ name: 'UintN<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (value instanceof AssetCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apas.indexOf(value)
    return new UintNImpl({ name: 'UintN<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (value instanceof ApplicationCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apfa.indexOf(value)
    return new UintNImpl({ name: 'UintN<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (typeof value === 'boolean') {
    return new BoolImpl({ name: 'Bool' }, value)
  }
  if (value instanceof Uint64Cls || typeof value === 'number') {
    return new UintNImpl({ name: 'UintN<64>', genericArgs: [{ name: '64' }] }, asBigInt(value))
  }
  if (value instanceof BigUintCls) {
    return new UintNImpl({ name: 'UintN<512>', genericArgs: [{ name: '512' }] }, value.asBigInt())
  }
  if (typeof value === 'bigint') {
    return new UintNImpl({ name: 'UintN<512>', genericArgs: [{ name: '512' }] }, value)
  }
  if (value instanceof BytesCls) {
    return new DynamicBytesImpl(
      { name: 'DynamicBytes', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] } } },
      value.asAlgoTs(),
    )
  }
  if (typeof value === 'string') {
    return new StrImpl({ name: 'Str' }, value)
  }
  if (Array.isArray(value)) {
    const result: ARC4Encoded[] = value.reduce((acc: ARC4Encoded[], cur: DeliberateAny) => {
      return acc.concat(getArc4Encoded(cur))
    }, [])
    const genericArgs: TypeInfo[] = result.map((x) => (x as DeliberateAny).typeInfo)
    const typeInfo = { name: `Tuple<[${genericArgs.map((x) => x.name).join(',')}]>`, genericArgs }
    return new TupleImpl(typeInfo, ...(result as [ARC4Encoded, ...ARC4Encoded[]]))
  }
  if (typeof value === 'object') {
    const result = Object.values(value).reduce((acc: ARC4Encoded[], cur: DeliberateAny) => {
      return acc.concat(getArc4Encoded(cur))
    }, [])
    const genericArgs: TypeInfo[] = result.map((x) => (x as DeliberateAny).typeInfo)
    const typeInfo = {
      name: `Struct<${value.constructor.name}>`,
      genericArgs: Object.fromEntries(Object.keys(value).map((x, i) => [x, genericArgs[i]])),
    }
    return new StructImpl(typeInfo, Object.fromEntries(Object.keys(value).map((x, i) => [x, result[i]])))
  }

  throw new CodeError(`Unsupported type for encoding: ${typeof value}`)
}

export const arc4EncodedLengthImpl = (typeInfoString: string): uint64 => {
  const typeInfo = JSON.parse(typeInfoString)
  return getMaxLengthOfStaticContentType(typeInfo)
}

export const tryArc4EncodedLengthImpl = (typeInfoString: string | TypeInfo): uint64 | undefined => {
  const typeInfo = typeof typeInfoString === 'string' ? JSON.parse(typeInfoString) : typeInfoString
  try {
    return getMaxLengthOfStaticContentType(typeInfo)
  } catch (e) {
    if (e instanceof CodeError && e.message.startsWith('unsupported type')) {
      return undefined
    }
    throw e
  }
}
