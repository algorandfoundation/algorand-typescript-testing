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
import { decodeArc4, encodeArc4, interpretAsArc4, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { describe, expect, it } from 'vitest'

class TestContract extends Contract {
  nativeReadonlyArrayMethod(a: readonly uint64[], b: string): readonly [readonly uint64[], string] {
    return [a.slice(0, 2), b]
  }
  arc4ReadonlyArrayMethod(a: readonly arc4.Uint8[], b: arc4.Str): readonly [readonly arc4.Uint8[], arc4.Str] {
    return [a.slice(0, 2), b]
  }
}

describe('native readonly array', () => {
  describe('readonly properties', () => {
    it('access elements in readonly array', () => {
      const arr: readonly uint64[] = [1, 2, 3]

      expect(arr[0]).toEqual(1)
      expect(arr[1]).toEqual(2)
      expect(arr[2]).toEqual(3)
      expect(arr.length).toEqual(3)

      // Array is readonly - cannot modify elements
      assertMatch(arr, [1, 2, 3])
    })

    it('access elements with at() method', () => {
      const arr: readonly uint64[] = [1, 2, 3]

      expect(arr.at(0)).toEqual(1)
      expect(arr.at(-1)).toEqual(3)
    })

    it('update element with with() method', () => {
      const arr: readonly uint64[] = [1, 2, 3]

      let updatedArr = arr.with(0, Uint64(10))
      assertMatch(updatedArr, [10, 2, 3])

      updatedArr = arr.with(-1, Uint64(30))
      assertMatch(updatedArr, [1, 2, 30])

      assertMatch(arr, [1, 2, 3])
    })
  })

  describe('copy()', () => {
    it('creates a deep copy', () => {
      const original: readonly uint64[][] = [[1, 2, 3]]
      const copy = clone(original)
      assertMatch(original, copy)

      // After cloning, the copy can be modified if it's not readonly
      copy[0][0] = 10
      assertMatch(original[0], [1, 2, 3])
      assertMatch(copy[0], [10, 2, 3])
    })
  })

  describe('store in state', () => {
    const ctx = new TestExecutionContext()

    it('stores readonly array in state', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const g1 = GlobalState({ key: 'g1', initialValue: [1, 2, 3] as readonly uint64[] })
        assertMatch(g1.value, [1, 2, 3])

        const l1 = LocalState<ReadonlyArray<uint64>>({ key: 'l1' })
        l1(Global.zeroAddress).value = [Uint64(4), Uint64(5), Uint64(6)]
        assertMatch(l1(Global.zeroAddress).value, [4, 5, 6])

        const b1 = Box<readonly uint64[]>({ key: 'b1' })
        b1.value = [100, 200, 300]
        assertMatch(b1.value, [100, 200, 300])

        const b2 = BoxMap<string, readonly uint64[]>({ keyPrefix: 'b2' })
        b2('key1').value = [7, 8, 9]
        assertMatch(b2('key1').value, [7, 8, 9])
      })
    })
  })

  describe('store arc4 value in readonly array', () => {
    it('can store primitive arc4 values', () => {
      const a1: readonly arc4.Uint64[] = [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)]
      assertMatch(a1, [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      assertMatch(a1, [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2, [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a3: readonly arc4.Uint64[] = []
      assertMatch(a3, [])
    })

    it('can store arc4 dynamic array', () => {
      const a1: readonly arc4.DynamicArray<arc4.Uint64>[] = [
        new arc4.DynamicArray(new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)),
      ]
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      a2[0].push(new arc4.Uint64(4))
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3), new arc4.Uint64(4)])
    })

    it('can store arc4 static array', () => {
      const a1: readonly arc4.StaticArray<arc4.Uint64, 3>[] = [
        new arc4.StaticArray(new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)),
      ]
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      a2[0][0] = new arc4.Uint64(10)
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2[0], [new arc4.Uint64(10), new arc4.Uint64(2), new arc4.Uint64(3)])
    })

    it('can store arc4 tuple', () => {
      const a1: readonly arc4.Tuple<readonly [arc4.Uint64, arc4.Str]>[] = [new arc4.Tuple(new arc4.Uint64(1), new arc4.Str('Hello'))]
      assertMatch(a1[0].native, [new arc4.Uint64(1), new arc4.Str('Hello')])

      const a2 = clone(a1)
      assertMatch(a1[0].native, [new arc4.Uint64(1), new arc4.Str('Hello')])
      assertMatch(a2[0].native, [new arc4.Uint64(1), new arc4.Str('Hello')])
    })
  })

  describe('store readonly array in other collections', () => {
    it('can be stored in object', () => {
      const obj = { arr: [1, 2, 3] as readonly uint64[], str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [1, 2, 3])

      const obj3 = { arr: [] as readonly uint64[], str: 'world' }
      assertMatch(obj3, { arr: [], str: 'world' })
    })

    it('can be stored in readonly object', () => {
      const obj: Readonly<{ arr: readonly uint64[]; str: string }> = { arr: [1, 2, 3], str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [1, 2, 3])

      const obj3 = { arr: [] as readonly uint64[], str: 'world' } as const
      assertMatch(obj3, { arr: [], str: 'world' })
    })

    it('can be stored in FixedArray', () => {
      const arr = new FixedArray<readonly uint64[], 2>([1, 2, 3], [4, 5, 6])
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr[1], [4, 5, 6])

      const arr2 = clone(arr)
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr2[0], [1, 2, 3])
    })

    it('can be stored in native tuple', () => {
      const a: [readonly uint64[], string] = [[1, 2, 3], 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [1, 2, 3])

      const c: [readonly uint64[], string] = [[], 'hello']
      assertMatch(c[0], [])
    })

    it('can be stored in native readonly tuple', () => {
      const a: readonly [readonly uint64[], string] = [[1, 2, 3], 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [1, 2, 3])

      const c = [[] as readonly uint64[], 'hello'] as const
      assertMatch(c[0], [])
    })
  })

  describe('store other collections in readonly array', () => {
    it('stores object in readonly array', () => {
      type Point = { x: uint64; y: uint64 }
      const a1: readonly Point[] = [
        { x: Uint64(1), y: Uint64(2) },
        { x: Uint64(3), y: Uint64(4) },
        { x: Uint64(5), y: Uint64(6) },
      ]
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2: readonly Point[] = []
      assertMatch(a2, [])

      const a3 = clone(a1)
      a3[0].x = Uint64(10)
      a3[1].x = Uint64(30)
      a3[2].x = Uint64(50)
      assertMatch(a3, [
        { x: 10, y: 2 },
        { x: 30, y: 4 },
        { x: 50, y: 6 },
      ])
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])
    })

    it('stores readonly object in readonly array', () => {
      type Point = Readonly<{ x: uint64; y: uint64 }>
      const a1: readonly Point[] = [
        { x: Uint64(1), y: Uint64(2) },
        { x: Uint64(3), y: Uint64(4) },
        { x: Uint64(5), y: Uint64(6) },
      ]
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2: readonly Point[] = []
      assertMatch(a2, [])

      const a3 = clone(a1)
      assertMatch(a3, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])
    })

    it('stores FixedArray in readonly array', () => {
      const a1: readonly FixedArray<uint64, 2>[] = [new FixedArray<uint64, 2>(1, 2), new FixedArray<uint64, 2>(3, 4)]
      assertMatch(a1, [new FixedArray<uint64, 2>(1, 2), new FixedArray<uint64, 2>(3, 4)])

      const a2 = clone(a1)
      a2[0][0] = Uint64(10)
      a2[1][0] = Uint64(30)
      assertMatch(a1, [new FixedArray(Uint64(1), Uint64(2)), new FixedArray(Uint64(3), Uint64(4))])
      assertMatch(a2, [new FixedArray(Uint64(10), Uint64(2)), new FixedArray(Uint64(30), Uint64(4))])
    })

    it('store native tuple in readonly array', () => {
      const a1: readonly [uint64, string, bytes][] = [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ]
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a2 = clone(a1)
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])
      assertMatch(a2, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a3: readonly [uint64, uint64][] = []
      assertMatch(a3, [])
    })

    it('store native readonly tuple in readonly array', () => {
      const a1: readonly (readonly [uint64, string, bytes])[] = [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ]
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a2 = clone(a1)
      assertMatch(a1, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])
      assertMatch(a2, [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ])

      const a3: readonly (readonly [uint64, uint64])[] = []
      assertMatch(a3, [])
    })
  })

  describe('method selector', () => {
    it('should return correct method selector for readonly array method', () => {
      expect(methodSelector(TestContract.prototype.nativeReadonlyArrayMethod)).toEqual(
        methodSelector('nativeReadonlyArrayMethod(uint64[],string)(uint64[],string)'),
      )
      expect(methodSelector(TestContract.prototype.arc4ReadonlyArrayMethod)).toEqual(
        methodSelector('arc4ReadonlyArrayMethod(uint8[],string)(uint8[],string)'),
      )
    })
  })

  describe('decode and encode', () => {
    it('should decode and encode readonly uint64 array', () => {
      const arr: readonly uint64[] = [10, 20, 30, 40]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<readonly uint64[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].asUint64(), arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly string array', () => {
      const arr: readonly string[] = ['hello', 'world', 'test']
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Str>>(encoded)
      const decoded = decodeArc4<readonly string[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly boolean array', () => {
      const arr: readonly boolean[] = [true, false, true, false, true, true, false, true, false, true]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Bool>>(encoded)
      const decoded = decodeArc4<readonly boolean[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly bytes array', () => {
      const arr: readonly bytes[] = [Bytes('hello'), Bytes('world'), Bytes('test')]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.DynamicBytes>>(encoded)
      const decoded = decodeArc4<readonly bytes[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly nested array', () => {
      const arr: readonly (readonly uint64[])[] = [[1, 2], [3, 4, 5], [6]]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.DynamicArray<arc4.Uint64>>>(encoded)
      const decoded = decodeArc4<readonly (readonly uint64[])[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].length, arr[i].length)
        for (let j = 0; j < arr[i].length; j++) {
          assertMatch(interpreted[i][j].asUint64(), arr[i][j])
        }
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly array with FixedArrays', () => {
      const arr: readonly FixedArray<uint64, 2>[] = [
        new FixedArray<uint64, 2>(1, 2),
        new FixedArray<uint64, 2>(3, 4),
        new FixedArray<uint64, 2>(5, 6),
      ]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.StaticArray<arc4.Uint64, 2>>>(encoded)
      const decoded = decodeArc4<readonly FixedArray<uint64, 2>[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].length, arr[i].length)
        for (let j = 0; j < arr[i].length; j++) {
          assertMatch(interpreted[i][j].asUint64(), arr[i][j])
        }
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly array with tuples', () => {
      const arr: readonly (readonly [uint64, string])[] = [
        [10, 'first'],
        [20, 'second'],
        [30, 'third'],
      ]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Tuple<readonly [arc4.Uint64, arc4.Str]>>>(encoded)
      const decoded = decodeArc4<readonly (readonly [uint64, string])[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native[0].asUint64(), arr[i][0])
        assertMatch(interpreted[i].native[1].native, arr[i][1])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly array with objects', () => {
      type Point = Readonly<{ x: uint64; y: uint64 }>
      const arr: readonly Point[] = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ]
      class PointStruct extends arc4.Struct<{ x: arc4.Uint64; y: arc4.Uint64 }> {}
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<PointStruct>>(encoded)
      const decoded = decodeArc4<readonly Point[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].x.asUint64(), arr[i].x)
        assertMatch(interpreted[i].y.asUint64(), arr[i].y)
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode readonly arc4 array', () => {
      const arr: readonly arc4.Uint64[] = [new arc4.Uint64(100), new arc4.Uint64(200), new arc4.Uint64(300)]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<readonly arc4.Uint64[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i], arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode empty readonly array', () => {
      const arr: readonly uint64[] = []
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<readonly uint64[]>(encoded)

      assertMatch(interpreted.length, 0)
      assertMatch(decoded, [])
    })
  })
})
