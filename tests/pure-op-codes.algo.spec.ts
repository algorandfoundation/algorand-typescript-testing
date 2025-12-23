import type { bytes, uint64 } from '@algorandfoundation/algorand-typescript'
import { Base64, BigUint, Bytes, err, Uint64 } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect } from 'vitest'
import { TestExecutionContext } from '../src'
import {
  BIGUINT_OVERFLOW_UNDERFLOW_MESSAGE,
  MAX_BYTES_SIZE,
  MAX_UINT512,
  MAX_UINT64,
  UINT64_OVERFLOW_UNDERFLOW_MESSAGE,
} from '../src/constants'
import * as op from '../src/impl/pure'
import { asBigUintCls, asUint8Array } from '../src/util'
import { getAvmResult, getAvmResultRaw } from './avm-invoker'
import { createArc4TestFixture } from './test-fixture'
import { base64Encode, base64UrlEncode, getPaddedBytes, getSha256Hash, intToBytes } from './util'

const avmIntArgOverflowError = 'is not a non-negative int or too big to fit in size'
const extractOutOfBoundError = /extraction (start|end) \d+ is beyond length/
const sqrtMaxUint64 = 4294967295n

describe('Pure op codes', async () => {
  const test = createArc4TestFixture({
    paths: 'tests/artifacts/miscellaneous-ops/contract.algo.ts',
    contracts: {
      MiscellaneousOpsContract: {},
    },
  })
  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  describe('addw', async () => {
    test.for([
      [0, 0],
      [0, MAX_UINT64],
      [MAX_UINT64, 0],
      [1, 0],
      [0, 1],
      [100, 42],
      [1, MAX_UINT64 - 1n],
      [MAX_UINT64 - 1n, 1],
      [100, MAX_UINT64],
      [MAX_UINT64, MAX_UINT64],
    ])('should add two uint64 values', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64[]>({ appClient }, 'verify_addw', a, b)
      const result = op.addw(a, b)
      expect(result[0].valueOf()).toBe(avmResult[0])
      expect(result[1].valueOf()).toBe(avmResult[1])
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 0],
    ])('should throw error when input overflows', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_addw', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.addw(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe('base64Decode', async () => {
    test.for([
      base64Encode(''),
      base64Encode('abc'),
      base64Encode('hello, world.'),
      base64Encode('0123.'),
      base64Encode(Bytes([0xff])),
      base64Encode(Bytes(Array(256).fill(0x00).concat([0xff]))),
    ])('should decode standard base64 string', async (a, { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_base64_decode_standard', asUint8Array(a)))!
      const result = op.base64Decode(Base64.StdEncoding, a)
      expect(result).toEqual(avmResult)
    })

    test.for([Bytes(Bytes(Array(256).fill(0x00).concat([0xff]))), asBigUintCls(BigUint(MAX_UINT512)).toBytes().asAlgoTs()])(
      'should throw error when input is not a valid base64 string',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_base64_decode_standard', asUint8Array(a))).rejects.toThrow(
          'illegal base64 data at input byte 0',
        )
        expect(() => op.base64Decode(Base64.StdEncoding, a)).toThrow('illegal base64 data')
      },
    )

    test.for([
      base64UrlEncode(''),
      base64UrlEncode('abc'),
      base64UrlEncode('hello, world.'),
      base64UrlEncode('0123.'),
      base64UrlEncode(Bytes([0xff])),
      base64UrlEncode(Bytes(Array(256).fill(0x00).concat([0xff]))),
    ])('should decode base64url string', async (a, { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_base64_decode_url', asUint8Array(a)))!
      const result = op.base64Decode(Base64.URLEncoding, a)
      expect(result).toEqual(avmResult)
    })

    test.for([Bytes(Bytes(Array(256).fill(0x00).concat([0xff]))), asBigUintCls(BigUint(MAX_UINT512)).toBytes().asAlgoTs()])(
      'should throw error when input is not a valid base64url string',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_base64_decode_url', asUint8Array(a))).rejects.toThrow('illegal base64 data')
        expect(() => op.base64Decode(Base64.URLEncoding, a)).toThrow('illegal base64 data')
      },
    )
  })

  describe('bitLength', async () => {
    test.for([
      [Bytes(encodingUtil.bigIntToUint8Array(0n)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(1n)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT64)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512 * MAX_UINT512)), 0],
      [Bytes(Array(8).fill(0x00).concat(Array(4).fill(0x0f))), 0],
      [Bytes([0x0f]), MAX_BYTES_SIZE - 1],
      [Bytes(), 0],
    ])('should return the number of bits for the bytes input', async ([a, padSize], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_bytes_bitlen', asUint8Array(a as bytes), padSize as number)
      const paddedA = getPaddedBytes(padSize as number, a as bytes)
      const result = op.bitLength(paddedA)
      expect(result).toEqual(avmResult)
    })

    test.for([0, 1, 42, MAX_UINT64])(
      'should return the number of bits for the uint64 input',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_uint64_bitlen', a)
        const result = op.bitLength(a)
        expect(result).toEqual(avmResult)
      },
    )

    test.for([MAX_UINT64 + 1n, MAX_UINT512, MAX_UINT512 * 2n])(
      'should throw error when uint64 input overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_uint64_bitlen', a)).rejects.toThrow(avmIntArgOverflowError)
        expect(() => op.bitLength(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      },
    )
  })

  describe('bsqrt', async () => {
    test.for([0, 1, 2, 9, 13, 144n, MAX_UINT64, MAX_UINT512])(
      'should compute the square root of a big uint',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const uint8ArrayA = encodingUtil.bigIntToUint8Array(BigInt(a))
        const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_bsqrt', uint8ArrayA))!

        const result = op.bsqrt(a)
        const bytesResult = asBigUintCls(result).toBytes()
        expect(bytesResult).toEqual(avmResult)
      },
    )

    test.for([MAX_UINT512 + 1n, MAX_UINT512 * 2n])(
      'should throw error when input overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const uint8ArrayA = encodingUtil.bigIntToUint8Array(BigInt(a))
        await expect(getAvmResultRaw({ appClient }, 'verify_bsqrt', uint8ArrayA)).rejects.toThrow('math attempted on large byte-array')
        expect(() => op.bsqrt(a)).toThrow(BIGUINT_OVERFLOW_UNDERFLOW_MESSAGE)
      },
    )
  })

  describe('btoi', async () => {
    test.for([
      Bytes(encodingUtil.bigIntToUint8Array(0n)),
      Bytes(encodingUtil.bigIntToUint8Array(1n)),
      Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT64)),
      Bytes(Array(4).fill(0x00).concat(Array(4).fill(0x0f))),
    ])('should convert bytes to uint64', async (a, { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_btoi', asUint8Array(a))
      const result = op.btoi(a)
      expect(result).toEqual(avmResult)
    })

    test.for([
      Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512)),
      Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512 * MAX_UINT512, 128)),
      Bytes(Array(5).fill(0x00).concat(Array(4).fill(0x0f))),
    ])('should throw error when input overflows', async (a, { appClientMiscellaneousOpsContract: appClient }) => {
      const errorRegex = new RegExp(`btoi arg too long, got ${a.length.valueOf()} bytes`)
      await expect(getAvmResultRaw({ appClient }, 'verify_btoi', asUint8Array(a))).rejects.toThrow(errorRegex)
      expect(() => op.btoi(a)).toThrow(errorRegex)
    })
  })

  describe('bzero', async () => {
    test.for([0, 1, 42, MAX_BYTES_SIZE])(
      'should return a zero filled bytes value of the given size',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_bzero', a))!
        const result = op.bzero(a)
        const resultHash = Bytes(getSha256Hash(asUint8Array(result)))
        expect(resultHash).toEqual(avmResult)
      },
    )

    test.for([MAX_BYTES_SIZE + 1, MAX_UINT64])(
      'should throw error when result overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_bzero', a)).rejects.toThrow('bzero attempted to create a too large string')
        expect(() => op.bzero(a)).toThrow('bzero attempted to create a too large string')
      },
    )

    test.for([MAX_UINT64 + 1n, MAX_UINT512, MAX_UINT512 * 2n])(
      'should throw error when input overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_bzero', a)).rejects.toThrow(avmIntArgOverflowError)
        expect(() => op.bzero(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      },
    )
  })

  describe('concat', async () => {
    test.for([
      ['', '', 0, 0],
      ['1', '', 0, 0],
      ['', '1', 0, 0],
      ['1', '1', 0, 0],
      ['', '0', 0, MAX_BYTES_SIZE - 1],
      ['0', '', MAX_BYTES_SIZE - 1, 0],
      ['1', '0', 0, MAX_BYTES_SIZE - 2],
      ['1', '0', MAX_BYTES_SIZE - 2, 0],
    ])('should retrun concatenated bytes', async ([a, b, padASize, padBSize], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>(
        { appClient },
        'verify_concat',
        asUint8Array(a as string),
        asUint8Array(b as string),
        padASize,
        padBSize,
      ))!

      const paddedA = getPaddedBytes(padASize as number, a as string)
      const paddedB = getPaddedBytes(padBSize as number, b as string)

      const result = op.concat(paddedA, paddedB)
      const resultHash = Bytes(getSha256Hash(asUint8Array(result)))
      expect(resultHash).toEqual(avmResult)
    })

    test.for([
      ['1', '0', MAX_BYTES_SIZE - 1, 0],
      ['1', '1', MAX_BYTES_SIZE - 1, MAX_BYTES_SIZE - 1],
      ['1', '0', 0, MAX_BYTES_SIZE - 1],
    ])('should throw error when input overflows', async ([a, b, padASize, padBSize], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(
        getAvmResultRaw({ appClient }, 'verify_concat', asUint8Array(a as string), asUint8Array(b as string), padASize, padBSize),
      ).rejects.toThrow(/concat produced a too big \(\d+\) byte-array/)
      const paddedA = getPaddedBytes(padASize as number, a as string)
      const paddedB = getPaddedBytes(padBSize as number, b as string)

      expect(() => op.concat(paddedA, paddedB)).toThrow(/Bytes length \d+ exceeds maximum length/)
    })
  })

  describe('divmodw', async () => {
    test.for([
      [0, 1, 0, 1],
      [100, 42, 100, 42],
      [42, 100, 42, 100],
      [0, MAX_UINT64, 0, MAX_UINT64],
      [MAX_UINT64, 1, MAX_UINT64, 1],
      [1, MAX_UINT64, 1, MAX_UINT64],
      [MAX_UINT64 - 1n, 1, MAX_UINT64 - 1n, 1],
      [1, MAX_UINT64 - 1n, 1, MAX_UINT64 - 1n],
      [100, MAX_UINT64, 100, MAX_UINT64],
      [MAX_UINT64, MAX_UINT64, MAX_UINT64, MAX_UINT64],
    ])('should calculate div and mod results', async ([a, b, c, d], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64[]>({ appClient }, 'verify_divmodw', a, b, c, d)
      const result = op.divmodw(a, b, c, d)
      expect(result[0].valueOf()).toBe(avmResult[0])
      expect(result[1].valueOf()).toBe(avmResult[1])
      expect(result[2].valueOf()).toBe(avmResult[2])
      expect(result[3].valueOf()).toBe(avmResult[3])
    })

    test.for([
      [1, MAX_UINT64 + 1n, 1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1, MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512, 0, MAX_UINT512],
      [MAX_UINT512 * 2n, 1, MAX_UINT512 * 2n, 1],
    ])('should throw error when input overflows', async ([a, b, c, d], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_divmodw', a, b, c, d)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.divmodw(a, b, c, d)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [0, 1],
      [100, 42],
      [42, 100],
      [0, MAX_UINT64],
      [MAX_UINT64, 1],
      [1, MAX_UINT64],
      [MAX_UINT64 - 1n, 1],
      [1, MAX_UINT64 - 1n],
      [100, MAX_UINT64],
      [MAX_UINT64, MAX_UINT64],
    ])('should throw error when dividing by zero', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_divmodw', a, b, 0, 0)).rejects.toThrow('/ 0')
      expect(() => op.divmodw(a, b, 0, 0)).toThrow('Division by zero')
    })
  })

  describe('divw', async () => {
    test.for([
      [0, 1, 1],
      [42, 100, 100],
      [0, MAX_UINT64, MAX_UINT64],
      [1, MAX_UINT64, MAX_UINT64],
      [1, MAX_UINT64 - 1n, MAX_UINT64 - 1n],
      [100, MAX_UINT64, MAX_UINT64],
    ])('should calculate div result', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64[]>({ appClient }, 'verify_divw', a, b, c)
      const result = op.divw(a, b, c)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [0, 1],
      [100, 42],
      [42, 100],
      [0, MAX_UINT64],
      [MAX_UINT64, 1],
      [1, MAX_UINT64],
      [MAX_UINT64 - 1n, 1],
      [1, MAX_UINT64 - 1n],
      [100, MAX_UINT64],
      [MAX_UINT64, MAX_UINT64],
    ])('should throw error when dividing by zero', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_divw', a, b, 0)).rejects.toThrow('divw 0')
      expect(() => op.divw(a, b, 0)).toThrow('Division by zero')
    })

    test.for([
      [1, MAX_UINT64 + 1n, 1],
      [MAX_UINT64 + 1n, 1, MAX_UINT64 + 1n],
      [0, MAX_UINT512, MAX_UINT512],
      [MAX_UINT512 * 2n, 1, MAX_UINT512 * 2n],
    ])('should throw error when input overflows', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_divw', a, b, c)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.divw(a, b, c)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [100, 42, 42],
      [MAX_UINT64, 1, 1],
      [MAX_UINT64 - 1n, 1, 1],
      [MAX_UINT64, MAX_UINT64, MAX_UINT64],
    ])('should throw error when result overflows', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_divw', a, b, c)).rejects.toThrow('divw overflow')
      expect(() => op.divw(a, b, c)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe('err', async () => {
    test('should throw default error', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_err')).rejects.toThrow('err opcode executed')
      expect(() => err()).toThrow('err opcode executed')
    })
  })

  describe('exp', async () => {
    test.for([
      [0, 1],
      [1, 0],
      [42, 11],
      [sqrtMaxUint64, 2],
      [1, MAX_UINT64],
    ])('should calculate the exponentiation result', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_exp', a, b)
      const result = op.exp(a, b)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [100, 42],
      [MAX_UINT64, 2],
      [2, 64],
    ])('should throw error when result overflows', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_exp', a, b)).rejects.toThrow('overflow')
      expect(() => op.exp(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 1],
    ])('should throw error when input overflows', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_exp', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.exp(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test('0 ** 0 is not supported', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_exp', 0, 0)).rejects.toThrow('0^0 is undefined')
      expect(() => op.exp(0, 0)).toThrow('0 ** 0 is undefined')
    })
  })

  describe('expw', async () => {
    test.for([
      [0, 1],
      [1, 0],
      [42, 11],
      [sqrtMaxUint64, 4],
      [2, 127],
    ])('should calculate the exponentiation result', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64[]>({ appClient }, 'verify_expw', a, b)
      const result = op.expw(a, b)
      expect(result[0].valueOf()).toBe(avmResult[0])
      expect(result[1].valueOf()).toBe(avmResult[1])
    })

    test.for([
      [100, 42],
      [MAX_UINT64, 3],
      [2, 128],
    ])('should throw error when result overflows', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_expw', a, b)).rejects.toThrow('overflow')
      expect(() => op.expw(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 1],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_expw', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.expw(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test('0 ** 0 is not supported', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_expw', 0, 0)).rejects.toThrow('0^0 is undefined')
      expect(() => op.expw(0, 0)).toThrow('0 ** 0 is undefined')
    })
  })

  describe('extract', async () => {
    test.for([
      [0, 0],
      [0, 1],
      [0, 2],
      [11, 1],
      [12, 0],
      [8, 4],
      [256, 0],
      [256, 3],
    ])(`should extract bytes from the input`, async ([b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const a = 'hello, world'.repeat(30)
      const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_extract', asUint8Array(a), b, c))!
      let result = op.extract(a, Uint64(b), Uint64(c))
      expect(result).toEqual(avmResult)

      if (c) {
        result = op.extract(a, b, c)
        expect(result).toEqual(avmResult)
      }
    })

    test.for(['hello, world', 'hi'])(
      'should work to extract bytes from 2 to end for %s',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_extract_from_2', asUint8Array(a)))!
        const result = op.extract(a, 2)
        expect(result).toEqual(avmResult)
      },
    )

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 1],
    ])(`should throw error when input overflows`, async ([b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const a = 'hello, world'.repeat(30)
      await expect(getAvmResultRaw({ appClient }, 'verify_extract', asUint8Array(a), b, c)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.extract(a, b, c)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [0, 13],
      [13, 0],
      [11, 2],
      [8, 5],
    ])('should throw error when input is invalid', async ([b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const a = 'hello, world'
      await expect(getAvmResultRaw({ appClient }, 'verify_extract', asUint8Array(a), b, c)).rejects.toThrow(extractOutOfBoundError)
      expect(() => op.extract(a, b, c)).toThrow(extractOutOfBoundError)
    })
  })

  describe('extractUint16', async () => {
    test.for([
      [intToBytes(256), 0],
      [getPaddedBytes(2, intToBytes(256)), 2],
      [intToBytes(MAX_UINT64), 6],
      [intToBytes(MAX_UINT512), 62],
    ])(`should extract uint16 from the input`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_extract_uint16', asUint8Array(a as bytes), b as number)
      const result = op.extractUint16(a as bytes, b as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [getPaddedBytes(2, intToBytes(256)), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT64), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT512), MAX_UINT512],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint16', asUint8Array(a as bytes), b as bigint)).rejects.toThrow(
        avmIntArgOverflowError,
      )
      expect(() => op.extractUint16(a as bytes, b as bigint)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [intToBytes(0), 0],
      [intToBytes(0), 1],
      [intToBytes(256), 1],
      [getPaddedBytes(2, intToBytes(256)), 3],
      [intToBytes(MAX_UINT64), 8],
      [intToBytes(MAX_UINT512), 65],
    ])(`should throw error when input is invalid`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint16', asUint8Array(a as bytes), b as number)).rejects.toThrow(
        extractOutOfBoundError,
      )
      expect(() => op.extractUint16(a as bytes, b as number)).toThrow(extractOutOfBoundError)
    })
  })

  describe('extractUint32', async () => {
    test.for([
      [Bytes([0x0f, 0x66, 0x66, 0x66]), 0],
      [getPaddedBytes(4, intToBytes(256)), 2],
      [intToBytes(MAX_UINT64), 4],
      [intToBytes(MAX_UINT512), 60],
    ])(`should extract uint32 from the input`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_extract_uint32', asUint8Array(a as bytes), b as number)
      const result = op.extractUint32(a as bytes, b as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [getPaddedBytes(4, intToBytes(256)), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT64), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT512), MAX_UINT512],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint32', asUint8Array(a as bytes), b as bigint)).rejects.toThrow(
        avmIntArgOverflowError,
      )
      expect(() => op.extractUint32(a as bytes, b as bigint)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [intToBytes(0), 0],
      [intToBytes(0), 1],
      [intToBytes(256), 1],
      [getPaddedBytes(4, intToBytes(256)), 3],
      [intToBytes(MAX_UINT64), 8],
      [intToBytes(MAX_UINT512), 65],
    ])(`should throw error when input is invalid`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint32', asUint8Array(a as bytes), b as number)).rejects.toThrow(
        extractOutOfBoundError,
      )
      expect(() => op.extractUint32(a as bytes, b as number)).toThrow(extractOutOfBoundError)
    })
  })

  describe('extractUint64', async () => {
    test.for([
      [Bytes([0x0f, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66]), 0],
      [getPaddedBytes(8, intToBytes(256)), 2],
      [intToBytes(MAX_UINT64), 0],
      [intToBytes(MAX_UINT512), 56],
    ])(`should extract uint64 from the input`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_extract_uint64', asUint8Array(a as bytes), b as number)
      const result = op.extractUint64(a as bytes, b as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [getPaddedBytes(8, intToBytes(256)), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT64), MAX_UINT64 + 1n],
      [intToBytes(MAX_UINT512), MAX_UINT512],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint64', asUint8Array(a as bytes), b as bigint)).rejects.toThrow(
        avmIntArgOverflowError,
      )
      expect(() => op.extractUint64(a as bytes, b as bigint)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [intToBytes(0), 0],
      [intToBytes(0), 1],
      [intToBytes(256), 1],
      [getPaddedBytes(8, intToBytes(256)), 3],
      [intToBytes(MAX_UINT64), 8],
      [intToBytes(MAX_UINT512), 65],
    ])(`should throw error when input is invalid`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_extract_uint64', asUint8Array(a as bytes), b as number)).rejects.toThrow(
        extractOutOfBoundError,
      )
      expect(() => op.extractUint64(a as bytes, b as number)).toThrow(extractOutOfBoundError)
    })
  })

  describe('getBit', async () => {
    test.for([
      [Bytes([0x00]), 0],
      [getPaddedBytes(2, intToBytes(256)), 3],
      [getPaddedBytes(2, intToBytes(256)), 0],
      [getPaddedBytes(2, intToBytes(256)), 11],
      [getPaddedBytes(2, intToBytes(65535)), 31],
      [getPaddedBytes(2, intToBytes(65535)), 24],
      [intToBytes(MAX_UINT64), 63],
      [intToBytes(MAX_UINT64 - 1n), 63],
      [intToBytes(MAX_UINT512), 511],
      [intToBytes(MAX_UINT512 - 1n), 511],
      [intToBytes(MAX_UINT64), 0],
      [intToBytes(MAX_UINT512), 0],
    ])(`should get the bit at the given index of bytes value`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_getbit_bytes', asUint8Array(a as bytes), b as number)
      const result = op.getBit(a, b as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [Bytes([0x00]), 8],
      [intToBytes(MAX_UINT64), 64],
      [intToBytes(MAX_UINT64 - 1n), 64],
      [intToBytes(MAX_UINT512), 512],
      [intToBytes(MAX_UINT512 - 1n), 512],
    ])('should throw error when index out of bound of bytes value', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_getbit_bytes', asUint8Array(a as bytes), b as number)).rejects.toThrow(
        'getbit index beyond byteslice',
      )
      expect(() => op.getBit(a, b as number)).toThrow(/getBit index \d+ is beyond length/)
    })

    test.for([
      [0, 0],
      [0, 3],
      [0, 10],
      [256, 3],
      [256, 0],
      [256, 11],
      [65535, 15],
      [65535, 7],
      [65535, 63],
      [MAX_UINT64, 63],
      [MAX_UINT64 - 1n, 63],
      [MAX_UINT64, 0],
    ])(`should get the bit at the given index of uint64 value`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_getbit_uint64', a, b)
      const result = op.getBit(a, b)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [MAX_UINT64, 64],
      [MAX_UINT64 - 1n, 64],
    ])(`should throw error when index out of bound of uint64 value`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_getbit_uint64', a, b)).rejects.toThrow('getbit index > 63')
      expect(() => op.getBit(a, b)).toThrow(/getBit index \d+ is beyond length/)
    })
  })

  describe('getByte', async () => {
    test.for([
      [Bytes([0x00]), 0],
      [getPaddedBytes(2, intToBytes(256)), 3],
      [getPaddedBytes(2, intToBytes(256)), 0],
      [getPaddedBytes(2, intToBytes(256)), 1],
      [getPaddedBytes(2, intToBytes(65530)), 3],
      [intToBytes(MAX_UINT64), 7],
      [intToBytes(MAX_UINT64 - 1n), 0],
      [intToBytes(MAX_UINT64 - 1n), 7],
      [intToBytes(MAX_UINT512), 63],
      [intToBytes(MAX_UINT512 - 1n), 63],
      [intToBytes(MAX_UINT512), 0],
    ])('should get the bytes value of the given input', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_getbyte', asUint8Array(a as bytes), b as number)
      const result = op.getByte(a as bytes, b as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [Bytes([0x00]), 8],
      [intToBytes(MAX_UINT64), 64],
      [intToBytes(MAX_UINT64 - 1n), 64],
      [intToBytes(MAX_UINT512), 512],
      [intToBytes(MAX_UINT512 - 1n), 512],
    ])('should thorw error when index out of bound', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_getbyte', asUint8Array(a as bytes), b as number)).rejects.toThrow(
        'getbyte index beyond array length',
      )
      expect(() => op.getByte(a as bytes, b as number)).toThrow(/getBytes index \d+ is beyond length/)
    })
  })

  describe('itob', async () => {
    test.for([0, 42, 100n, 256, 65535, MAX_UINT64])(
      'should convert uint64 to bytes',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const avmResult = (await getAvmResult<Uint8Array>({ appClient }, 'verify_itob', a))!
        const result = op.itob(a)
        expect(result).toEqual(avmResult)
      },
    )

    test.for([MAX_UINT64 + 1n, MAX_UINT512])(
      'should throw error when input overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResultRaw({ appClient }, 'verify_itob', a)).rejects.toThrow(avmIntArgOverflowError)
        expect(() => op.itob(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      },
    )
  })

  describe('len', async () => {
    test.for([
      [Bytes(encodingUtil.bigIntToUint8Array(0n)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(1n)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT64)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512)), 0],
      [Bytes(encodingUtil.bigIntToUint8Array(MAX_UINT512 * MAX_UINT512)), 0],
      [Bytes(Array(8).fill(0x00).concat(Array(4).fill(0x0f))), 0],
      [Bytes([0x0f]), MAX_BYTES_SIZE - 1],
      [Bytes(), 0],
    ])('should return the length of the bytes input', async ([a, padSize], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_bytes_len', asUint8Array(a as bytes), padSize as number)
      const paddedA = getPaddedBytes(padSize as number, a as bytes)
      const result = op.len(paddedA)
      expect(result).toEqual(avmResult)
    })
  })

  describe('mulw', async () => {
    test.for([
      [0, 0],
      [1, 0],
      [0, 1],
      [100, 42],
      [1, MAX_UINT64 - 1n],
      [MAX_UINT64 - 1n, 1],
      [100, MAX_UINT64],
      [MAX_UINT64, MAX_UINT64],
    ])(`should calculate the multiplication result`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64[]>({ appClient }, 'verify_mulw', a, b)
      const result = op.mulw(a, b)
      expect(result[0].valueOf()).toBe(avmResult[0])
      expect(result[1].valueOf()).toBe(avmResult[1])
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 0],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64[]>({ appClient }, 'verify_mulw', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.mulw(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe('replace', async () => {
    test.for([
      ['hello, world.', 5, '!!'],
      ['hello, world.', 5, ''],
      ['hello, world.', 5, ', there.'],
      ['hello, world.', 12, '!'],
      ['hello, world.', 12, ''],
      ['hello, world.', 0, 'H'],
      ['', 0, ''],
    ])(`should replace bytes in the input`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>(
        { appClient },
        'verify_replace',
        asUint8Array(a as string),
        b,
        asUint8Array(c as string),
      ))!
      const result = op.replace(a as string, b as number, c as string)
      expect(result).toEqual(avmResult)
    })

    test.for([
      ['', 0, 'A'],
      ['hello', 5, '!!'],
      ['hello', 6, '!'],
      ['hello', 0, 'Hello, world'],
    ])(
      `should throw error when replacement result in longer bytes length`,
      async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(
          getAvmResultRaw({ appClient }, 'verify_replace', asUint8Array(a as string), b, asUint8Array(c as string)),
        ).rejects.toThrow(/replacement (start|end) \d+ beyond (original )*length/)
        expect(() => op.replace(a as string, b as number, c as string)).toThrow(`expected value <= ${(a as string).length}`)
      },
    )
  })

  describe('select', async () => {
    test.for([
      ['one', 'two', 0],
      ['one', 'two', 1],
      ['one', 'two', 2],
      ['one', 'two', true],
      ['one', 'two', false],
      [Bytes([0x00, 0x00, 0xff]), Bytes([0xff]), 0n],
      [Bytes([0x00, 0x00, 0xff]), Bytes([0xff]), 1n],
    ])(`should select bytes according to the input`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>(
        { appClient },
        'verify_select_bytes',
        asUint8Array(a as string),
        asUint8Array(b as string),
        c === true ? 1 : c === false ? 0 : (c as number),
      ))!
      const result = op.select(a as string, b as string, c as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [Bytes([0x00, 0x00, 0xff]), Bytes([0xff]), MAX_UINT64 + 1n],
      [Bytes([0x00, 0x00, 0xff]), Bytes([0xff]), MAX_UINT512],
    ])(`should throw error when input overflows to select bytes`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(
        getAvmResultRaw({ appClient }, 'verify_select_bytes', asUint8Array(a as bytes), asUint8Array(b as bytes), c as bigint),
      ).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.select(a as bytes, b as bytes, c as bigint)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [10, 20, 0],
      [10, 20, 1],
      [256, 512, 2],
      [10, MAX_UINT64, true],
      [MAX_UINT64, 20, false],
    ])('should select uint64 according to the input', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_select_uint64', a, b, c === true ? 1 : c === false ? 0 : c)
      const result = op.select(a, b, c)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [MAX_UINT64 + 1n, MAX_UINT64 + 10n, MAX_UINT64 + 1n],
      [MAX_UINT512, MAX_UINT512, MAX_UINT512],
    ])(`should throw error when input overflows to select uint64`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_select_uint64', a, b, c)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.select(a, b, c)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe('setBit', async () => {
    test.for([
      [Bytes([0x00]), 0, 1],
      [getPaddedBytes(2, intToBytes(256)), 3, 1],
      [getPaddedBytes(2, intToBytes(256)), 0, 1],
      [getPaddedBytes(2, intToBytes(256)), 11, 1],
      [getPaddedBytes(2, intToBytes(65535)), 31, 0],
      [getPaddedBytes(2, intToBytes(65535)), 24, 0],
      [intToBytes(MAX_UINT64), 63, 0],
      [intToBytes(MAX_UINT64 - 1n), 63, 1],
      [intToBytes(MAX_UINT512), 511, 0],
      [intToBytes(MAX_UINT512 - 1n), 511, 1],
      [intToBytes(MAX_UINT64), 0, 0],
      [intToBytes(MAX_UINT512), 0, 0],
    ])(`should set the bit at the given index of bytes value`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>(
        { appClient },
        'verify_setbit_bytes',
        asUint8Array(a as bytes),
        b as number,
        c as number,
      ))!
      const result = op.setBit(a as bytes, b as number, c as number) as bytes
      expect(result).toEqual(avmResult)
    })

    test.for([
      [Bytes([0x00]), 8, 1],
      [intToBytes(MAX_UINT64), 64, 0],
      [intToBytes(MAX_UINT64 - 1n), 64, 1],
      [intToBytes(MAX_UINT512), 512, 0],
      [intToBytes(MAX_UINT512 - 1n), 512, 1],
    ])('should throw error when index out of bound of bytes value', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(
        getAvmResultRaw({ appClient }, 'verify_setbit_bytes', asUint8Array(a as bytes), b as number, c as number),
      ).rejects.toThrow('setbit index beyond byteslice')
      expect(() => op.setBit(a as bytes, b as number, c as number)).toThrow(/setBit index \d+ is beyond length/)
    })

    test('should throw error when input is invalid', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      const a = Bytes([0x00])
      const b = 0
      const c = 2
      await expect(getAvmResultRaw({ appClient }, 'verify_setbit_bytes', asUint8Array(a), b, c)).rejects.toThrow('setbit value > 1')
      expect(() => op.setBit(a, b, c)).toThrow(`setBit value > 1`)
    })

    test.for([
      [0, 0, 1],
      [0, 3, 1],
      [0, 10, 1],
      [256, 3, 1],
      [256, 0, 1],
      [256, 11, 1],
      [65535, 15, 0],
      [65535, 7, 0],
      [65535, 63, 1],
      [MAX_UINT64, 63, 0],
      [MAX_UINT64 - 1n, 63, 1],
      [MAX_UINT64, 0, 0],
    ])('should set the bit at the given index of uint64 value', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_setbit_uint64', a, b, c)
      const result = op.setBit(a, b, c)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [MAX_UINT64, 64, 0],
      [MAX_UINT64 - 1n, 64, 1],
    ])(
      `should throw error when index out of bound of uint64 value`,
      async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResult<uint64>({ appClient }, 'verify_setbit_uint64', a, b, c)).rejects.toThrow('setbit index > 63')
        expect(() => op.setBit(a, b, c)).toThrow(/setBit index \d+ is beyond length/)
      },
    )

    test('should throw error when input is invalid', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      const a = 0
      const b = 2
      const c = 2
      await expect(getAvmResult<uint64>({ appClient }, 'verify_setbit_uint64', a, b, c)).rejects.toThrow('setbit value > 1')
      expect(() => op.setBit(a, b, c)).toThrow(`setBit value > 1`)
    })
  })

  describe('setByte', async () => {
    test.for([
      [Bytes([0x00]), 0, 1],
      [getPaddedBytes(2, intToBytes(256)), 3, 1],
      [getPaddedBytes(2, intToBytes(256)), 0, 1],
      [getPaddedBytes(2, intToBytes(256)), 1, 255],
      [getPaddedBytes(2, intToBytes(65535)), 2, 0],
      [getPaddedBytes(2, intToBytes(65535)), 2, 100],
      [intToBytes(MAX_UINT64), 7, 0],
      [intToBytes(MAX_UINT64 - 1n), 0, 42],
      [intToBytes(MAX_UINT512), 63, 0],
      [intToBytes(MAX_UINT512 - 1n), 1, 1],
      [intToBytes(MAX_UINT64), 0, 0],
      [intToBytes(MAX_UINT512), 0, 0],
    ])(`should set bytes in the input`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = (await getAvmResult<Uint8Array>(
        { appClient },
        'verify_setbyte',
        asUint8Array(a as bytes),
        b as number,
        c as number,
      ))!
      const result = op.setByte(a as bytes, b as number, c as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [Bytes([0x00]), 8, 1],
      [intToBytes(MAX_UINT64), 64, 0],
      [intToBytes(MAX_UINT64 - 1n), 64, 1],
      [intToBytes(MAX_UINT512), 512, 0],
      [intToBytes(MAX_UINT512 - 1n), 512, 1],
    ])(`should throw error when index out of bound of bytes`, async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_setbyte', asUint8Array(a as bytes), b as number, c as number)).rejects.toThrow(
        'setbyte index beyond array length',
      )
      expect(() => op.setByte(a as bytes, b as number, c as number)).toThrow(`setByte index ${b} is beyond length`)
    })

    test('should throw error when input is invalid', async ({ appClientMiscellaneousOpsContract: appClient }) => {
      const a = Bytes([0x00])
      const b = 0
      const c = 256
      await expect(getAvmResultRaw({ appClient }, 'verify_setbyte', asUint8Array(a), b, c)).rejects.toThrow('setbyte value > 255')
      expect(() => op.setByte(a, b, c)).toThrow(`setByte value ${c} > 255`)
    })
  })

  describe('shl', async () => {
    test.for([
      [0, 0],
      [1, 0],
      [0, 1],
      [42, 0],
      [100, 42],
      [1, 63],
      [MAX_UINT64 - 1n, 63],
      [MAX_UINT64, 63],
    ])(`should shift left the input`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_shl', a, b)
      const result = op.shl(a, b)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 0],
    ])(`should throw error when input overflows`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_shl', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.shl(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [1, MAX_UINT64],
      [MAX_UINT64, 64],
    ])(`should throw error when input is invalid`, async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_shl', a, b)).rejects.toThrow('shl arg too big')
      expect(() => op.shl(a, b)).toThrow(`shl value ${b} >= 64`)
    })
  })

  describe('shr', async () => {
    test.for([
      [0, 0],
      [1, 0],
      [0, 1],
      [111, 42],
      [1, 63],
      [MAX_UINT64 - 1n, 63],
      [MAX_UINT64, 63],
    ])('should shift right the input', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_shr', a, b)
      const result = op.shr(a, b)
      expect(result).toEqual(avmResult)
    })

    test.for([
      [1, MAX_UINT64 + 1n],
      [MAX_UINT64 + 1n, 1],
      [0, MAX_UINT512],
      [MAX_UINT512 * 2n, 1],
    ])('should throw error when input overflows', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_shr', a, b)).rejects.toThrow(avmIntArgOverflowError)
      expect(() => op.shr(a, b)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })

    test.for([
      [1, MAX_UINT64],
      [MAX_UINT64, 64],
    ])('should throw error when input is invalid', async ([a, b], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResult<uint64>({ appClient }, 'verify_shr', a, b)).rejects.toThrow('shr arg too big')
      expect(() => op.shr(a, b)).toThrow(`shr value ${b} >= 64`)
    })
  })

  describe('sqrt', async () => {
    test.for([0, 1, 2, 9, 13, MAX_UINT64])(
      'should calculate the square root of the input',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        const avmResult = await getAvmResult<uint64>({ appClient }, 'verify_sqrt', a)
        const result = op.sqrt(a)
        expect(result).toEqual(avmResult)
      },
    )

    test.for([MAX_UINT64 + 1n, MAX_UINT512, MAX_UINT512 * 2n])(
      'should throw error when input overflows',
      async (a, { appClientMiscellaneousOpsContract: appClient }) => {
        await expect(getAvmResult<uint64>({ appClient }, 'verify_sqrt', a)).rejects.toThrow(avmIntArgOverflowError)
        expect(() => op.sqrt(a)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
      },
    )
  })

  describe('substring', async () => {
    test.for([
      ['hello, world.', 5, 5],
      ['hello, world.', 5, 6],
      ['hello, world.', 5, 7],
      ['hello, world.', 12, 13],
      ['hello, world.', 11, 13],
      ['hello, world.', 0, 1],
      ['hello, world.', 0, 2],
      ['hello, world.', 0, 13],
      ['', 0, 0],
    ])('should extract substring from the input', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      const avmResult = await getAvmResult<Uint8Array>({ appClient }, 'verify_substring', asUint8Array(a as string), b, c)
      const result = op.substring(a as string, b as number, c as number)
      expect(result).toEqual(avmResult)
    })

    test.for([
      ['', 0, 1],
      ['hello', 5, 7],
      ['hello', 4, 3],
      ['hello', 0, 7],
    ])('should throw error when input is invalid', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_substring', asUint8Array(a as string), b, c)).rejects.toThrow(
        /(substring range beyond length of string)|(substring end before start)/,
      )
      expect(() => op.substring(a as string, b as number, c as number)).toThrow(
        /(substring range beyond length of string)|(substring end before start)/,
      )
    })

    test.for([
      ['', MAX_UINT64, MAX_UINT64 + 1n],
      ['hello', MAX_UINT64 + 1n, MAX_UINT64 + 2n],
    ])('should throw error when input overflows', async ([a, b, c], { appClientMiscellaneousOpsContract: appClient }) => {
      await expect(getAvmResultRaw({ appClient }, 'verify_substring', asUint8Array(a as string), b as bigint, c as bigint)).rejects.toThrow(
        avmIntArgOverflowError,
      )
      expect(() => op.substring(a as string, b as bigint, c as bigint)).toThrow(UINT64_OVERFLOW_UNDERFLOW_MESSAGE)
    })
  })

  describe('jsonRef', async () => {
    test('should throw not available error', async () => {
      expect(() => op.JsonRef.jsonObject(Bytes(''), Bytes(''))).toThrow('JsonRef.jsonObject is not available in test context')
      expect(() => op.JsonRef.jsonString(Bytes(''), Bytes(''))).toThrow('JsonRef.jsonString is not available in test context')
      expect(() => op.JsonRef.jsonUint64(Bytes(''), Bytes(''))).toThrow('JsonRef.jsonUint64 is not available in test context')
    })
  })
})
