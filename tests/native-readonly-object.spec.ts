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
import { decodeArc4, encodeArc4, interpretAsArc4, methodSelector } from '@algorandfoundation/algorand-typescript/arc4'
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
        'metadata',
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

  describe('decode and encode', () => {
    it('should decode and encode simple mutable object', () => {
      class SimpleObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: arc4.DynamicBytes
      }> {}
      const obj: SimpleObj = { a: 1, b: true, c: 'hello', d: Bytes('world') }
      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<SimpleObjStruct>(encoded)
      const decoded = decodeArc4<SimpleObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.native, obj.b)
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(interpreted.d.native, obj.d)
      assertMatch(decoded, obj)
    })

    it('should decode and encode nested mutable object', () => {
      class ObjectStruct extends arc4.Struct<{
        x: arc4.UintN64
        y: arc4.Str
        z: arc4.Bool
      }> {}
      class NestedObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: ObjectStruct
      }> {}

      const obj: NestedObj = {
        a: 42,
        b: false,
        c: 'nested',
        d: { x: 100, y: 'inner', z: true },
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<NestedObjStruct>(encoded)
      const decoded = decodeArc4<NestedObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.native, obj.b)
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(interpreted.d.x.native, obj.d.x)
      assertMatch(interpreted.d.y.native, obj.d.y)
      assertMatch(interpreted.d.z.native, obj.d.z)
      assertMatch(decoded, obj)
    })

    it('should decode and encode array object', () => {
      class ArrayObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: arc4.DynamicArray<arc4.UintN64>
      }> {}

      const obj: ArrayObj = {
        a: 123,
        b: true,
        c: 'array test',
        d: [10, 20, 30, 40],
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<ArrayObjStruct>(encoded)
      const decoded = decodeArc4<ArrayObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.native, obj.b)
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(interpreted.d.length, obj.d.length)
      for (let i = 0; i < obj.d.length; i++) {
        assertMatch(interpreted.d[i].native, obj.d[i])
      }
      assertMatch(decoded, obj)
    })

    it('should decode and encode fixed array object', () => {
      class FixedArrayObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: arc4.StaticArray<arc4.UintN64, 3>
      }> {}

      const obj: FixedArrayReadonlyObj = {
        a: 456,
        b: false,
        c: 'fixed array',
        d: new FixedArray<uint64, 3>(5, 10, 15),
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<FixedArrayObjStruct>(encoded)
      const decoded = decodeArc4<FixedArrayReadonlyObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.native, obj.b)
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(interpreted.d.length, obj.d.length)
      for (let i = 0; i < obj.d.length; i++) {
        assertMatch(interpreted.d[i].native, obj.d[i])
      }
      assertMatch(decoded, obj)
    })

    it('should decode and encode tuple object', () => {
      class TupleObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: arc4.Tuple<[arc4.UintN64, arc4.Str, arc4.Bool]>
      }> {}

      const obj: TupleObj = {
        a: 789,
        b: true,
        c: 'tuple test',
        d: [99, 'tuple string', false],
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<TupleObjStruct>(encoded)
      const decoded = decodeArc4<TupleObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.native, obj.b)
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(interpreted.d.native[0].native, obj.d[0])
      assertMatch(interpreted.d.native[1].native, obj.d[1])
      assertMatch(interpreted.d.native[2].native, obj.d[2])
      assertMatch(decoded, obj)
    })

    it('should decode and encode arc4 primitive object', () => {
      class Arc4PrimitiveObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: arc4.Bool
        c: arc4.Str
        d: arc4.Byte
      }> {}

      const obj: Arc4PrimitiveReadonlyObj = {
        a: new arc4.UintN64(999),
        b: new arc4.Bool(false),
        c: new arc4.Str('arc4 test'),
        d: new arc4.Byte(255),
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<Arc4PrimitiveObjStruct>(encoded)
      const decoded = decodeArc4<Arc4PrimitiveReadonlyObj>(encoded)

      assertMatch(interpreted.a, obj.a)
      assertMatch(interpreted.b, obj.b)
      assertMatch(interpreted.c, obj.c)
      assertMatch(interpreted.d, obj.d)
      assertMatch(decoded, obj)
    })

    it('should decode and encode deep nested object', () => {
      class ObjStruct extends arc4.Struct<{
        p: arc4.UintN64
        q: arc4.Str
      }> {}
      class NestedObjStruct extends arc4.Struct<{
        x: ObjStruct
        y: arc4.DynamicArray<arc4.Str>
        z: arc4.Tuple<[arc4.UintN64, arc4.Bool]>
      }> {}
      class DeepNestedObjStruct extends arc4.Struct<{
        a: arc4.UintN64
        b: NestedObjStruct
        c: arc4.Str
      }> {}

      const obj: DeepNestedReadonlyObj = {
        a: 555,
        b: {
          x: { p: 111, q: 'deep' },
          y: ['first', 'second', 'third'],
          z: [222, true],
        },
        c: 'deep test',
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<DeepNestedObjStruct>(encoded)
      const decoded = decodeArc4<DeepNestedReadonlyObj>(encoded)

      assertMatch(interpreted.a.native, obj.a)
      assertMatch(interpreted.b.x.p.native, obj.b.x.p)
      assertMatch(interpreted.b.x.q.native, obj.b.x.q)
      assertMatch(interpreted.b.y.length, obj.b.y.length)
      for (let i = 0; i < obj.b.y.length; i++) {
        assertMatch(interpreted.b.y[i].native, obj.b.y[i])
      }
      assertMatch(interpreted.b.z.native[0].native, obj.b.z[0])
      assertMatch(interpreted.b.z.native[1].native, obj.b.z[1])
      assertMatch(interpreted.c.native, obj.c)
      assertMatch(decoded, obj)
    })
  })
})
