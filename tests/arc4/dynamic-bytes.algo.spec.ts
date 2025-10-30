import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { DynamicBytes, convertBytes } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { describe, expect, test } from 'vitest'

const abiTypeString = 'byte[]'
const testData = [
  {
    nativeValue() {
      return [0, 1, 8, 16, 32, 64, 128, 255, 20, 30, 40, 50, 111]
    },
    dynamicBytes() {
      return new DynamicBytes(Bytes(this.nativeValue()))
    },
  },
  {
    nativeValue() {
      return [...encodingUtil.utf8ToUint8Array('01ff99aa'.repeat(8))]
    },
    dynamicBytes() {
      return new DynamicBytes('01ff99aa'.repeat(8))
    },
  },
]

describe('arc4.DynamicBytes', async () => {
  test.each(testData)('should be able to get bytes representation', async (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValue(), abiTypeString, {})
    const result = data.dynamicBytes().bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each(testData)('should be able to concat', async (data) => {
    const sdkResult = getABIEncodedValue([...data.nativeValue(), ...data.nativeValue()], abiTypeString, {})
    const result = data.dynamicBytes().concat(data.dynamicBytes()).bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each(testData)('get item from dynamic bytes', async (data) => {
    const dynamicArray = data.dynamicBytes()
    const nativeValue = data.nativeValue()
    for (let i = 0; i < dynamicArray.length; i++) {
      expect(dynamicArray[i].asUint64()).toEqual(nativeValue[i])
    }
    expect(dynamicArray.length).toEqual(nativeValue.length)
  })

  test.each(testData)('create dynamic bytes from bytes', async (data) => {
    const nativeValue = data.nativeValue()
    const sdkEncodedBytes = getABIEncodedValue(nativeValue, abiTypeString, {})
    const result = convertBytes<DynamicBytes>(Bytes(sdkEncodedBytes), { strategy: 'unsafe-cast' })
    for (let i = 0; i < result.length; i++) {
      expect(result[i].asUint64()).toEqual(nativeValue[i])
    }
  })
})
