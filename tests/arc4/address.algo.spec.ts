import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Account, Bytes } from '@algorandfoundation/algorand-typescript'
import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { Address, convertBytes } from '@algorandfoundation/algorand-typescript/arc4'
import { afterEach, describe, expect, test } from 'vitest'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../../src/constants'
import { encodeAddress } from '../../src/impl/reference'
import { asUint8Array } from '../../src/util'

const abiTypeString = 'address'
const testData = [
  Bytes.fromHex('00'.repeat(32)),
  Bytes.fromHex('01'.repeat(32)),
  Bytes.fromHex('ff'.repeat(32)),
  Bytes.fromHex(`${'00'.repeat(31)}ff`),
]

describe('arc4.Address', () => {
  const ctx = new TestExecutionContext()
  afterEach(() => {
    ctx.reset()
  })

  test.each(testData)('create address from bytes', (value) => {
    const sdkResult = getABIEncodedValue(asUint8Array(value), abiTypeString, {})
    const result = new Address(value)
    expect(result.bytes).toEqual(sdkResult)
  })
  test.each(testData)('create address from str', (value) => {
    const stringValue = encodeAddress(asUint8Array(value))
    const sdkResult = getABIEncodedValue(stringValue, abiTypeString, {})
    const result = new Address(stringValue)
    expect(result.bytes).toEqual(sdkResult)
  })
  test.each(testData)('create address from Account', (value) => {
    const accountValue = Account(value)
    const sdkResult = getABIEncodedValue(asUint8Array(accountValue.bytes), abiTypeString, {})
    const result = new Address(accountValue)
    expect(result.bytes).toEqual(sdkResult)
  })

  test.each(testData)('get item from address created from bytes', (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const result = new Address(value)
    let i = 0
    for (const entry of result) {
      expect(entry.asUint64()).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })
  test.each(testData)('get item from address created from str', (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const stringValue = encodeAddress(uint8ArrayValue)
    const result = new Address(stringValue)
    let i = 0
    for (const entry of result) {
      expect(entry.asUint64()).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })
  test.each(testData)('get item from address created from Account', (value) => {
    const uint8ArrayValue = asUint8Array(value)
    const accountValue = Account(value)
    const result = new Address(accountValue)
    let i = 0
    for (const entry of result) {
      expect(entry.asUint64()).toEqual(uint8ArrayValue[i++])
    }
    expect(result.length).toEqual(uint8ArrayValue.length)
  })

  test.each(testData)('fromBytes method', (value) => {
    const sdkResult = getABIEncodedValue(asUint8Array(value), abiTypeString, {})
    const result = convertBytes<Address>(value, { strategy: 'unsafe-cast' })
    expect(result.bytes).toEqual(sdkResult)
  })

  test.each(testData)('fromLog method', (value) => {
    const sdkResult = getABIEncodedValue(asUint8Array(value), abiTypeString, {})
    const paddedValue = Bytes([...asUint8Array(ABI_RETURN_VALUE_LOG_PREFIX), ...asUint8Array(value)])
    const result = convertBytes<Address>(paddedValue, { prefix: 'log', strategy: 'unsafe-cast' })
    expect(result.bytes).toEqual(sdkResult)
  })
})
