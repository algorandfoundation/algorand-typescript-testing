import { biguint, BigUint, bytes, internal, TransactionType, uint64, Uint64 } from '@algorandfoundation/algorand-typescript'
import { ARC4Encoded, OnCompleteAction } from '@algorandfoundation/algorand-typescript/arc4'
import { BytesBackedCls, Uint64BackedCls } from './impl/base'
import { arc4Encoders, encodeArc4Impl, getArc4Encoder } from './impl/encoded-types'
import { AccountCls, ApplicationCls, AssetCls } from './impl/reference'
import { DeliberateAny } from './typescript-helpers'
import { asBytes, asMaybeBigUintCls, asMaybeBytesCls, asMaybeUint64Cls, asUint64Cls, asUint8Array, nameOfType } from './util'

export type TypeInfo = {
  name: string
  genericArgs?: TypeInfo[] | Record<string, TypeInfo>
}

export type fromBytes<T> = (val: Uint8Array | internal.primitives.StubBytesCompat, typeInfo: TypeInfo, prefix?: 'none' | 'log') => T

const booleanFromBytes: fromBytes<boolean> = (val) => {
  return internal.encodingUtil.uint8ArrayToBigInt(asUint8Array(val)) > 0n
}

const bigUintFromBytes: fromBytes<biguint> = (val) => {
  return BigUint(internal.encodingUtil.uint8ArrayToBigInt(asUint8Array(val)))
}

const bytesFromBytes: fromBytes<bytes> = (val) => {
  return asBytes(val)
}

const stringFromBytes: fromBytes<string> = (val) => {
  return asBytes(val).toString()
}

const uint64FromBytes: fromBytes<uint64> = (val) => {
  return Uint64(internal.encodingUtil.uint8ArrayToBigInt(asUint8Array(val)))
}

const onCompletionFromBytes: fromBytes<OnCompleteAction> = (val) => {
  return Uint64(internal.encodingUtil.uint8ArrayToBigInt(asUint8Array(val))) as OnCompleteAction
}

const transactionTypeFromBytes: fromBytes<TransactionType> = (val) => {
  return Uint64(internal.encodingUtil.uint8ArrayToBigInt(asUint8Array(val))) as TransactionType
}

export const encoders: Record<string, fromBytes<DeliberateAny>> = {
  account: AccountCls.fromBytes,
  application: ApplicationCls.fromBytes,
  asset: AssetCls.fromBytes,
  boolean: booleanFromBytes,
  biguint: bigUintFromBytes,
  bytes: bytesFromBytes,
  string: stringFromBytes,
  uint64: uint64FromBytes,
  OnCompleteAction: onCompletionFromBytes,
  TransactionType: transactionTypeFromBytes,
  ...arc4Encoders,
}

export const getEncoder = <T>(typeInfo: TypeInfo): fromBytes<T> => {
  return getArc4Encoder<T>(typeInfo, encoders)
}

export const toBytes = (val: unknown): bytes => {
  const uint64Val = asMaybeUint64Cls(val)
  if (uint64Val !== undefined) {
    return uint64Val.toBytes().asAlgoTs()
  }
  const bytesVal = asMaybeBytesCls(val)
  if (bytesVal !== undefined) {
    return bytesVal.asAlgoTs()
  }
  const bigUintVal = asMaybeBigUintCls(val)
  if (bigUintVal !== undefined) {
    return bigUintVal.toBytes().asAlgoTs()
  }
  if (val instanceof BytesBackedCls) {
    return val.bytes
  }
  if (val instanceof Uint64BackedCls) {
    return asUint64Cls(val.uint64).toBytes().asAlgoTs()
  }
  if (val instanceof ARC4Encoded) {
    return val.bytes
  }
  if (Array.isArray(val) || typeof val === 'object') {
    return encodeArc4Impl('', val)
  }
  internal.errors.internalError(`Invalid type for bytes: ${nameOfType(val)}`)
}
