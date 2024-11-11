import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Bool } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResult } from '../avm-invoker'
import { asUint8Array } from '../util'

describe('arc4.Bool', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(async () => {
    ctx.reset()
  })

  test.each([true, false])('should be able to get bytes representation of %s', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_bool_bytes', value)
    const result = new Bool(value)
    expect(result.bytes).toEqual(avmResult)
  })

  test.each([asUint8Array(Bytes.fromHex('00')), asUint8Array(Bytes.fromHex('80'))])('create Bool from bytes', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_bool_from_bytes', value)
    const result = Bool.fromBytes(Bytes(value))
    expect(result.native).toEqual(avmResult)
  })

  test.each([asUint8Array(Bytes.fromHex('00')), asUint8Array(Bytes.fromHex('80'))])('create Bool from log', async (value) => {
    const paddedValue = new Uint8Array([...asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX), ...value])
    const avmResult = await getAvmResult({ appClient }, 'verify_bool_from_log', paddedValue)
    const result = Bool.fromLog(Bytes(paddedValue))
    expect(result.native).toEqual(avmResult)
  })

  test.each([
    [asUint8Array(Bytes.fromHex('00')), asUint8Array('')],
    [asUint8Array(Bytes.fromHex('80')), asUint8Array(Bytes.fromHex('ff000102'))],
    [asUint8Array(Bytes.fromHex('00')), asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.slice(0, 3))],
  ])('should throw error when log prefix is invalid for Bool', async (value, prefix) => {
    const paddedValue = new Uint8Array([...prefix, ...value])
    await expect(() => getAvmResult({ appClient }, 'verify_bool_from_log', paddedValue)).rejects.toThrowError(
      new RegExp('(assert failed)|(extraction start \\d+ is beyond length)'),
    )
    expect(() => Bool.fromLog(Bytes(paddedValue))).toThrowError('ABI return prefix not found')
  })
})
