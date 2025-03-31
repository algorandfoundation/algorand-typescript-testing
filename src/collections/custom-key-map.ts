import type { Account } from '@algorandfoundation/algorand-typescript'
import { InternalError } from '../errors'
import type { StubBytesCompat, StubUint64Compat } from '../impl/primitives'
import type { DeliberateAny } from '../typescript-helpers'
import { asBytesCls, asUint64Cls } from '../util'

type Primitive = number | bigint | string | boolean
export abstract class CustomKeyMap<TKey, TValue> implements Map<TKey, TValue> {
  #keySerializer: (key: TKey) => Primitive
  #map = new Map<Primitive, [TKey, TValue]>()

  constructor(keySerializer: (key: TKey) => number | bigint | string) {
    this.#keySerializer = keySerializer
  }

  clear(): void {
    this.#map.clear()
  }
  delete(key: TKey): boolean {
    return this.#map.delete(this.#keySerializer(key))
  }
  forEach(callbackfn: (value: TValue, key: TKey, map: Map<TKey, TValue>) => void, thisArg?: DeliberateAny): void {
    for (const [key, value] of this.#map.values()) {
      callbackfn.call(thisArg ?? this, value, key, this)
    }
  }
  get(key: TKey): TValue | undefined {
    return this.#map.get(this.#keySerializer(key))?.[1]
  }
  getOrFail(key: TKey): TValue {
    const value = this.get(key)
    if (value === undefined) {
      throw new InternalError('Key not found')
    }
    return value
  }
  has(key: TKey): boolean {
    return this.#map.has(this.#keySerializer(key))
  }
  set(key: TKey, value: TValue): this {
    this.#map.set(this.#keySerializer(key), [key, value])
    return this
  }
  get size(): number {
    return this.#map.size
  }
  entries(): MapIterator<[TKey, TValue]> {
    return this.#map.values()
  }
  *keys(): MapIterator<TKey> {
    for (const [key] of this.#map.values()) {
      yield key
    }
  }
  *values(): MapIterator<TValue> {
    for (const [, value] of this.#map.values()) {
      yield value
    }
  }
  [Symbol.iterator](): MapIterator<[TKey, TValue]> {
    return this.#map.values()
  }
  get [Symbol.toStringTag](): string {
    return this.constructor.name
  }
}

export class AccountMap<TValue> extends CustomKeyMap<Account, TValue> {
  constructor() {
    super(AccountMap.getAddressStrFromAccount)
  }

  private static getAddressStrFromAccount = (acc: Account) => {
    return asBytesCls(acc.bytes).valueOf()
  }
}

export class BytesMap<TValue> extends CustomKeyMap<StubBytesCompat, TValue> {
  constructor() {
    super((bytes) => asBytesCls(bytes).valueOf())
  }
}

export class Uint64Map<TValue> extends CustomKeyMap<StubUint64Compat, TValue> {
  constructor() {
    super((uint64) => asUint64Cls(uint64).valueOf())
  }
}
