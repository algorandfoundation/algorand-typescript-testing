import type {
  Account,
  Application,
  Asset,
  biguint,
  bytes,
  OnCompleteAction,
  TransactionType,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded, Bool } from '@algorandfoundation/algorand-typescript/arc4'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { ABI_RETURN_VALUE_LOG_PREFIX, BITS_IN_BYTE } from '../../constants'
import type { DeliberateAny } from '../../typescript-helpers'
import { asBytes, asBytesCls, assert, asUint8Array } from '../../util'
import { BytesBackedCls, Uint64BackedCls } from '../base'
import type { BytesCls, StubBytesCompat } from '../primitives'
import { AlgoTsPrimitiveCls, BigUint, Uint64 } from '../primitives'
import { AccountCls, ApplicationCls, AssetCls } from '../reference'
import { ABI_LENGTH_SIZE } from './constants'
import type { fromBytes, StaticArrayGenericArgs, TypeInfo } from './types'

/** @internal */
export const validBitSizes = [...Array(64).keys()].map((x) => (x + 1) * 8)
/** @internal */
export const maxBigIntValue = (bitSize: number) => 2n ** BigInt(bitSize) - 1n
/** @internal */
export const maxBytesLength = (bitSize: number) => Math.floor(bitSize / BITS_IN_BYTE)
/** @internal */
export const regExpNxM = (maxPrecision: number) => new RegExp(`^\\d*\\.?\\d{0,${maxPrecision}}$`)
/** @internal */
export const trimTrailingDecimalZeros = (v: string) => v.replace(/(\d+\.\d*?)0+$/, '$1').replace(/\.$/, '')

/** @internal */
export const trimGenericTypeName = (typeName: string): string => typeName.replace(/<.*>/, '')

/** @internal */
export const areAllARC4Encoded = <T>(items: T[]): items is T[] => items.every((item) => item instanceof ARC4Encoded)

/** @internal */
export const checkItemTypeName = (type: TypeInfo, value: ARC4Encoded) => {
  const validTypeName = trimGenericTypeName(type.name)
  assert(validTypeName === value.constructor.name, `item must be of type ${validTypeName}, not ${value.constructor.name}`)
}

// Walk consecutive booleans from `index` in direction `delta`, returning the count of
// neighbouring bools (excluding the starting element). Returns -1 if the starting element
// is not a bool, and 0 when `index` is already at the boundary in the chosen direction.
const findBoolRun = <T>(values: T[], index: number, delta: number, isBool: (v: T) => boolean, isHomogenous?: boolean): number => {
  const length = values.length
  if (isHomogenous) {
    return delta < 0 ? 0 : length - index - 1
  }
  let until = 0
  while (true) {
    const curr = index + delta * until
    if (isBool(values[curr])) {
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

/** @internal */
export const findBoolTypes = (values: TypeInfo[], index: number, delta: number, isHomogenous?: boolean): number =>
  findBoolRun(values, index, delta, (v) => v.name === 'Bool' || v.name === 'boolean', isHomogenous)

/** @internal */
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
        getNativeValue(
          value,
          Array.isArray(targetTypeInfo?.genericArgs)
            ? (targetTypeInfo?.genericArgs as TypeInfo[])?.[index]
            : ((targetTypeInfo?.genericArgs as Record<string, TypeInfo>)?.[key] as TypeInfo),
        ),
      ]),
    )
  }
  return native
}

/** @internal */
export const readLength = (value: Uint8Array): readonly [number, Uint8Array] => {
  const length = Number(encodingUtil.uint8ArrayToBigInt(value.slice(0, ABI_LENGTH_SIZE)))
  const data = value.slice(ABI_LENGTH_SIZE)
  return [length, data]
}

/** @internal */
export const encodeLength = (length: number): BytesCls => {
  return asBytesCls(encodingUtil.bigIntToUint8Array(BigInt(length), ABI_LENGTH_SIZE))
}

/** @internal */
export const findBool = (values: ARC4Encoded[], index: number, delta: number, isHomogenous?: boolean): number =>
  findBoolRun(values, index, delta, (v) => v instanceof Bool, isHomogenous)

/** @internal */
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

/** @internal */
export const holdsDynamicLengthContent = (value: TypeInfo): boolean => {
  const itemTypeName = trimGenericTypeName(value.name)

  return (
    itemTypeName === 'Str' ||
    itemTypeName === 'Array' ||
    itemTypeName === 'ReadonlyArray' ||
    itemTypeName === 'DynamicArray' ||
    itemTypeName === 'ReferenceArray' ||
    itemTypeName === 'DynamicBytes' ||
    value.name === 'bytes' || // `bytes` has dynamic length but `bytes<N>` is statically sized
    itemTypeName === 'string' ||
    ((itemTypeName === 'StaticArray' || itemTypeName === 'FixedArray') &&
      holdsDynamicLengthContent((value.genericArgs as StaticArrayGenericArgs).elementType)) ||
    ((itemTypeName === 'Tuple' ||
      itemTypeName === 'MutableTuple' ||
      itemTypeName === 'ReadonlyTuple' ||
      itemTypeName === 'Struct' ||
      itemTypeName === 'Object' ||
      itemTypeName === 'ReadonlyObject') &&
      Object.values(value.genericArgs as Record<string, TypeInfo>).some(holdsDynamicLengthContent))
  )
}

/** @internal */
export const stripLogPrefix = (value: StubBytesCompat | Uint8Array, prefix: 'none' | 'log'): Uint8Array => {
  const uint8ArrayValue = value instanceof Uint8Array ? value : asUint8Array(value)
  if (prefix === 'log') {
    assert(asBytes(uint8ArrayValue.slice(0, 4)).equals(ABI_RETURN_VALUE_LOG_PREFIX), 'ABI return prefix not found')
    return uint8ArrayValue.slice(4)
  }
  return uint8ArrayValue
}

const bigIntFromBytes = (val: StubBytesCompat | Uint8Array, _typeInfo: TypeInfo, prefix: 'none' | 'log' = 'none'): bigint =>
  encodingUtil.uint8ArrayToBigInt(asUint8Array(stripLogPrefix(val, prefix)))

/** @internal */
export const booleanFromBytes: fromBytes<boolean> = (...args) => bigIntFromBytes(...args) > 0n

/** @internal */
export const bigUintFromBytes: fromBytes<biguint> = (...args) => BigUint(bigIntFromBytes(...args))

/** @internal */
export const uint64FromBytes: fromBytes<uint64> = (...args) => Uint64(bigIntFromBytes(...args))

/** @internal */
export const onCompletionFromBytes: fromBytes<OnCompleteAction> = (...args) => uint64FromBytes(...args) as OnCompleteAction

/** @internal */
export const transactionTypeFromBytes: fromBytes<TransactionType> = (...args) => uint64FromBytes(...args) as TransactionType

/** @internal */
export const bytesFromBytes: fromBytes<bytes> = (val, _typeInfo, prefix = 'none') => asBytes(stripLogPrefix(val, prefix))

/** @internal */
export const stringFromBytes: fromBytes<string> = (...args) => bytesFromBytes(...args).toString()

/** @internal */
export const accountFromBytes: fromBytes<Account> = (val, _typeInfo, prefix = 'none') => AccountCls.fromBytes(stripLogPrefix(val, prefix))

/** @internal */
export const applicationFromBytes: fromBytes<Application> = (val, _typeInfo, prefix = 'none') =>
  ApplicationCls.fromBytes(stripLogPrefix(val, prefix))

/** @internal */
export const assetFromBytes: fromBytes<Asset> = (val, _typeInfo, prefix = 'none') => AssetCls.fromBytes(stripLogPrefix(val, prefix))
