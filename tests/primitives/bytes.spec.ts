import type { bytes } from '@algorandfoundation/algorand-typescript'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { beforeAll, describe, expect } from 'vitest'
import { MAX_BYTES_SIZE } from '../../src/constants'

import { sha256 } from '../../src/impl'
import { BytesCls } from '../../src/impl/primitives'
import { asUint8Array } from '../../src/util'
import { getAvmResult, getAvmResultRaw } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'
import { getSha256Hash, padUint8Array } from '../util'

describe('Bytes', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/primitive-ops/contract.algo.ts', {
    PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })

  beforeAll(async () => {
    await localnetFixture.newScope()
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
})
