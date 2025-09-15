import type { Account as AccountType, bytes, NTuple, StringCompat, uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { FixedArray as _FixedArray, ReferenceArray as _ReferenceArray } from '@algorandfoundation/algorand-typescript'
import type { BitSize } from '@algorandfoundation/algorand-typescript/arc4'
import {
  Address as _Address,
  ARC4Encoded as _ARC4Encoded,
  Bool as _Bool,
  Byte as _Byte,
  DynamicArray as _DynamicArray,
  DynamicBytes as _DynamicBytes,
  StaticArray as _StaticArray,
  StaticBytes as _StaticBytes,
  Str as _Str,
  Struct as _Struct,
  Tuple as _Tuple,
  UFixed as _UFixed,
  Uint as _Uint,
} from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import assert from 'assert'
import {
  ABI_RETURN_VALUE_LOG_PREFIX,
  ALGORAND_ADDRESS_BYTE_LENGTH,
  ALGORAND_CHECKSUM_BYTE_LENGTH,
  MAX_UINT64,
  UINT64_SIZE,
} from '../../constants'
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
  concatUint8Arrays,
  uint8ArrayToNumber,
} from '../../util'
import { BytesBackedCls, Uint64BackedCls } from '../base'
import type { StubBytesCompat } from '../primitives'
import { BigUintCls, Bytes, BytesCls, getUint8Array, isBytes, Uint64Cls } from '../primitives'
import { Account, AccountCls, ApplicationCls, AssetCls } from '../reference'
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
  getNativeValue,
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

interface _ARC4Encodedint8Array extends _ARC4Encoded {
  get uint8ArrayValue(): Uint8Array
}
/** @internal */
export class Uint<N extends BitSize> extends _Uint<N> implements _ARC4Encodedint8Array {
  private _value: Uint8Array
  private bitSize: N
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<N>) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.bitSize = Uint.getMaxBitsLength(this.typeInfo) as N

    assert(validBitSizes.includes(this.bitSize), `Invalid bit size ${this.bitSize}`)

    const bigIntValue = asBigUintCls(v ?? 0n).valueOf()
    const maxValue = maxBigIntValue(this.bitSize)
    assert(bigIntValue <= maxValue, `expected value <= ${maxValue}, got: ${bigIntValue}`)

    this._value = encodingUtil.bigIntToUint8Array(bigIntValue, maxBytesLength(this.bitSize))
  }

  get native() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this._value)
    return this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)
  }

  asUint64() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this._value)
    if (bigIntValue > MAX_UINT64) {
      throw new CodeError('value too large to fit in uint64')
    }
    return asUint64(bigIntValue)
  }

  asBigUint() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this._value)
    return asBigUint(bigIntValue)
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value
  }

  get bytes(): bytes {
    return Bytes(this._value)
  }

  equals(other: this): boolean {
    if (!(other instanceof Uint) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): Uint<BitSize> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new Uint<BitSize>(typeInfo)
    result._value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return parseInt((typeInfo.genericArgs as TypeInfo[])![0].name, 10) as BitSize
  }
}

/** @internal */
export class UFixed<N extends BitSize, M extends number> extends _UFixed<N, M> implements _ARC4Encodedint8Array {
  private _value: Uint8Array
  private bitSize: N
  private precision: M
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: `${number}.${number}`) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const genericArgs = this.typeInfo.genericArgs as uFixedGenericArgs
    this.bitSize = UFixed.getMaxBitsLength(this.typeInfo) as N
    this.precision = parseInt(genericArgs.m.name, 10) as M

    const trimmedValue = trimTrailingDecimalZeros(v ?? '0.0')
    assert(regExpNxM(this.precision).test(trimmedValue), `expected positive decimal literal with max of ${this.precision} decimal places`)

    const bigIntValue = BigInt(trimmedValue.replace('.', ''))
    const maxValue = maxBigIntValue(this.bitSize)
    assert(bigIntValue <= maxValue, `expected value <= ${maxValue}, got: ${bigIntValue}`)

    this._value = encodingUtil.bigIntToUint8Array(bigIntValue, maxBytesLength(this.bitSize))
  }

  get native() {
    const bigIntValue = encodingUtil.uint8ArrayToBigInt(this._value)
    return this.bitSize <= UINT64_SIZE ? asUint64(bigIntValue) : asBigUint(bigIntValue)
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value
  }

  get bytes(): bytes {
    return Bytes(this._value)
  }

  equals(other: this): boolean {
    if (!(other instanceof UFixed) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytes(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): _UFixed<BitSize, number> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new UFixed<BitSize, number>(typeInfo, '0.0')
    result._value = asUint8Array(bytesValue)
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    const genericArgs = typeInfo.genericArgs as uFixedGenericArgs
    return parseInt(genericArgs.n.name, 10) as BitSize
  }
}

/** @internal */
export class Byte extends _Byte implements _ARC4Encodedint8Array {
  typeInfo: TypeInfo
  private _value: Uint<8>

  constructor(typeInfo: TypeInfo | string, v?: CompatForArc4Int<8>) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this._value = new Uint<8>(typeInfo, v)
  }

  asUint64() {
    return this._value.asUint64()
  }

  asBigUint() {
    return this._value.asBigUint()
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value.uint8ArrayValue
  }

  get bytes(): bytes {
    return this._value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof Byte) || JSON.stringify(this._value.typeInfo) !== JSON.stringify(other._value.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this._value.typeInfo.name}, got ${other._value.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): Byte {
    const uintNValue = Uint.fromBytes(value, typeInfo, prefix) as Uint<8>
    const result = new Byte(typeInfo)
    result._value = uintNValue
    return result
  }

  static getMaxBitsLength(typeInfo: TypeInfo): BitSize {
    return Uint.getMaxBitsLength(typeInfo)
  }
}

/** @internal */
export class Str extends _Str implements _ARC4Encodedint8Array {
  typeInfo: TypeInfo
  private _value: Uint8Array

  constructor(typeInfo: TypeInfo | string, s?: StringCompat) {
    super()
    const bytesValue = asBytesCls(s ?? '')
    const bytesLength = encodeLength(bytesValue.length.asNumber())
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this._value = asUint8Array(bytesLength.concat(bytesValue))
  }
  get native(): string {
    return encodingUtil.uint8ArrayToUtf8(this._value.slice(ABI_LENGTH_SIZE))
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value
  }

  get bytes(): bytes {
    return Bytes(this._value)
  }

  equals(other: this): boolean {
    if (!(other instanceof Str)) {
      throw new CodeError(`Expected expression of type Str, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): Str {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new Str(typeInfo)
    result._value = asUint8Array(bytesValue)
    return result
  }
}

/** @internal */
export class Bool extends _Bool implements _ARC4Encodedint8Array {
  private _value: Uint8Array
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, v?: boolean) {
    super(v)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this._value = encodingUtil.bigIntToUint8Array(v ? TRUE_BIGINT_VALUE : FALSE_BIGINT_VALUE, 1)
  }

  get native(): boolean {
    return encodingUtil.uint8ArrayToBigInt(this._value) === TRUE_BIGINT_VALUE
  }

  equals(other: this): boolean {
    if (!(other instanceof Bool)) {
      throw new CodeError(`Expected expression of type Bool, got ${(other as object).constructor.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value
  }

  get bytes(): bytes {
    return Bytes(this._value?.length ? this._value : new Uint8Array([0]))
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): Bool {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new Bool(typeInfo)
    result._value = asUint8Array(bytesValue)
    return result
  }
}

/** @internal */
export class StaticArray<TItem extends _ARC4Encoded, TLength extends number>
  extends _StaticArray<TItem, TLength>
  implements _ARC4Encodedint8Array
{
  private _value?: NTuple<TItem, TLength>
  private _uint8ArrayValue?: Uint8Array
  private size: number
  typeInfo: TypeInfo
  genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength })
  constructor(typeInfo: TypeInfo | string, ...items: TItem[])
  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    // if first item is the symbol, we are initialising from bytes
    // so we don't need to pass the items to the super constructor
    const isInitialisingFromBytes = items.length === 1 && (items[0] as DeliberateAny) === IS_INITIALISING_FROM_BYTES_SYMBOL
    super()

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
        this._value = items as NTuple<TItem, TLength>
      } else {
        this._uint8ArrayValue = new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo))
      }
    }
    return new Proxy(this, arrayProxyHandler<TItem>()) as StaticArray<TItem, TLength>
  }

  get uint8ArrayValue(): Uint8Array {
    return this._uint8ArrayValue ?? encode(this.items, true)
  }

  get bytes(): bytes {
    return Bytes(this._uint8ArrayValue ?? encode(this.items, true))
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticArray) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.size
  }

  get items(): NTuple<TItem, TLength> {
    if (this._uint8ArrayValue) {
      const childTypes = Array(this.size).fill(this.genericArgs.elementType)
      this._value = decode(this._uint8ArrayValue, childTypes, true) as NTuple<TItem, TLength>
      this._uint8ArrayValue = undefined
      return this._value
    } else if (this._value) {
      this._uint8ArrayValue = undefined
      return this._value
    }
    throw new CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): StaticArray<TItem, TLength> {
    return StaticArray.fromBytes(this.uint8ArrayValue, JSON.stringify(this.typeInfo)) as unknown as StaticArray<TItem, TLength>
  }

  concat(other: Parameters<InstanceType<typeof _StaticArray>['concat']>[0]): DynamicArray<TItem> {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as TItem)
      next = otherEntries.next()
    }
    return new DynamicArray<TItem>(
      { name: `DynamicArray<${this.genericArgs.elementType.name}>`, genericArgs: { elementType: this.genericArgs.elementType } },
      ...items,
    )
  }

  get native(): NTuple<TItem, TLength> {
    return this.items
  }

  static fromBytes(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): StaticArray<_ARC4Encoded, number> {
    let bytesValue = value instanceof Uint8Array ? value : asUint8Array(value)
    if (prefix === 'log') {
      assert(Bytes(bytesValue.slice(0, 4)).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    // pass the symbol to the constructor to let it know we are initialising from bytes
    const result = new StaticArray<_ARC4Encoded, number>(typeInfo, IS_INITIALISING_FROM_BYTES_SYMBOL as DeliberateAny)
    result._uint8ArrayValue = bytesValue
    return result
  }
}

/** @internal */
export class Address extends _Address implements _ARC4Encodedint8Array {
  typeInfo: TypeInfo
  private _value: StaticArray<Byte, 32>

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

    this._value = StaticArray.fromBytes(uint8ArrayValue, typeInfo) as StaticArray<Byte, 32>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<Byte>()) as Address
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value.uint8ArrayValue
  }

  get bytes(): bytes {
    return this._value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof Address) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return 32
  }

  get native(): AccountType {
    return Account(this._value.bytes)
  }

  get items(): readonly Byte[] {
    return this._value.items
  }

  setItem(_index: number, _value: Byte): void {
    throw new CodeError('Address is immutable')
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): Address {
    const staticArrayValue = StaticArray.fromBytes(value, typeInfo, prefix) as StaticArray<Byte, 32>
    const result = new Address(typeInfo)
    result._value = staticArrayValue
    return result
  }
}

/** @internal */
export class DynamicArray<TItem extends _ARC4Encoded> extends _DynamicArray<TItem> implements _ARC4Encodedint8Array {
  private _value?: TItem[]
  private _uint8ArrayValue?: Uint8Array
  typeInfo: TypeInfo
  genericArgs: DynamicArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[]) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as DynamicArrayGenericArgs

    assert(areAllARC4Encoded(items), 'expected ARC4 type')

    items.forEach((item) => {
      checkItemTypeName(this.genericArgs.elementType, item)
    })
    this._value = items

    return new Proxy(this, arrayProxyHandler<TItem>()) as DynamicArray<TItem>
  }

  get uint8ArrayValue(): Uint8Array {
    return this._uint8ArrayValue ?? this.encodeWithLength(this.items)
  }

  get bytes(): bytes {
    return Bytes(this._uint8ArrayValue ?? this.encodeWithLength(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof DynamicArray) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this.items.length
  }

  get items(): TItem[] {
    if (this._uint8ArrayValue) {
      const [length, data] = readLength(this._uint8ArrayValue)
      const childTypes = Array(length).fill(this.genericArgs.elementType)
      this._value = decode(data, childTypes, true) as TItem[]
      this._uint8ArrayValue = undefined
      return this._value
    } else if (this._value) {
      this._uint8ArrayValue = undefined
      return this._value
    }
    throw new CodeError('value is not set')
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  copy(): DynamicArray<TItem> {
    return DynamicArray.fromBytes(this.uint8ArrayValue, JSON.stringify(this.typeInfo)) as DynamicArray<TItem>
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

  concat(other: Parameters<InstanceType<typeof _DynamicArray>['concat']>[0]): DynamicArray<TItem> {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as TItem)
      next = otherEntries.next()
    }
    return new DynamicArray<TItem>(this.typeInfo, ...items)
  }

  static fromBytes(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): DynamicArray<_ARC4Encoded> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new DynamicArray(typeInfo)
    result._uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }

  private encodeWithLength(items: TItem[]) {
    return concatUint8Arrays(encodeLength(items.length).asUint8Array(), encode(items, true))
  }
}

/** @internal */
export class Tuple<TTuple extends [_ARC4Encoded, ..._ARC4Encoded[]]> extends _Tuple<TTuple> implements _ARC4Encodedint8Array {
  private _value?: TTuple
  private _uint8ArrayValue?: Uint8Array
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
        this._value = items
      } else {
        this._uint8ArrayValue = new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo))
      }
    }
  }

  get uint8ArrayValue(): Uint8Array {
    return this._uint8ArrayValue ?? encode(this.items)
  }

  get bytes(): bytes {
    return Bytes(this._uint8ArrayValue ?? encode(this.items))
  }

  equals(other: this): boolean {
    if (!(other instanceof Tuple) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
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
    if (this._uint8ArrayValue) {
      this._value = decode(this._uint8ArrayValue, this.genericArgs) as TTuple
      this._uint8ArrayValue = undefined
      return this._value
    } else if (this._value) {
      this._uint8ArrayValue = undefined
      return this._value
    }
    throw new CodeError('value is not set')
  }

  static fromBytes(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): Tuple<[_ARC4Encoded, ..._ARC4Encoded[]]> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    // pass the symbol to the constructor to let it know we are initialising from bytes
    const result = new Tuple(typeInfo, IS_INITIALISING_FROM_BYTES_SYMBOL as DeliberateAny)
    result._uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }
}

/** @internal */
export class Struct<T extends StructConstraint> extends (_Struct<StructConstraint> as DeliberateAny) implements _ARC4Encodedint8Array {
  private _uint8ArrayValue?: Uint8Array
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
        if (originalValue === undefined && target._uint8ArrayValue?.length && Object.keys(target.genericArgs).includes(prop.toString())) {
          return target.items[prop.toString()]
        }
        return originalValue
      },
      set(target, prop, value) {
        if (target._uint8ArrayValue && Object.keys(target.genericArgs).includes(prop.toString())) {
          target.decodeAsProperties()
        }
        return Reflect.set(target, prop, value)
      },
    })
  }

  get uint8ArrayValue(): Uint8Array {
    return this._uint8ArrayValue ?? encode(Object.values(this.items))
  }

  get bytes(): bytes {
    return Bytes(this._uint8ArrayValue ?? encode(Object.values(this.items)))
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

  copy(): Struct<T> {
    return Struct.fromBytes(this.uint8ArrayValue, JSON.stringify(this.typeInfo)) as Struct<T>
  }

  private decodeAsProperties() {
    if (this._uint8ArrayValue) {
      const values = decode(this._uint8ArrayValue, Object.values(this.genericArgs))
      Object.keys(this.genericArgs).forEach((key, index) => {
        ;(this as unknown as StructConstraint)[key] = values[index]
      })
      this._uint8ArrayValue = undefined
    }
  }

  static fromBytes(
    value: StubBytesCompat | Uint8Array,
    typeInfo: string | TypeInfo,
    prefix: 'none' | 'log' = 'none',
  ): Struct<StructConstraint> {
    let bytesValue = asBytesCls(value)
    if (prefix === 'log') {
      assert(bytesValue.slice(0, 4).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
      bytesValue = bytesValue.slice(4)
    }
    const result = new Struct(typeInfo)
    result._uint8ArrayValue = asUint8Array(bytesValue)
    return result
  }
}

/** @internal */
export class DynamicBytes extends _DynamicBytes implements _ARC4Encodedint8Array {
  typeInfo: TypeInfo
  private _value: DynamicArray<Byte>

  constructor(typeInfo: TypeInfo | string, value?: bytes | string) {
    super(value)
    const uint8ArrayValue = concatUint8Arrays(encodeLength(value?.length ?? 0).asUint8Array(), asUint8Array(value ?? new Uint8Array()))
    this._value = DynamicArray.fromBytes(uint8ArrayValue, typeInfo) as DynamicArray<Byte>
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    return new Proxy(this, arrayProxyHandler<Byte>()) as DynamicBytes
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value.uint8ArrayValue
  }

  get bytes(): bytes {
    return this._value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof DynamicBytes) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this._value.length
  }

  get native(): bytes {
    return this._value.bytes.slice(ABI_LENGTH_SIZE)
  }

  get items(): Byte[] {
    return this._value.items
  }

  setItem(_index: number, _value: Byte): void {
    throw new CodeError('DynamicBytes is immutable')
  }

  concat(other: Parameters<InstanceType<typeof _DynamicBytes>['concat']>[0]): DynamicBytes {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as Byte)
      next = otherEntries.next()
    }
    const concatenatedBytes = items
      .map((item) => item.uint8ArrayValue)
      .reduce((acc, curr) => concatUint8Arrays(acc, curr), new Uint8Array())
    return new DynamicBytes(this.typeInfo, asBytes(concatenatedBytes))
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): DynamicBytes {
    const dynamicArrayValue = DynamicArray.fromBytes(value, typeInfo, prefix) as DynamicArray<Byte>
    const result = new DynamicBytes(typeInfo)
    result._value = dynamicArrayValue
    return result
  }
}

/** @internal */
export class StaticBytes<TLength extends uint64 = 0> extends _StaticBytes<TLength> implements _ARC4Encodedint8Array {
  private _value: StaticArray<Byte, TLength>
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, value?: bytes<TLength>) {
    super(value ?? (Bytes() as bytes<TLength>))
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    const uint8ArrayValue = asUint8Array(value ?? new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo)))
    this._value = StaticArray.fromBytes(uint8ArrayValue, typeInfo) as unknown as StaticArray<Byte, TLength>
    return new Proxy(this, arrayProxyHandler<Byte>()) as StaticBytes<TLength>
  }

  get uint8ArrayValue(): Uint8Array {
    return this._value.uint8ArrayValue
  }

  get bytes(): bytes {
    return this._value.bytes
  }

  equals(other: this): boolean {
    if (!(other instanceof StaticBytes) || JSON.stringify(this.typeInfo) !== JSON.stringify(other.typeInfo)) {
      throw new CodeError(`Expected expression of type ${this.typeInfo.name}, got ${other.typeInfo.name}`)
    }
    return this.bytes.equals(other.bytes)
  }

  get length(): uint64 {
    return this._value.length
  }

  get native(): bytes<TLength> {
    return this._value.bytes as bytes<TLength>
  }

  get items(): Byte[] {
    return this._value.items
  }

  setItem(_index: number, _value: Byte): void {
    throw new CodeError('StaticBytes is immutable')
  }

  concat(other: Parameters<InstanceType<typeof _StaticBytes>['concat']>[0]): DynamicBytes {
    const items = this.items
    const otherEntries = other.entries()
    let next = otherEntries.next()
    while (!next.done) {
      items.push(next.value[1] as Byte)
      next = otherEntries.next()
    }
    const concatenatedBytes = items
      .map((item) => item.uint8ArrayValue)
      .reduce((acc, curr) => concatUint8Arrays(acc, curr), new Uint8Array())
    return new DynamicBytes(this.typeInfo, asBytes(concatenatedBytes))
  }

  static fromBytes(value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none'): StaticBytes {
    const staticArrayValue = StaticArray.fromBytes(value, typeInfo, prefix) as StaticArray<Byte, number>
    const result = new StaticBytes(typeInfo)
    result._value = staticArrayValue as StaticArray<Byte, 0>
    return result
  }
}

/** @internal */
export class ReferenceArray<TItem> extends _ReferenceArray<TItem> {
  private _values: TItem[]
  typeInfo: TypeInfo

  constructor(typeInfo: TypeInfo | string, ...items: TItem[]) {
    super(...items)
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this._values = items

    return new Proxy(this, arrayProxyHandler<TItem>()) as ReferenceArray<TItem>
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

  slice(start?: Uint64Compat, end?: Uint64Compat): _ReferenceArray<TItem> {
    const startIndex = end === undefined ? 0 : asNumber(start ?? 0)
    const endIndex = end === undefined ? asNumber(start ?? this._values.length) : asNumber(end)
    return new ReferenceArray<TItem>(this.typeInfo, ...this._values.slice(startIndex, endIndex))
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

  copy(): _ReferenceArray<TItem> {
    const bytesValue = toBytes(this)
    return getEncoder<_ReferenceArray<TItem>>(this.typeInfo)(bytesValue, this.typeInfo)
  }
}

/** @internal */
export class FixedArray<TItem, TLength extends number> extends _FixedArray<TItem, TLength> {
  private _values: NTuple<TItem, TLength>
  private size: number
  typeInfo: TypeInfo
  private genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    super()
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as StaticArrayGenericArgs
    this.size = parseInt(this.genericArgs.size.name, 10)
    if (items.length) {
      this._values = items as NTuple<TItem, TLength>
    } else {
      const bytesValue = asBytes(new Uint8Array(getMaxLengthOfStaticContentType(this.typeInfo)))
      this._values = (getEncoder<_FixedArray<TItem, TLength>>(this.typeInfo)(bytesValue, this.typeInfo) as FixedArray<TItem, TLength>).items
    }
    return new Proxy(this, arrayProxyHandler<TItem>()) as FixedArray<TItem, TLength>
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

  copy(): _FixedArray<TItem, TLength> {
    const bytesValue = toBytes(this)
    return getEncoder<_FixedArray<TItem, TLength>>(this.typeInfo)(bytesValue, this.typeInfo)
  }
}

const decode = (value: Uint8Array, childTypes: TypeInfo[], isHomogenous?: boolean) => {
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
      const before = findBoolTypes(childTypes, i, -1, isHomogenous)
      let after = findBoolTypes(childTypes, i, 1, isHomogenous)

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

  const values: _ARC4Encoded[] = []
  childTypes.forEach((childType, index) => {
    values.push(
      getEncoder<_ARC4Encoded>(childType)(
        ['bytes', 'string'].includes(childType.name) ? valuePartitions[index].slice(2) : valuePartitions[index],
        childType,
      ),
    )
  })
  return values
}

const encode = (values: (_ARC4Encoded & { uint8ArrayValue?: Uint8Array })[], isHomogenous?: boolean) => {
  const length = values.length
  const heads = []
  const tails = []
  const dynamicLengthTypeIndex = []
  let i = 0
  const valuesLengthBytes = values instanceof _DynamicArray ? encodeLength(length).asUint8Array() : new Uint8Array()
  while (i < length) {
    const value = values[i]
    assert(value instanceof _ARC4Encoded, `expected ARC4 type ${value.constructor.name}`)
    dynamicLengthTypeIndex.push(isDynamicLengthType(value))
    if (dynamicLengthTypeIndex.at(-1)) {
      heads.push(asUint8Array(Bytes.fromHex('0000')))
      tails.push((value as _ARC4Encodedint8Array).uint8ArrayValue ?? asUint8Array(value.bytes))
    } else {
      if (value instanceof _Bool) {
        const before = findBool(values, i, -1, isHomogenous)
        let after = findBool(values, i, 1, isHomogenous)
        if (before % 8 != 0) {
          throw new CodeError('"expected before index should have number of bool mod 8 equal 0"')
        }
        after = Math.min(7, after)
        const consecutiveBools = values.slice(i, i + after + 1) as _Bool[]
        const compressedNumber = compressMultipleBool(consecutiveBools)
        heads.push(new Uint8Array([compressedNumber]))
        i += after
      } else {
        heads.push((value as _ARC4Encodedint8Array).uint8ArrayValue ?? asUint8Array(value.bytes))
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

  return concatUint8Arrays(valuesLengthBytes, ...heads, ...tails)
}

const isDynamicLengthType = (value: _ARC4Encoded) => {
  return (
    value instanceof Str ||
    (value instanceof StaticArray && holdsDynamicLengthContent(value.typeInfo)) ||
    (value instanceof Tuple && value.genericArgs.some(holdsDynamicLengthContent)) ||
    (value instanceof Struct && Object.values(value.genericArgs).some(holdsDynamicLengthContent)) ||
    value instanceof DynamicArray ||
    value instanceof DynamicBytes
  )
}

/** @internal */
export function encodeArc4<T>(sourceTypeInfoString: string | undefined, source: T): bytes {
  const arc4Encoded = getArc4Encoded(source, sourceTypeInfoString)
  return arc4Encoded.bytes
}

/** @internal */
export function decodeArc4<T>(
  sourceTypeInfoString: string,
  targetTypeInfoString: string,
  bytes: StubBytesCompat,
  prefix: 'none' | 'log' = 'none',
): T {
  const sourceTypeInfo = JSON.parse(sourceTypeInfoString)
  const targetTypeInfo = JSON.parse(targetTypeInfoString)
  const encoder = getEncoder(sourceTypeInfo)
  const source = encoder(bytes, sourceTypeInfo, prefix) as { typeInfo: TypeInfo }
  return getNativeValue(source, targetTypeInfo) as T
}

/** @internal */
export function interpretAsArc4<T extends _ARC4Encoded>(
  typeInfoString: string,
  bytes: StubBytesCompat,
  prefix: 'none' | 'log' = 'none',
): T {
  const typeInfo = JSON.parse(typeInfoString)
  return getEncoder<T>(typeInfo)(bytes, typeInfo, prefix)
}

/** @internal */
export const getArc4Encoded = (value: DeliberateAny, sourceTypeInfoString?: string): _ARC4Encoded => {
  if (value instanceof _ARC4Encoded) {
    return value
  }
  if (value instanceof AccountCls) {
    return getArc4Encoded(value.bytes)
  }
  if (value instanceof AssetCls) {
    return getArc4Encoded(value.id)
  }
  if (value instanceof ApplicationCls) {
    return getArc4Encoded(value.id)
  }
  if (typeof value === 'boolean') {
    return new Bool({ name: 'Bool' }, value)
  }
  if (value instanceof Uint64Cls || typeof value === 'number') {
    return new Uint({ name: 'Uint<64>', genericArgs: [{ name: '64' }] }, asBigInt(value))
  }
  if (value instanceof BigUintCls) {
    return new Uint({ name: 'Uint<512>', genericArgs: [{ name: '512' }] }, value.asBigInt())
  }
  if (typeof value === 'bigint') {
    return new Uint({ name: 'Uint<512>', genericArgs: [{ name: '512' }] }, value)
  }
  if (value instanceof BytesCls) {
    if (value.fixedLength !== undefined) {
      return new StaticBytes(
        {
          name: 'StaticBytes',
          genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] }, size: { name: value.fixedLength.toString() } },
        },
        value.asAlgoTs(),
      )
    }
    return new DynamicBytes(
      { name: 'DynamicBytes', genericArgs: { elementType: { name: 'Byte', genericArgs: [{ name: '8' }] } } },
      value.asAlgoTs(),
    )
  }
  if (typeof value === 'string') {
    return new Str({ name: 'Str' }, value)
  }
  if (Array.isArray(value) || value instanceof ReferenceArray || value instanceof FixedArray) {
    const sourceTypeInfo = sourceTypeInfoString ? JSON.parse(sourceTypeInfoString) : undefined
    const sourceGenericArgs = ((value as DeliberateAny).typeInfo || sourceTypeInfo || {})?.genericArgs
    const result: _ARC4Encoded[] = (value instanceof ReferenceArray || value instanceof FixedArray ? value.items : value).reduce(
      (acc: _ARC4Encoded[], cur: DeliberateAny, currentIndex: number) => {
        const elementTypeInfo = sourceGenericArgs?.elementType || sourceGenericArgs?.[currentIndex]
        const elementTypeInfoString = elementTypeInfo ? JSON.stringify(elementTypeInfo) : undefined
        return acc.concat(getArc4Encoded(cur, elementTypeInfoString))
      },
      [],
    )

    const genericArgs: TypeInfo[] = result.map((x) => (x as DeliberateAny).typeInfo)
    if (value instanceof FixedArray) {
      const typeInfo = {
        name: `StaticArray<${genericArgs[0].name},${genericArgs.length}>`,
        genericArgs: { elementType: genericArgs[0], size: { name: genericArgs.length.toString() } },
      }
      return new StaticArray(typeInfo, ...(result as [_ARC4Encoded, ..._ARC4Encoded[]]))
    } else if (
      sourceTypeInfo?.name?.startsWith('Array') ||
      sourceTypeInfo?.name?.startsWith('ReadonlyArray') ||
      value instanceof ReferenceArray
    ) {
      const elementType = genericArgs[0] ?? sourceTypeInfo.genericArgs?.elementType
      const typeInfo = { name: `DynamicArray<${elementType.name}>`, genericArgs: { elementType } }
      return new DynamicArray(typeInfo, ...(result as [_ARC4Encoded, ..._ARC4Encoded[]]))
    } else {
      const typeInfo = { name: `Tuple<[${genericArgs.map((x) => x.name).join(',')}]>`, genericArgs }
      return new Tuple(typeInfo, ...(result as [_ARC4Encoded, ..._ARC4Encoded[]]))
    }
  }
  if (typeof value === 'object') {
    const sourceTypeInfo = sourceTypeInfoString ? JSON.parse(sourceTypeInfoString) : undefined
    const propTypeInfos = (value.typeInfo || sourceTypeInfo || {}).genericArgs
    const result = Object.entries(value).reduce((acc: _ARC4Encoded[], [key, cur]: DeliberateAny) => {
      const propTypeInfoString = propTypeInfos?.[key] ? JSON.stringify(propTypeInfos[key]) : undefined
      return acc.concat(getArc4Encoded(cur, propTypeInfoString))
    }, [])
    const genericArgs: TypeInfo[] = result.map((x) => (x as DeliberateAny).typeInfo)
    const typeInfo = {
      name: `Struct<${value.constructor.name}>`,
      genericArgs: Object.fromEntries(Object.keys(value).map((x, i) => [x, genericArgs[i]])),
    }
    return new Struct(typeInfo, Object.fromEntries(Object.keys(value).map((x, i) => [x, result[i]])))
  }

  throw new CodeError(`Unsupported type for encoding: ${typeof value}`)
}

/** @internal */
export const toBytes = (val: unknown, sourceTypeInfoString?: string): bytes => {
  return asBytes(toUint8Array(val, sourceTypeInfoString))
}

/** @internal */
export const toUint8Array = (val: unknown, sourceTypeInfoString?: string): Uint8Array => {
  const uint64Val = asMaybeUint64Cls(val, false)
  if (uint64Val !== undefined) {
    return uint64Val.toBytes().asUint8Array()
  }
  const bytesVal = asMaybeBytesCls(val)
  if (bytesVal !== undefined) {
    return bytesVal.asUint8Array()
  }
  const bigUintVal = asMaybeBigUintCls(val)
  if (bigUintVal !== undefined) {
    return bigUintVal.toBytes().asUint8Array()
  }
  if (val instanceof BytesBackedCls) {
    return asUint8Array(val.bytes)
  }
  if (val instanceof Uint64BackedCls) {
    return asUint64Cls(val.uint64).toBytes().asUint8Array()
  }
  if (Array.isArray(val) || typeof val === 'object') {
    const arc4Encoded = getArc4Encoded(val, sourceTypeInfoString)
    return (arc4Encoded as _ARC4Encodedint8Array).uint8ArrayValue ?? asUint8Array(arc4Encoded.bytes)
  }
  throw new InternalError(`Invalid type for bytes: ${nameOfType(val)}`)
}

/** @internal */
export const getEncoder = <T>(typeInfo: TypeInfo): fromBytes<T> => {
  const mutableTupleFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const tuple = Tuple.fromBytes(value, typeInfo, prefix)
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
    const struct = Struct.fromBytes(value, typeInfo, prefix)
    return asNumber(struct.bytes.length) ? struct.native : ({} as unknown as typeof struct.native)
  }
  const readonlyObjectFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const result = mutableObjectFromBytes(value, typeInfo, prefix)
    return result as Readonly<typeof result>
  }
  const arrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const dynamicArray = DynamicArray.fromBytes(value, typeInfo, prefix)
    return asNumber(dynamicArray.bytes.length) ? dynamicArray.native : ([] as unknown as typeof dynamicArray.native)
  }
  const readonlyArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const result = arrayFromBytes(value, typeInfo, prefix)
    return result as Readonly<typeof result>
  }
  const referenceArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const dynamicArray = DynamicArray.fromBytes(value, typeInfo, prefix)
    return new ReferenceArray(
      typeInfo,
      ...(asNumber(dynamicArray.bytes.length) ? dynamicArray.native : ([] as unknown as typeof dynamicArray.native)),
    )
  }
  const fixedArrayFromBytes = (value: StubBytesCompat | Uint8Array, typeInfo: string | TypeInfo, prefix: 'none' | 'log' = 'none') => {
    const staticArray = StaticArray.fromBytes(value, typeInfo, prefix)
    return new FixedArray(
      typeInfo,
      ...(asNumber(staticArray.uint8ArrayValue.length) ? staticArray.native : ([] as unknown as typeof staticArray.native)),
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
    Address: Address.fromBytes,
    Bool: Bool.fromBytes,
    Byte: Byte.fromBytes,
    Str: Str.fromBytes,
    'Uint<.*>': Uint.fromBytes,
    'UFixed<.*>': UFixed.fromBytes,
    'StaticArray<.*>': StaticArray.fromBytes,
    'DynamicArray<.*>': DynamicArray.fromBytes,
    'Tuple(<.*>)?': Tuple.fromBytes,
    'ReadonlyTuple(<.*>)?': readonlyMutableTupleFromBytes,
    'MutableTuple(<.*>)?': mutableTupleFromBytes,
    'Struct(<.*>)?': Struct.fromBytes,
    DynamicBytes: DynamicBytes.fromBytes,
    'StaticBytes<.*>': StaticBytes.fromBytes,
    object: Struct.fromBytes,
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
