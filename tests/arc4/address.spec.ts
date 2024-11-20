import { Account, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Address, interpretAsArc4 } from '@algorandfoundation/algorand-typescript/arc4'
import { ABIType, encodeAddress } from 'algosdk'
import { afterEach, describe, expect, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import { asUint8Array } from '../util'

const abiAddressType = ABIType.from('address')
const testData = [
  Bytes.fromHex('00'.repeat(32)),
  Bytes.fromHex('01'.repeat(32)),
  Bytes.fromHex('ff'.repeat(32)),
  Bytes.fromHex(`${'00'.repeat(31)}ff`),
]

describe('arc4.Address', async () => {
  const ctx = new TestExecutionContext()
  afterEach(async () => {
    ctx.reset()
  })

  test.each(testData)('create address from bytes', async (value) => {
    const sdkResult = abiAddressType.encode(asUint8Array(value))
    const result = new Address(value)
    expect(result.bytes).toEqual(sdkResult)
  })
  test.each(testData)('create address from str', async (value) => {
    const stringValue = encodeAddress(asUint8Array(value))
    const sdkResult = abiAddressType.encode(stringValue)
    const result = new Address(stringValue)
    expect(result.bytes).toEqual(sdkResult)
  })
  test.each(testData)('create address from Account', async (value) => {
    const accountValue = Account(value)
    const sdkResult = abiAddressType.encode(asUint8Array(accountValue.bytes))
    const result = new Address(accountValue)
    expect(result.bytes).toEqual(sdkResult)
  })

  test.each(testData)('get item from address created from bytes', async (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const result = new Address(value)
    let i = 0
    for (const entry of result) {
      expect(entry.native).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })
  test.each(testData)('get item from address created from str', async (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const stringValue = encodeAddress(uint8ArrayValue)
    const result = new Address(stringValue)
    let i = 0
    for (const entry of result) {
      expect(entry.native).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })
  test.each(testData)('get item from address created from Account', async (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const accountValue = Account(value)
    const result = new Address(accountValue)
    let i = 0
    for (const entry of result) {
      expect(entry.native).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })

  test.each(testData)('fromBytes method', async (value) => {
    const sdkResult = abiAddressType.encode(asUint8Array(value))
    const result = interpretAsArc4<Address>(value)
    expect(result.bytes).toEqual(sdkResult)
  })

  test.each(testData)('fromLog method', async (value) => {
    const sdkResult = abiAddressType.encode(asUint8Array(value))
    const paddedValue = Bytes([...asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX), ...asUint8Array(value)])
    const result = interpretAsArc4<Address>(paddedValue, 'log')
    expect(result.bytes).toEqual(sdkResult)
  })
})
