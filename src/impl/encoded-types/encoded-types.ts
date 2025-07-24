import type { Account as AccountType, bytes, NTuple, StringCompat, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { FixedArray, ReferenceArray } from '@algorandfoundation/algorand-typescript'
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
  UFixed,
  Uint,
} from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import assert from 'assert'
import { ABI_RETURN_VALUE_LOG_PREFIX, ALGORAND_ADDRESS_BYTE_LENGTH, ALGORAND_CHECKSUM_BYTE_LENGTH, UINT64_SIZE } from '../../constants'
import { lazyContext } from '../../context-helpers/internal-context'
import { AvmError, avmInvariant, CodeError, InternalError } from '../../errors'
import { nameOfType, type DeliberateAny } from '../../typescript-helpers'
import {
  asBigInt,
  asBigUint,
  asBigUintCls,
  asBytes,
  asBytesCls,
  asMaybeBigUintCls,
  asMaybeBytesCls,
  asMaybeUint64Cls,
  asNumber,
  asUint64,
  asUint64Cls,
  asUint8Array,
  conactUint8Arrays,
  uint8ArrayToNumber,
} from '../../util'
import { BytesBackedCls, Uint64BackedCls } from '../base'
import type { StubBytesCompat } from '../primitives'
import { BigUintCls, Bytes, BytesCls, getUint8Array, isBytes, Uint64Cls } from '../primitives'
import { Account, AccountCls, ApplicationCls, AssetCls } from '../reference'
import type { ApplicationCallTransaction } from '../transactions'
import { arrayProxyHandler } from './array-proxy'
import { ABI_LENGTH_SIZE, FALSE_BIGINT_VALUE, IS_INITIALISING_FROM_BYTES_SYMBOL, TRUE_BIGINT_VALUE } from './constants'
import {
  areAllARC4Encoded,
  bigUintFromBytes,
  booleanFromBytes,
  bytesFromBytes,
  checkItemTypeName,
  compressMultipleBool,
  encodeLength,
  findBool,
  findBoolTypes,
  holdsDynamicLengthContent,
  maxBigIntValue,
  maxBytesLength,
  onCompletionFromBytes,
  readLength,
  regExpNxM,
  stringFromBytes,
  transactionTypeFromBytes,
  trimTrailingDecimalZeros,
  uint64FromBytes,
  validBitSizes,
} from './helpers'
import type {
  CompatForArc4Int,
  DynamicArrayGenericArgs,
  fromBytes,
  StaticArrayGenericArgs,
  StructConstraint,
  TypeInfo,
  uFixedGenericArgs,
} from './types'
import { getMaxLengthOfStaticContentType } from './utils'

export class UintImpl<N extends BitSize> extends Uint<N> {
  private value: Uint8Array
  private bitSize: N
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<N>) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.bitSize = UintImpl.getMaxBitsLength(this.typeInfo) as N

    assert(validBitSizes.includes(this.bitSize), `Invalid bit size ${this.bitSize}`)

    const bigIntValue = asBigUintCls(v ?? 0n).valueOf()
    const maxValue = maxBigIntValue(this.bitSize)
    assert(bigIntValue <= maxValue, `expected value <= ${maxValue}, got: ${bigIntValue}`)

    this.value = encodingUtil.bigIntToUint8Array(bigIntValue, maxBytesLength(this.bitSize))
  }

  get native() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this.value)
    return (this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)) as Uint<N>['native']
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  equals(other: this): boolean {
    if (!(other instanceof UintImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): UintImpl<BitSize> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new UintImpl<BitSize>(typeInfo)
    result.value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return parseInt((typeInfo.genericArgs as TypeInfo[])![0].name, 10) as BitSize
  }
}

export class UFixedImpl<N extends BitSize, M extends number> extends UFixed<N, M> {
  private value: Uint8Array
  private bitSize: N
  private precision: M
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: `${number}.${number}`) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const genericArgs = this.typeInfo.genericArgs as uFixedGenericArgs
    this.bitSize = UFixedImpl.getMaxBitsLength(this.typeInfo) as N
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
    return (this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)) as UFixed<N, M>['native']
  }

  get bytes(): bytes {
    return Bytes(this.value)
  }

  equals(other: this): boolean {
    if (!(other instanceof UFixedImpl) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytesImpl(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): UFixed<BitSize, number> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new UFixedImpl<BitSize, number>(typeInfo, '0.0')
    result.value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    const genericArgs = typeInfo.genericArgs as uFixedGenericArgs
    return parseInt(genericArgs.n.name, 10) as BitSize
  }
}

export class ByteImpl extends Byte {
  typeInfo: TypeInfo
  private value: UintImpl<8>

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<8>) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.value = new UintImpl<8>(typeInfo, v)
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
    const uintNValue = UintImpl.fromBytesImpl(value, typeInfo, prefix) as UintImpl<8>
    const result = new ByteImpl(typeInfo)
    result.value = uintNValue
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return UintImpl.getMaxBitsLength(typeInfo)
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
    return Bytes(this.value?.length ? this.value : new Uint8Array([0]))
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
    const isInitialisingFromBytes = items.length === 1 && (items[0] as DeliberateAny) === IS_INITIALISING_FROM_BYTES_SYMBOL
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
        this.uint8ArrayValue = new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo))
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
    return StaticArrayImpl.fromBytesImpl(this.bytes, JSON.stringify(this.typeInfo)) as unknown as StaticArrayImpl<TItem, TLength>
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
    const result = new StaticArrayImpl<ARC4Encoded, number>(typeInfo, IS_INITIALISING_FROM_BYTES_SYMBOL as DeliberateAny)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
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
    const isInitialisingFromBytes = items.length === 1 && (items[0] as DeliberateAny) === IS_INITIALISING_FROM_BYTES_SYMBOL
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
        this.uint8ArrayValue = new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo))
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
    const result = new TupleImpl(typeInfo, IS_INITIALISING_FROM_BYTES_SYMBOL as DeliberateAny)
    result.uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }
}

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
        if (originalValue === undefined && target.uint8ArrayValue?.length && Object.keys(target.genericArgs).includes(prop.toString())) {
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
}

export class StaticBytesImpl<TLength extends uint64 = 0> extends StaticBytes<TLength> {
  private value: StaticArrayImpl<ByteImpl, TLength>
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, value?: bytes<TLength>) {
    super(value ?? (Bytes() as bytes<TLength>))
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const uint8ArrayValue = asUint8Array(value ?? new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo)))
    this.value = StaticArrayImpl.fromBytesImpl(uint8ArrayValue, typeInfo) as unknown as StaticArrayImpl<ByteImpl, TLength>
    return new Proxy(this, arrayProxyHandler<ByteImpl>()) as StaticBytesImpl<TLength>
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

  get native(): bytes<TLength> {
    return this.value.bytes as bytes<TLength>
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
    result.value = staticArrayValue as StaticArrayImpl<ByteImpl, 0>
    return result
  }
}

export class ReferenceArrayImpl<TItem> extends ReferenceArray<TItem> {
  private _values: TItem[]
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, ...items: TItem[]) {
    super(...items)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this._values = items

    return new Proxy(this, arrayProxyHandler<TItem>()) as ReferenceArrayImpl<TItem>
  }

  /**
   * Returns the current length of this array
   */
  get length(): uint64 {
    return this._values.length
  }

  get items(): TItem[] {
    return this._values
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  slice(start?: Uint64Compat, end?: Uint64Compat): ReferenceArray<TItem> {
    const startIndex = end === undefined ? 0 : asNumber(start ?? 0)
    const endIndex = end === undefined ? asNumber(start ?? this._values.length) : asNumber(end)
    return new ReferenceArrayImpl<TItem>(this.typeInfo, ...this._values.slice(startIndex, endIndex))
  }

  /**
   * Push a number of items into this array
   * @param items The items to be added to this array
   */
  push(...items: TItem[]): void {
    this._values.push(...items)
  }

  /**
   * Pop a single item from this array
   */
  pop(): TItem {
    return this._values.pop()!
  }

  copy(): ReferenceArray<TItem> {
    const bytesValue = toBytes(this)
    return getEncoder<ReferenceArray<TItem>>(this.typeInfo)(bytesValue, this.typeInfo)
  }
}

export class FixedArrayImpl<TItem, TLength extends number> extends FixedArray<TItem, TLength> {
  private _values: NTuple<TItem, TLength>
  private size: number
  typeInfo: TypeInfo
  private genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    super(...(items as DeliberateAny))
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as StaticArrayGenericArgs
    this.size = parseInt(this.genericArgs.size.name, 10)
    if (items.length) {
      this._values = items as NTuple<TItem, TLength>
    } else {
      const bytesValue = asBytes(new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo)))
      this._values = (
        getEncoder<FixedArray<TItem, TLength>>(this.typeInfo)(bytesValue, this.typeInfo) as FixedArrayImpl<TItem, TLength>
      ).items
    }
    return new Proxy(this, arrayProxyHandler<TItem>()) as FixedArrayImpl<TItem, TLength>
  }

  concat(...others: (TItem | ConcatArray<TItem>)[]): TItem[] {
    return this.items.concat(...others)
  }

  get length(): uint64 {
    return this.size
  }

  get items(): NTuple<TItem, TLength> {
    return this._values
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  slice(start?: Uint64Compat, end?: Uint64Compat): Array<TItem> {
    const startIndex = end === undefined ? 0 : asNumber(start ?? 0)
    const endIndex = end === undefined ? asNumber(start ?? this._values.length) : asNumber(end)
    return this._values.slice(startIndex, endIndex)
  }

  copy(): FixedArray<TItem, TLength> {
    const bytesValue = toBytes(this)
    return getEncoder<FixedArray<TItem, TLength>>(this.typeInfo)(bytesValue, this.typeInfo)
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
    values.push(
      getEncoder<ARC4Encoded>(childType)(
        ['bytes', 'string'].includes(childType.name) ? valuePartitions[index].slice(2) : valuePartitions[index],
        childType,
      ),
    )
  })
  return values
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

const isDynamicLengthType = (value: ARC4Encoded) => {
  return (
    value instanceof StrImpl ||
    (value instanceof StaticArrayImpl && holdsDynamicLengthContent(value.typeInfo)) ||
    (value instanceof TupleImpl && value.genericArgs.some(holdsDynamicLengthContent)) ||
    (value instanceof StructImpl && Object.values(value.genericArgs).some(holdsDynamicLengthContent)) ||
    value instanceof DynamicArrayImpl ||
    value instanceof DynamicBytesImpl
  )
}

export function encodeArc4Impl<T>(sourceTypeInfoString: string | undefined, source: T): bytes {
  const arc4Encoded = getArc4Encoded(source, sourceTypeInfoString)
  return arc4Encoded.bytes
}

export const getArc4Encoded = (value: DeliberateAny, sourceTypeInfoString?: string): ARC4Encoded => {
  if (value instanceof ARC4Encoded) {
    return value
  }
  if (value instanceof AccountCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apat.indexOf(value)
    return new UintImpl({ name: 'Uint<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (value instanceof AssetCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apas.indexOf(value)
    return new UintImpl({ name: 'Uint<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (value instanceof ApplicationCls) {
    const index = (lazyContext.activeGroup.activeTransaction as ApplicationCallTransaction).apfa.indexOf(value)
    return new UintImpl({ name: 'Uint<64>', genericArgs: [{ name: '64' }] }, asBigInt(index))
  }
  if (typeof value === 'boolean') {
    return new BoolImpl({ name: 'Bool' }, value)
  }
  if (value instanceof Uint64Cls || typeof value === 'number') {
    return new UintImpl({ name: 'Uint<64>', genericArgs: [{ name: '64' }] }, asBigInt(value))
  }
  if (value instanceof BigUintCls) {
    return new UintImpl({ name: 'Uint<512>', genericArgs: [{ name: '512' }] }, value.asBigInt())
  }
  if (typeof value === 'bigint') {
    return new UintImpl({ name: 'Uint<512>', genericArgs: [{ name: '512' }] }, value)
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
  if (Array.isArray(value) || value instanceof ReferenceArrayImpl || value instanceof FixedArrayImpl) {
    const sourceTypeInfo = sourceTypeInfoString ? JSON.parse(sourceTypeInfoString) : undefined
    const sourceGenericArgs = ((value as DeliberateAny).typeInfo || sourceTypeInfo || {})?.genericArgs
    const result: ARC4Encoded[] = (value instanceof ReferenceArrayImpl || value instanceof FixedArrayImpl ? value.items : value).reduce(
      (acc: ARC4Encoded[], cur: DeliberateAny, currentIndex: number) => {
        const elementTypeInfo = sourceGenericArgs?.elementType || sourceGenericArgs?.[currentIndex]
        const elementTypeInfoString = elementTypeInfo ? JSON.stringify(elementTypeInfo) : undefined
        return acc.concat(getArc4Encoded(cur, elementTypeInfoString))
      },
      [],
    )

    const genericArgs: TypeInfo[] = result.map((x) => (x as DeliberateAny).typeInfo)
    if (value instanceof FixedArrayImpl) {
      const typeInfo = {
        name: `StaticArray<${genericArgs[0].name},${genericArgs.length}>`,
        genericArgs: { elementType: genericArgs[0], size: { name: genericArgs.length.toString() } },
      }
      return new StaticArrayImpl(typeInfo, ...(result as [ARC4Encoded, ...ARC4Encoded[]]))
    } else if (
      sourceTypeInfo?.name?.startsWith('Array') ||
      sourceTypeInfo?.name?.startsWith('ReadonlyArray') ||
      value instanceof ReferenceArrayImpl
    ) {
      const elementType = genericArgs[0] ?? sourceTypeInfo.genericArgs?.elementType
      const typeInfo = { name: `DynamicArray<${elementType.name}>`, genericArgs: { elementType } }
      return new DynamicArrayImpl(typeInfo, ...(result as [ARC4Encoded, ...ARC4Encoded[]]))
    } else {
      const typeInfo = { name: `Tuple<[${genericArgs.map((x) => x.name).join(',')}]>`, genericArgs }
      return new TupleImpl(typeInfo, ...(result as [ARC4Encoded, ...ARC4Encoded[]]))
    }
  }
  if (typeof value === 'object') {
    const sourceTypeInfo = sourceTypeInfoString ? JSON.parse(sourceTypeInfoString) : undefined
    const propTypeInfos = (value.typeInfo || sourceTypeInfo || {}).genericArgs
    const result = Object.entries(value).reduce((acc: ARC4Encoded[], [key, cur]: DeliberateAny) => {
      const propTypeInfoString = propTypeInfos?.[key] ? JSON.stringify(propTypeInfos[key]) : undefined
      return acc.concat(getArc4Encoded(cur, propTypeInfoString))
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

export const toBytes = (val: unknown, sourceTypeInfoString?: string): bytes => {
  const uint64Val = asMaybeUint64Cls(val, false)
  if (uint64Val !== undefined) {
    return uint64Val.toBytes().asAlgoTs()
  }
  const bytesVal = asMaybeBytesCls(val)
  if (bytesVal !== undefined) {
    return bytesVal.asAlgoTs()
  }
  const bigUintVal = asMaybeBigUintCls(val)
  if (bigUintVal !== undefined) {
    return bigUintVal.toBytes().asAlgoTs()
  }
  if (val instanceof BytesBackedCls) {
    return val.bytes
  }
  if (val instanceof Uint64BackedCls) {
    return asUint64Cls(val.uint64).toBytes().asAlgoTs()
  }
  if (Array.isArray(val) || typeof val === 'object') {
    return encodeArc4Impl(sourceTypeInfoString, val)
  }
  throw new InternalError(`Invalid type for bytes: ${nameOfType(val)}`)
}

export const getEncoder = <T>(typeInfo: TypeInfo): fromBytes<T> => {
  const mutableTupleFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const tuple = TupleImpl.fromBytesImpl(value, typeInfo, prefix)
    return asNumber(tuple.bytes.length) ? tuple.native : ([] as unknown as typeof tuple.native)
  }
  const readonlyMutableTupleFromBytes = (
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ) => {
    const result = mutableTupleFromBytes(value, typeInfo, prefix)
    return result as Readonly<typeof result>
  }
  const mutableObjectFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const struct = StructImpl.fromBytesImpl(value, typeInfo, prefix)
    return asNumber(struct.bytes.length) ? struct.native : ({} as unknown as typeof struct.native)
  }
  const readonlyObjectFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const result = mutableObjectFromBytes(value, typeInfo, prefix)
    return result as Readonly<typeof result>
  }
  const arrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const dynamicArray = DynamicArrayImpl.fromBytesImpl(value, typeInfo, prefix)
    return asNumber(dynamicArray.bytes.length) ? dynamicArray.native : ([] as unknown as typeof dynamicArray.native)
  }
  const readonlyArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const result = arrayFromBytes(value, typeInfo, prefix)
    return result as Readonly<typeof result>
  }
  const referenceArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const dynamicArray = DynamicArrayImpl.fromBytesImpl(value, typeInfo, prefix)
    return new ReferenceArrayImpl(
      typeInfo,
      ...(asNumber(dynamicArray.bytes.length) ? dynamicArray.native : ([] as unknown as typeof dynamicArray.native)),
    )
  }
  const fixedArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const staticArray = StaticArrayImpl.fromBytesImpl(value, typeInfo, prefix)
    return new FixedArrayImpl(
      typeInfo,
      ...(asNumber(staticArray.bytes.length) ? staticArray.native : ([] as unknown as typeof staticArray.native)),
    )
  }
  const encoders: Record<string, fromBytes<DeliberateAny>> = {
    account: AccountCls.fromBytes,
    application: ApplicationCls.fromBytes,
    asset: AssetCls.fromBytes,
    boolean: booleanFromBytes,
    biguint: bigUintFromBytes,
    'bytes(<.*>)?': bytesFromBytes,
    string: stringFromBytes,
    uint64: uint64FromBytes,
    OnCompleteAction: onCompletionFromBytes,
    TransactionType: transactionTypeFromBytes,
    Address: AddressImpl.fromBytesImpl,
    Bool: BoolImpl.fromBytesImpl,
    Byte: ByteImpl.fromBytesImpl,
    Str: StrImpl.fromBytesImpl,
    'Uint<.*>': UintImpl.fromBytesImpl,
    'UFixed<.*>': UFixedImpl.fromBytesImpl,
    'StaticArray<.*>': StaticArrayImpl.fromBytesImpl,
    'DynamicArray<.*>': DynamicArrayImpl.fromBytesImpl,
    'Tuple(<.*>)?': TupleImpl.fromBytesImpl,
    'ReadonlyTuple(<.*>)?': readonlyMutableTupleFromBytes,
    'MutableTuple(<.*>)?': mutableTupleFromBytes,
    'Struct(<.*>)?': StructImpl.fromBytesImpl,
    DynamicBytes: DynamicBytesImpl.fromBytesImpl,
    'StaticBytes<.*>': StaticBytesImpl.fromBytesImpl,
    object: StructImpl.fromBytesImpl,
    'Object<.*>': mutableObjectFromBytes,
    'ReadonlyObject<.*>': readonlyObjectFromBytes,
    'ReferenceArray<.*>': referenceArrayFromBytes,
    'FixedArray<.*>': fixedArrayFromBytes,
    'Array<.*>': arrayFromBytes,
    'ReadonlyArray<.*>': readonlyArrayFromBytes,
  }

  const encoder = Object.entries(encoders).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (!encoder) {
    throw new Error(`No encoder found for type ${typeInfo.name}`)
  }
  return encoder as fromBytes<T>
}
