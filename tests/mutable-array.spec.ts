import type { uint64 } from '@algorandfoundation/algorand-typescript'
import { describe, expect, it } from 'vitest'
import { MutableArray } from '../src/impl'
import { Uint64 } from '../src/impl/primitives'

describe('MutableArray', () => {
  describe('constructor', () => {
    it('creates empty array when no arguments provided', () => {
      const arr = new MutableArray<uint64>()
      expect(arr.length).toEqual(0)
    })

    it('creates array with initial values', () => {
      const arr = new MutableArray<uint64>(Uint64(1), Uint64(2), Uint64(3))
      expect(arr.length).toEqual(3)
      expect(arr[0]).toEqual(1)
      expect(arr[1]).toEqual(2)
      expect(arr[2]).toEqual(3)
    })
  })

  describe('index access', () => {
    it('throws on out of bounds access', () => {
      const arr = new MutableArray(1, 2)
      expect(() => arr[2]).toThrow('Index out of bounds')
      expect(() => arr[-1]).toThrow('Index out of bounds')
    })

    it('allows setting values by index', () => {
      const arr = new MutableArray(1, 2)
      const index = Uint64(0)
      arr[index] = 10
      expect(arr[index]).toEqual(10)
    })
  })

  describe('at()', () => {
    it('returns value at positive index', () => {
      const arr = new MutableArray(1, 2, 3)
      expect(arr.at(Uint64(1))).toEqual(2)
    })

    it('returns value at negative index', () => {
      const arr = new MutableArray(1, 2, 3)
      expect(() => arr.at(-1)).toThrow('Uint64 overflow or underflow')
    })
  })

  describe('slice()', () => {
    it('returns full copy with no arguments', () => {
      const arr = new MutableArray(1, 2, 3)
      const sliced = arr.slice()
      expect([...sliced]).toEqual([1, 2, 3])
    })

    it('slices with end index', () => {
      const arr = new MutableArray(1, 2, 3)
      const sliced = arr.slice(Uint64(2))
      expect([...sliced]).toEqual([1, 2])
    })

    it('slices with start and end index', () => {
      const arr = new MutableArray(1, 2, 3, 4)
      const sliced = arr.slice(Uint64(1), Uint64(3))
      expect([...sliced]).toEqual([2, 3])
    })
  })

  describe('push() and pop()', () => {
    it('pushes items to end of array', () => {
      const arr = new MutableArray(1)
      arr.push(2, 3)
      expect([...arr]).toEqual([1, 2, 3])
    })

    it('pops item from end of array', () => {
      const arr = new MutableArray(1, 2, 3)
      const popped = arr.pop()
      expect(popped).toEqual(3)
      expect([...arr]).toEqual([1, 2])
    })
  })

  describe('iteration', () => {
    it('supports for...of iteration', () => {
      const arr = new MutableArray(1, 2, 3)
      const result: number[] = []
      for (const item of arr) {
        result.push(item)
      }
      expect(result).toEqual([1, 2, 3])
    })

    it('provides entries() iterator', () => {
      const arr = new MutableArray('a', 'b')
      const entries = [...arr.entries()]
      expect(entries).toEqual([
        [0, 'a'],
        [1, 'b'],
      ])
    })

    it('provides keys() iterator', () => {
      const arr = new MutableArray('a', 'b')
      const keys = [...arr.keys()]
      expect(keys).toEqual([0, 1])
    })
  })

  describe('copy()', () => {
    it('creates a deep copy', () => {
      const original = new MutableArray(1, 2, 3)
      const copy = original.copy()
      copy[0] = 10
      expect(original[0]).toEqual(1)
      expect(copy[0]).toEqual(10)
    })
  })
})
