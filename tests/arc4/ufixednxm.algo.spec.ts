import type { bytes } from '@algorandfoundation/algorand-typescript'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { convertBytes, UFixed } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import { asBigUint, asUint8Array } from '../../src/util'
import { getAvmResult } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'

const invalidBytesLengthError = (length: number) => `byte string must correspond to a ufixed${length}`
describe('arc4.UFixed', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/arc4-primitive-ops/contract.algo.ts', {
    Arc4PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })
  afterEach(() => {
    ctx.reset()
  })

  test.for(['-1', '42.9496729501', '255.01two'])(
    'should throw error when instantiating UFixed<32,8> with invalid value %s',
    async (value) => {
      expect(() => new UFixed<32, 8>(value as `${number}.${number}`)).toThrow(
        'expected positive decimal literal with max of 8 decimal places',
      )
    },
  )

  test.for(['42.94967296', (2n ** 32n).toString()])(
    'should throw error when instantiating UFixed<32,8> with overflowing value %s',
    async (value) => {
      expect(() => new UFixed<32, 8>(value as `${number}.${number}`)).toThrow('expected value <=')
    },
  )

  test.for(['0', '1', '25.5', '42.94967295', '42.9496729500'])(
    'should be able to get UFixed<32,8> bytes representation of %s',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const a = new UFixed<32, 8>(value as `${number}.${number}`)
      const bigIntValue = asBigUint(a.bytes).valueOf()
      const avmResult = await getAvmResult({ appClient }, 'verify_ufixed_bytes', bigIntValue)
      expect(a.bytes).toEqual(avmResult)
    },
  )

  test.for(['0', '1', '25.5', '42.94967295', '11579208923731619542357098500868790785326998466564056403945758.4007913129639935'])(
    'should be able to get UFixed<256,16> bytes representation of %s',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const a = new UFixed<256, 16>(value as `${number}.${number}`)
      const bigIntValue = asBigUint(a.bytes).valueOf()
      const avmResult = await getAvmResult({ appClient }, 'verify_bigufixed_bytes', bigIntValue)
      expect(a.bytes).toEqual(avmResult)
    },
  )

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 4),
    encodingUtil.bigIntToUint8Array(255n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 16n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n),
  ])('create UFixed<32,8> from bytes', async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_ufixed_from_bytes', value)
    const result = convertBytes<UFixed<32, 8>>(Bytes(value), { strategy: 'unsafe-cast' })

    expect(asBigUint(result.bytes)).toEqual(avmResult)
  })

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])(
    'sdk throws error when creating UFixed<32,8> from bytes with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult({ appClient }, 'verify_ufixed_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(32))

      const result = convertBytes<UFixed<32, 8>>(Bytes(value), { strategy: 'unsafe-cast' })
      expect(result.bytes).toEqual(value)
    },
  )

  test.for([
    [encodingUtil.bigIntToUint8Array(0n, 4), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 4), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 4), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4), 2n ** 32n - 1n],
  ])('create UFixed<32,8> from abi log', async ([value, expected], { appClientArc4PrimitiveOpsContract: appClient }) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value as Uint8Array)))
    const avmResult = await getAvmResult({ appClient }, 'verify_ufixed_from_log', logValue)

    const result = convertBytes<UFixed<32, 8>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
    expect(avmResult).toEqual(expected)
    expect(asBigUint(result.bytes)).toEqual(expected)
  })

  test.for([
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes.fromHex('FF000102')],
  ])(
    'should throw error when log prefix is invalid for UFixed<32,8>',
    async ([value, prefix], { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(Bytes(prefix as Uint8Array).concat(Bytes(value as bytes)))
      await expect(() => getAvmResult({ appClient }, 'verify_ufixed_from_log', logValue)).rejects.toThrowError('has valid prefix')
      expect(() => convertBytes<UFixed<32, 8>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })).toThrowError(
        'ABI return prefix not found',
      )
    },
  )

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])(
    'sdk throws error when creating UFixed<32,8> from log with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
      await expect(() => getAvmResult({ appClient }, 'verify_ufixed_from_log', logValue)).rejects.toThrowError(invalidBytesLengthError(32))

      const result = convertBytes<UFixed<32, 8>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
      expect(asBigUint(result.bytes)).toEqual(encodingUtil.uint8ArrayToBigInt(value))
    },
  )

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 32),
    encodingUtil.bigIntToUint8Array(255n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n),
  ])('create UFixed<256,16> from bytes', async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_bigufixed_from_bytes', value)
    const result = convertBytes<UFixed<256, 16>>(Bytes(value), { strategy: 'unsafe-cast' })

    expect(asBigUint(result.bytes)).toEqual(avmResult)
  })

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])(
    'sdk throws error when creating UFixed<256,16> from bytes with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      await expect(getAvmResult({ appClient }, 'verify_bigufixed_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(256))

      const result = convertBytes<UFixed<256, 16>>(Bytes(value), { strategy: 'unsafe-cast' })
      expect(result.bytes).toEqual(value)
    },
  )

  test.for([
    [encodingUtil.bigIntToUint8Array(0n, 32), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 32), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 32), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32), 2n ** 256n - 1n],
  ])('create UFixed<256,16> from abi log', async ([value, expected], { appClientArc4PrimitiveOpsContract: appClient }) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value as Uint8Array)))
    const avmResult = await getAvmResult({ appClient }, 'verify_bigufixed_from_log', logValue)

    const result = convertBytes<UFixed<256, 16>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
    expect(avmResult).toEqual(expected)
    expect(asBigUint(result.bytes)).toEqual(expected)
  })

  test.for([
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes.fromHex('FF000102')],
  ])(
    'should throw error when log prefix is invalid for UFixed<256,16>',
    async ([value, prefix], { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(Bytes(prefix as Uint8Array).concat(Bytes(value as bytes)))
      await expect(() => getAvmResult({ appClient }, 'verify_bigufixed_from_log', logValue)).rejects.toThrowError('has valid prefix')
      expect(() => convertBytes<UFixed<256, 16>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })).toThrowError(
        'ABI return prefix not found',
      )
    },
  )

  test.for([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])(
    'sdk throws error when creating UFixed<256,16> from log with invalid length',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
      await expect(() => getAvmResult({ appClient }, 'verify_bigufixed_from_log', logValue)).rejects.toThrowError(
        invalidBytesLengthError(256),
      )

      const result = convertBytes<UFixed<256, 16>>(Bytes(logValue), { prefix: 'log', strategy: 'unsafe-cast' })
      expect(asBigUint(result.bytes)).toEqual(encodingUtil.uint8ArrayToBigInt(value))
    },
  )
})
