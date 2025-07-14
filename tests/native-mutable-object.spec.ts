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

type SimpleObj = {
  a: uint64
  b: boolean
  c: string
  d: bytes
}

type NestedObj = {
  a: uint64
  b: boolean
  c: string
  d: {
    x: uint64
    y: string
    z: boolean
  }
}

type NestedReadonlyObj = {
  a: uint64
  b: boolean
  c: string
  d: Readonly<{
    x: uint64
    y: string
    z: boolean
  }>
}

type ArrayObj = {
  a: uint64
  b: boolean
  c: string
  d: uint64[]
}

type ReadonlyArrayObj = {
  a: uint64
  b: boolean
  c: string
  d: readonly uint64[]
}

type FixedArrayObj = {
  a: uint64
  b: boolean
  c: string
  d: FixedArray<uint64, 3>
}

type TupleObj = {
  a: uint64
  b: boolean
  c: string
  d: [uint64, string, boolean]
}

type ReadonlyTupleObj = {
  a: uint64
  b: boolean
  c: string
  d: readonly [uint64, string, boolean]
}

type DeepNestedObj = {
  a: uint64
  b: {
    x: {
      p: uint64
      q: string
    }
    y: string[]
    z: [uint64, boolean]
  }
  c: string
}

type Arc4PrimitiveObj = {
  a: arc4.UintN64
  b: arc4.Bool
  c: arc4.Str
  d: arc4.Byte
}

type Arc4DynamicArrayObj = {
  a: uint64
  b: arc4.DynamicArray<arc4.UintN64>
  c: string
}

type Arc4StaticArrayObj = {
  a: uint64
  b: arc4.StaticArray<arc4.UintN64, 3>
  c: string
}

type Arc4TupleObj = {
  a: uint64
  b: arc4.Tuple<readonly [arc4.UintN64, arc4.Str, arc4.Bool]>
  c: string
}

class TestContract extends Contract {
  nativeMutableObj(obj: SimpleObj): SimpleObj {
    return obj
  }

  arc4PrimitiveMutableObj(obj: Arc4PrimitiveObj): Arc4PrimitiveObj {
    return obj
  }
}

describe('native mutable object', () => {
  const ctx = new TestExecutionContext()

  describe('set properties', () => {
    it('set properties in simple mutable object', () => {
      const obj: SimpleObj = { a: 1, b: true, c: 'hello', d: Bytes('world') }

      const obj2 = clone(obj)
      obj2.a = 42
      obj2.b = false
      obj2.c = 'goodbye'
      obj2.d = Bytes('universe')

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: Bytes('world'),
      })
      assertMatch(obj2, {
        a: 42,
        b: false,
        c: 'goodbye',
        d: Bytes('universe'),
      })
    })

    it('set properties in nested mutable object', () => {
      const obj: NestedObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      }

      const obj2 = clone(obj)
      obj2.a = 42
      obj2.d.x = 100
      obj2.d.y = 'modified'
      obj2.d.z = true

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      })
      assertMatch(obj2, {
        a: 42,
        b: true,
        c: 'hello',
        d: { x: 100, y: 'modified', z: true },
      })
    })

    it('set properties in nested readonly object', () => {
      const obj: NestedReadonlyObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      }

      const obj2 = clone(obj)
      obj2.a = 42
      obj2.d = {
        x: 100,
        y: 'modified',
        z: true,
      }

      assertMatch(obj, {
        a: 1,
        b: true,
        c: 'hello',
        d: { x: 10, y: 'test', z: false },
      })
      assertMatch(obj2, {
        a: 42,
        b: true,
        c: 'hello',
        d: { x: 100, y: 'modified', z: true },
      })
    })

    it('set array property in mutable object', () => {
      const obj: ArrayObj = { a: 1, b: true, c: 'hello', d: [10, 20, 30] }

      const obj2 = clone(obj)
      obj2.d[0] = 1
      obj2.d[1] = 2
      obj2.d.pop()

      assertMatch(obj.d, [10, 20, 30])
      assertMatch(obj2.d, [1, 2])
    })

    it('set readonly array property in mutable object', () => {
      const obj: ReadonlyArrayObj = { a: 1, b: true, c: 'hello', d: [10, 20, 30] }

      const obj2 = clone(obj)
      obj2.d = [1, 2]

      assertMatch(obj.d, [10, 20, 30])
      assertMatch(obj2.d, [1, 2])
    })

    it('set items in fixed array mutable object', () => {
      const obj: FixedArrayObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: new FixedArray<uint64, 3>(10, 20, 30),
      }

      const obj2 = clone(obj)
      obj2.d = new FixedArray<uint64, 3>(100, 20, 300)

      assertMatch(obj.d, [10, 20, 30])
      assertMatch(obj2.d, [100, 20, 300])
    })

    it('set items in tuple mutable object', () => {
      const obj: TupleObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false] as [uint64, string, boolean],
      }

      const obj2 = clone(obj)
      obj2.d[0] = 100
      obj2.d[1] = 'modified'
      obj2.d[2] = true

      assertMatch(obj.d, [10, 'test', false])
      assertMatch(obj2.d, [100, 'modified', true])
    })

    it('set items in readonly tuple mutable object', () => {
      const obj: ReadonlyTupleObj = {
        a: 1,
        b: true,
        c: 'hello',
        d: [10, 'test', false],
      }

      const obj2 = clone(obj)
      obj2.d = [100, 'modified', true] as [uint64, string, boolean]

      assertMatch(obj.d, [10, 'test', false])
      assertMatch(obj2.d, [100, 'modified', true])
    })

    it('set items in deep nested mutable object', () => {
      const obj: DeepNestedObj = {
        a: 1,
        b: {
          x: { p: 10, q: 'test' },
          y: ['hello', 'world'],
          z: [20, false] as [uint64, boolean],
        },
        c: 'root',
      }
      const obj2 = clone(obj)

      obj2.a = 42
      obj2.b.x.p = 100
      obj2.b.x.q = 'modified'
      obj2.b.y[0] = 'goodbye'
      obj2.b.y.push('universe')
      obj2.b.z[0] = 200
      obj2.b.z[1] = true
      obj2.c = 'updated'

      assertMatch(obj, {
        a: 1,
        b: {
          x: { p: 10, q: 'test' },
          y: ['hello', 'world'],
          z: [20, false] as [uint64, boolean],
        },
        c: 'root',
      })
      assertMatch(obj2, {
        a: 42,
        b: {
          x: { p: 100, q: 'modified' },
          y: ['goodbye', 'world', 'universe'],
          z: [200, true] as [uint64, boolean],
        },
        c: 'updated',
      })
    })
  })

  describe('store arc4 value', () => {
    it('can store primitive arc4 values', () => {
      const obj: Arc4PrimitiveObj = {
        a: new arc4.UintN64(42),
        b: new arc4.Bool(true),
        c: new arc4.Str('hello'),
        d: new arc4.Byte(125),
      }

      const obj2 = clone(obj)
      obj2.a = new arc4.UintN64(100)
      obj2.b = new arc4.Bool(false)
      obj2.c = new arc4.Str('world')
      obj2.d = new arc4.Byte(42)

      assertMatch(obj, {
        a: new arc4.UintN64(42),
        b: new arc4.Bool(true),
        c: new arc4.Str('hello'),
        d: new arc4.Byte(125),
      })
      assertMatch(obj2, {
        a: new arc4.UintN64(100),
        b: new arc4.Bool(false),
        c: new arc4.Str('world'),
        d: new arc4.Byte(42),
      })
    })

    it('can store arc4 dynamic array', () => {
      const obj: Arc4DynamicArrayObj = {
        a: 42,
        b: new arc4.DynamicArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      }

      const obj2 = clone(obj)
      obj2.b[0] = new arc4.UintN64(100)
      obj2.b.push(new arc4.UintN64(40))

      assertMatch(obj.b, [new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)])
      assertMatch(obj2.b, [new arc4.UintN64(100), new arc4.UintN64(20), new arc4.UintN64(30), new arc4.UintN64(40)])
    })

    it('can store arc4 static array', () => {
      const obj: Arc4StaticArrayObj = {
        a: 42,
        b: new arc4.StaticArray(new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)),
        c: 'test',
      }

      const obj2 = clone(obj)
      obj2.b[0] = new arc4.UintN64(100)
      obj2.b[2] = new arc4.UintN64(300)

      assertMatch(obj.b, [new arc4.UintN64(10), new arc4.UintN64(20), new arc4.UintN64(30)])
      assertMatch(obj2.b, [new arc4.UintN64(100), new arc4.UintN64(20), new arc4.UintN64(300)])
    })

    it('can store arc4 tuple', () => {
      const obj: Arc4TupleObj = {
        a: 42,
        b: new arc4.Tuple(new arc4.UintN64(10), new arc4.Str('hello'), new arc4.Bool(true)),
        c: 'test',
      }

      const obj2 = clone(obj)
      obj2.b = new arc4.Tuple(new arc4.UintN64(100), new arc4.Str('world'), new arc4.Bool(false))

      assertMatch(obj.b.native, [new arc4.UintN64(10), new arc4.Str('hello'), new arc4.Bool(true)])
      assertMatch(obj2.b.native, [new arc4.UintN64(100), new arc4.Str('world'), new arc4.Bool(false)])
    })
  })

  describe('store in state', () => {
    it('stores mutable object in state', () => {
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
      arr2[0].a = 10
      assertMatch(arr[0].a, 1)
      assertMatch(arr2[0].a, 10)
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
      arr2[0].a = 10
      assertMatch(arr[0].a, 1)
      assertMatch(arr2[0].a, 10)
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
      arr2[0].a = 10
      assertMatch(arr[0].a, 1)
      assertMatch(arr2[0].a, 10)
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
      tuple2[0].a = 10
      assertMatch(tuple[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
      assertMatch(tuple2[0], {
        a: 10,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
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
      tuple2[0].a = 10
      assertMatch(tuple[0], {
        a: 1,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
      assertMatch(tuple2[0], {
        a: 10,
        b: true,
        c: 'test',
        d: Bytes('data'),
      })
    })
  })

  describe('method selector', () => {
    it('should return correct method selector for mutable object method', () => {
      expect(methodSelector(TestContract.prototype.nativeMutableObj)).toEqual(
        methodSelector('nativeMutableObj((uint64,bool,string,byte[]))(uint64,bool,string,byte[])'),
      )
      expect(methodSelector(TestContract.prototype.arc4PrimitiveMutableObj)).toEqual(
        methodSelector('arc4PrimitiveMutableObj((uint64,bool,string,byte))(uint64,bool,string,byte)'),
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

      const obj: FixedArrayObj = {
        a: 456,
        b: false,
        c: 'fixed array',
        d: new FixedArray<uint64, 3>(5, 10, 15),
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<FixedArrayObjStruct>(encoded)
      const decoded = decodeArc4<FixedArrayObj>(encoded)

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

      const obj: Arc4PrimitiveObj = {
        a: new arc4.UintN64(999),
        b: new arc4.Bool(false),
        c: new arc4.Str('arc4 test'),
        d: new arc4.Byte(255),
      }

      const encoded = encodeArc4(obj)
      const interpreted = interpretAsArc4<Arc4PrimitiveObjStruct>(encoded)
      const decoded = decodeArc4<Arc4PrimitiveObj>(encoded)

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

      const obj: DeepNestedObj = {
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
      const decoded = decodeArc4<DeepNestedObj>(encoded)

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
