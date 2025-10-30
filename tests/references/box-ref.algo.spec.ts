import type { bytes } from '@algorandfoundation/algorand-typescript'
import { Box, Bytes, op } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { afterEach, describe, expect, it, test } from 'vitest'
import { MAX_BOX_SIZE, MAX_BYTES_SIZE } from '../../src/constants'
import { asBytes, asNumber, asUint64 } from '../../src/util'

const TEST_BOX_KEY = 'test_key'
const BOX_NOT_CREATED_ERROR = 'Box has not been created'

describe('BoxRef', () => {
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test.each(['key', Bytes('key')])('can be initialised with key %s', (key) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key })
      expect(box.exists).toBe(false)
      expect(box.key).toEqual(asBytes(key))
      expect(() => box.value).toThrow(BOX_NOT_CREATED_ERROR)
      expect(() => box.length).toThrow(BOX_NOT_CREATED_ERROR)
    })
  })

  test.each([0, 1, 10, MAX_BOX_SIZE])('can create a box of size %s', (size) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size })

      expect(box.length).toBe(size)

      assertBoxValue(box, new Uint8Array(size))
    })
  })

  it(`throws error when creating a box with size greater than ${MAX_BOX_SIZE}`, () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      expect(() => box.create({ size: MAX_BOX_SIZE + 1 })).toThrow(`Box size cannot exceed ${MAX_BOX_SIZE}`)
    })
  })

  it('can delete value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: MAX_BOX_SIZE })

      expect(box.length).toBe(MAX_BOX_SIZE)

      const existed = box.delete()

      expect(existed).toBe(true)
      expect(box.exists).toBe(false)

      expect(() => box.length).toThrow(BOX_NOT_CREATED_ERROR)
      expect(() => box.resize(10)).toThrow(BOX_NOT_CREATED_ERROR)
      expect(() => box.replace(0, Bytes(0x11))).toThrow(BOX_NOT_CREATED_ERROR)

      expect(box.delete()).toBe(false)
    })
  })

  test.each([
    [1, 0],
    [10, 1],
    [MAX_BOX_SIZE, 10],
    [MAX_BOX_SIZE, MAX_BYTES_SIZE],
  ])('can resize to smaller size from %s to %s', (size, newSize) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size })
      initialiseBoxValue(box, new Uint8Array(Array(size).fill(0x11)))

      box.resize(newSize)
      expect(box.length).toBe(newSize)
      assertBoxValue(box, new Uint8Array(Array(newSize).fill(0x11)))
    })
  })

  test.each([
    [0, 1],
    [1, 10],
    [10, MAX_BYTES_SIZE],
    [MAX_BYTES_SIZE, MAX_BOX_SIZE],
  ])('can resize to larger size from %s to %s', (size, newSize) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size })
      initialiseBoxValue(box, new Uint8Array(Array(size).fill(0x11)))

      box.resize(newSize)
      expect(box.length).toBe(newSize)
      assertBoxValue(
        box,
        new Uint8Array(
          Array(size)
            .fill(0x11)
            .concat(Array(newSize - size).fill(0x00)),
        ),
      )
    })
  })

  it(`throws error when resizing to size greater than ${MAX_BOX_SIZE}`, () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: 10 })

      expect(() => box.resize(MAX_BOX_SIZE + 1)).toThrow(`Box size cannot exceed ${MAX_BOX_SIZE}`)
    })
  })

  it('can replace value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: MAX_BOX_SIZE })

      const boxValue = new Uint8Array(
        Array(MAX_BOX_SIZE / 2)
          .fill([0x01, 0x02])
          .flat(),
      )

      initialiseBoxValue(box, boxValue)

      assertBoxValue(box, boxValue)
    })
  })

  it('throws error when replacing value of a non-existing box', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })

      expect(() => box.replace(0, Bytes(0x11))).toThrow(BOX_NOT_CREATED_ERROR)
    })
  })

  test.each([
    [0, Bytes(new Uint8Array(Array(11).fill(0x11)))],
    [10, Bytes(new Uint8Array([0x11]))],
    [9, Bytes(new Uint8Array(Array(2).fill(0x11)))],
  ])('throws error when replacing with a value that exceeds box size', (start, replacement) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: 10 })

      expect(() => box.replace(asUint64(start), replacement)).toThrow('Replacement content exceeds box size')
    })
  })

  it('can retrieve value using maybe', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: 10 })

      const boxValue = new Uint8Array(Array(5).fill([0x01, 0x02]).flat())
      box.value = Bytes(boxValue)

      const [value, exists] = box.maybe()
      const [opValue, opExists] = op.Box.get(box.key)
      expect(exists).toBe(true)
      expect(opExists).toBe(true)
      expect(value).toEqual(Bytes(boxValue))
      expect(opValue).toEqual(Bytes(boxValue))
    })
  })

  it('can retrieve non-existing value using maybe', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: 10 })

      const boxValue = new Uint8Array(Array(5).fill([0x01, 0x02]).flat())
      box.value = Bytes(boxValue)
      box.delete()

      const [value, exists] = box.maybe()
      const [opValue, opExists] = op.Box.get(box.key)
      expect(exists).toBe(false)
      expect(opExists).toBe(false)
      expect(value).toEqual(Bytes(''))
      expect(opValue).toEqual(Bytes(''))
    })
  })

  test.each([
    [0, Bytes('')],
    [10, Bytes(new Uint8Array(Array(10).fill(0x11)))],
    [MAX_BYTES_SIZE, Bytes(new Uint8Array(Array(MAX_BYTES_SIZE).fill(0x11)))],
  ])('can put and get value', (size, value) => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size })

      box.value = value

      const content = box.get({ default: Bytes(new Uint8Array(size)) })
      expect(content).toEqual(value)

      const [opContent, opExists] = op.Box.get(box.key)
      expect(opExists).toBe(true)
      expect(opContent).toEqual(value)
    })
  })

  it('can put value when box is not created', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })

      const boxValue = new Uint8Array(Array(5).fill([0x01, 0x02]).flat())
      box.value = Bytes(boxValue)

      expect(box.exists).toBe(true)
      expect(box.length).toBe(10)

      const content = box.get({ default: Bytes(new Uint8Array(10)) })
      expect(content).toEqual(Bytes(boxValue))
    })
  })

  it('can get value with default value when box is not created', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })

      const defaultValue = Bytes(new Uint8Array(10))
      const content = box.get({ default: defaultValue })
      expect(content).toEqual(defaultValue)
    })
  })

  it('throws error when put and get value exceeding max bytes size', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: MAX_BOX_SIZE })

      expect(() => (box.value = Bytes(new Uint8Array(Array(MAX_BOX_SIZE).fill(0x11))))).toThrow('exceeds maximum length')
      expect(() => box.get({ default: Bytes(new Uint8Array(Array(MAX_BOX_SIZE).fill(0x11))) })).toThrow('exceeds maximum length')
    })
  })

  it('can splice with longer value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const size = 10
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: size })

      const boxValue = new Uint8Array(Array(5).fill([0x01, 0x02]).flat())
      box.value = Bytes(boxValue)

      const replacement = new Uint8Array(Array(2).fill(0x11))
      box.splice(1, 1, Bytes(replacement))

      const content = box.get({ default: Bytes(new Uint8Array(size)) })

      const opBoxKey = asBytes('another_key')
      op.Box.create(opBoxKey, size)
      op.Box.put(opBoxKey, Bytes(boxValue))
      op.Box.splice(opBoxKey, 1, 1, Bytes(replacement))
      const [opBoxContent, _opBoxExists] = op.Box.get(opBoxKey)
      const [opBoxLength, _] = op.Box.length(opBoxKey)

      expect(content).toEqual(Bytes(new Uint8Array([0x01, ...replacement, 0x01, 0x02, 0x01, 0x02, 0x01, 0x02, 0x01])))
      expect(content).toEqual(opBoxContent)
      expect(box.length).toEqual(size)
      expect(box.length).toEqual(asNumber(opBoxLength))
    })
  })

  it('can splice with shorter value', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const size = 10
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: size })

      const boxValue = new Uint8Array(Array(5).fill([0x01, 0x02]).flat())
      box.value = Bytes(boxValue)

      const replacement = new Uint8Array(Array(2).fill(0x11))
      box.splice(1, 5, Bytes(replacement))

      const content = box.get({ default: Bytes(new Uint8Array(size)) })

      const opBoxKey = asBytes('another_key')
      op.Box.create(opBoxKey, size)
      op.Box.put(opBoxKey, Bytes(boxValue))
      op.Box.splice(opBoxKey, 1, 5, Bytes(replacement))
      const [opBoxContent, _opBoxExists] = op.Box.get(opBoxKey)
      const [opBoxLength, _] = op.Box.length(opBoxKey)

      expect(content).toEqual(Bytes(new Uint8Array([0x01, ...replacement, 0x01, 0x02, 0x01, 0x02, 0x00, 0x00, 0x00])))
      expect(content).toEqual(opBoxContent)
      expect(box.length).toEqual(size)
      expect(box.length).toEqual(asNumber(opBoxLength))
    })
  })

  it('can splice when box does not exist', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })

      expect(() => box.splice(1, 1, Bytes(new Uint8Array([0x11])))).toThrow(BOX_NOT_CREATED_ERROR)
    })
  })

  it('throws error when splicing with index out of bounds', () => {
    ctx.txn.createScope([ctx.any.txn.applicationCall()]).execute(() => {
      const box = Box<bytes>({ key: TEST_BOX_KEY })
      box.create({ size: 10 })

      expect(() => box.splice(11, 1, Bytes(new Uint8Array([0x11])))).toThrow('Start index exceeds box size')
    })
  })
})

const initialiseBoxValue = (box: Box<bytes>, value: Uint8Array): void => {
  let index = 0
  const size = asNumber(value.length)
  while (index < size) {
    const length = Math.min(size - index, MAX_BYTES_SIZE)
    box.replace(index, Bytes(value.slice(index, index + length)))
    index += length
  }
}

const assertBoxValue = (box: Box<bytes>, expectedValue: Uint8Array, start: number = 0): void => {
  let index = start
  const size = expectedValue.length
  while (index < size) {
    const length = Math.min(size - index, MAX_BYTES_SIZE)
    const boxContent = box.extract(index, length)
    const opBoxContent = op.Box.extract(box.key, index, length)
    expect(boxContent).toEqual(opBoxContent)
    expect(boxContent).toEqual(Bytes(expectedValue.slice(index, index + length)))
    index += length
  }
}
