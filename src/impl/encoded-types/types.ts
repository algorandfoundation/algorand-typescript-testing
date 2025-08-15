import type { BigUintCompat, Uint64Compat } from '@algorandfoundation/algorand-typescript'
import type { ARC4Encoded, BitSize } from '@algorandfoundation/algorand-typescript/arc4'

import type { StubBytesCompat } from '../primitives'

/** @internal */
export type CompatForArc4Int<N extends BitSize> = N extends 8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 ? Uint64Compat : BigUintCompat
/** @internal */
export type uFixedGenericArgs = { n: TypeInfo; m: TypeInfo }
/** @internal */
export type StaticArrayGenericArgs = { elementType: TypeInfo; size: TypeInfo }
/** @internal */
export type DynamicArrayGenericArgs = { elementType: TypeInfo }
/** @internal */
export type StructConstraint = Record<string, ARC4Encoded>
/** @internal */
export type TypeInfo = {
  name: string
  genericArgs?: TypeInfo[] | Record<string, TypeInfo>
}

/** @internal */
export type fromBytes<T> = (val: Uint8Array | StubBytesCompat, typeInfo: TypeInfo, prefix?: 'none' | 'log') => T
