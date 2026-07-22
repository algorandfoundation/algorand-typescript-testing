import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, Bytes, clone, GlobalMap, op, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { ARC4Encoded, Bool, DynamicArray, DynamicBytes, Str, Struct } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import { MAX_UINT64 } from '../../src/constants'
import { toBytes } from '../../src/impl/encoded-types'
import { Uint64Cls } from '../../src/impl/primitives'
import { asBytes } from '../../src/util'

const VALUE_NOT_SET_ERROR = 'value is not set'

class MyStruct extends Struct<{ a: Str; b: DynamicBytes; c: Bool }> {}
type MyObject = { a: string; b: bytes; c: boolean }
type MyArc4Object = { a: Str; b: DynamicBytes; c: Bool }

describe('GlobalMap', () => {
  const ctx = new TestExecutionContext()
  const keyPrefix = Bytes('test_key_prefix')
  const testData = [
    {
      key: Bytes('abc'),
      value: Uint64(100),
      newValue: Uint64(200),
      withGlobalContext: (test: (globalMap: GlobalMap<bytes, uint64>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<bytes, uint64>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: 'def',
      value: Bytes('Test1'),
      newValue: Bytes('hello'),
      withGlobalContext: (test: (globalMap: GlobalMap<string, bytes>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<string, bytes>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: BigUint(123),
      value: 'Test1',
      newValue: 'hello',
      withGlobalContext: (test: (globalMap: GlobalMap<biguint, string>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<biguint, string>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: Uint64(456),
      value: BigUint(MAX_UINT64),
      newValue: BigUint(MAX_UINT64 - 1n),
      withGlobalContext: (test: (globalMap: GlobalMap<uint64, biguint>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<uint64, biguint>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: new Str('ghi'),
      value: BigUint(100),
      newValue: BigUint(200),
      withGlobalContext: (test: (globalMap: GlobalMap<Str, biguint>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<Str, biguint>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: Uint64(456),
      value: new Str('Test1'),
      newValue: new Str('hello'),
      withGlobalContext: (test: (globalMap: GlobalMap<uint64, Str>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<uint64, Str>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: new Str('jkl'),
      value: new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200)),
      newValue: new DynamicArray(new arc4.Uint64(200), new arc4.Uint64(300)),
      withGlobalContext: (test: (globalMap: GlobalMap<Str, DynamicArray<arc4.Uint64>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<Str, DynamicArray<arc4.Uint64>>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: new Str('TTest'),
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      withGlobalContext: (test: (globalMap: GlobalMap<Str, readonly [string, bytes, boolean]>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<Str, readonly [string, bytes, boolean]>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: new Str('TTest'),
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      withGlobalContext: (test: (globalMap: GlobalMap<Str, [string, bytes, boolean]>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<Str, [string, bytes, boolean]>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: new Str('OTest'),
      value: { a: 'hello', b: Bytes('world'), c: true } as unknown as MyStruct,
      newValue: { a: 'world', b: Bytes('hello'), c: false } as unknown as MyStruct,
      withGlobalContext: (test: (globalMap: GlobalMap<Str, MyStruct>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<Str, MyStruct>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      withGlobalContext: (test: (globalMap: GlobalMap<{ x: uint64; y: uint64 }, MyObject>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<{ x: uint64; y: uint64 }, MyObject>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      withGlobalContext: (test: (globalMap: GlobalMap<{ x: uint64; y: uint64 }, Readonly<MyObject>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<{ x: uint64; y: uint64 }, Readonly<MyObject>>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      withGlobalContext: (test: (globalMap: GlobalMap<{ x: uint64; y: uint64 }, MyArc4Object>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<{ x: uint64; y: uint64 }, MyArc4Object>({ keyPrefix })
          test(globalMap)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      withGlobalContext: (test: (globalMap: GlobalMap<{ x: uint64; y: uint64 }, Readonly<MyArc4Object>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const globalMap = GlobalMap<{ x: uint64; y: uint64 }, Readonly<MyArc4Object>>({ keyPrefix })
          test(globalMap)
        })
      },
    },
  ]

  afterEach(() => {
    ctx.reset()
  })

  test.for(['key_prefix', Bytes('key_prefix')])('can be initialised with key prefix %s', (keyPrefix) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const globalMap = GlobalMap<bytes, bytes>({ keyPrefix })

      expect(globalMap.keyPrefix.length.valueOf()).toBeGreaterThan(0)
      expect(globalMap.keyPrefix).toEqual(asBytes(keyPrefix))
      expect(() => globalMap(Bytes('')).value).toThrow(VALUE_NOT_SET_ERROR)
    })
  })

  test.each(testData)('key %s and value %s can be set as value', ({ key, value, withGlobalContext }) => {
    withGlobalContext((globalMap) => {
      globalMap(key as never).value = value

      const classContent = globalMap(key as never).value
      const fullKey = keyPrefix.concat(toBytes(key))

      const opContent = op.AppGlobal.getBytes(fullKey)

      expect(toBytes(classContent)).toEqual(opContent)
    })
  })

  test.each(testData)('hasValue is true after set', ({ key, value, withGlobalContext }) => {
    withGlobalContext((globalMap) => {
      globalMap(key as never).value = value

      expect(globalMap(key as never).hasValue).toBe(true)
    })
  })

  test.each(testData.filter((d) => !(d.value instanceof Uint64Cls)))(
    'hasValue is false after delete for non-uint64 types',
    ({ key, value, withGlobalContext }) => {
      withGlobalContext((globalMap) => {
        globalMap(key as never).value = value
        globalMap(key as never).delete()

        expect(globalMap(key as never).hasValue).toBe(false)
      })
    },
  )

  test('hasValue is true after delete for uint64 type (resets to zero)', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const globalMap = GlobalMap<bytes, uint64>({ keyPrefix })
      const key = Bytes('abc')
      globalMap(key).value = Uint64(100)
      globalMap(key).delete()

      // uint64 delete resets to Uint64(0) rather than undefined
      expect(globalMap(key).hasValue).toBe(true)
      expect(globalMap(key).value).toEqual(Uint64(0))
    })
  })

  test.each(testData.filter((d) => !(d.value instanceof Uint64Cls)))(
    'key %s and value %s can be deleted',
    ({ key, value, withGlobalContext }) => {
      withGlobalContext((globalMap) => {
        globalMap(key as never).value = value

        globalMap(key as never).delete()

        expect(() => globalMap(key as never).value).toThrow(VALUE_NOT_SET_ERROR)
      })
    },
  )

  test.each(testData)('can get value after using op.AppGlobal.put', ({ key, value, newValue, withGlobalContext }) => {
    withGlobalContext((globalMap) => {
      globalMap(key as never).value = value
      if (value instanceof ARC4Encoded) {
        expect((globalMap(key as never).value as unknown as ARC4Encoded).bytes).toEqual(value.bytes)
      } else {
        expect(globalMap(key as never).value).toEqual(value)
      }

      const newBytesValue = toBytes(newValue)
      const fullKey = keyPrefix.concat(toBytes(key))
      op.AppGlobal.put(fullKey, newBytesValue)
      const opContent = op.AppGlobal.getBytes(fullKey)

      expect(opContent).toEqual(newBytesValue)
      // After op.AppGlobal.put, the stored value is raw bytes/uint64, not the original typed value
      expect(toBytes(globalMap(key as never).value)).toEqual(newBytesValue)
    })
  })

  test('can maintain the mutations to the array global state value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const globalMap = GlobalMap<Str, DynamicArray<arc4.Uint64>>({ keyPrefix })
      const key = new Str('jkl')
      const value = new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200))
      globalMap(key).value = value
      expect(globalMap(key).value.length).toEqual(2)
      expect(globalMap(key).value.at(-1).asUint64()).toEqual(200)

      // newly pushed value should be retained
      globalMap(key).value.push(new arc4.Uint64(300))
      expect(globalMap(key).value.length).toEqual(3)
      expect(globalMap(key).value.at(-1).asUint64()).toEqual(300)

      // modifying a clone should not affect the original
      const copy = clone(globalMap(key).value)
      copy[2] = new arc4.Uint64(400)
      expect(globalMap(key).value.at(-1).asUint64()).toEqual(300)

      // setting the modified copy back should update the value
      globalMap(key).value = copy
      expect(globalMap(key).value.length).toEqual(3)
      expect(globalMap(key).value.at(-1).asUint64()).toEqual(400)
    })
  })
})
