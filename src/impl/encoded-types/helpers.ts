import type { biguint, bytes, OnCompleteAction, TransactionType, uint64 } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded, Bool } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { BITS_IN_BYTE } from '../../constants'
import type { DeliberateAny } from '../../typescript-helpers'
import { asBytesCls, assert } from '../../util'
import { BytesBackedCls, Uint64BackedCls } from '../base'
import type { BytesCls } from '../primitives'
import { AlgoTsPrimitiveCls } from '../primitives'
import { ABI_LENGTH_SIZE } from './constants'
import type { StaticArrayGenericArgs, TypeInfo } from './types'

import { asBytes, asUint8Array } from '../../util'
import { BigUint, Uint64 } from '../primitives'
import type { fromBytes } from './types'

export const validBitSizes = [...Array(64).keys()].map((x) => (x + 1) * 8)
export const maxBigIntValue = (bitSize: number) => 2n ** BigInt(bitSize) - 1n
export const maxBytesLength = (bitSize: number) => Math.floor(bitSize / BITS_IN_BYTE)
export const regExpNxM = (maxPrecision: number) => new RegExp(`^\\d*\\.?\\d{0,${maxPrecision}}$`)
export const trimTrailingDecimalZeros = (v: string) => v.replace(/(\d+\.\d*?)0+$/, '$1').replace(/\.$/, '')

export const trimGenericTypeName = (typeName: string): string => typeName.replace(/<.*>/, '')

export const areAllARC4Encoded = <T extends ARC4Encoded>(items: T[]): items is T[] => items.every((item) => item instanceof ARC4Encoded)

export const checkItemTypeName = (type: TypeInfo, value: ARC4Encoded) => {
  const typeName = trimGenericTypeName(type.name)
  const validTypeNames = [typeName, `${typeName}Impl`]
  assert(validTypeNames.includes(value.constructor.name), `item must be of type ${typeName}, not ${value.constructor.name}`)
}

export const findBoolTypes = (values: TypeInfo[], index: number, delta: number): number => {
  // Helper function to find consecutive booleans from current index in a tuple.
  let until = 0
  const length = values.length
  while (true) {
    const curr = index + delta * until
    if (['Bool', 'boolean'].includes(values[curr].name)) {
      if ((curr != length - 1 && delta > 0) || (curr > 0 && delta < 0)) {
        until += 1
      } else {
        break
      }
    } else {
      until -= 1
      break
    }
  }
  return until
}

export const getNativeValue = (value: DeliberateAny, targetTypeInfo: TypeInfo | undefined): DeliberateAny => {
  if (value.typeInfo && value.typeInfo.name === targetTypeInfo?.name) {
    return value
  }
  const native = (value as DeliberateAny).native
  if (Array.isArray(native)) {
    return native.map((item) => getNativeValue(item, (targetTypeInfo?.genericArgs as { elementType: TypeInfo })?.elementType))
  } else if (native instanceof AlgoTsPrimitiveCls) {
    return native
  } else if (native instanceof BytesBackedCls) {
    return native.bytes
  } else if (native instanceof Uint64BackedCls) {
    return native.uint64
  } else if (typeof native === 'object') {
    return Object.fromEntries(
      Object.entries(native).map(([key, value], index) => [
        key,
        getNativeValue(value, (targetTypeInfo?.genericArgs as TypeInfo[])?.[index]),
      ]),
    )
  }
  return native
}

export const readLength = (value: Uint8Array): readonly [number, Uint8Array] => {
  const length = Number(encodingUtil.uint8ArrayToBigInt(value.slice(0, ABI_LENGTH_SIZE)))
  const data = value.slice(ABI_LENGTH_SIZE)
  return [length, data]
}

export const encodeLength = (length: number): BytesCls => {
  return asBytesCls(encodingUtil.bigIntToUint8Array(BigInt(length), ABI_LENGTH_SIZE))
}

export const findBool = (values: ARC4Encoded[], index: number, delta: number) => {
  let until = 0
  const length = values.length
  while (true) {
    const curr = index + delta * until
    if (values[curr] instanceof Bool) {
      if ((curr !== length - 1 && delta > 0) || (curr > 0 && delta < 0)) {
        until += 1
      } else {
        break
      }
    } else {
      until -= 1
      break
    }
  }
  return until
}

export const compressMultipleBool = (values: Bool[]): number => {
  let result = 0
  if (values.length > 8) {
    throw new Error('length of list should not be greater than 8')
  }
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value.native) {
      result |= 1 << (7 - i)
    }
  }
  return result
}

export const holdsDynamicLengthContent = (value: TypeInfo): boolean => {
  const itemTypeName = trimGenericTypeName(value.name)

  return (
    itemTypeName === 'Str' ||
    itemTypeName === 'DynamicArray' ||
    itemTypeName === 'DynamicBytes' ||
    (itemTypeName === 'StaticArray' && holdsDynamicLengthContent((value.genericArgs as StaticArrayGenericArgs).elementType)) ||
    ((itemTypeName === 'Tuple' || itemTypeName === 'Struct') &&
      Object.values(value.genericArgs as Record<string, TypeInfo>).some(holdsDynamicLengthContent))
  )
}

export const booleanFromBytes: fromBytes<boolean> = (val) => {
  return encodingUtil.uint8ArrayToBigInt(asUint8Array(val)) > 0n
}

export const bigUintFromBytes: fromBytes<biguint> = (val) => {
  return BigUint(encodingUtil.uint8ArrayToBigInt(asUint8Array(val)))
}

export const bytesFromBytes: fromBytes<bytes> = (val) => {
  return asBytes(val)
}

export const stringFromBytes: fromBytes<string> = (val) => {
  return asBytes(val).toString()
}

export const uint64FromBytes: fromBytes<uint64> = (val) => {
  return Uint64(encodingUtil.uint8ArrayToBigInt(asUint8Array(val)))
}

export const onCompletionFromBytes: fromBytes<OnCompleteAction> = (val) => {
  return Uint64(encodingUtil.uint8ArrayToBigInt(asUint8Array(val))) as OnCompleteAction
}

export const transactionTypeFromBytes: fromBytes<TransactionType> = (val) => {
  return Uint64(encodingUtil.uint8ArrayToBigInt(asUint8Array(val))) as TransactionType
}
