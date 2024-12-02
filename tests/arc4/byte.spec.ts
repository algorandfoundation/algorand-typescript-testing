import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Byte, interpretAsArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, it, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_UINT64 } from '../../src/constants'
import { asBigUintCls } from '../../src/util'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResult } from '../avm-invoker'
import { asUint8Array } from '../util'

const invalidBytesLengthError = 'byte string must be 1 byte long'
describe('arc4.Byte', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(async () => {
    ctx.reset()
  })

  test.each([2 ** 8, MAX_UINT64])('instantiation should throw error as %s would overflow 8 bits', async (value) => {
    const bytesValue = asBigUintCls(value).toBytes()

    await expect(getAvmResult({ appClient }, 'verify_byte_init', asUint8Array(bytesValue))).rejects.toThrowError()
    expect(() => new Byte(value)).toThrowError(`expected value <= ${2 ** 8 - 1}`)
  })

  test.each([
    [0, 0],
    [255, 255],
    [2 ** 8 - 1, 2 ** 8 - 1],
  ])('instantiating Byte should work for %s', async (value, expected) => {
    const bytesValue = asBigUintCls(value).toBytes()
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_init', asUint8Array(bytesValue))

    const result = new Byte(value)

    expect(result.native).toEqual(expected)
    expect(avmResult).toEqual(expected)
  })

  test.each([0, 1, 255])('should be able to get bytes representation of %s', async (value) => {
    expect(new Byte(value).bytes).toEqual(encodingUtil.bigIntToUint8Array(BigInt(value), 1))
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
      [255, 42],
      [255, 255],
    ])(`${operator}`, async (a, b) => {
      const getStubResult = (a: Byte, b: Byte) => {
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
        const bytesValueA = asBigUintCls(a).toBytes()
        const bytesValueB = asBigUintCls(b).toBytes()
        const avmResult = await getAvmResult({ appClient }, `verify_byte_byte_${op}`, asUint8Array(bytesValueA), asUint8Array(bytesValueB))

        const encodedA = new Byte(a)
        const encodedB = new Byte(b)
        const result = getStubResult(encodedA, encodedB)

        expect(result).toEqual(avmResult)
      })
    })
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(42n, 1),
    encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 1),
  ])('create Byte from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_from_bytes', value)
    const result = interpretAsArc4<Byte>(Bytes(value))

    expect(result.native).toEqual(avmResult)
  })

  test.each([encodingUtil.bigIntToUint8Array(0n, 2), encodingUtil.bigIntToUint8Array(255n, 8)])(
    'sdk throws error when creating Byte from bytes with invalid length',
    async (value) => {
      await expect(getAvmResult({ appClient }, 'verify_byte_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError)

      const result = interpretAsArc4<Byte>(Bytes(value))
      expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
    },
  )

  test.each([
    [encodingUtil.bigIntToUint8Array(0n, 1), 0],
    [encodingUtil.bigIntToUint8Array(42n, 1), 42],
    [encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 1), 2 ** 8 - 1],
  ])('create Byte from abi log', async (value, expected) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_from_log', logValue)

    const result = interpretAsArc4<Byte>(Bytes(logValue), 'log')
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(255n, 1), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 1), Bytes.fromHex('FF000102')],
  ])('should throw error when log prefix is invalid for Byte', async (value, prefix) => {
    const logValue = asUint8Array(Bytes(prefix).concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_byte_from_log', logValue)).rejects.toThrowError(
      new RegExp('(assert failed)|(extraction start \\d+ is beyond length)'),
    )
    expect(() => interpretAsArc4<Byte>(Bytes(logValue), 'log')).toThrowError('ABI return prefix not found')
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 2),
    encodingUtil.bigIntToUint8Array(42n, 8),
    encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 8),
  ])('sdk throws error when creating Byte from log with invalid length', async (value) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_byte_from_log', logValue)).rejects.toThrowError(invalidBytesLengthError)

    const result = interpretAsArc4<Byte>(Bytes(logValue), 'log')
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })
})
