import type { Account, biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, Bytes, clone, LocalMap, op, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { ARC4Encoded, Bool, DynamicArray, DynamicBytes, Str, Struct } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import { toBytes } from '../../src/impl/encoded-types'
import { Uint64Cls } from '../../src/impl/primitives'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes } from '../../src/util'

const VALUE_NOT_SET_ERROR = 'value is not set'

class MyStruct extends Struct<{ a: Str; b: DynamicBytes; c: Bool }> {}
type MyObject = { a: string; b: bytes; c: boolean }
type MyArc4Object = { a: Str; b: DynamicBytes; c: Bool }

describe('LocalMap', () => {
  const ctx = new TestExecutionContext()
  const keyPrefix = Bytes('test_key_prefix')
  const testData = [
    {
      key: Bytes('abc'),
      value: Uint64(100),
      newValue: Uint64(200),
      withLocalContext: (test: (localMap: LocalMap<bytes, uint64>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<bytes, uint64>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: 'def',
      value: Bytes('Test1'),
      newValue: Bytes('hello'),
      withLocalContext: (test: (localMap: LocalMap<string, bytes>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<string, bytes>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: BigUint(123),
      value: 'Test1',
      newValue: 'hello',
      withLocalContext: (test: (localMap: LocalMap<biguint, string>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<biguint, string>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: Uint64(456),
      value: BigUint(100),
      newValue: BigUint(200),
      withLocalContext: (test: (localMap: LocalMap<uint64, biguint>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<uint64, biguint>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: new Str('ghi'),
      value: BigUint(100),
      newValue: BigUint(200),
      withLocalContext: (test: (localMap: LocalMap<Str, biguint>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<Str, biguint>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: Uint64(456),
      value: new Str('Test1'),
      newValue: new Str('hello'),
      withLocalContext: (test: (localMap: LocalMap<uint64, Str>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<uint64, Str>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: new Str('jkl'),
      value: new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200)),
      newValue: new DynamicArray(new arc4.Uint64(200), new arc4.Uint64(300)),
      withLocalContext: (test: (localMap: LocalMap<Str, DynamicArray<arc4.Uint64>>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<Str, DynamicArray<arc4.Uint64>>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: new Str('TTest'),
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      withLocalContext: (test: (localMap: LocalMap<Str, readonly [string, bytes, boolean]>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<Str, readonly [string, bytes, boolean]>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: new Str('TTest'),
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      withLocalContext: (test: (localMap: LocalMap<Str, [string, bytes, boolean]>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<Str, [string, bytes, boolean]>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: new Str('OTest'),
      value: { a: 'hello', b: Bytes('world'), c: true } as unknown as MyStruct,
      newValue: { a: 'world', b: Bytes('hello'), c: false } as unknown as MyStruct,
      withLocalContext: (test: (localMap: LocalMap<Str, MyStruct>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<Str, MyStruct>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      withLocalContext: (test: (localMap: LocalMap<{ x: uint64; y: uint64 }, MyObject>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<{ x: uint64; y: uint64 }, MyObject>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      withLocalContext: (test: (localMap: LocalMap<{ x: uint64; y: uint64 }, Readonly<MyObject>>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<{ x: uint64; y: uint64 }, Readonly<MyObject>>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      withLocalContext: (test: (localMap: LocalMap<{ x: uint64; y: uint64 }, MyArc4Object>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<{ x: uint64; y: uint64 }, MyArc4Object>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
    {
      key: { x: Uint64(21), y: Uint64(42) },
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      withLocalContext: (test: (localMap: LocalMap<{ x: uint64; y: uint64 }, Readonly<MyArc4Object>>, account: Account) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const localMap = LocalMap<{ x: uint64; y: uint64 }, Readonly<MyArc4Object>>({ keyPrefix })
          test(localMap, ctx.defaultSender)
        })
      },
    },
  ]

  afterEach(() => {
    ctx.reset()
  })

  test.for(['key_prefix', Bytes('key_prefix')])('can be initialised with key prefix %s', (keyPrefix) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<bytes, bytes>({ keyPrefix })

      expect(localMap.keyPrefix.length.valueOf()).toBeGreaterThan(0)
      expect(localMap.keyPrefix).toEqual(asBytes(keyPrefix))
      expect(() => localMap(Bytes(''), ctx.defaultSender).value).toThrow(VALUE_NOT_SET_ERROR)
    })
  })

  test.each(testData)('key %s and value %s can be set as value', ({ key, value, withLocalContext }) => {
    withLocalContext((localMap: DeliberateAny, account: Account) => {
      localMap(key, account).value = value

      const classContent = localMap(key, account).value
      const fullKey = keyPrefix.concat(toBytes(key))

      const opContent = op.AppLocal.getBytes(account, fullKey)

      expect(toBytes(classContent)).toEqual(opContent)
    })
  })

  test.each(testData)('hasValue is true after set', ({ key, value, withLocalContext }) => {
    withLocalContext((localMap: DeliberateAny, account: Account) => {
      localMap(key, account).value = value

      expect(localMap(key, account).hasValue).toBe(true)
    })
  })

  test.each(testData.filter((d) => !(d.value instanceof Uint64Cls)))(
    'hasValue is false after delete for non-uint64 types',
    ({ key, value, withLocalContext }) => {
      withLocalContext((localMap: DeliberateAny, account: Account) => {
        localMap(key, account).value = value
        localMap(key, account).delete()

        expect(localMap(key, account).hasValue).toBe(false)
      })
    },
  )

  test('hasValue is true after delete for uint64 type (resets to zero)', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<bytes, uint64>({ keyPrefix })
      const account = ctx.defaultSender
      const key = Bytes('abc')
      localMap(key, account).value = Uint64(100)
      localMap(key, account).delete()

      // uint64 delete resets to Uint64(0) rather than undefined
      expect(localMap(key, account).hasValue).toBe(true)
      expect(localMap(key, account).value).toEqual(Uint64(0))
    })
  })

  test.each(testData.filter((d) => !(d.value instanceof Uint64Cls)))(
    'key %s and value %s can be deleted',
    ({ key, value, withLocalContext }) => {
      withLocalContext((localMap: DeliberateAny, account: Account) => {
        localMap(key, account).value = value

        localMap(key, account).delete()

        expect(() => localMap(key, account).value).toThrow(VALUE_NOT_SET_ERROR)
      })
    },
  )

  test.each(testData)('can get value after using op.AppLocal.put', ({ key, value, newValue, withLocalContext }) => {
    withLocalContext((localMap: DeliberateAny, account: Account) => {
      localMap(key, account).value = value
      if (value instanceof ARC4Encoded) {
        expect((localMap(key, account).value as unknown as ARC4Encoded).bytes).toEqual(value.bytes)
      } else {
        expect(localMap(key, account).value).toEqual(value)
      }

      const newBytesValue = toBytes(newValue)
      const fullKey = keyPrefix.concat(toBytes(key))
      op.AppLocal.put(account, fullKey, newBytesValue)
      const opContent = op.AppLocal.getBytes(account, fullKey)

      expect(opContent).toEqual(newBytesValue)
      // After op.AppLocal.put, the stored value is raw bytes/uint64, not the original typed value
      expect(toBytes(localMap(key, account).value)).toEqual(newBytesValue)
    })
  })

  test('multiple accounts can store different values', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<uint64, bytes>({ keyPrefix })
      const account1 = ctx.defaultSender
      const account2 = ctx.any.account()
      const key = Uint64(1)

      localMap(key, account1).value = Bytes('value1')
      localMap(key, account2).value = Bytes('value2')

      expect(localMap(key, account1).value).toEqual(Bytes('value1'))
      expect(localMap(key, account2).value).toEqual(Bytes('value2'))

      localMap(key, account1).delete()
      expect(localMap(key, account1).hasValue).toBe(false)
      expect(localMap(key, account2).hasValue).toBe(true)
    })
  })

  test('multiple keys can be stored for same account', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<uint64, bytes>({ keyPrefix })
      const account = ctx.defaultSender

      localMap(Uint64(1), account).value = Bytes('one')
      localMap(Uint64(2), account).value = Bytes('two')
      localMap(Uint64(3), account).value = Bytes('three')

      expect(localMap(Uint64(1), account).value).toEqual(Bytes('one'))
      expect(localMap(Uint64(2), account).value).toEqual(Bytes('two'))
      expect(localMap(Uint64(3), account).value).toEqual(Bytes('three'))
    })
  })

  test('get missing key raises', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<uint64, bytes>({ keyPrefix })
      expect(() => localMap(Uint64(404), ctx.defaultSender).value).toThrow(VALUE_NOT_SET_ERROR)
    })
  })

  test('can maintain the mutations to the array local state value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const localMap = LocalMap<Str, DynamicArray<arc4.Uint64>>({ keyPrefix })
      const account = ctx.defaultSender
      const key = new Str('jkl')
      const value = new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200))
      localMap(key, account).value = value
      expect(localMap(key, account).value.length).toEqual(2)
      expect(localMap(key, account).value.at(-1).asUint64()).toEqual(200)

      // newly pushed value should be retained
      localMap(key, account).value.push(new arc4.Uint64(300))
      expect(localMap(key, account).value.length).toEqual(3)
      expect(localMap(key, account).value.at(-1).asUint64()).toEqual(300)

      // modifying a clone should not affect the original
      const copy = clone(localMap(key, account).value)
      copy[2] = new arc4.Uint64(400)
      expect(localMap(key, account).value.at(-1).asUint64()).toEqual(300)

      // setting the modified copy back should update the value
      localMap(key, account).value = copy
      expect(localMap(key, account).value.length).toEqual(3)
      expect(localMap(key, account).value.at(-1).asUint64()).toEqual(400)
    })
  })
})
