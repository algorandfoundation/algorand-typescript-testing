import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { interpretAsArc4, UFixedNxM } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import { asBigUint, asUint8Array } from '../../src/util'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResult } from '../avm-invoker'

const invalidBytesLengthError = (length: number) => `byte string must correspond to a ufixed${length}`
describe('arc4.UFixedNxM', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(async () => {
    ctx.reset()
  })

  test.each(['-1', '42.9496729501', '255.01two'])(
    'should throw error when instantiating UFixedNxM<32,8> with invalid value %s',
    async (value) => {
      expect(() => new UFixedNxM<32, 8>(value as `${number}.${number}`)).toThrow(
        'expected positive decimal literal with max of 8 decimal places',
      )
    },
  )

  test.each(['42.94967296', (2n ** 32n).toString()])(
    'should throw error when instantiating UFixedNxM<32,8> with overflowing value %s',
    async (value) => {
      expect(() => new UFixedNxM<32, 8>(value as `${number}.${number}`)).toThrow('expected value <=')
    },
  )

  test.each(['0', '1', '25.5', '42.94967295', '42.9496729500'])(
    'should be able to get UFixedNxM<32,8> bytes representation of %s',
    async (value) => {
      const a = new UFixedNxM<32, 8>(value as `${number}.${number}`)
      const bigIntValue = asBigUint(a.bytes).valueOf()
      const avmResult = await getAvmResult({ appClient }, 'verify_ufixednxm_bytes', bigIntValue)
      expect(a.bytes).toEqual(avmResult)
    },
  )

  test.each(['0', '1', '25.5', '42.94967295', '11579208923731619542357098500868790785326998466564056403945758.4007913129639935'])(
    'should be able to get UFixedNxM<256,16> bytes representation of %s',
    async (value) => {
      const a = new UFixedNxM<256, 16>(value as `${number}.${number}`)
      const bigIntValue = asBigUint(a.bytes).valueOf()
      const avmResult = await getAvmResult({ appClient }, 'verify_bigufixednxm_bytes', bigIntValue)
      expect(a.bytes).toEqual(avmResult)
    },
  )

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 4),
    encodingUtil.bigIntToUint8Array(255n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 16n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n),
  ])('create UFixedNxM<32,8> from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_ufixednxm_from_bytes', value)
    const result = interpretAsArc4<UFixedNxM<32, 8>>(Bytes(value))

    expect(result.native).toEqual(avmResult)
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])('sdk throws error when creating UFixedNxM<32,8> from bytes with invalid length', async (value) => {
    await expect(getAvmResult({ appClient }, 'verify_ufixednxm_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(32))

    const result = interpretAsArc4<UFixedNxM<32, 8>>(Bytes(value))
    expect(result.bytes).toEqual(value)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(0n, 4), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 4), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 4), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 4), 2n ** 32n - 1n],
  ])('create UFixedNxM<32,8> from abi log', async (value, expected) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    const avmResult = await getAvmResult({ appClient }, 'verify_ufixednxm_from_log', logValue)

    const result = interpretAsArc4<UFixedNxM<32, 8>>(Bytes(logValue), 'log')
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 4), Bytes.fromHex('FF000102')],
  ])('should throw error when log prefix is invalid for UFixedNxM<32,8>', async (value, prefix) => {
    const logValue = asUint8Array(Bytes(prefix).concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_ufixednxm_from_log', logValue)).rejects.toThrowError('assert failed')
    expect(() => interpretAsArc4<UFixedNxM<32, 8>>(Bytes(logValue), 'log')).toThrowError('ABI return prefix not found')
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 1),
    encodingUtil.bigIntToUint8Array(0n, 8),
    encodingUtil.bigIntToUint8Array(255n, 2),
    encodingUtil.bigIntToUint8Array(2n ** 32n - 1n, 8),
  ])('sdk throws error when creating UFixedNxM<32,8> from log with invalid length', async (value) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_ufixednxm_from_log', logValue)).rejects.toThrowError(invalidBytesLengthError(32))

    const result = interpretAsArc4<UFixedNxM<32, 8>>(Bytes(logValue), 'log')
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 32),
    encodingUtil.bigIntToUint8Array(255n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n),
  ])('create UFixedNxM<256,16> from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_bigufixednxm_from_bytes', value)
    const result = interpretAsArc4<UFixedNxM<256, 16>>(Bytes(value))

    expect(result.native).toEqual(avmResult)
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])('sdk throws error when creating UFixedNxM<256,16> from bytes with invalid length', async (value) => {
    await expect(getAvmResult({ appClient }, 'verify_bigufixednxm_from_bytes', value)).rejects.toThrowError(invalidBytesLengthError(256))

    const result = interpretAsArc4<UFixedNxM<256, 16>>(Bytes(value))
    expect(result.bytes).toEqual(value)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(0n, 32), 0n],
    [encodingUtil.bigIntToUint8Array(255n, 32), 255n],
    [encodingUtil.bigIntToUint8Array(2n ** 16n, 32), 2n ** 16n],
    [encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 32), 2n ** 256n - 1n],
  ])('create UFixedNxM<256,16> from abi log', async (value, expected) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    const avmResult = await getAvmResult({ appClient }, 'verify_bigufixednxm_from_log', logValue)

    const result = interpretAsArc4<UFixedNxM<256, 16>>(Bytes(logValue), 'log')
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes()],
    [encodingUtil.bigIntToUint8Array(255n, 32), Bytes.fromHex('FF000102')],
  ])('should throw error when log prefix is invalid for UFixedNxM<256,16>', async (value, prefix) => {
    const logValue = asUint8Array(Bytes(prefix).concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_bigufixednxm_from_log', logValue)).rejects.toThrowError('assert failed')
    expect(() => interpretAsArc4<UFixedNxM<256, 16>>(Bytes(logValue), 'log')).toThrowError('ABI return prefix not found')
  })

  test.each([
    encodingUtil.bigIntToUint8Array(0n, 16),
    encodingUtil.bigIntToUint8Array(0n, 40),
    encodingUtil.bigIntToUint8Array(2n ** 128n - 1n, 16),
    encodingUtil.bigIntToUint8Array(2n ** 256n - 1n, 40),
  ])('sdk throws error when creating UFixedNxM<256,16> from log with invalid length', async (value) => {
    const logValue = asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.concat(Bytes(value)))
    await expect(() => getAvmResult({ appClient }, 'verify_bigufixednxm_from_log', logValue)).rejects.toThrowError(
      invalidBytesLengthError(256),
    )

    const result = interpretAsArc4<UFixedNxM<256, 16>>(Bytes(logValue), 'log')
    expect(result.native).toEqual(encodingUtil.uint8ArrayToBigInt(value))
  })
})
