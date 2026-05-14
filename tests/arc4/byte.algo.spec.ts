import type { bytes } from '@algorandfoundation/algorand-typescript'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Byte, convertBytes } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_UINT64 } from '../../src/constants'
import { asBigUintCls, asUint8Array } from '../../src/util'
import { getAvmResult } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'

const invalidBytesLengthError = (actual: number) => `Expected 1 byte for byte type, got ${actual}`
describe('arc4.Byte', async () => {
  const test = createArc4TestFixture({
    paths: 'tests/artifacts/arc4-primitive-ops/contract.algo.ts',
    contracts: {
      Arc4PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
    },
  })

  const ctx = new TestExecutionContext()

  afterEach(() => {
    ctx.reset()
  })

  test.for([2 ** 8, MAX_UINT64])(
    'instantiation should throw error as %s would overflow 8 bits',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const bytesValue = asBigUintCls(value).toBytes()

      await expect(getAvmResult({ appClient }, 'verify_byte_init', asUint8Array(bytesValue))).rejects.toThrowError()
      expect(() => new Byte(value)).toThrowError(`expected value <= ${2 ** 8 - 1}`)
    },
  )

  test.for([
    [0, 0],
    [255, 255],
    [2 ** 8 - 1, 2 ** 8 - 1],
  ])('instantiating Byte should work for %s', async ([value, expected], { appClientArc4PrimitiveOpsContract: appClient }) => {
    const bytesValue = asBigUintCls(value).toBytes()
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_init', asUint8Array(bytesValue))

    const result = new Byte(value)

    expect(result.asUint64()).toEqual(expected)
    expect(avmResult).toEqual(expected)
  })

  test.for([0, 1, 255])('should be able to get bytes representation of %s', async (value) => {
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
            return a.asUint64() < b.asUint64()
          case '<=':
            return a.asUint64() <= b.asUint64()
          case '>':
            return a.asUint64() > b.asUint64()
          case '>=':
            return a.asUint64() >= b.asUint64()
          default:
            throw new Error(`Unknown operator: ${op}`)
        }
      }
      test(`${a} ${operator} ${b}`, async ({ appClientArc4PrimitiveOpsContract: appClient }) => {
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

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(42n, 1),
    encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 1),
  ])('create Byte from bytes', async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_from_bytes', value)
    const result = convertBytes<Byte>(Bytes(value), { strategy: 'unsafe-cast' })

    expect(result.asUint64()).toEqual(avmResult)
  })

  test.for([encodingUtil.bigIntToUint8Array(0n, 2), encodingUtil.bigIntToUint8Array(255n, 8)])(
    'sdk throws error when creating Byte from bytes with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult({ appClient }, 'verify_byte_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(value.length))

      const result = convertBytes<Byte>(Bytes(value), { strategy: 'unsafe-cast' })
      expect(result.asUint64()).toEqual(encodingUtil.uint8ArrayToBigInt(value))
    },
  )

  test.for([
    [encodingUtil.bigIntToUint8Array(0n, 1), 0],
    [encodingUtil.bigIntToUint8Array(42n, 1), 42],
    [encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 1), 2 ** 8 - 1],
  ])('create Byte from abi log', async ([value, expected], { appClientArc4PrimitiveOpsContract: appClient }) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value as Uint8Array)))
    const avmResult = await getAvmResult({ appClient }, 'verify_byte_from_log', logValue)

    const result = convertBytes<Byte>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
    expect(avmResult).toEqual(expected)
    expect(result.asUint64()).toEqual(expected)
  })

  test.for([
    [encodingUtil.bigIntToUint8Array(255n, 1), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 1), Bytes.fromHex('FF000102')],
  ])(
    'should throw error when log prefix is invalid for Byte',
    async ([value, prefix], { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(Bytes(prefix as Uint8Array).concat(Bytes(value as bytes)))
      await expect(() => getAvmResult({ appClient }, 'verify_byte_from_log', logValue)).rejects.toThrowError(
        new RegExp('(has valid prefix)|(extraction start \\d+ is beyond length)'),
      )
      expect(() => convertBytes<Byte>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })).toThrowError(
        'ABI return prefix not found',
      )
    },
  )

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 2),
    encodingUtil.bigIntToUint8Array(42n, 8),
    encodingUtil.bigIntToUint8Array(2n ** 8n - 1n, 8),
  ])(
    'sdk throws error when creating Byte from log with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
      await expect(() => getAvmResult({ appClient }, 'verify_byte_from_log', logValue)).rejects.toThrowError(
        invalidBytesLengthError(value.length),
      )

      const result = convertBytes<Byte>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
      expect(result.asUint64()).toEqual(encodingUtil.uint8ArrayToBigInt(value))
    },
  )
})
