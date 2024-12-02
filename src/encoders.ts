import { biguint, BigUint, bytes, internal, TransactionType, uint64, Uint64 } from '@algorandfoundation/algorand-typescript'
import { OnCompleteAction } from '@algorandfoundation/algorand-typescript/arc4'
import { AccountCls } from './impl/account'
import { ApplicationCls } from './impl/application'
import { AssetCls } from './impl/asset'
import { arc4Encoders, getArc4Encoder } from './impl/encoded-types'
import { DeliberateAny } from './typescript-helpers'
import { asBytes, asUint8Array } from './util'

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
