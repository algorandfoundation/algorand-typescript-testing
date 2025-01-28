import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Bool, interpretAsArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, beforeAll, describe, expect } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import { asUint8Array } from '../../src/util'
import { getAvmResult } from '../avm-invoker'
import { createArc4TestFixture } from '../test-fixture'

describe('arc4.Bool', async () => {
  const [test, localnetFixture] = createArc4TestFixture('tests/artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc56.json', {
    Arc4PrimitiveOpsContract: { deployParams: { createParams: { extraProgramPages: undefined } } },
  })
  const ctx = new TestExecutionContext()

  beforeAll(async () => {
    await localnetFixture.newScope()
  })

  afterEach(() => {
    ctx.reset()
  })

  test.for([true, false])(
    'should be able to get bytes representation of %s',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult({ appClient }, 'verify_bool_bytes', value)
      const result = new Bool(value)
      expect(result.bytes).toEqual(avmResult)
    },
  )

  test.for([asUint8Array(Bytes.fromHex('00')), asUint8Array(Bytes.fromHex('80'))])(
    'create Bool from bytes',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const avmResult = await getAvmResult({ appClient }, 'verify_bool_from_bytes', value)
      const result = interpretAsArc4<Bool>(Bytes(value))
      expect(result.native).toEqual(avmResult)
    },
  )

  test.for([asUint8Array(Bytes.fromHex('00')), asUint8Array(Bytes.fromHex('80'))])(
    'create Bool from log',
    async (value, { appClientArc4PrimitiveOpsContract: appClient }) => {
      const paddedValue = new Uint8Array([...asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX), ...value])
      const avmResult = await getAvmResult({ appClient }, 'verify_bool_from_log', paddedValue)
      const result = interpretAsArc4<Bool>(Bytes(paddedValue), 'log')
      expect(result.native).toEqual(avmResult)
    },
  )

  test.for([
    [asUint8Array(Bytes.fromHex('00')), asUint8Array('')],
    [asUint8Array(Bytes.fromHex('80')), asUint8Array(Bytes.fromHex('ff000102'))],
    [asUint8Array(Bytes.fromHex('00')), asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.slice(0, 3))],
  ])(
    'should throw error when log prefix is invalid for Bool',
    async ([value, prefix], { appClientArc4PrimitiveOpsContract: appClient }) => {
      const paddedValue = new Uint8Array([...prefix, ...value])
      await expect(() => getAvmResult({ appClient }, 'verify_bool_from_log', paddedValue)).rejects.toThrowError(
        new RegExp('(has valid prefix)|(extraction start \\d+ is beyond length)'),
      )
      expect(() => interpretAsArc4<Bool>(Bytes(paddedValue), 'log')).toThrowError('ABI return prefix not found')
    },
  )
})
