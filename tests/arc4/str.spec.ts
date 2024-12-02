import { AppSpec } from '@algorandfoundation/algokit-utils/types/app-spec'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { interpretAsArc4, Str } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { afterEach, describe, expect, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_LOG_SIZE } from '../../src/constants'
import appSpecJson from '../artifacts/arc4-primitive-ops/data/Arc4PrimitiveOpsContract.arc32.json'
import { getAlgorandAppClient, getAvmResult } from '../avm-invoker'
import { asUint8Array } from '../util'

describe('arc4.Str', async () => {
  const appClient = await getAlgorandAppClient(appSpecJson as AppSpec)
  const ctx = new TestExecutionContext()

  afterEach(async () => {
    ctx.reset()
  })

  test.each([
    '',
    'hello',
    '0'.repeat(MAX_LOG_SIZE - 13), // Max log size is 1024
  ])('instantiate Str with %s', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_string_init', asUint8Array(value))
    const result = new Str(`Hello, ${value}`)
    expect(result.native).toEqual(avmResult)
  })

  test.each([
    ['hello', 'world', 'helloworld'],
    ['foo', 'bar', 'foobar'],
  ])('add Str values', async (a, b, expected) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_string_add', asUint8Array(a), asUint8Array(b))
    const aStr = new Str(a)
    const bStr = new Str(b)
    const result = new Str(aStr.native.concat(bStr.native))
    expect(avmResult).toEqual(expected)
    expect(result.native).toEqual(expected)
  })

  test.each([
    ['', ''],
    ['hello', 'hello'],
    ['foo', 'Foo'],
    ['foo', 'bar'],
  ])('%s equals %s', async (a, b) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_string_eq', asUint8Array(a), asUint8Array(b))
    const aStr = new Str(a)
    const bStr = new Str(b)
    const result = aStr === bStr
    expect(result).toEqual(avmResult)
  })

  test.each([
    '',
    'hello',
    '0'.repeat(MAX_LOG_SIZE - 8), // Max log size is 1024
  ])('should be able to get bytes representation of %s', async (value) => {
    const avmResult = await getAvmResult({ appClient }, 'verify_string_bytes', asUint8Array(value))
    const result = new Str(value)
    expect(result.bytes).toEqual(avmResult)
  })

  test.each([
    asUint8Array(''),
    asUint8Array('hello'),
    asUint8Array('0'.repeat(MAX_LOG_SIZE - 13)), // Max log size is 1024
  ])('create Str from bytes', async (value) => {
    const paddedValue = new Uint8Array([...encodingUtil.bigIntToUint8Array(BigInt(value.length), 2), ...value])
    const avmResult = await getAvmResult({ appClient }, 'verify_string_from_bytes', paddedValue)
    const result = interpretAsArc4<Str>(Bytes(paddedValue))
    expect(result.native).toEqual(avmResult)
  })

  test.each([
    asUint8Array(''),
    asUint8Array('hello'),
    asUint8Array('0'.repeat(MAX_LOG_SIZE - 13)), // Max log size is 1024
  ])('create Str from log', async (value) => {
    const paddedValue = new Uint8Array([
      ...asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX),
      ...encodingUtil.bigIntToUint8Array(BigInt(value.length), 2),
      ...value,
    ])
    const avmResult = await getAvmResult({ appClient }, 'verify_string_from_log', paddedValue)
    const result = interpretAsArc4<Str>(Bytes(paddedValue), 'log')
    expect(result.native).toEqual(avmResult)
  })

  test.each([
    [asUint8Array(''), asUint8Array('')],
    [asUint8Array('hello'), asUint8Array(Bytes.fromHex('ff000102'))],
    [asUint8Array('0'.repeat(MAX_LOG_SIZE - 13)), asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX.slice(0, 3))], // Max log size is 1024
  ])('should throw error when log prefix is invalid for Str', async (value, prefix) => {
    const paddedValue = new Uint8Array([...prefix, ...value])
    await expect(() => getAvmResult({ appClient }, 'verify_string_from_log', paddedValue)).rejects.toThrowError(
      new RegExp('(assert failed)|(extraction start \\d+ is beyond length)'),
    )
    expect(() => interpretAsArc4<Str>(Bytes(paddedValue), 'log')).toThrowError('ABI return prefix not found')
  })
})
