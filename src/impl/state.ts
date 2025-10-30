import type {
  Account,
  Application,
  BoxMap as BoxMapType,
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
import { AssertError, CodeError, InternalError } from '../errors'
import type { TypeInfo } from '../impl/encoded-types'
import { toBytes } from '../impl/encoded-types'
import { getGenericTypeInfo } from '../runtime-helpers'
import { asBytes, asBytesCls, asNumber, asUint8Array, concatUint8Arrays } from '../util'
import { getEncoder, minLengthForType } from './encoded-types'
import type { StubBytesCompat, StubUint64Compat } from './primitives'
import { Bytes, Uint64, Uint64Cls } from './primitives'

export class GlobalStateCls<ValueType> {
  /** @internal */
  private readonly _type: string = GlobalStateCls.name

  /** @internal */
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

  /** @internal */
  constructor(key?: bytes | string, value?: ValueType) {
    this.key = key !== undefined ? asBytes(key) : undefined
    this.#value = value
  }
}

export class LocalStateCls<ValueType> {
  /** @internal */
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
  /** @internal */
  private applicationId: uint64

  /** @internal */
  constructor() {
    this.applicationId = lazyContext.activeGroup.activeApplicationId
  }

  getValue(key: string | bytes | undefined, account: Account): LocalStateCls<ValueType> {
    const bytesKey = key === undefined ? Bytes() : asBytes(key)
    const localStateMap = this.ensureApplicationLocalStateMap(bytesKey)
    if (!localStateMap.has(account)) {
      localStateMap.set(account, new LocalStateCls())
    }
    return localStateMap.getOrFail(account) as LocalStateCls<ValueType>
  }

  /** @internal */
  private ensureApplicationLocalStateMap(key: bytes | string) {
    const applicationData = lazyContext.ledger.applicationDataMap.getOrFail(this.applicationId)!.application
    if (!applicationData.localStateMaps.has(key)) {
      applicationData.localStateMaps.set(key, new AccountMap<LocalStateCls<ValueType>>())
    }
    return applicationData.localStateMaps.getOrFail(key)
  }
}

/** @internal */
export function GlobalState<ValueType>(options?: GlobalStateOptions<ValueType>): GlobalStateType<ValueType> {
  return new GlobalStateCls(options?.key, options?.initialValue)
}

/** @internal */
export function LocalState<ValueType>(options?: { key?: bytes | string }): LocalStateType<ValueType> {
  function localStateInternal(account: Account): LocalStateForAccount<ValueType> {
    return localStateInternal.map.getValue(localStateInternal.key, account)
  }
  localStateInternal.key = options?.key
  localStateInternal.hasKey = options?.key !== undefined && options.key.length > 0
  localStateInternal.map = new LocalStateMapCls<ValueType>()
  return localStateInternal
}

/** @internal */
export class BoxCls<TValue> {
  #key: bytes | undefined
  #app: Application
  #valueType?: TypeInfo

  private readonly _type: string = BoxCls.name
  private get valueType(): TypeInfo {
    if (this.#valueType === undefined) {
      const typeInfo = getGenericTypeInfo(this)
      if (typeInfo === undefined || typeInfo.genericArgs === undefined || typeInfo.genericArgs.length !== 1) {
        throw new InternalError('Box value type is not set')
      }
      this.#valueType = (typeInfo.genericArgs as TypeInfo[])[0]
    }
    return this.#valueType
  }

  static [Symbol.hasInstance](x: unknown): x is BoxCls<unknown> {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === BoxCls.name
  }

  constructor(key?: StubBytesCompat, app?: Application, valueType?: TypeInfo) {
    this.#key = key ? asBytes(key) : undefined
    this.#app = app ?? lazyContext.activeApplication
    this.#valueType = valueType
  }

  private get fromBytes() {
    return (val: Uint8Array) => getEncoder<TValue>(this.valueType)(val, this.valueType)
  }

  create(options?: { size?: StubUint64Compat }): boolean {
    const optionSize = options?.size !== undefined ? asNumber(options.size) : undefined
    const valueTypeSize = minLengthForType(this.valueType)
    if (valueTypeSize === undefined && optionSize === undefined) {
      throw new InternalError(`${this.valueType.name} does not have a fixed byte size. Please specify a size argument`)
    }
    if (valueTypeSize !== undefined && optionSize !== undefined) {
      if (optionSize < valueTypeSize) {
        throw new InternalError(`Box size cannot be less than ${valueTypeSize}`)
      }
      if (optionSize > valueTypeSize) {
        process.emitWarning(
          `Box size is set to ${optionSize} but the value type ${this.valueType.name} has a fixed size of ${valueTypeSize}`,
        )
      }
    }
    const size = asNumber(options?.size ?? 0)
    if (size > MAX_BOX_SIZE) {
      throw new InternalError(`Box size cannot exceed ${MAX_BOX_SIZE}`)
    }
    lazyContext.ledger.setBox(this.#app, this.key, new Uint8Array(Math.max(size, valueTypeSize ?? 0)))
    return true
  }

  get value(): TValue {
    if (!this.exists) {
      throw new InternalError('Box has not been created')
    }
    let materialised = lazyContext.ledger.getMaterialisedBox<TValue>(this.#app, this.key)
    if (materialised !== undefined) {
      return materialised
    }
    const original = lazyContext.ledger.getBox(this.#app, this.key)
    materialised = this.fromBytes(original)
    lazyContext.ledger.setMaterialisedBox(this.#app, this.key, materialised)
    return materialised
  }
  set value(v: TValue) {
    const isStaticValueType = minLengthForType(this.valueType) !== undefined
    const newValueBytes = asUint8Array(toBytes(v))
    if (isStaticValueType && this.exists) {
      const originalValueBytes = lazyContext.ledger.getBox(this.#app, this.key)
      if (originalValueBytes.length !== newValueBytes.length) {
        throw new CodeError(`attempt to box_put wrong size ${originalValueBytes.length} != ${newValueBytes.length}`)
      }
    }
    lazyContext.ledger.setBox(this.#app, this.key, newValueBytes)
    lazyContext.ledger.setMaterialisedBox(this.#app, this.key, v)
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
    return lazyContext.ledger.getBox(this.#app, this.key).length
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
    let updatedContent = concatUint8Arrays(content.slice(0, startNumber), valueBytes.asUint8Array(), content.slice(end))

    if (updatedContent.length > content.length) {
      updatedContent = updatedContent.slice(0, content.length)
    } else if (updatedContent.length < content.length) {
      updatedContent = concatUint8Arrays(updatedContent, new Uint8Array(content.length - updatedContent.length))
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
    const updatedContent = concatUint8Arrays(
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
      updatedContent = concatUint8Arrays(content, new Uint8Array(newSizeNumber - content.length))
    } else {
      updatedContent = content.slice(0, newSize)
    }
    this.backingValue = updatedContent
  }

  private get backingValue(): Uint8Array {
    return lazyContext.ledger.getBox(this.#app, this.key)
  }

  private set backingValue(value: Uint8Array) {
    lazyContext.ledger.setBox(this.#app, this.key, value)
  }
}

/** @internal */
export class BoxMapCls<TKey, TValue> {
  private _keyPrefix: bytes | undefined
  #app: Application

  private readonly _type: string = BoxMapCls.name

  static [Symbol.hasInstance](x: unknown): x is BoxMapCls<unknown, unknown> {
    return x instanceof Object && '_type' in x && (x as { _type: string })['_type'] === BoxMapCls.name
  }

  constructor() {
    this.#app = lazyContext.activeApplication
  }

  get hasKeyPrefix(): boolean {
    return this._keyPrefix !== undefined && this._keyPrefix.length > 0
  }

  get keyPrefix(): bytes {
    if (this._keyPrefix === undefined || this._keyPrefix.length === 0) {
      throw new InternalError('Box key prefix is empty')
    }
    return this._keyPrefix
  }

  set keyPrefix(keyPrefix: StubBytesCompat) {
    this._keyPrefix = asBytes(keyPrefix)
  }

  call(key: TKey, proxy: (key: TKey) => BoxType<TValue>): BoxType<TValue> {
    const typeInfo = getGenericTypeInfo(proxy)
    const valueType = (typeInfo!.genericArgs! as TypeInfo[])[1]
    const box = new BoxCls<TValue>(this.getFullKey(key), this.#app, valueType)
    return box
  }

  private getFullKey(key: TKey): bytes {
    return this.keyPrefix.concat(toBytes(key))
  }
}

/** @internal */
export function Box<TValue>(options?: { key: bytes | string }): BoxType<TValue> {
  return new BoxCls<TValue>(options?.key)
}

/** @internal */
export function BoxMap<TKey, TValue>(options?: { keyPrefix: bytes | string }): BoxMapType<TKey, TValue> {
  const boxMap = new BoxMapCls<TKey, TValue>()
  if (options?.keyPrefix !== undefined) {
    boxMap.keyPrefix = options.keyPrefix
  }

  const x = (key: TKey): BoxType<TValue> => boxMap.call(key, x)
  return Object.setPrototypeOf(x, boxMap)
}
