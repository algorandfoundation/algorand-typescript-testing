import type { biguint, bytes, FixedArray, uint64 } from '@algorandfoundation/algorand-typescript'
import { arc4, BigUint, Box, Bytes, clone, op, Uint64 } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import type { Uint16 } from '@algorandfoundation/algorand-typescript/arc4'
import {
  ARC4Encoded,
  Bool,
  DynamicArray,
  DynamicBytes,
  interpretAsArc4,
  StaticArray,
  Str,
  Tuple,
  Uint32,
  Uint8,
} from '@algorandfoundation/algorand-typescript/arc4'
import { itob } from '@algorandfoundation/algorand-typescript/op'
import { afterEach, describe, expect, it, test } from 'vitest'
import { MAX_BYTES_SIZE } from '../../src/constants'
import { toBytes } from '../../src/impl/encoded-types'
import type { DeliberateAny } from '../../src/typescript-helpers'
import { asBytes, asUint8Array, concatUint8Arrays } from '../../src/util'
import { BoxContract } from '../artifacts/box-contract/contract.algo'

const BOX_NOT_CREATED_ERROR = 'Box has not been created'

type MyObject = { a: string; b: bytes; c: boolean }
type MyArc4Object = { a: Str; b: DynamicBytes; c: Bool }

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
      value: new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200)),
      newValue: new DynamicArray(new arc4.Uint64(200), new arc4.Uint64(300)),
      emptyValue: interpretAsArc4<DynamicArray<arc4.Uint64>>(Bytes('')),
      withBoxContext: (test: (boxMap: Box<DynamicArray<arc4.Uint64>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<DynamicArray<arc4.Uint64>>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      emptyValue: [],
      withBoxContext: (test: (boxMap: Box<readonly [string, bytes, boolean]>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<readonly [string, bytes, boolean]>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: ['hello', Bytes('world'), true] as const,
      newValue: ['world', Bytes('hello'), false] as const,
      emptyValue: [],
      withBoxContext: (test: (boxMap: Box<[string, bytes, boolean]>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<[string, bytes, boolean]>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      emptyValue: {},
      withBoxContext: (test: (boxMap: Box<MyObject>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<MyObject>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: { a: 'hello', b: Bytes('world'), c: true },
      newValue: { a: 'world', b: Bytes('hello'), c: false },
      emptyValue: {},
      withBoxContext: (test: (boxMap: Box<Readonly<MyObject>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<Readonly<MyObject>>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      emptyValue: {},
      withBoxContext: (test: (boxMap: Box<MyArc4Object>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<MyArc4Object>({ key })
          test(boxMap)
        })
      },
    },
    {
      value: { a: new Str('hello'), b: new DynamicBytes('world'), c: new Bool(true) },
      newValue: { a: new Str('world'), b: new DynamicBytes('hello'), c: new Bool(false) },
      emptyValue: {},
      withBoxContext: (test: (boxMap: Box<Readonly<MyArc4Object>>) => void) => {
        ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
          const boxMap = Box<Readonly<MyArc4Object>>({ key })
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
      expect(toBytes(ctx.ledger.getBox(app, 'oca'))).toEqual(itob(oca.asUint64()))
      expect(toBytes(ctx.ledger.getBox(app, 'txn'))).toEqual(itob(txn.asUint64()))
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
      } else if (box.value instanceof ARC4Encoded) {
        expect(box.value.bytes).toEqual(newBytesValue)
      } else {
        expect(toBytes(box.value)).toEqual(newBytesValue)
      }
    })
  })

  it('can maintain the mutations to the box value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<DynamicArray<arc4.Uint64>>({ key })
      const value = new DynamicArray(new arc4.Uint64(100), new arc4.Uint64(200))
      box.value = value
      expect(box.value.length).toEqual(2)
      expect(box.value.at(-1).asUint64()).toEqual(200)

      // newly pushed value should be retained
      box.value.push(new arc4.Uint64(300))
      expect(box.value.length).toEqual(3)
      expect(box.value.at(-1).asUint64()).toEqual(300)

      // setting bytes value through op should be reflected in the box value.
      const copy = clone(box.value)
      copy[2] = new arc4.Uint64(400)
      expect(box.value.at(-1).asUint64()).toEqual(300)

      op.Box.put(key, toBytes(copy))
      expect(box.value.length).toEqual(3)
      expect(box.value.at(-1).asUint64()).toEqual(400)
    })
  })

  test('should be able to replace specific bytes values using ref', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<StaticArray<Uint16, 4>>({ key: 'a' })
      box.create()

      box.replace(1, new Uint8(123).bytes)
      expect(box.value[0].asUint64()).toEqual(123)

      box.replace(2, new Uint8(255).bytes)
      expect(box.value[1].asUint64()).toEqual(65280)
    })
  })

  it('should be able to store large boolean array', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const boxBool = Box<FixedArray<boolean, 33_000>>({ key: 'tooManyBools' })
      boxBool.create()
      expect(boxBool.length).toEqual(4125)

      boxBool.value[0] = true
      boxBool.value[42] = true
      boxBool.value[500] = true
      boxBool.value[32_999] = true

      expect(boxBool.value[0]).toBe(true)
      expect(boxBool.value[42]).toBe(true)
      expect(boxBool.value[500]).toBe(true)
      expect(boxBool.value[32_999]).toBe(true)

      const box_length = op.Box.length(Bytes('tooManyBools'))[0]
      expect(box_length).toBe(4125)
      const bytes1 = op.Box.extract(Bytes('tooManyBools'), 0, MAX_BYTES_SIZE)
      const bytes2 = op.Box.extract(Bytes('tooManyBools'), MAX_BYTES_SIZE, box_length - MAX_BYTES_SIZE)
      const allBytes = concatUint8Arrays(asUint8Array(bytes1), asUint8Array(bytes2))
      expect(allBytes.length).toBe(4125)

      const tooManyBools = Array(33_000).fill(false)
      tooManyBools[0] = true
      tooManyBools[42] = true
      tooManyBools[500] = true
      tooManyBools[32_999] = true

      const expectedBytes = new Uint8Array(
        Array.from({ length: Math.ceil(tooManyBools.length / 8) }, (_, index) =>
          tooManyBools
            .slice(index * 8, index * 8 + 8)
            .reverse()
            .reduce((sum, val, bit) => sum + (val ? 1 << bit : 0), 0),
        ),
      )

      expect(allBytes).toEqual(expectedBytes)
    })
  })

  describe('Box.create', () => {
    it('throw errors if size is not provided for dynamic value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxStr = Box<string>({ key: 'a' })
        const boxStaticArray = Box<StaticArray<DynamicArray<Uint32>, 10>>({ key: 'c' })
        const boxDynamicArray = Box<DynamicArray<Uint8>>({ key: 'd' })
        const boxTuple = Box<Tuple<[Uint8, Uint8, Bool, Bool, Str]>>({ key: 'e' })

        const errorMessage = 'does not have a fixed byte size. Please specify a size argument'
        expect(() => boxStr.create()).toThrow(errorMessage)
        expect(() => boxStaticArray.create()).toThrow(errorMessage)
        expect(() => boxDynamicArray.create()).toThrow(errorMessage)
        expect(() => boxTuple.create()).toThrow(errorMessage)
      })
    })

    it('throws error if size is less than required for static value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxBool = Box<boolean>({ key: 'bool' })
        const boxArc4Bool = Box<Bool>({ key: 'arc4b' })
        const boxUint = Box<uint64>({ key: 'b' })
        const boxStaticArray = Box<StaticArray<Uint32, 10>>({ key: 'c' })
        const boxTuple = Box<Tuple<[Uint8, Uint8, Bool, Bool]>>({ key: 'e' })
        const errorMessage = 'Box size cannot be less than'
        expect(() => boxBool.create({ size: 7 })).toThrow(`${errorMessage} 8`)
        expect(() => boxArc4Bool.create({ size: 0 })).toThrow(`${errorMessage} 1`)
        expect(() => boxUint.create({ size: 7 })).toThrow(`${errorMessage} 8`)
        expect(() => boxStaticArray.create({ size: 39 })).toThrow(`${errorMessage} 40`)
        expect(() => boxTuple.create({ size: 2 })).toThrow(`${errorMessage} 3`)
      })
    })

    it('throws error when setting value if size is larger than required for static value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxBool = Box<boolean>({ key: 'bool' })
        const boxArc4Bool = Box<Bool>({ key: 'arc4b' })
        const boxUint = Box<uint64>({ key: 'b' })
        const boxStaticArray = Box<StaticArray<Uint32, 10>>({ key: 'c' })
        const boxTuple = Box<Tuple<readonly [Uint8, Uint8, Bool, Bool]>>({ key: 'e' })

        const errorMessage = 'attempt to box_put wrong size'
        boxBool.create({ size: 9 })
        expect(() => (boxBool.value = true)).toThrow(errorMessage)

        boxArc4Bool.create({ size: 2 })
        expect(() => (boxArc4Bool.value = new Bool(true))).toThrow(errorMessage)

        boxUint.create({ size: 9 })
        expect(() => (boxUint.value = Uint64(100))).toThrow(errorMessage)

        boxStaticArray.create({ size: 41 })
        expect(
          () =>
            (boxStaticArray.value = new StaticArray(
              new Uint32(100),
              new Uint32(200),
              new Uint32(300),
              new Uint32(400),
              new Uint32(500),
              new Uint32(600),
              new Uint32(700),
              new Uint32(800),
              new Uint32(900),
              new Uint32(1000),
            )),
        ).toThrow(errorMessage)

        boxTuple.create({ size: 4 })
        expect(() => (boxTuple.value = new Tuple(new Uint8(1), new Uint8(2), new Bool(true), new Bool(false)))).toThrow(errorMessage)
      })
    })

    it('set correct size if size is not provided for static value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxBool = Box<boolean>({ key: 'bool' })
        const boxArc4Bool = Box<Bool>({ key: 'arc4b' })
        const boxUint = Box<uint64>({ key: 'b' })
        const boxStaticArray = Box<StaticArray<Uint32, 10>>({ key: 'c' })
        const boxTuple = Box<Tuple<readonly [Uint8, Uint8, Bool, Bool]>>({ key: 'e' })

        boxBool.create()
        expect(boxBool.length).toEqual(8)
        boxBool.value = true
        expect(boxBool.length).toEqual(8)

        boxArc4Bool.create()
        expect(boxArc4Bool.length).toEqual(1)
        boxArc4Bool.value = new Bool(true)
        expect(boxArc4Bool.length).toEqual(1)

        boxUint.create()
        expect(boxUint.length).toEqual(8)
        boxUint.value = Uint64(100)
        expect(boxUint.length).toEqual(8)

        boxStaticArray.create()
        expect(boxStaticArray.length).toEqual(40)
        boxStaticArray.value = new StaticArray(
          new Uint32(100),
          new Uint32(200),
          new Uint32(300),
          new Uint32(400),
          new Uint32(500),
          new Uint32(600),
          new Uint32(700),
          new Uint32(800),
          new Uint32(900),
          new Uint32(1000),
        )
        expect(boxStaticArray.length).toEqual(40)

        boxTuple.create()
        expect(boxTuple.length).toEqual(3)
        boxTuple.value = new Tuple(new Uint8(1), new Uint8(2), new Bool(true), new Bool(false))
        expect(boxTuple.length).toEqual(3)
      })
    })

    it('can set value if size provided is less than required for dynamic value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxStr = Box<string>({ key: 'a' })
        const boxStaticArray = Box<StaticArray<DynamicArray<Uint32>, 10>>({ key: 'c' })
        const boxDynamicArray = Box<DynamicArray<Uint8>>({ key: 'd' })
        const boxTuple = Box<Tuple<readonly [Uint8, Uint8, Bool, Bool, Str]>>({ key: 'e' })

        boxStr.create({ size: 2 })
        boxStr.value = 'hello'
        expect(boxStr.length).toEqual(5)

        boxStaticArray.create({ size: 2 })
        boxStaticArray.value = new StaticArray(
          new DynamicArray(new Uint32(100), new Uint32(200)),
          new DynamicArray(new Uint32(300), new Uint32(400)),
          new DynamicArray(new Uint32(500), new Uint32(600)),
          new DynamicArray(new Uint32(700), new Uint32(800)),
          new DynamicArray(new Uint32(900), new Uint32(1000)),
          new DynamicArray(new Uint32(1100), new Uint32(1200)),
          new DynamicArray(new Uint32(1300), new Uint32(1400)),
          new DynamicArray(new Uint32(1500), new Uint32(1600)),
          new DynamicArray(new Uint32(1700), new Uint32(1800)),
          new DynamicArray(new Uint32(1900), new Uint32(2000)),
        )
        expect(boxStaticArray.length).toEqual(120)

        boxDynamicArray.create({ size: 2 })
        boxDynamicArray.value = new DynamicArray(new Uint8(100), new Uint8(200))
        expect(boxDynamicArray.length).toEqual(4)

        boxTuple.create({ size: 2 })
        boxTuple.value = new Tuple(new Uint8(1), new Uint8(2), new Bool(true), new Bool(false), new Str('hello'))
        expect(boxTuple.length).toEqual(12)
      })
    })

    it('can set value if size provided is larger than required for dynamic value type', () => {
      ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
        const boxStr = Box<string>({ key: 'a' })
        const boxStaticArray = Box<StaticArray<DynamicArray<Uint32>, 10>>({ key: 'c' })
        const boxDynamicArray = Box<DynamicArray<Uint8>>({ key: 'd' })
        const boxTuple = Box<Tuple<readonly [Uint8, Uint8, Bool, Bool, Str]>>({ key: 'e' })

        boxStr.create({ size: 200 })
        boxStr.value = 'hello'
        expect(boxStr.length).toEqual(5)

        boxStaticArray.create({ size: 200 })
        boxStaticArray.value = new StaticArray(
          new DynamicArray(new Uint32(100), new Uint32(200)),
          new DynamicArray(new Uint32(300), new Uint32(400)),
          new DynamicArray(new Uint32(500), new Uint32(600)),
          new DynamicArray(new Uint32(700), new Uint32(800)),
          new DynamicArray(new Uint32(900), new Uint32(1000)),
          new DynamicArray(new Uint32(1100), new Uint32(1200)),
          new DynamicArray(new Uint32(1300), new Uint32(1400)),
          new DynamicArray(new Uint32(1500), new Uint32(1600)),
          new DynamicArray(new Uint32(1700), new Uint32(1800)),
          new DynamicArray(new Uint32(1900), new Uint32(2000)),
        )
        expect(boxStaticArray.length).toEqual(120)

        boxDynamicArray.create({ size: 200 })
        boxDynamicArray.value = new DynamicArray(new Uint8(100), new Uint8(200))
        expect(boxDynamicArray.length).toEqual(4)

        boxTuple.create({ size: 200 })
        boxTuple.value = new Tuple(new Uint8(1), new Uint8(2), new Bool(true), new Bool(false), new Str('hello'))
        expect(boxTuple.length).toEqual(12)
      })
    })
  })
})
