import type { biguint, bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { BigUint, Box, Bytes, op, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { ARC4Encoded, DynamicArray, interpretAsArc4, Str, UintN64 } from '@algorandfoundation/algorand-typescript/arc4'
import { itob } from '@algorandfoundation/algorand-typescript/op'
import { afterEach, describe, expect, it, test } from 'vitest'
import { toBytes } from '../../src/encoders'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes } from '../../src/util'
import { BoxContract } from '../artifacts/box-contract/contract.algo'

const BOX_NOT_CREATED_ERROR = 'Box has not been created'

describe('Box', () => {
  const ctx = new TestExecutionContext()
  const key = Bytes('test_key')
  const testData = [
    {
      value: Uint64(100),
      newValue: Uint64(200),
      emptyValue: Uint64(0),
      withBoxContext: (test: (box: Box<uint64>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const box = Box<uint64>({ key })
          test(box)
        })
      },
    },
    {
      value: Bytes('Test1'),
      newValue: Bytes('hello'),
      emptyValue: Bytes(''),
      withBoxContext: (test: (box: Box<bytes>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const box = Box<bytes>({ key })
          test(box)
        })
      },
    },
    {
      value: 'Test1',
      newValue: 'hello',
      emptyValue: '',
      withBoxContext: (test: (box: Box<string>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const box = Box<string>({ key })
          test(box)
        })
      },
    },
    {
      value: BigUint(100),
      newValue: BigUint(200),
      emptyValue: BigUint(0),
      withBoxContext: (test: (box: Box<biguint>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const box = Box<biguint>({ key })
          test(box)
        })
      },
    },
    {
      value: true,
      newValue: false,
      emptyValue: false,
      withBoxContext: (test: (box: Box<boolean>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const box = Box<boolean>({ key })
          test(box)
        })
      },
    },
    {
      value: new Str('Test1'),
      newValue: new Str('hello'),
      emptyValue: interpretAsArc4<Str>(Bytes('')),
      withBoxContext: (test: (boxMap: Box<Str>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<Str>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: new DynamicArray(new UintN64(100), new UintN64(200)),
      newValue: new DynamicArray(new UintN64(200), new UintN64(300)),
      emptyValue: interpretAsArc4<DynamicArray<UintN64>>(Bytes('')),
      withBoxContext: (test: (boxMap: Box<DynamicArray<UintN64>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<DynamicArray<UintN64>>({ key })
          test(boxMap)
        })
      },
    },
  ]

  afterEach(() => {
    ctx.reset()
  })

  test.each(['key', Bytes('key')])('can be initialised with key %s', (key) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box({ key })
      expect(box.exists).toBe(false)
      expect(box.key).toEqual(asBytes(key))
      expect(() => box.value).toThrow(BOX_NOT_CREATED_ERROR)
      expect(() => box.length).toThrow(BOX_NOT_CREATED_ERROR)
    })
  })

  test.each(testData)('%s can be set as value', ({ value, withBoxContext }) => {
    withBoxContext((box) => {
      box.value = value

      const [content, exists] = op.Box.get(key)
      const [length, _] = op.Box.length(key)

      expect(exists).toBe(true)
      expect(box.length).toEqual(length)
      expect(content).toEqual(toBytes(value))
    })
  })

  test.each(testData)('%s value can be delete', ({ value, withBoxContext }) => {
    withBoxContext((box) => {
      box.value = value

      box.delete()

      expect(box.exists).toBe(false)
      expect(() => box.value).toThrow(BOX_NOT_CREATED_ERROR)

      const [content, exists] = op.Box.get(key)
      expect(exists).toBe(false)
      expect(content).toEqual(Bytes(''))
    })
  })

  test.each(testData)('can retrieve existing value %s using maybe', ({ value, withBoxContext }) => {
    withBoxContext((box) => {
      box.value = value

      const [content, exists] = box.maybe()
      const [opContent, opExists] = op.Box.get(key)

      expect(exists).toBe(true)
      expect(opExists).toBe(true)
      expect(opContent).toEqual(toBytes(content))
    })
  })

  test.each(testData)('can retrieve non-existing value using maybe', ({ value, emptyValue, withBoxContext }) => {
    withBoxContext((box) => {
      box.value = value
      box.delete()

      const [content, exists] = box.maybe()
      const [opContent, opExists] = op.Box.get(key)

      expect(exists).toBe(false)
      expect(opExists).toBe(false)
      expect(opContent).toEqual(Bytes(''))
      if (content instanceof ARC4Encoded) {
        expect(content.bytes).toEqual((emptyValue as ARC4Encoded).bytes)
      } else {
        expect(content).toEqual(emptyValue)
      }
    })
  })

  it('can store enum values', () => {
    const contract = ctx.contract.create(BoxContract)

    const deferredStoreCall = ctx.txn.deferAppCall(contract, contract.storeEnums, 'storeEnums')
    const deferredReadCall = ctx.txn.deferAppCall(contract, contract.read_enums, 'read_enums')

    ctx.txn.createScope([deferredStoreCall, deferredReadCall]).execute(() => {
      deferredStoreCall.submit()
      const [oca, txn] = deferredReadCall.submit().native

      const app = ctx.ledger.getApplicationForContract(contract)
      expect(toBytes(ctx.ledger.getBox(app, 'oca'))).toEqual(itob(oca.native))
      expect(toBytes(ctx.ledger.getBox(app, 'txn'))).toEqual(itob(txn.native))
    })
  })

  test.each(testData)('can get typed value after using op.Box.put', ({ value, newValue, withBoxContext }) => {
    withBoxContext((box) => {
      box.value = value
      if (value instanceof ARC4Encoded) {
        expect((box as DeliberateAny).get(key).bytes).toEqual(value.bytes)
      } else {
        expect(box.value).toEqual(value)
      }

      const newBytesValue = toBytes(newValue)
      op.Box.put(key, newBytesValue)
      const [opContent, _] = op.Box.get(key)

      expect(opContent).toEqual(newBytesValue)
      if (newValue instanceof ARC4Encoded) {
        expect((box as DeliberateAny).get(key).bytes).toEqual(newValue.bytes)
      } else {
        expect(box.value).toEqual(newValue)
      }
    })
  })

  it('can maintain the mutations to the box value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<DynamicArray<UintN64>>({ key })
      const value = new DynamicArray(new UintN64(100), new UintN64(200))
      box.value = value
      expect(box.value.length).toEqual(2)
      expect(box.value.at(-1).native).toEqual(200)

      // newly pushed value should be retained
      box.value.push(new UintN64(300))
      expect(box.value.length).toEqual(3)
      expect(box.value.at(-1).native).toEqual(300)

      // setting bytes value through op should be reflected in the box value.
      const copy = box.value.copy()
      copy[2] = new UintN64(400)
      expect(box.value.at(-1).native).toEqual(300)

      op.Box.put(key, toBytes(copy))
      expect(box.value.length).toEqual(3)
      expect(box.value.at(-1).native).toEqual(400)
    })
  })
})
