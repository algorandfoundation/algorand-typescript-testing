import type { NTuple } from '@algorandfoundation/algorand-typescript'
import { FixedArray, type uint64, type Uint64Compat } from '@algorandfoundation/algorand-typescript'
import type { DeliberateAny } from '../typescript-helpers'
import { asNumber } from '../util'
import { arrayProxyHandler } from './encoded-types/array-proxy'
import type { StaticArrayGenericArgs, TypeInfo } from './encoded-types/types'

/**
 * A fixed sized array
 * @typeParam TItem The type of a single item in the array
 * @typeParam TLength The fixed length of the array
 */
export class FixedArrayImpl<TItem, TLength extends number> extends FixedArray<TItem, TLength> {
  private _value: NTuple<TItem, TLength>
  private size: number
  private typeInfo: TypeInfo
  private genericArgs: StaticArrayGenericArgs

  constructor(typeInfo: TypeInfo | string, ...items: TItem[] & { length: TLength }) {
    super(...(items as DeliberateAny))
    this.typeInfo = typeof typeInfo === 'string' ? JSON.parse(typeInfo) : typeInfo
    this.genericArgs = this.typeInfo.genericArgs as StaticArrayGenericArgs
    this.size = parseInt(this.genericArgs.size.name, 10)
    if (items.length) {
      this._value = items as NTuple<TItem, TLength>
    } else {
      this._value = items as NTuple<TItem, TLength>
      // console.log(getMaxLengthOfStaticContentType(this.typeInfo))
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
    return this._value
  }

  setItem(index: number, value: TItem): void {
    this.items[index] = value
  }

  /** @deprecated Array slicing is not yet supported in Algorand TypeScript
   * Create a new Dynamic array with all items from this array
   */
  slice(): Array<TItem>
  /** @deprecated Array slicing is not yet supported in Algorand TypeScript
   * Create a new DynamicArray with all items up till `end`.
   * Negative indexes are taken from the end.
   * @param end An index in which to stop copying items.
   */
  slice(end: Uint64Compat): Array<TItem>
  /** @deprecated Array slicing is not yet supported in Algorand TypeScript
   * Create a new DynamicArray with items from `start`, up until `end`
   * Negative indexes are taken from the end.
   * @param start An index in which to start copying items.
   * @param end An index in which to stop copying items
   */
  slice(start: Uint64Compat, end: Uint64Compat): Array<TItem>
  slice(start?: Uint64Compat, end?: Uint64Compat): Array<TItem> {
    return this.items.slice(start === undefined ? undefined : asNumber(start), end === undefined ? undefined : asNumber(end))
  }
}
