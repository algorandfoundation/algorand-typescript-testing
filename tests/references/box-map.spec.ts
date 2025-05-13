import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { BigUint, BoxMap, Bytes, op, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type { Bool, DynamicBytes, StaticArray, Tuple, UintN16 } from '@algorandfoundation/algorand-typescript/arc4'
import { ARC4Encoded, DynamicArray, interpretAsArc4, Str, Struct, UintN64, UintN8 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, it, test } from 'vitest'
import { MAX_UINT64 } from '../../src/constants'
import { toBytes } from '../../src/encoders'
import { asBytes } from '../../src/util'

const BOX_NOT_CREATED_ERROR = 'Box has not been created'

class MyStruct extends Struct<{ a: Str; b: DynamicBytes; c: Bool }> {}

describe('BoxMap', () => {
  const ctx = new TestExecutionContext()
  const keyPrefix = Bytes('test_key_prefix')
  const testData = [
    {
      key: Bytes('abc'),
      value: Uint64(100),
      newValue: Uint64(200),
      emptyValue: Uint64(0),
      withBoxContext: (test: (boxMap: BoxMap<bytes, uint64>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<bytes, uint64>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: 'def',
      value: Bytes('Test1'),
      newValue: Bytes('hello'),
      emptyValue: Bytes(''),
      withBoxContext: (test: (boxMap: BoxMap<string, bytes>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<string, bytes>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: BigUint(123),
      value: 'Test1',
      newValue: 'hello',
      emptyValue: '',
      withBoxContext: (test: (boxMap: BoxMap<biguint, string>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<biguint, string>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: Uint64(456),
      value: BigUint(MAX_UINT64),
      newValue: BigUint(MAX_UINT64 - 1n),
      emptyValue: BigUint(0),
      withBoxContext: (test: (boxMap: BoxMap<uint64, biguint>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<uint64, biguint>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: new Str('ghi'),
      value: BigUint(100),
      newValue: BigUint(200),
      emptyValue: BigUint(0),
      withBoxContext: (test: (boxMap: BoxMap<Str, biguint>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<Str, biguint>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: Uint64(456),
      value: new Str('Test1'),
      newValue: new Str('hello'),
      emptyValue: interpretAsArc4<Str>(Bytes('')),
      withBoxContext: (test: (boxMap: BoxMap<uint64, Str>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<uint64, Str>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: new Str('jkl'),
      value: new DynamicArray(new UintN64(100), new UintN64(200)),
      newValue: new DynamicArray(new UintN64(200), new UintN64(300)),
      emptyValue: interpretAsArc4<DynamicArray<UintN64>>(Bytes('')),
      withBoxContext: (test: (boxMap: BoxMap<Str, DynamicArray<UintN64>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<Str, DynamicArray<UintN64>>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: new Str('TTest'),
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      emptyValue: interpretAsArc4<Tuple<[Str, DynamicBytes, Bool]>>(Bytes('')),
      withBoxContext: (test: (boxMap: BoxMap<Str, readonly [string, bytes, boolean]>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<Str, readonly [string, bytes, boolean]>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: new Str('OTest'),
      value: { a: 'hello', b: Bytes('world'), c: true } as unknown as MyStruct,
      newValue: { a: 'world', b: Bytes('hello'), c: false } as unknown as MyStruct,
      emptyValue: interpretAsArc4<MyStruct>(Bytes('')),
      withBoxContext: (test: (boxMap: BoxMap<Str, MyStruct>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<Str, MyStruct>({ keyPrefix })
          test(boxMap)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: 'hello', b: Bytes('world'), c: true } as unknown as MyStruct,
      newValue: { a: 'world', b: Bytes('hello'), c: false } as unknown as MyStruct,
      emptyValue: interpretAsArc4<MyStruct>(Bytes('')),
      withBoxContext: (test: (boxMap: BoxMap<{ x: uint64; y: uint64 }, MyStruct>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = BoxMap<{ x: uint64; y: uint64 }, MyStruct>({ keyPrefix })
          test(boxMap)
        })
      },
    },
  ]

  afterEach(() => {
    ctx.reset()
  })

  test.for(['key_prefix', Bytes('key_prefix')])('can be initialised with key prefix %s', (keyPrefix) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = BoxMap<bytes, bytes>({ keyPrefix })

      expect(box.keyPrefix.length.valueOf()).toBeGreaterThan(0)
      expect(box.keyPrefix).toEqual(asBytes(keyPrefix))
      expect(() => box(Bytes('')).value).toThrow(BOX_NOT_CREATED_ERROR)
      expect(() => box(Bytes('')).length).toThrow(BOX_NOT_CREATED_ERROR)
    })
  })

  test.each(testData)('key %s and value %s can be set as value', ({ key, value, withBoxContext }) => {
    withBoxContext((boxMap) => {
      boxMap(key as never).value = value

      const boxContent = boxMap(key as never).value
      const fullKey = keyPrefix.concat(toBytes(key))

      const [opBoxContent, opExists] = op.Box.get(fullKey)
      const [opLength, _] = op.Box.length(fullKey)

      expect(opExists).toBe(true)
      expect(boxMap(key as never).length).toEqual(opLength)
      expect(toBytes(boxContent)).toEqual(opBoxContent)
    })
  })

  test.each(testData)('key %s and value %s can be delete', ({ key, value, withBoxContext }) => {
    withBoxContext((boxMap) => {
      boxMap(key as never).value = value

      boxMap(key as never).delete()

      expect(() => boxMap(key as never).value).toThrow(BOX_NOT_CREATED_ERROR)
      const fullKey = keyPrefix.concat(toBytes(key))
      const [opBoxContent, opExists] = op.Box.get(fullKey)
      expect(opExists).toBe(false)
      expect(opBoxContent).toEqual(Bytes(''))
    })
  })

  test.each(testData)('can retrieve existing key %s and value %s using maybe', ({ key, value, withBoxContext }) => {
    withBoxContext((boxMap) => {
      boxMap(key as never).value = value

      const [content, exists] = boxMap(key as never).maybe()

      const fullKey = keyPrefix.concat(toBytes(key))
      const [opContent, opExists] = op.Box.get(fullKey)
      const [opLength, _] = op.Box.length(fullKey)

      expect(exists).toBe(true)
      expect(opExists).toBe(true)
      expect(boxMap(key as never).length).toEqual(opLength)
      expect(toBytes(content)).toEqual(opContent)
    })
  })

  test.each(testData)('can retrieve non-existing value using maybe', ({ key, value, emptyValue, withBoxContext }) => {
    withBoxContext((boxMap) => {
      boxMap(key as never).value = value
      boxMap(key as never).delete()

      const [content, exists] = boxMap(key as never).maybe()

      expect(exists).toBe(false)
      if (content instanceof ARC4Encoded) {
        expect(content.bytes).toEqual((emptyValue as ARC4Encoded).bytes)
      } else {
        expect(content).toEqual(emptyValue)
      }

      const fullKey = keyPrefix.concat(toBytes(key))
      const [opContent, opExists] = op.Box.get(fullKey)
      expect(opExists).toBe(false)
      expect(opContent).toEqual(Bytes(''))
    })
  })

  test.each(testData)('can get typed value after using op.Box.put', ({ key, value, newValue, withBoxContext }) => {
    withBoxContext((boxMap) => {
      boxMap(key as never).value = value
      if (value instanceof ARC4Encoded) {
        expect((boxMap(key as never).value as ARC4Encoded).bytes).toEqual(value.bytes)
      } else {
        expect(boxMap(key as never).value).toEqual(value)
      }

      const newBytesValue = toBytes(newValue)
      const fullKey = keyPrefix.concat(toBytes(key))
      op.Box.put(fullKey, newBytesValue)
      const [opContent, _] = op.Box.get(fullKey)

      expect(opContent).toEqual(newBytesValue)
      if (newValue instanceof ARC4Encoded) {
        expect((boxMap(key as never).value as ARC4Encoded).bytes).toEqual(newValue.bytes)
      } else if (boxMap(key as never).value instanceof ARC4Encoded) {
        expect((boxMap(key as never).value as ARC4Encoded).bytes).toEqual(newBytesValue)
      } else {
        expect(boxMap(key as never).value).toEqual(newValue)
      }
    })
  })

  it('can maintain the mutations to the array box value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const boxMap = BoxMap<Str, DynamicArray<UintN64>>({ keyPrefix })
      const key = new Str('jkl')
      const value = new DynamicArray(new UintN64(100), new UintN64(200))
      boxMap(key).value = value
      expect(boxMap(key).value.length).toEqual(2)
      expect(boxMap(key).value.at(-1).native).toEqual(200)

      // newly pushed value should be retained
      boxMap(key).value.push(new UintN64(300))
      expect(boxMap(key).value.length).toEqual(3)
      expect(boxMap(key).value.at(-1).native).toEqual(300)

      // setting bytes value through op should be reflected in the box value.
      const copy = boxMap(key).value.copy()
      copy[2] = new UintN64(400)
      expect(boxMap(key).value.at(-1).native).toEqual(300)

      const fullKey = keyPrefix.concat(toBytes(key))
      op.Box.put(fullKey, toBytes(copy))
      expect(boxMap(key).value.length).toEqual(3)
      expect(boxMap(key).value.at(-1).native).toEqual(400)
    })
  })

  test('should be able to replace specific bytes values using ref', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const boxMap = BoxMap<uint64, StaticArray<UintN16, 4>>({ keyPrefix: 'a' })

      const box1 = boxMap(1)
      box1.create()

      const boxRefA = box1.ref
      boxRefA.replace(1, new UintN8(123).bytes)
      expect(box1.value[0].native).toEqual(123)
      expect(boxMap(1).value[0].native).toEqual(123)

      const boxRefB = box1.ref
      boxRefB.replace(2, new UintN8(255).bytes)
      expect(box1.value[1].native).toEqual(65280)
      expect(boxMap(1).value[1].native).toEqual(65280)

      const box2 = boxMap(2)
      box2.create()

      const boxRefC = box2.ref
      boxRefC.replace(1, new UintN8(223).bytes)
      expect(box2.value[0].native).toEqual(223)
      expect(boxMap(2).value[0].native).toEqual(223)

      const boxRefD = box2.ref
      boxRefD.replace(3, new UintN8(255).bytes)
      expect(box2.value[1].native).toEqual(255)
      expect(boxMap(2).value[1].native).toEqual(255)
    })
  })
})
