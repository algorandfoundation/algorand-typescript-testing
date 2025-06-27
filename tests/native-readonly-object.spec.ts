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
} from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
import { describe, expect, it } from 'vitest'

type SimpleObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: bytes
}>

type NestedObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: Readonly<{
    x: uint64
    y: string
    z: boolean
  }>
}>

type ArrayObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: uint64[]
}>

type ReadonlyArrayObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: readonly uint64[]
}>

type FixedArrayReadonlyObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: FixedArray<uint64, 3>
}>

type TupleObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: [uint64, string, boolean]
}>

type ReadonlyTupleObj = Readonly<{
  a: uint64
  b: boolean
  c: string
  d: readonly [uint64, string, boolean]
}>

type DeepNestedReadonlyObj = Readonly<{
  a: uint64
  b: Readonly<{
    x: Readonly<{
      p: uint64
      q: string
    }>
    y: readonly string[]
    z: readonly [uint64, boolean]
  }>
  c: string
}>

type Arc4PrimitiveReadonlyObj = Readonly<{
  a: arc4.UintN64
  b: arc4.Bool
  c: arc4.Str
  d: arc4.Byte
}>

type Arc4DynamicArrayReadonlyObj = Readonly<{
  a: uint64
  b: arc4.DynamicArray<arc4.UintN64>
  c: string
}>

type Arc4StaticArrayReadonlyObj = Readonly<{
  a: uint64
  b: arc4.StaticArray<arc4.UintN64, 3>
  c: string
}>

type Arc4TupleReadonlyObj = Readonly<{
  a: uint64
  b: arc4.Tuple<readonly [arc4.UintN64, arc4.Str, arc4.Bool]>
  c: string
}>

class TestContract extends Contract {
  nativeReadonlyObj(obj: SimpleObj): SimpleObj {
    return obj
  }

  arc4PrimitiveReadonlyObj(obj: Arc4PrimitiveReadonlyObj): Arc4PrimitiveReadonlyObj {
    return obj
  }
}

describe('native readonly object', () => {
  const ctx = new TestExecutionContext()

  describe('readonly properties', () => {
    it('access properties in simple readonly object', () => {
      const obj: SimpleObj = { a: 1, b: true, c: 'hello', d: Bytes('world') }

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: Bytes('world'),
      })
    })

    it('access properties in nested readonly object', () => {
      const obj: NestedObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      }

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      })
    })

    it('access readonly array property in readonly object', () => {
      const obj: ReadonlyArrayObj = { a: 1, b: true, c: 'hello', d: [10, 20, 30] }

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 20, 30],
      })
    })

    it('access array property in readonly object', () => {
      const obj: ArrayObj = { a: 1, b: true, c: 'hello', d: [10, 20, 30] }

      const obj2 = clone(obj)
      obj2.d[0] = 100
      obj2.d.pop()

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 20, 30],
      })
      assertMatch(obj2, {
        a: 1,
        b: true,
        c: 'hello',
        d: [100, 20],
      })
    })

    it('access fixed array property in readonly object', () => {
      const obj: FixedArrayReadonlyObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: new FixedArray<uint64, 3>(10, 20, 30),
      }

      const obj2 = clone(obj)
      obj2.d[0] = 100
      obj2.d[2] = 300

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: new FixedArray<uint64, 3>(10, 20, 30),
      })

      assertMatch(obj2, {
        a: 1,
        b: true,
        c: 'hello',
        d: new FixedArray<uint64, 3>(100, 20, 300),
      })
    })

    it('access tuple property in readonly object', () => {
      const obj: TupleObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false],
      }

      const obj2 = clone(obj)
      obj2.d[0] = 100
      obj2.d[2] = true

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false],
      })
      assertMatch(obj2, {
        a: 1,
        b: true,
        c: 'hello',
        d: [100, 'test', true],
      })
    })

    it('access readonly tuple property in readonly object', () => {
      const obj: ReadonlyTupleObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false],
      }

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false],
      })
    })

    it('access properties in deep nested readonly object', () => {
      const obj: DeepNestedReadonlyObj = {
        a: 1,
        b: {
          x: { p: 10, q: 'test' },
          y: ['hello', 'world'],
          z: [20, false],
        },
        c: 'root',
      }

      assertMatch(obj, {
        a: 1,
        b: {
          x: { p: 10, q: 'test' },
          y: ['hello', 'world'],
          z: [20, false],
        },
        c: 'root',
      })
    })
  })

  describe('clone readonly objects', () => {
    it('clone simple readonly object', () => {
      const original: SimpleObj = { a: 1, b: true, c: 'hello', d: Bytes('world') }
      const cloned = clone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
    })

    it('clone nested readonly object', () => {
      const original: NestedObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      }
      const cloned = clone(original)

      expect(cloned).toEqual(original)
      expect(cloned).not.toBe(original)
      expect(cloned.d).not.toBe(original.d)
    })

    it('clone readonly object with arrays', () => {
      const original: ArrayObj = { a: 1, b: true, c: 'hello', d: [10, 20, 30] }
      const cloned = clone(original)

      cloned.d[0] = 100

      assertMatch(original, {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 20, 30],
      })

      assertMatch(cloned, {
        a: 1,
        b: true,
        c: 'hello',
        d: [100, 20, 30],
      })
    })
  })

  describe('store arc4 value', () => {
    it('can store primitive arc4 values', () => {
      const obj: Arc4PrimitiveReadonlyObj = {
        a: new arc4.UintN64(42),
        b: new arc4.Bool(true),
        c: new arc4.Str('hello'),
        d: new arc4.Byte(125),
      }

      const obj2 = clone(obj)

      assertMatch(obj, {
        a: new arc4.UintN64(42),
        b: new arc4.Bool(true),
        c: new arc4.Str('hello'),
        d: new arc4.Byte(125),
      })
      assertMatch(obj2, {
        a: new arc4.UintN64(42),
        b: new arc4.Bool(true),
        c: new arc4.Str('hello'),
        d: new arc4.Byte(125),
      })
    })

    it('can store arc4 dynamic array', () => {
      const obj: Arc4DynamicArrayReadonlyObj = {
        a: 42,
        b: new arc4.DynamicArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      }

      const obj2 = clone(obj)
      obj2.b.push(new arc4.UintN64(40))

      assertMatch(obj, {
        a: 42,
        b: new arc4.DynamicArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      })

      assertMatch(obj2, {
        a: 42,
        b: new arc4.DynamicArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30), new arc4.UintN64(40)),
        c: 'test',
      })
    })

    it('can store arc4 static array', () => {
      const obj: Arc4StaticArrayReadonlyObj = {
        a: 42,
        b: new arc4.StaticArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      }

      const obj2 = clone(obj)
      obj2.b[0] = new arc4.UintN64(100)
      obj2.b[2] = new arc4.UintN64(300)

      assertMatch(obj, {
        a: 42,
        b: new arc4.StaticArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      })
      assertMatch(obj2, {
        a: 42,
        b: new arc4.StaticArray(new arc4.UintN64(100), new arc4.UintN64(20), new arc4.UintN64(300)),
        c: 'test',
      })
    })

    it('can store arc4 tuple', () => {
      const obj: Arc4TupleReadonlyObj = {
        a: 42,
        b: new arc4.Tuple(new arc4.UintN64(10), new arc4.Str('hello'), new arc4.Bool(true)),
        c: 'test',
      }

      const obj2 = clone(obj)

      assertMatch(obj, obj2)
    })
  })

  describe('store in state', () => {
    it('stores readonly object in state', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const g1 = GlobalState({ key: 'g1', initialValue: { a: 1, b: true, c: 'hello', d: Bytes('world') } as SimpleObj })
        assertMatch(g1.value, {
          a: 1,
          b: true,
          c: 'hello',
          d: Bytes('world'),
        })

        const l1 = LocalState<SimpleObj>({ key: 'l1' })
        l1(Global.zeroAddress).value = { a: 42, b: false, c: 'test', d: Bytes('data') } as SimpleObj
        assertMatch(l1(Global.zeroAddress).value, {
          a: 42,
          b: false,
          c: 'test',
          d: Bytes('data'),
        })

        const b1 = Box<SimpleObj>({ key: 'b1' })
        b1.value = { a: 100, b: true, c: 'box', d: Bytes('storage') } as SimpleObj
        assertMatch(b1.value, {
          a: 100,
          b: true,
          c: 'box',
          d: Bytes('storage'),
        })

        const b2 = BoxMap<string, SimpleObj>({ keyPrefix: 'b2' })
        b2('key1').value = { a: 200, b: false, c: 'map', d: Bytes('value') } as SimpleObj
        assertMatch(b2('key1').value, {
          a: 200,
          b: false,
          c: 'map',
          d: Bytes('value'),
        })
      })
    })
  })

  describe('store in collections', () => {
    it('can be stored in native array', () => {
      const arr: SimpleObj[] = [
        { a: 1, b: true, c: 'first', d: Bytes('one') },
        { a: 2, b: false, c: 'second', d: Bytes('two') },
      ]

      assertMatch(arr[0], {
        a: 1,
        b: true,
        c: 'first',
        d: Bytes('one'),
      })
      assertMatch(arr[1], {
        a: 2,
        b: false,
        c: 'second',
        d: Bytes('two'),
      })

      const arr2 = clone(arr)
      arr2[1] = { a: 3, b: true, c: 'third', d: Bytes('three') }
      assertMatch(arr[0], arr2[0])
      assertMatch(arr2[1], {
        a: 3,
        b: true,
        c: 'third',
        d: Bytes('three'),
      })
    })

    it('can be stored in readonly native array', () => {
      const arr: readonly SimpleObj[] = [
        { a: 1, b: true, c: 'first', d: Bytes('one') },
        { a: 2, b: false, c: 'second', d: Bytes('two') },
      ]

      assertMatch(arr[0], {
        a: 1,
        b: true,
        c: 'first',
        d: Bytes('one'),
      })
      assertMatch(arr[1], {
        a: 2,
        b: false,
        c: 'second',
        d: Bytes('two'),
      })

      const arr2 = clone(arr)
      assertMatch(arr[0], arr2[0])
      assertMatch(arr[1], arr2[1])
    })

    it('can be stored in fixed array', () => {
      const arr = new FixedArray<SimpleObj, 2>(
        { a: 1, b: true, c: 'first', d: Bytes('one') },
        { a: 2, b: false, c: 'second', d: Bytes('two') },
      )

      assertMatch(arr[0], {
        a: 1,
        b: true,
        c: 'first',
        d: Bytes('one'),
      })
      assertMatch(arr[1], {
        a: 2,
        b: false,
        c: 'second',
        d: Bytes('two'),
      })

      const arr2 = clone(arr)
      assertMatch(arr[0], arr2[0])
      assertMatch(arr[1], arr2[1])
    })

    it('can be stored in tuple', () => {
      const tuple: [SimpleObj, string] = [{ a: 1, b: true, c: 'test', d: Bytes('data') }, 'metadata']

      assertMatch(tuple[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
      assertMatch(tuple[1], 'metadata')

      const tuple2 = clone(tuple)
      tuple2[0] = { a: 2, b: false, c: 'hello', d: Bytes('world') }
      assertMatch(tuple, [
        {
          a: 1,
          b: true,
          c: 'test',
          d: Bytes('data'),
        },
        'metadata',
      ])
      assertMatch(tuple2, [
        {
          a: 2,
          b: false,
          c: 'hello',
          d: Bytes('world'),
        },
      ])
    })

    it('can be stored in readonly tuple', () => {
      const tuple: readonly [SimpleObj, string] = [{ a: 1, b: true, c: 'test', d: Bytes('data') }, 'metadata']

      assertMatch(tuple[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
      assertMatch(tuple[1], 'metadata')

      const tuple2 = clone(tuple)
      assertMatch(tuple[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
      assertMatch(tuple2[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
    })
  })

  describe('method selector', () => {
    it('should return correct method selector for readonly object method', () => {
      expect(methodSelector(TestContract.prototype.nativeReadonlyObj)).toEqual(
        methodSelector('nativeReadonlyObj((uint64,bool,string,byte[]))(uint64,bool,string,byte[])'),
      )
      expect(methodSelector(TestContract.prototype.arc4PrimitiveReadonlyObj)).toEqual(
        methodSelector('arc4PrimitiveReadonlyObj((uint64,bool,string,byte))(uint64,bool,string,byte)'),
      )
    })
  })
})
