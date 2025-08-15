import type { Uint64Compat } from '@algorandfoundation/algorand-typescript'
import { AvmError } from '../../errors'
import { arrayUtil } from '../primitives'

/** @internal */
export const arrayProxyHandler = <TItem>() => ({
  get(target: { items: readonly TItem[] }, prop: PropertyKey) {
    const idx = prop ? parseInt(prop.toString(), 10) : NaN
    if (!isNaN(idx)) {
      if (idx >= 0 && idx < target.items.length) return target.items[idx]
      throw new AvmError('Index out of bounds')
    } else if (prop === Symbol.iterator) {
      return target.items[Symbol.iterator].bind(target.items)
    } else if (prop === 'entries') {
      return target.items.entries.bind(target.items)
    } else if (prop === 'keys') {
      return target.items.keys.bind(target.items)
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
