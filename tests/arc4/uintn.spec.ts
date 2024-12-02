import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { BitSize, interpretAsArc4, UintN, UintN16, UintN256, UintN32, UintN64, UintN8 } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, it, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_UINT512, MAX_UINT64 } from '../../src/constants'
import { asBigUintCls } from '../../src/util'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResult } from '../avm-invoker'
import { asUint8Array } from '../util'

const invalidBytesLengthError = (length: number) => `byte string must correspond to a uint${length}`
describe('arc4.UintN', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(async () => {
    ctx.reset()
  })

  test.each([2 ** 32, MAX_UINT64])('instantiation should throw error as %s would overflow 32 bits', async (value) => {
    const bytesValue = asBigUintCls(value).toBytes()

    await expect(getAvmResult({ appClient }, 'verify_uintn_init', asUint8Array(bytesValue))).rejects.toThrowError()
    expect(() => new UintN32(value)).toThrowError(`expected value <= ${2 ** 32 - 1}`)
  })

  test.each([2 ** 256, MAX_UINT512])('instantiation should throw error as %s would overflow 256 bits', async (value) => {
    const bytesValue = asBigUintCls(value).toBytes()

    await expect(getAvmResult({ appClient }, 'verify_biguintn_init', asUint8Array(bytesValue))).rejects.toThrowError()
    expect(() => new UintN256(value)).toThrowError(`expected value <= ${2 ** 256 - 1}`)
  })

  test.each([
    [0, 0],
    [255, 255],
    [2 ** 32 - 1, 2 ** 32 - 1],
  ])('instantiating UintN<32> should work for %s', async (value, expected) => {
    const bytesValue = asBigUintCls(value).toBytes()
    const avmResult = await getAvmResult({ appClient }, 'verify_uintn_init', asUint8Array(bytesValue))

    const result = new UintN32(value)

    expect(result.native).toEqual(BigInt(expected))
    expect(avmResult).toEqual(BigInt(expected))
  })

  test.each([
    [0, 0],
    [255, 255],
    [MAX_UINT64, MAX_UINT64],
    [2 ** 128, 2 ** 128],
    [2 ** 256 - 1, 2 ** 256 - 1],
  ])('instantiating UintN<256> should work for %s', async (value, expected) => {
    const bytesValue = asBigUintCls(value).toBytes()
    const avmResult = await getAvmResult({ appClient }, 'verify_biguintn_init', asUint8Array(bytesValue))

    const result = new UintN256(value)

    expect(result.native).toEqual(BigInt(expected))
    expect(avmResult).toEqual(BigInt(expected))
  })

  test.each([0, 1, 255])('should be able to get bytes representation of %s', async (value) => {
    expect(new UintN8(value).bytes).toEqual(encodingUtil.bigIntToUint8Array(BigInt(value), 1))
    expect(new UintN16(value).bytes).toEqual(encodingUtil.bigIntToUint8Array(BigInt(value), 2))
    expect(new UintN64(value).bytes).toEqual(encodingUtil.bigIntToUint8Array(BigInt(value), 8))
    expect(new UintN<512>(value).bytes).toEqual(encodingUtil.bigIntToUint8Array(BigInt(value), 64))
  })

  describe.each(['eq', 'ne', 'lt', 'le', 'gt', 'ge'])('logical operators', async (op) => {
    const operator = (function () {
      switch (op) {
        case 'eq':
          return '==='
        case 'ne':
          return '!=='
        case 'lt':
          return '<'
        case 'le':
          return '<='
        case 'gt':
          return '>'
        case 'ge':
          return '>='
        default:
          throw new Error(`Unknown operator: ${op}`)
      }
    })()
    describe.each([
      [0, 0],
      [0, 1],
      [0, 255],
      [255, 255],
      [65535, 65535],
      [255, 65535],
      [MAX_UINT64, MAX_UINT64],
      [65535, 4294967295],
      [4294967295, MAX_UINT64],
      [MAX_UINT512, MAX_UINT512],
    ])(`${operator}`, async (a, b) => {
      const getStubResult = (a: UintN<BitSize>, b: UintN<BitSize>) => {
        switch (operator) {
          case '===':
            return a === b
          case '!==':
            return a !== b
          case '<':
            return a.native < b.native
          case '<=':
            return a.native <= b.native
          case '>':
            return a.native > b.native
          case '>=':
            return a.native >= b.native
          default:
            throw new Error(`Unknown operator: ${op}`)
        }
      }
      it(`${a} ${operator} ${b}`, async () => {
        const aType = a <= MAX_UINT64 ? 'uintn' : 'biguintn'
        const bType = b <= MAX_UINT64 ? 'uintn' : 'biguintn'
        const bytesValueA = asBigUintCls(a).toBytes()
        const bytesValueB = asBigUintCls(b).toBytes()
        const avmResult = await getAvmResult(
          { appClient },
          `verify_${aType}_${bType}_${op}`,
          asUint8Array(bytesValueA),
          asUint8Array(bytesValueB),
        )

        const encodedA = a <= MAX_UINT64 ? new UintN<64>(a) : new UintN<512>(a)
        const encodedB = b <= MAX_UINT64 ? new UintN<64>(b) : new UintN<512>(b)
        const result = getStubResult(encodedA, encodedB)

        expect(result).toEqual(avmResult)
      })
    })
  })

  test.each([
    [MAX_UINT64, MAX_UINT512],
    [0, MAX_UINT512],
    [1, MAX_UINT512],
  ])('should throw error when comparing UinN with different bit sizes', async (a, b) => {
    const encodedA = a <= MAX_UINT64 ? new UintN<64>(a) : new UintN<512>(a)
    const encodedB = b <= MAX_UINT64 ? new UintN<64>(b) : new UintN<512>(b)
    expect(() => encodedA === encodedB).toThrowError(/Expected expression of type UintN<\d+>, got UintN<\d+>/)
    expect(() => encodedA !== encodedB).toThrowError(/Expected expression of type UintN<\d+>, got UintN<\d+>/)
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 4),
    encodingUtil.bigIntToUint8Array(255n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 16n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n),
  ])('create UintN<32> from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_uintn_from_bytes', value)

    const result = interpretAsArc4<UintN32>(Bytes(value))

    expect(result.native).toEqual(avmResult)
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])('sdk throws error when creating UintN<32> from bytes with invalid length', async (value) => {
    await expect(getAvmResult({ appClient }, 'verify_uintn_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(32))

    const result = interpretAsArc4<UintN32>(Bytes(value))
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 32),
    encodingUtil.bigIntToUint8Array(255n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n),
  ])('create UintN<256> from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_biguintn_from_bytes', value)
    const result = interpretAsArc4<UintN256>(Bytes(value))

    expect(result.native).toEqual(avmResult)
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])('sdk throws error when creating UintN<256> from bytes with invalid length', async (value) => {
    await expect(getAvmResult({ appClient }, 'verify_biguintn_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(256))

    const result = interpretAsArc4<UintN256>(Bytes(value))
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(0n, 4), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 4), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 4), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4), 2n ** 32n - 1n],
  ])('create UintN<32> from abi log', async (value, expected) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    const avmResult = await getAvmResult({ appClient }, 'verify_uintn_from_log', logValue)

    const result = interpretAsArc4<UintN<32>>(Bytes(logValue), 'log')
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes.fromHex('FF000102')],
  ])('should throw error when log prefix is invalid for UintN<32>', async (value, prefix) => {
    const logValue = asUint8Array(Bytes(prefix).concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_uintn_from_log', logValue)).rejects.toThrowError('assert failed')
    expect(() => interpretAsArc4<UintN<32>>(Bytes(logValue), 'log')).toThrowError('ABI return prefix not found')
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])('sdk throws error when creating UintN<32> from log with invalid length', async (value) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_uintn_from_log', logValue)).rejects.toThrowError(invalidBytesLengthError(32))

    const result = interpretAsArc4<UintN<32>>(Bytes(logValue), 'log')
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(0n, 32), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 32), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 32), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32), 2n ** 256n - 1n],
  ])('create UintN<256> from abi log', async (value, expected) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    const avmResult = await getAvmResult({ appClient }, 'verify_biguintn_from_log', logValue)

    const result = interpretAsArc4<UintN<256>>(Bytes(logValue), 'log')
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes.fromHex('FF000102')],
  ])('should throw error when log prefix is invalid for UintN<256>', async (value, prefix) => {
    const logValue = asUint8Array(Bytes(prefix).concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_biguintn_from_log', logValue)).rejects.toThrowError('assert failed')
    expect(() => interpretAsArc4<UintN<256>>(Bytes(logValue), 'log')).toThrowError('ABI return prefix not found')
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])('sdk throws error when creating UintN<256> from log with invalid length', async (value) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_biguintn_from_log', logValue)).rejects.toThrowError(invalidBytesLengthError(256))

    const result = interpretAsArc4<UintN<256>>(Bytes(logValue), 'log')
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })
})
