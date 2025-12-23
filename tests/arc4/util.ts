import type { ABIValue } from '@algorandfoundation/algokit-utils/abi'
import { ABIType } from '@algorandfoundation/algokit-utils/abi'

export function getABIEncodedValue(abiValue: ABIValue, abiTypeName: string) {
  return ABIType.from(abiTypeName).encode(abiValue)
}
