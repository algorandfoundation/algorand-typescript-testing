import { getABIEncodedValue } from '@algorandfoundation/algokit-utils/types/app-arc56'
import { Bytes } from '@algorandfoundation/algorand-typescript'
import { interpretAsArc4, StaticBytes } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { describe, expect, test } from 'vitest'

const testData = [
  {
    abiTypeString() {
      return `byte[${this.nativeValue().length}]`
    },
    nativeValue() {
      return [0, 1, 8, 16, 32, 64, 128, 255, 20, 30, 40, 50, 111]
    },
    staticBytes() {
      return new StaticBytes<13>(Bytes(this.nativeValue()))
    },
  },
  {
    abiTypeString() {
      return `byte[${this.nativeValue().length}]`
    },
    nativeValue() {
      return encodingUtil.utf8ToUint8Array('01ff99aa'.repeat(8))
    },
    staticBytes() {
      return new StaticBytes<64>('01ff99aa'.repeat(8))
    },
  },
]

describe('arc4.StaticBytes', async () => {
  test.each(testData)('should be able to get bytes representation', async (data) => {
    const sdkResult = getABIEncodedValue(data.nativeValue(), data.abiTypeString(), {})
    const result = data.staticBytes().bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each(testData)('should be able to concat', async (data) => {
    const sdkResult = getABIEncodedValue([...data.nativeValue(), ...data.nativeValue()], 'byte[]', {})
    const result = data.staticBytes().concat(data.staticBytes()).bytes
    expect(result).toEqual(Bytes(sdkResult))
  })

  test.each(testData)('get item from static bytes', async (data) => {
    const staticArray = data.staticBytes()
    const nativeValue = data.nativeValue()
    for (let i = 0; i < staticArray.length; i++) {
      expect(staticArray[i].native).toEqual(nativeValue[i])
    }
    expect(staticArray.length).toEqual(nativeValue.length)
  })

  test.each(testData)('create static bytes from bytes', async (data) => {
    const nativeValue = data.nativeValue()
    const sdkEncodedBytes = getABIEncodedValue(nativeValue, data.abiTypeString(), {})
    const result = interpretAsArc4<StaticBytes>(Bytes(sdkEncodedBytes))
    for (let i = 0; i < result.length; i++) {
      expect(result[i].native).toEqual(nativeValue[i])
    }
  })
})
