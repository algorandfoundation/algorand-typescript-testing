import type { bytes } from '@algorandfoundation/algorand-typescript'
import { Bytes, FixedArray, op } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { describe, expect, it } from 'vitest'
import { MAX_BYTES_SIZE } from '../../src/constants'

import type { Byte, StaticArray } from '@algorandfoundation/algorand-typescript/arc4'
import { convertBytes, decodeArc4, sizeOf } from '@algorandfoundation/algorand-typescript/arc4'
import { sha256 } from '../../src/impl'
import { BytesCls } from '../../src/impl/primitives'
import { asUint8Array } from '../../src/util'
import { getAvmResult, getAvmResultRaw } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'
import { getSha256Hash, padUint8Array } from '../util'

describe('Bytes', async () => {
  const test = createArc4TestFixture('tests/artifacts/primitive-ops/contract.algo.ts', {
    PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })

  describe.each([
    ['', '', 0, 0],
    ['1', '', 0, 0],
    ['', '1', 0, 0],
    ['1', '1', 0, 0],
    ['', '0', 0, MAX_BYTES_SIZE - 1],
    ['0', '', MAX_BYTES_SIZE - 1, 0],
    ['1', '0', 0, MAX_BYTES_SIZE - 2],
    ['1', '0', MAX_BYTES_SIZE - 2, 0],
  ])('concat', async (a, b, padASize, padBSize) => {
    test(`${a} concat ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
      const uint8ArrayB = encodingUtil.utf8ToUint8Array(b)
      const avmResult = (await getAvmResult({ appClient }, `verify_bytes_add`, uint8ArrayA, uint8ArrayB, padASize, padBSize))!

      const bytesA = Bytes(padUint8Array(uint8ArrayA, padASize))
      const bytesB = Bytes(padUint8Array(uint8ArrayB, padBSize))
      const result = bytesA.concat(bytesB)
      const resultHash = Bytes(getSha256Hash(asUint8Array(result)))
      expect(resultHash, `for values: ${a}, ${b}`).toEqual(avmResult)
    })
  })

  describe.each([
    ['', '', 1, MAX_BYTES_SIZE],
    ['1', '', 0, MAX_BYTES_SIZE],
    ['', '', MAX_BYTES_SIZE, MAX_BYTES_SIZE],
  ])('concat overflow', async (a, b, padASize, padBSize) => {
    test(`${a} concat ${b} overflows`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
      const uint8ArrayB = encodingUtil.utf8ToUint8Array(b)

      await expect(getAvmResultRaw({ appClient }, `verify_bytes_add`, uint8ArrayA, uint8ArrayB, padASize, padBSize)).rejects.toThrow(
        /concat produced a too big \(\d+\) byte-array/,
      )

      const bytesA = Bytes(padUint8Array(uint8ArrayA, padASize))
      const bytesB = Bytes(padUint8Array(uint8ArrayB, padBSize))
      expect(() => bytesA.concat(bytesB)).toThrow(/Bytes length \d+ exceeds maximum length/)
    })
  })

  describe.each(['and', 'or', 'xor'])('bitwise operators', async (op) => {
    const getStubResult = (a: bytes, b: bytes) => {
      switch (op) {
        case 'and':
          return a.bitwiseAnd(b)
        case 'or':
          return a.bitwiseOr(b)
        case 'xor':
          return a.bitwiseXor(b)
        default:
          throw new Error(`Unknown operator: ${op}`)
      }
    }
    describe.each([
      ['0', '0'],
      ['001', '11'],
      ['100', '11'],
      ['00', '111'],
      ['11', '001'],
      ['', '11'],
    ])(`bitwise ${op}`, async (a, b) => {
      test(`${a} bitwise ${op} ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
        const bytesA = Bytes(a)
        const bytesB = Bytes(b)

        const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
        const uint8ArrayB = encodingUtil.utf8ToUint8Array(b)
        const avmResult = (await getAvmResult({ appClient }, `verify_bytes_${op}`, uint8ArrayA, uint8ArrayB))!
        const result = getStubResult(bytesA, bytesB)
        expect(result, `for values: ${a}, ${b}`).toEqual(avmResult)
      })
    })
  })

  describe.each([
    ['0', 0],
    ['1', 0],
    ['1010', 0],
    ['11100', MAX_BYTES_SIZE - 5],
    ['', MAX_BYTES_SIZE],
  ])('bitwise invert', async (a, padSize) => {
    test(`~${a}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
      const avmResult = (await getAvmResult({ appClient }, `verify_bytes_not`, uint8ArrayA, padSize))!

      const bytesA = Bytes(padUint8Array(uint8ArrayA, padSize))
      const result = bytesA.bitwiseInvert()
      const resultHash = sha256(result)

      expect(resultHash, `for value: ${a}`).toEqual(avmResult)
    })
  })

  describe.each([
    ['0', '0'],
    ['', ''],
    ['11', '11'],
    ['011', '11'],
    ['11', '001'],
    ['', '00'],
  ])('equals', async (a, b) => {
    test(`${a} equals ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const bytesA = Bytes(a)
      const bytesB = Bytes(b)
      const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
      const uint8ArrayB = encodingUtil.utf8ToUint8Array(b)

      const avmResult = await getAvmResult<boolean>({ appClient }, `verify_bytes_eq`, uint8ArrayA, uint8ArrayB)
      const result = bytesA.equals(bytesB)
      expect(result, `for values: ${a}, ${b}`).toEqual(avmResult)
    })
  })

  describe.each([
    ['0', '0'],
    ['', ''],
    ['11', '11'],
    ['011', '11'],
    ['11', '001'],
    ['', '00'],
  ])('not equals', async (a, b) => {
    test(`${a} not equals ${b}`, async ({ appClientPrimitiveOpsContract: appClient }) => {
      const bytesA = Bytes(a)
      const bytesB = Bytes(b)
      const uint8ArrayA = encodingUtil.utf8ToUint8Array(a)
      const uint8ArrayB = encodingUtil.utf8ToUint8Array(b)

      const avmResult = await getAvmResult<boolean>({ appClient }, `verify_bytes_ne`, uint8ArrayA, uint8ArrayB)
      const result = !bytesA.equals(bytesB)
      expect(result, `for values: ${a}, ${b}`).toEqual(avmResult)
    })
  })

  describe('from encoded string', () => {
    test('hex', () => {
      const hex = 'FF'
      const bytes = Bytes.fromHex(hex)
      const resultUint8Array = asUint8Array(bytes)
      expect(resultUint8Array).toEqual(Uint8Array.from([0xff]))
    })

    test('base64', () => {
      const base64 = '/w=='
      const bytes = Bytes.fromBase64(base64)
      const resultUint8Array = asUint8Array(bytes)
      expect(resultUint8Array).toEqual(Uint8Array.from([0xff]))
    })

    test('base32', () => {
      const base32 = '74======'
      const bytes = Bytes.fromBase32(base32)
      const resultUint8Array = asUint8Array(bytes)
      expect(resultUint8Array).toEqual(Uint8Array.from([0xff]))
    })
  })

  describe.each([MAX_BYTES_SIZE + 1, MAX_BYTES_SIZE * 2])('value overflows', (size) => {
    test(`${size} bytes`, () => {
      const a = new Uint8Array(size)
      expect(() => Bytes(a)).toThrow(/Bytes length \d+ exceeds maximum length/)
    })
  })

  describe.each([
    [undefined, new Uint8Array(0)],
    ['ABC', new Uint8Array([0x41, 0x42, 0x43])],
    [new Uint8Array([0xff, 0x00]), new Uint8Array([0xff, 0x00])],
  ])('fromCompat', (a, b) => {
    test(`${a} fromCompat`, async () => {
      const result = BytesCls.fromCompat(a)
      expect(result.asUint8Array()).toEqual(b)
    })
  })

  describe('fixed size', () => {
    it('should be able to create fixed size bytes with no parameter', () => {
      const x = op.bzero(32)
      expect(x.length).toEqual(32)
      expect(x).toEqual(Bytes.fromHex('0000000000000000000000000000000000000000000000000000000000000000', { length: 32 }))
      expect(x).toEqual(Bytes.fromBase64('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', { length: 32 }))
      expect(x).toEqual(Bytes.fromBase32('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==', { length: 32 }))
    })

    it('should be able to create fixed size bytes with parameter', () => {
      const x1 = Bytes(new Uint8Array(32), { length: 32 })
      expect(x1.length).toEqual(32)
      expect(x1).toEqual(op.bzero(32))

      const x2 = Bytes('abcdefghijklmnopqrstuvwxyz123456', { length: 32 })
      expect(x2.length).toEqual(32)
      expect(x2).toEqual(Bytes('abcdefghijklmnopqrstuvwxyz123456'))
      expect(x2).toEqual(Bytes.fromHex('6162636465666768696a6b6c6d6e6f707172737475767778797a313233343536'))
      expect(x2).toEqual(Bytes.fromBase64('YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY='))
      expect(x2).toEqual(Bytes.fromBase32('MFRGGZDFMZTWQ2LKNNWG23TPOBYXE43UOV3HO6DZPIYTEMZUGU3A===='))
    })

    it('should be treated as statically sized', () => {
      expect(sizeOf<bytes<32>>()).toEqual(32)
      expect(sizeOf<FixedArray<bytes<32>, 2>>()).toEqual(64)

      const x1 = new FixedArray<bytes<32>, 2>()
      expect(x1.length).toEqual(2)
      expect(x1[0].length).toEqual(32)
      expect(x1[1].length).toEqual(32)
      expect(x1[0]).toEqual(op.bzero(32))
      expect(x1[1]).toEqual(op.bzero(32))

      const x2 = decodeArc4<FixedArray<bytes<32>, 2>>(op.bzero(64))
      expect(x2.length).toEqual(2)
      expect(x2[0].length).toEqual(32)
      expect(x2[1].length).toEqual(32)

      const x3 = convertBytes<StaticArray<StaticArray<Byte, 32>, 2>>(op.bzero(64), { strategy: 'unsafe-cast' })
      expect(x3.length).toEqual(2)
      expect(x3[0].bytes).toEqual(Bytes.fromHex('0000000000000000000000000000000000000000000000000000000000000000', { length: 32 }))
      expect(x3[1].bytes).toEqual(Bytes.fromHex('0000000000000000000000000000000000000000000000000000000000000000', { length: 32 }))
    })
  })
})
