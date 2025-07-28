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
  nativeArrayMethod(a: uint64[], b: string): readonly [uint64[], string] {
    return [a.slice(0, 2), b]
  }
  arc4ArrayMethod(a: arc4.Uint8[], b: arc4.Str): readonly [arc4.Uint8[], arc4.Str] {
    return [a.slice(0, 2), b]
  }
}

describe('native mutable array', () => {
  describe('copy()', () => {
    it('creates a deep copy', () => {
      const original: uint64[][] = [[1, 2, 3]]
      const copy = clone(original)
      assertMatch(original, copy)

      copy[0][0] = 10
      expect(original[0][0]).toEqual(1)
      expect(copy[0][0]).toEqual(10)
    })
  })

  describe('store in state', () => {
    const ctx = new TestExecutionContext()

    it('stores native array in state', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const g1 = GlobalState({ key: 'g1', initialValue: [1, 2, 3] as uint64[] })
        assertMatch(g1.value, [1, 2, 3])

        const l1 = LocalState<uint64[]>({ key: 'l1' })
        l1(Global.zeroAddress).value = [Uint64(4), Uint64(5), Uint64(6)]
        assertMatch(l1(Global.zeroAddress).value, [4, 5, 6])

        const b1 = Box<uint64[]>({ key: 'b1' })
        b1.value = [100, 200, 300]
        assertMatch(b1.value, [100, 200, 300])

        const b2 = BoxMap<string, uint64[]>({ keyPrefix: 'b2' })
        b2('key1').value = [7, 8, 9]
        assertMatch(b2('key1').value, [7, 8, 9])
      })
    })
  })

  describe('store arc4 value in native array', () => {
    it('can store primitive arc4 values', () => {
      const a1: arc4.Uint64[] = [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)]
      assertMatch(a1, [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      a2[0] = new arc4.Uint64(10)
      assertMatch(a1, [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2, [new arc4.Uint64(10), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a3: arc4.Uint64[] = []
      assertMatch(a3, [])
    })

    it('can store arc4 dynamic array', () => {
      const a1: arc4.DynamicArray<arc4.Uint64>[] = [new arc4.DynamicArray(new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3))]
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      a2[0][0] = new arc4.Uint64(10)
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2[0], [new arc4.Uint64(10), new arc4.Uint64(2), new arc4.Uint64(3)])
    })

    it('can store arc4 static array', () => {
      const a1: arc4.StaticArray<arc4.Uint64, 3>[] = [new arc4.StaticArray(new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3))]
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])

      const a2 = clone(a1)
      a2[0][0] = new arc4.Uint64(10)
      assertMatch(a1[0], [new arc4.Uint64(1), new arc4.Uint64(2), new arc4.Uint64(3)])
      assertMatch(a2[0], [new arc4.Uint64(10), new arc4.Uint64(2), new arc4.Uint64(3)])
    })

    it('can store arc4 tuple', () => {
      const a1: arc4.Tuple<readonly [arc4.Uint64, arc4.Str]>[] = [new arc4.Tuple(new arc4.Uint64(1), new arc4.Str('Hello'))]
      assertMatch(a1[0].native, [new arc4.Uint64(1), new arc4.Str('Hello')])

      const a2 = clone(a1)
      a2[0] = new arc4.Tuple(new arc4.Uint64(10), new arc4.Str('hello'))
      assertMatch(a1[0].native, [new arc4.Uint64(1), new arc4.Str('Hello')])
      assertMatch(a2[0].native, [new arc4.Uint64(10), new arc4.Str('hello')])
    })
  })

  describe('store native array in other collections', () => {
    it('can be stored in object', () => {
      const obj = { arr: [1, 2, 3] as uint64[], str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      obj2.arr[0] = Uint64(10)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [10, 2, 3])

      const obj3 = { arr: [] as uint64[], str: 'world' }
      assertMatch(obj3, { arr: [], str: 'world' })
    })

    it('can be stored in readonly object', () => {
      const obj: Readonly<{ arr: uint64[]; str: string }> = { arr: [1, 2, 3], str: 'hello' }
      assertMatch(obj.arr, [1, 2, 3])

      const obj2 = clone(obj)
      obj2.arr[0] = Uint64(10)
      assertMatch(obj.arr, [1, 2, 3])
      assertMatch(obj2.arr, [10, 2, 3])

      const obj3 = { arr: [] as uint64[], str: 'world' } as const
      assertMatch(obj3, { arr: [], str: 'world' })
    })

    it('can be stored in FixedArray', () => {
      const arr = new FixedArray<uint64[], 2>([1, 2, 3], [4, 5, 6])
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr[1], [4, 5, 6])

      const arr2 = clone(arr)
      arr2[0][0] = Uint64(10)
      assertMatch(arr[0], [1, 2, 3])
      assertMatch(arr2[0], [10, 2, 3])
    })

    it('can be stored in native tuple', () => {
      const a: [uint64[], string] = [[1, 2, 3], 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      b[0][0] = Uint64(10)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [10, 2, 3])

      const c: [uint64[], string] = [[], 'hello']
      assertMatch(c[0], [])
    })

    it('can be stored in native readonly tuple', () => {
      const a: readonly [uint64[], string] = [[1, 2, 3], 'hello']
      assertMatch(a[0], [1, 2, 3])

      const b = clone(a)
      b[0][0] = Uint64(10)
      assertMatch(a[0], [1, 2, 3])
      assertMatch(b[0], [10, 2, 3])

      const c = [[] as uint64[], 'hello'] as const
      assertMatch(c[0], [])
    })
  })

  describe('store other collections in native array', () => {
    it('stores object in native array', () => {
      type Point = { x: uint64; y: uint64 }
      const a1: Point[] = [
        { x: Uint64(1), y: Uint64(2) },
        { x: Uint64(3), y: Uint64(4) },
        { x: Uint64(5), y: Uint64(6) },
      ]
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2: Point[] = []
      assertMatch(a2, [])

      const a3 = clone(a1)
      a3[2] = { x: 0, y: 0 }
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

    it('stores readonly object in native array', () => {
      type Point = Readonly<{ x: uint64; y: uint64 }>
      const a1: Point[] = [
        { x: Uint64(1), y: Uint64(2) },
        { x: Uint64(3), y: Uint64(4) },
        { x: Uint64(5), y: Uint64(6) },
      ]
      assertMatch(a1, [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ])

      const a2: Point[] = []
      assertMatch(a2, [])

      const a3 = clone(a1)
      a3[2] = { x: 0, y: 0 }
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

    it('stores FixedArray in native array', () => {
      const a1: FixedArray<uint64, 2>[] = [new FixedArray<uint64, 2>(1, 2), new FixedArray<uint64, 2>(3, 4)]
      assertMatch(a1, [new FixedArray<uint64, 2>(1, 2), new FixedArray<uint64, 2>(3, 4)])

      const a2 = clone(a1)
      a2[1][1] = 40
      assertMatch(a1, [new FixedArray(Uint64(1), Uint64(2)), new FixedArray(Uint64(3), Uint64(4))])
      assertMatch(a2, [new FixedArray(Uint64(1), Uint64(2)), new FixedArray(Uint64(3), Uint64(40))])
    })

    it('store native tuple in native array', () => {
      const a1: [uint64, string, bytes][] = [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ]
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

      const a3: [uint64, uint64][] = []
      assertMatch(a3, [])
    })

    it('store native readonly tuple in native array', () => {
      const a1: Readonly<[uint64, string, bytes]>[] = [
        [1, 'a', Bytes('x')],
        [2, 'b', Bytes('y')],
      ]
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

      const a3: readonly [uint64, uint64][] = []
      assertMatch(a3, [])
    })
  })

  describe('method selector', () => {
    it('should return correct method selector for native array method', () => {
      expect(methodSelector(TestContract.prototype.nativeArrayMethod)).toEqual(
        methodSelector('nativeArrayMethod(uint64[],string)(uint64[],string)'),
      )
      expect(methodSelector(TestContract.prototype.arc4ArrayMethod)).toEqual(
        methodSelector('arc4ArrayMethod(uint8[],string)(uint8[],string)'),
      )
    })
  })

  describe('decode and encode', () => {
    it('should decode and encode mutable uint64 array', () => {
      const arr: uint64[] = [10, 20, 30, 40]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<uint64[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable string array', () => {
      const arr: string[] = ['hello', 'world', 'test', 'mutable']
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Str>>(encoded)
      const decoded = decodeArc4<string[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable boolean array', () => {
      const arr: boolean[] = [true, false, true, false, true, true, false, true, false, true]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Bool>>(encoded)
      const decoded = decodeArc4<boolean[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable bytes array', () => {
      const arr: bytes[] = [Bytes('hello'), Bytes('world'), Bytes('test'), Bytes('data')]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.DynamicBytes>>(encoded)
      const decoded = decodeArc4<bytes[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native, arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable nested array', () => {
      const arr: uint64[][] = [[1, 2], [3, 4, 5], [6], [7, 8, 9, 10]]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.DynamicArray<arc4.Uint64>>>(encoded)
      const decoded = decodeArc4<uint64[][]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].length, arr[i].length)
        for (let j = 0; j < arr[i].length; j++) {
          assertMatch(interpreted[i][j].native, arr[i][j])
        }
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable array with FixedArrays', () => {
      const arr: FixedArray<uint64, 2>[] = [
        new FixedArray<uint64, 2>(1, 2),
        new FixedArray<uint64, 2>(3, 4),
        new FixedArray<uint64, 2>(5, 6),
      ]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.StaticArray<arc4.Uint64, 2>>>(encoded)
      const decoded = decodeArc4<FixedArray<uint64, 2>[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].length, arr[i].length)
        for (let j = 0; j < arr[i].length; j++) {
          assertMatch(interpreted[i][j].native, arr[i][j])
        }
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable array with tuples', () => {
      const arr: [uint64, string][] = [
        [10, 'first'],
        [20, 'second'],
        [30, 'third'],
      ]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Tuple<[arc4.Uint64, arc4.Str]>>>(encoded)
      const decoded = decodeArc4<[uint64, string][]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].native[0].native, arr[i][0])
        assertMatch(interpreted[i].native[1].native, arr[i][1])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable array with objects', () => {
      type Point = { x: uint64; y: uint64 }
      const arr: Point[] = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ]
      class PointStruct extends arc4.Struct<{ x: arc4.Uint64; y: arc4.Uint64 }> {}
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<PointStruct>>(encoded)
      const decoded = decodeArc4<Point[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i].x.native, arr[i].x)
        assertMatch(interpreted[i].y.native, arr[i].y)
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode mutable arc4 array', () => {
      const arr: arc4.Uint64[] = [new arc4.Uint64(100), new arc4.Uint64(200), new arc4.Uint64(300), new arc4.Uint64(400)]
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<arc4.Uint64[]>(encoded)

      assertMatch(interpreted.length, arr.length)
      for (let i = 0; i < arr.length; i++) {
        assertMatch(interpreted[i], arr[i])
      }
      assertMatch(decoded, arr)
    })

    it('should decode and encode empty mutable array', () => {
      const arr: uint64[] = []
      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<uint64[]>(encoded)

      assertMatch(interpreted.length, 0)
      assertMatch(decoded, [])
    })

    it('should decode and encode after array mutation', () => {
      const arr: uint64[] = [1, 2, 3]

      // Mutate the array
      arr.push(4, 5)
      arr[0] = 10

      const encoded = encodeArc4(arr)
      const interpreted = interpretAsArc4<arc4.DynamicArray<arc4.Uint64>>(encoded)
      const decoded = decodeArc4<uint64[]>(encoded)

      const expected = [10, 2, 3, 4, 5]
      assertMatch(interpreted.length, expected.length)
      for (let i = 0; i < expected.length; i++) {
        assertMatch(interpreted[i].native, expected[i])
      }
      assertMatch(decoded, expected)
    })
  })
})
