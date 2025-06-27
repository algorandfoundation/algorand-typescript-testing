import type { bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import {
  arc4,
  assertMatch,
  Box,
  BoxMap,
  Bytes,
  clone,
  Contract,
  FixedArray,
  Global,
  GlobalState,
  LocalState,
  Uint64,
} from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { describe, expect, it } from 'vitest'

class TestContract extends Contract {
  fixedArrayNative(a: FixedArray<uint64, 10>, b: string): readonly [FixedArray<uint64, 2>, string] {
    return [new FixedArray(a[0], a[1]), b]
  }
  fixedArrayArc4(a: FixedArray<arc4.UintN8, 10>, b: arc4.Str): readonly [FixedArray<arc4.UintN8, 2>, arc4.Str] {
    return [new FixedArray(a[0], a[1]), b]
  }
}

describe('FixedArray', () => {
  describe('constructor', () => {
    it('creates empty array when no arguments provided', () => {
      const arr = new FixedArray<uint64, 2>()
      expect(arr.length).toEqual(2)
    })

    it('creates array with initial values', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      expect(arr.length).toEqual(3)
      expect(arr[0]).toEqual(1)
      expect(arr[1]).toEqual(2)
      expect(arr[2]).toEqual(3)
    })
  })

  describe('index access', () => {
    it('throws on out of bounds access', () => {
      const arr = new FixedArray(Uint64(1), Uint64(2))
      expect(() => arr[2]).toThrow('Index out of bounds')
      expect(() => arr[-1]).toThrow('Index out of bounds')
    })

    it('allows setting values by index', () => {
      const arr = new FixedArray(Uint64(1), Uint64(2))
      const index = Uint64(0)
      arr[index] = 10
      expect(arr[index]).toEqual(10)
    })
  })

  describe('at()', () => {
    it('returns value at positive index', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      expect(arr.at(Uint64(1))).toEqual(2)
    })

    it('returns value at negative index', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      expect(arr.at(-1)).toEqual(3)
    })
  })

  describe('slice()', () => {
    it('returns full copy with no arguments', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      const sliced = arr.slice()
      expect([...sliced]).toEqual([1, 2, 3])
    })

    it('slices with end index', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      const sliced = arr.slice(Uint64(2))
      expect([...sliced]).toEqual([1, 2])
    })

    it('slices with start and end index', () => {
      const arr = new FixedArray<uint64, 4>(1, 2, 3, 4)
      const sliced = arr.slice(Uint64(1), Uint64(3))
      expect([...sliced]).toEqual([2, 3])
    })
  })

  describe('iteration', () => {
    it('supports for...of iteration', () => {
      const arr = new FixedArray<uint64, 3>(1, 2, 3)
      const result: number[] = []
      for (const item of arr) {
        result.push(item)
      }
      expect(result).toEqual([1, 2, 3])
    })

    it('provides entries() iterator', () => {
      const arr = new FixedArray('a', 'b')
      const entries = [...arr.entries()]
      expect(entries).toEqual([
        [0, 'a'],
        [1, 'b'],
      ])
    })

    it('provides keys() iterator', () => {
      const arr = new FixedArray('a', 'b')
      const keys = [...arr.keys()]
      expect(keys).toEqual([0, 1])
    })
  })

  describe('copy()', () => {
    it('creates a deep copy', () => {
      const original = new FixedArray<FixedArray<string, 3>, 1>(new FixedArray<string, 3>('a', 'b', 'c'))
      const copy = clone(original)
      copy[0][0] = 'aa'
      expect(original[0][0]).toEqual('a')
      expect(copy[0][0]).toEqual('aa')
    })
  })

  describe('store in state', () => {
    const ctx = new TestExecutionContext()

    it('stores fixed array in state', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const g1 = GlobalState({ key: 'g1', initialValue: new FixedArray<uint64, 3>(1, 2, 3) })
        assertMatch(g1.value, [1, 2, 3])

        const l1 = LocalState<FixedArray<uint64, 3>>({ key: 'l1' })
        l1(Global.zeroAddress).value = new FixedArray(Uint64(4), Uint64(5), Uint64(6))
        assertMatch(l1(Global.zeroAddress).value, [4, 5, 6])

        const b1 = Box<FixedArray<uint64, 3>>({ key: 'b1' })
        b1.value = new FixedArray()
        assertMatch(b1.value, [0, 0, 0])

        const b2 = BoxMap<string, FixedArray<uint64, 3>>({ keyPrefix: 'b2' })
        b2('key1').value = new FixedArray<uint64, 3>(7, 8, 9)
        assertMatch(b2('key1').value, [7, 8, 9])
      })
    })
  })

  describe('store arc4 value in fixed array', () => {
    it('can store primitive arc4 values', () => {
      const a1: FixedArray<arc4.UintN64, 3> = new FixedArray(new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3))
      assertMatch(a1, [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])

      const a2 = clone(a1)
      a2[0] = new arc4.UintN64(10)
      assertMatch(a1, [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])
      assertMatch(a2, [new arc4.UintN64(10), new arc4.UintN64(2), new arc4.UintN64(3)])

      const a3 = new FixedArray<arc4.UintN64, 3>()
      assertMatch(a3, [new arc4.UintN64(0), new arc4.UintN64(0), new arc4.UintN64(0)])
    })

    it('can store arc4 dynamic array', () => {
      const a1: FixedArray<arc4.DynamicArray<arc4.UintN64>, 1> = new FixedArray(
        new arc4.DynamicArray(new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)),
      )
      assertMatch(a1[0], [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])

      const a2 = clone(a1)
      a2[0][0] = new arc4.UintN64(10)
      assertMatch(a1[0], [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])
      assertMatch(a2[0], [new arc4.UintN64(10), new arc4.UintN64(2), new arc4.UintN64(3)])
    })

    it('can store arc4 static array', () => {
      const a1: FixedArray<arc4.StaticArray<arc4.UintN64, 3>, 1> = new FixedArray(
        new arc4.StaticArray(new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)),
      )
      assertMatch(a1[0], [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])

      const a2 = clone(a1)
      a2[0][0] = new arc4.UintN64(10)
      assertMatch(a1[0], [new arc4.UintN64(1), new arc4.UintN64(2), new arc4.UintN64(3)])
      assertMatch(a2[0], [new arc4.UintN64(10), new arc4.UintN64(2), new arc4.UintN64(3)])

      const a3 = new FixedArray<arc4.StaticArray<arc4.UintN64, 3>, 1>()
      assertMatch(a3[0], [new arc4.UintN64(0), new arc4.UintN64(0), new arc4.UintN64(0)])
    })
    it('can store arc4 tuple', () => {
      const a1: FixedArray<arc4.Tuple<readonly [arc4.UintN64, arc4.Str]>, 1> = new FixedArray(
        new arc4.Tuple(new arc4.UintN64(1), new arc4.Str('Hello')),
      )
      assertMatch(a1[0].native, [new arc4.UintN64(1), new arc4.Str('Hello')])

      const a2 = clone(a1)
      a2[0] = new arc4.Tuple(new arc4.UintN64(10), new arc4.Str('hello'))
      assertMatch(a1[0].native, [new arc4.UintN64(1), new arc4.Str('Hello')])
      assertMatch(a2[0].native, [new arc4.UintN64(10), new arc4.Str('hello')])

      const a3 = new FixedArray<arc4.Tuple<[arc4.UintN64, arc4.UintN64]>, 1>()
      assertMatch(a3[0].native, [new arc4.UintN64(0), new arc4.UintN64(0)])
    })
  })

  describe('store fixed array in other collections', () => {
    it('can be stored in object', () => {
      const obj = { arr: new FixedArray<uint64, 3>(1, 2, 3), str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      obj2.arr[0] = Uint64(10)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [10, 2, 3])

      const obj3 = { arr: new FixedArray<uint64, 2>(), str: 'world' }
      assertMatch(obj3, { arr: new FixedArray(Uint64(0), Uint64(0)), str: 'world' })
    })

    it('can be stored in readonly object', () => {
      const obj: Readonly<{ arr: FixedArray<uint64, 3>; str: string }> = { arr: new FixedArray<uint64, 3>(1, 2, 3), str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      obj2.arr[0] = Uint64(10)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [10, 2, 3])

      const obj3 = { arr: new FixedArray<uint64, 2>(), str: 'world' } as const
      assertMatch(obj3, { arr: new FixedArray(Uint64(0), Uint64(0)), str: 'world' })
    })

    it('can be stored in native array', () => {
      const arr: FixedArray<uint64, 3>[] = [new FixedArray<uint64, 3>(1, 2, 3), new FixedArray<uint64, 3>(4, 5, 6)]
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr[1], [4, 5, 6])

      const arr2 = clone(arr)
      arr2[0][0] = Uint64(10)
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr2[0], [10, 2, 3])

      const arr3: FixedArray<uint64, 2>[] = []
      assertMatch(arr3, [])
    })

    it('can be stored in native readonly array', () => {
      const arr: ReadonlyArray<FixedArray<uint64, 3>> = [new FixedArray<uint64, 3>(1, 2, 3), new FixedArray<uint64, 3>(4, 5, 6)]
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr[1], [4, 5, 6])

      const arr2 = clone(arr)
      arr2[0][0] = Uint64(10)
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr2[0], [10, 2, 3])

      const arr3: Readonly<FixedArray<uint64, 2>[]> = []
      assertMatch(arr3, [])
    })

    it('can be stored in native tuple', () => {
      const a: [FixedArray<uint64, 3>, string] = [new FixedArray<uint64, 3>(1, 2, 3), 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      b[0][0] = Uint64(10)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [10, 2, 3])

      const c: [FixedArray<uint64, 3>, string] = [new FixedArray(), 'hello']
      assertMatch(c[0], [0, 0, 0])
    })

    it('can be stored in native readonly tuple', () => {
      const a: readonly [FixedArray<uint64, 3>, string] = [new FixedArray<uint64, 3>(1, 2, 3), 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      b[0][0] = Uint64(10)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [10, 2, 3])

      const c = [new FixedArray<uint64, 3>(), 'hello'] as const
      assertMatch(c[0], [0, 0, 0])
    })
  })

  describe('store other collections in fixed array', () => {
    it('stores object in fixed array', () => {
      type Point = { x: uint64; y: uint64 }
      const a1 = new FixedArray({ x: Uint64(1), y: Uint64(2) }, { x: Uint64(3), y: Uint64(4) }, { x: Uint64(5), y: Uint64(6) })
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2 = new FixedArray<Point, 2>()
      assertMatch(a2, [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ])

      const a3 = clone(a1)
      a3[2] = a2.at(-1)
      assertMatch(a3, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 0, y: 0 },
      ])
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])
    })

    it('stores readonly object in fixed array', () => {
      type Point = Readonly<{ x: uint64; y: uint64 }>
      const a1 = new FixedArray<Point, 3>({ x: Uint64(1), y: Uint64(2) }, { x: Uint64(3), y: Uint64(4) }, { x: Uint64(5), y: Uint64(6) })
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2 = new FixedArray<Point, 2>()
      assertMatch(a2, [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ])

      const a3 = clone(a1)
      a3[2] = a2.at(-1)
      assertMatch(a3, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 0, y: 0 },
      ])
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])
    })

    it('stores native array in fixed array', () => {
      const a1 = new FixedArray<uint64[], 3>([1], [2, 3], [4])
      assertMatch(a1, [[1], [2, 3], [4]])

      const a2 = clone(a1)
      a2[1][1] = a1[1][1] * 10
      assertMatch(a1, [[1], [2, 3], [4]])
      assertMatch(a2, [[1], [2, 30], [4]])
    })

    it('stores native readonly array in fixed array', () => {
      const a1 = new FixedArray<Readonly<uint64[]>, 3>([1], [2, 3], [4])
      assertMatch(a1, [[1], [2, 3], [4]])

      const a2 = clone(a1)
      a2[1] = [2, 30]
      assertMatch(a1, [[1], [2, 3], [4]])
      assertMatch(a2, [[1], [2, 30], [4]])
    })

    it('store native tuple in fixed array', () => {
      const a1 = new FixedArray<[uint64, string, bytes], 2>([1, 'a', Bytes('x')], [2, 'b', Bytes('y')])
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a2 = clone(a1)
      a2[1] = [20, 'hello', Bytes('world')]
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])
      assertMatch(a2, [
        [1, 'a', Bytes('x')],
        [20, 'hello', Bytes('world')],
      ])

      const a3 = new FixedArray<[uint64, uint64], 2>()
      assertMatch(a3, [
        [0, 0],
        [0, 0],
      ])
    })

    it('store native readonly tuple in fixed array', () => {
      const a1 = new FixedArray<Readonly<[uint64, string, bytes]>, 2>([1, 'a', Bytes('x')], [2, 'b', Bytes('y')])
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a2 = clone(a1)
      a2[1] = [20, 'hello', Bytes('world')]
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])
      assertMatch(a2, [
        [1, 'a', Bytes('x')],
        [20, 'hello', Bytes('world')],
      ])

      const a3 = new FixedArray<readonly [uint64, uint64], 2>()
      assertMatch(a3, [
        [0, 0],
        [0, 0],
      ])
    })
  })

  describe('method selector', () => {
    it('should return correct method selector for fixed array method', () => {
      expect(methodSelector(TestContract.prototype.fixedArrayNative)).toEqual(
        methodSelector('fixedArrayNative(uint64[10],string)(uint64[2],string)'),
      )
      expect(methodSelector(TestContract.prototype.fixedArrayArc4)).toEqual(
        methodSelector('fixedArrayArc4(uint8[10],string)(uint8[2],string)'),
      )
    })
  })
})
