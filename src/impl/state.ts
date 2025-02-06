import type {
  Account,
  Application,
  BoxMap as BoxMapType,
  BoxRef as BoxRefType,
  Box as BoxType,
  bytes,
  GlobalStateOptions,
  GlobalState as GlobalStateType,
  LocalStateForAccount,
  LocalState as LocalStateType,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { AccountMap } from '../collections/custom-key-map'
import { MAX_BOX_SIZE } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import type { TypeInfo } from '../encoders'
import { getEncoder, toBytes } from '../encoders'
import { AssertError, InternalError } from '../errors'
import { getGenericTypeInfo } from '../runtime-helpers'
import { asBytes, asBytesCls, asNumber, asUint8Array, conactUint8Arrays } from '../util'
import type { StubBytesCompat, StubUint64Compat } from './primitives'
import { Bytes, Uint64, Uint64Cls } from './primitives'

export class GlobalStateCls<ValueType> {
  private readonly _type: string = GlobalStateCls.name

  #value: ValueType | undefined
  key: bytes | undefined

  get hasKey(): boolean {
    return this.key !== undefined && this.key.length > 0
  }

  delete: () => void = () => {
    if (this.#value instanceof Uint64Cls) {
      this.#value = Uint64(0) as ValueType
    } else {
      this.#value = undefined
    }
  }

  static [Symbol.hasInstance](x: unknown): x is GlobalStateCls<unknown> {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === GlobalStateCls.name
  }

  get value(): ValueType {
    if (this.#value === undefined) {
      throw new AssertError('value is not set')
    }
    return this.#value
  }

  set value(v: ValueType) {
    this.#value = v
  }

  get hasValue(): boolean {
    return this.#value !== undefined
  }

  constructor(key?: bytes | string, value?: ValueType) {
    this.key = key !== undefined ? asBytes(key) : undefined
    this.#value = value
  }
}

export class LocalStateCls<ValueType> {
  #value: ValueType | undefined
  delete: () => void = () => {
    if (this.#value instanceof Uint64Cls) {
      this.#value = Uint64(0) as ValueType
    } else {
      this.#value = undefined
    }
  }
  get value(): ValueType {
    if (this.#value === undefined) {
      throw new AssertError('value is not set')
    }
    return this.#value
  }

  set value(v: ValueType) {
    this.#value = v
  }

  get hasValue(): boolean {
    return this.#value !== undefined
  }
}

export class LocalStateMapCls<ValueType> {
  #value = new AccountMap<LocalStateCls<ValueType>>()

  getValue(account: Account): LocalStateCls<ValueType> {
    if (!this.#value.has(account)) {
      this.#value.set(account, new LocalStateCls<ValueType>())
    }
    return this.#value.getOrFail(account)!
  }
}

export function GlobalState<ValueType>(options?: GlobalStateOptions<ValueType>): GlobalStateType<ValueType> {
  return new GlobalStateCls(options?.key, options?.initialValue)
}

export function LocalState<ValueType>(options?: { key?: bytes | string }): LocalStateType<ValueType> {
  function localStateInternal(account: Account): LocalStateForAccount<ValueType> {
    return localStateInternal.map.getValue(account)
  }
  localStateInternal.key = options?.key
  localStateInternal.hasKey = options?.key !== undefined && options.key.length > 0
  localStateInternal.map = new LocalStateMapCls<ValueType>()
  return localStateInternal
}

export class BoxCls<TValue> {
  #key: bytes | undefined
  #app: Application

  private readonly _type: string = BoxCls.name

  static [Symbol.hasInstance](x: unknown): x is BoxCls<unknown> {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === BoxCls.name
  }

  constructor(key?: StubBytesCompat) {
    this.#key = key ? asBytes(key) : undefined
    this.#app = lazyContext.activeApplication
  }

  private get fromBytes() {
    const typeInfo = getGenericTypeInfo(this)
    const valueType = (typeInfo!.genericArgs! as TypeInfo[])[0]
    return (val: Uint8Array) => getEncoder<TValue>(valueType)(val, valueType)
  }

  get value(): TValue {
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }

    return this.fromBytes(lazyContext.ledger.getBox(this.#app, this.key))
  }
  set value(v: TValue) {
    lazyContext.ledger.setBox(this.#app, this.key, asUint8Array(toBytes(v)))
  }

  get hasKey(): boolean {
    return this.#key !== undefined && this.#key.length > 0
  }

  get key(): bytes {
    if (this.#key === undefined || this.#key.length === 0) {
      throw new InternalError('Box key is empty')
    }
    return this.#key
  }

  set key(key: StubBytesCompat) {
    this.#key = asBytes(key)
  }

  get exists(): boolean {
    return lazyContext.ledger.boxExists(this.#app, this.key)
  }

  get length(): uint64 {
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    return toBytes(this.value).length
  }

  get(options: { default: TValue }): TValue {
    const [value, exists] = this.maybe()
    return exists ? value : options.default
  }

  delete(): boolean {
    return lazyContext.ledger.deleteBox(this.#app, this.key)
  }

  maybe(): readonly [TValue, boolean] {
    const value = this.fromBytes(lazyContext.ledger.getBox(this.#app, this.key))
    return [value, lazyContext.ledger.boxExists(this.#app, this.key)]
  }
}

export class BoxMapCls<TKey, TValue> {
  #keyPrefix: bytes | undefined
  #app: Application

  private readonly _type: string = BoxMapCls.name

  static [Symbol.hasInstance](x: unknown): x is BoxMapCls<unknown, unknown> {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === BoxMapCls.name
  }

  private get fromBytes() {
    const typeInfo = getGenericTypeInfo(this)
    const valueType = (typeInfo!.genericArgs! as TypeInfo[])[1]
    return (val: Uint8Array) => getEncoder<TValue>(valueType)(val, valueType)
  }

  constructor(keyPrefix?: StubBytesCompat) {
    this.#keyPrefix = keyPrefix ? asBytes(keyPrefix) : undefined
    this.#app = lazyContext.activeApplication
  }

  get hasKeyPrefix(): boolean {
    return this.#keyPrefix !== undefined && this.#keyPrefix.length > 0
  }

  get keyPrefix(): bytes {
    if (this.#keyPrefix === undefined || this.#keyPrefix.length === 0) {
      throw new InternalError('Box key prefix is empty')
    }
    return this.#keyPrefix
  }

  set keyPrefix(keyPrefix: StubBytesCompat) {
    this.#keyPrefix = asBytes(keyPrefix)
  }

  get(key: TKey, options?: { default: TValue }): TValue {
    const [value, exists] = this.maybe(key)
    if (!exists && options === undefined) {
      throw new InternalError('Box has not been created')
    }
    return exists ? value : options!.default
  }

  set(key: TKey, value: TValue): void {
    lazyContext.ledger.setBox(this.#app, this.getFullKey(key), toBytes(value))
  }

  delete(key: TKey): boolean {
    return lazyContext.ledger.deleteBox(this.#app, this.getFullKey(key))
  }

  has(key: TKey): boolean {
    return lazyContext.ledger.boxExists(this.#app, this.getFullKey(key))
  }

  maybe(key: TKey): readonly [TValue, boolean] {
    const fullKey = this.getFullKey(key)
    const value = this.fromBytes(lazyContext.ledger.getBox(this.#app, fullKey))
    return [value, lazyContext.ledger.boxExists(this.#app, fullKey)]
  }

  length(key: TKey): uint64 {
    return toBytes(this.get(key)).length
  }

  private getFullKey(key: TKey): bytes {
    return this.keyPrefix.concat(toBytes(key))
  }
}

export class BoxRefCls {
  #key: bytes | undefined
  #app: Application

  private readonly _type: string = BoxRefCls.name

  static [Symbol.hasInstance](x: unknown): x is BoxRefCls {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === BoxRefCls.name
  }

  constructor(key?: StubBytesCompat) {
    this.#key = key ? asBytes(key) : undefined
    this.#app = lazyContext.activeApplication
  }

  get hasKey(): boolean {
    return this.#key !== undefined && this.#key.length > 0
  }

  get key(): bytes {
    if (this.#key === undefined || this.#key.length === 0) {
      throw new InternalError('Box key is empty')
    }
    return this.#key
  }

  set key(key: StubBytesCompat) {
    this.#key = asBytes(key)
  }

  get value(): bytes {
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    return toBytes(this.backingValue)
  }

  set value(v: StubBytesCompat) {
    const bytesValue = asBytesCls(v)
    const content = this.backingValue
    if (this.exists && content.length !== bytesValue.length.asNumber()) {
      throw new InternalError('Box already exists with a different size')
    }
    this.backingValue = bytesValue.asUint8Array()
  }

  get exists(): boolean {
    return lazyContext.ledger.boxExists(this.#app, this.key)
  }

  create(options: { size: StubUint64Compat }): boolean {
    const size = asNumber(options.size)
    if (size > MAX_BOX_SIZE) {
      throw new InternalError(`Box size cannot exceed ${MAX_BOX_SIZE}`)
    }
    const content = this.backingValue
    if (this.exists && content.length !== size) {
      throw new InternalError('Box already exists with a different size')
    }
    if (this.exists) {
      return false
    }
    this.backingValue = new Uint8Array(size)
    return true
  }

  get(options: { default: StubBytesCompat }): bytes {
    const [value, exists] = this.maybe()
    return exists ? value : asBytes(options.default)
  }

  put(value: StubBytesCompat): void {
    this.value = value
  }

  splice(start: StubUint64Compat, length: StubUint64Compat, value: StubBytesCompat): void {
    const content = this.backingValue
    const startNumber = asNumber(start)
    const lengthNumber = asNumber(length)
    const valueBytes = asBytesCls(value)
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    if (startNumber > content.length) {
      throw new InternalError('Start index exceeds box size')
    }
    const end = Math.min(startNumber + lengthNumber, content.length)
    let updatedContent = conactUint8Arrays(content.slice(0, startNumber), valueBytes.asUint8Array(), content.slice(end))

    if (updatedContent.length > content.length) {
      updatedContent = updatedContent.slice(0, content.length)
    } else if (updatedContent.length < content.length) {
      updatedContent = conactUint8Arrays(updatedContent, new Uint8Array(content.length - updatedContent.length))
    }
    this.backingValue = updatedContent
  }

  replace(start: StubUint64Compat, value: StubBytesCompat): void {
    const content = this.backingValue
    const startNumber = asNumber(start)
    const valueBytes = asBytesCls(value)
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    if (startNumber + asNumber(valueBytes.length) > content.length) {
      throw new InternalError('Replacement content exceeds box size')
    }
    const updatedContent = conactUint8Arrays(
      content.slice(0, startNumber),
      valueBytes.asUint8Array(),
      content.slice(startNumber + valueBytes.length.asNumber()),
    )
    this.backingValue = updatedContent
  }

  extract(start: StubUint64Compat, length: StubUint64Compat): bytes {
    const content = this.backingValue
    const startNumber = asNumber(start)
    const lengthNumber = asNumber(length)
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    if (startNumber + lengthNumber > content.length) {
      throw new InternalError('Index out of bounds')
    }
    return toBytes(content.slice(startNumber, startNumber + lengthNumber))
  }
  delete(): boolean {
    return lazyContext.ledger.deleteBox(this.#app, this.key)
  }

  resize(newSize: uint64): void {
    const newSizeNumber = asNumber(newSize)
    if (newSizeNumber > MAX_BOX_SIZE) {
      throw new InternalError(`Box size cannot exceed ${MAX_BOX_SIZE}`)
    }
    const content = this.backingValue
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    let updatedContent
    if (newSizeNumber > content.length) {
      updatedContent = conactUint8Arrays(content, new Uint8Array(newSizeNumber - content.length))
    } else {
      updatedContent = content.slice(0, newSize)
    }
    this.backingValue = updatedContent
  }

  maybe(): readonly [bytes, boolean] {
    return [Bytes(lazyContext.ledger.getBox(this.#app, this.key)), lazyContext.ledger.boxExists(this.#app, this.key)]
  }

  get length(): uint64 {
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    return this.backingValue.length
  }

  private get backingValue(): Uint8Array {
    return lazyContext.ledger.getBox(this.#app, this.key)
  }

  private set backingValue(value: Uint8Array) {
    lazyContext.ledger.setBox(this.#app, this.key, value)
  }
}

export function Box<TValue>(options?: { key: bytes | string }): BoxType<TValue> {
  return new BoxCls<TValue>(options?.key)
}

export function BoxMap<TKey, TValue>(options?: { keyPrefix: bytes | string }): BoxMapType<TKey, TValue> {
  return new BoxMapCls<TKey, TValue>(options?.keyPrefix)
}

export function BoxRef(options?: { key: bytes | string }): BoxRefType {
  return new BoxRefCls(options?.key)
}
