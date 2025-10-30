import { Uint64, urange } from '@algorandfoundation/algorand-typescript'
import { describe, expect, it } from 'vitest'

describe('urange', () => {
  it('should iterate from 0 to a-1 when only a is provided', () => {
    const a = Uint64(5)
    const iterator = urange(a)
    const result = []

    for (let item = iterator.next(); !item.done; item = iterator.next()) {
      result.push(item.value)
    }

    expect(result).toEqual([BigInt(0), BigInt(1), BigInt(2), BigInt(3), BigInt(4)])
  })

  it('should iterate from a to b-1 when a and b are provided', () => {
    const a = Uint64(2)
    const b = Uint64(5)
    const iterator = urange(a, b)
    const result = []

    for (let item = iterator.next(); !item.done; item = iterator.next()) {
      result.push(item.value)
    }

    expect(result).toEqual([BigInt(2), BigInt(3), BigInt(4)])
  })

  it('should iterate from a to b-1 with step c when a, b, and c are provided', () => {
    const a = Uint64(2)
    const b = Uint64(10)
    const c = Uint64(2)
    const iterator = urange(a, b, c)
    const result = []

    for (let item = iterator.next(); !item.done; item = iterator.next()) {
      result.push(item.value)
    }

    expect(result).toEqual([BigInt(2), BigInt(4), BigInt(6), BigInt(8)])
  })

  it('should return iteration count when done', () => {
    const a = Uint64(3)
    const iterator = urange(a)
    let item = iterator.next()
    let count = 0

    while (!item.done) {
      count++
      item = iterator.next()
    }

    expect(item.value).toBe(count)
  })
})
