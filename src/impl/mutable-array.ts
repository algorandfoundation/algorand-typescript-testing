import type { uint64, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { AvmError } from '../errors'
import { asNumber } from '../util'

export class MutableArray<TItem> {
  private _values: TItem[]

  constructor(...items: TItem[]) {
    this._values = items

    return new Proxy(this, {
      get(target, prop: PropertyKey) {
        const idx = prop ? parseInt(prop.toString(), 10) : NaN
        if (!isNaN(idx)) {
          if (idx >= 0 && idx < target._values.length) return target._values[idx]
          throw new AvmError('Index out of bounds')
        }
        return Reflect.get(target, prop)
      },
      set(target, prop: PropertyKey, value: TItem) {
        const idx = prop ? parseInt(prop.toString(), 10) : NaN
        if (!isNaN(idx)) {
          if (idx >= 0 && idx < target._values.length) {
            target._values[idx] = value
            return true
          }
          throw new AvmError('Index out of bounds')
        }

        return Reflect.set(target, prop, value)
      },
    })
  }

  /**
   * Returns the current length of this array
   */
  get length(): uint64 {
    return this._values.length
  }

  /**
   * Returns the item at the given index.
   * Negative indexes are taken from the end.
   * @param index The index of the item to retrieve
   */
  at(index: Uint64Compat): TItem {
    return this._values[asNumber(index)]
  }

  /**
   * Create a new Dynamic array with all items from this array
   * @internal Not supported yet
   */
  slice(): MutableArray<TItem>
  /**
   * Create a new MutableArray with all items up till `end`.
   * Negative indexes are taken from the end.
   * @param end An index in which to stop copying items.
   * @internal Not supported yet
   */
  slice(end: Uint64Compat): MutableArray<TItem>
  /**
   * Create a new MutableArray with items from `start`, up until `end`
   * Negative indexes are taken from the end.
   * @param start An index in which to start copying items.
   * @param end An index in which to stop copying items
   * @internal Not supported yet
   */
  slice(start: Uint64Compat, end: Uint64Compat): MutableArray<TItem>
  slice(start?: Uint64Compat, end?: Uint64Compat): MutableArray<TItem> {
    const startIndex = end === undefined ? 0 : asNumber(start ?? 0)
    const endIndex = end === undefined ? asNumber(start ?? this._values.length) : asNumber(end)
    return new MutableArray<TItem>(...this._values.slice(startIndex, endIndex))
  }

  /**
   * Returns an iterator for the items in this array
   */
  [Symbol.iterator](): IterableIterator<TItem> {
    return this._values[Symbol.iterator]()
  }

  /**
   * Returns an iterator for a tuple of the indexes and items in this array
   */
  entries(): IterableIterator<readonly [uint64, TItem]> {
    return this._values.entries()
  }

  /**
   * Returns an iterator for the indexes in this array
   */
  keys(): IterableIterator<uint64> {
    return this._values.keys()
  }

  /**
   * Get or set the item at the specified index.
   * Negative indexes are not supported
   */
  [index: uint64]: TItem

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

  copy(): MutableArray<TItem> {
    return new MutableArray(...this._values)
  }
}
