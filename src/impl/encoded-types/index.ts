import type { ARC4Encoded } from '@algorandfoundation/algorand-typescript/arc4'
import type { StubBytesCompat } from '../primitives'
import { getEncoder } from './encoded-types'
import { getNativeValue } from './helpers'
import type { TypeInfo } from './types'

export {
  AddressImpl,
  BoolImpl,
  ByteImpl,
  DynamicArrayImpl,
  DynamicBytesImpl,
  encodeArc4Impl,
  FixedArrayImpl,
  getArc4Encoded,
  getEncoder,
  ReferenceArrayImpl,
  StaticArrayImpl,
  StaticBytesImpl,
  StrImpl,
  StructImpl,
  toBytes,
  TupleImpl,
  UFixedImpl,
  UintImpl,
} from './encoded-types'
export { TypeInfo } from './types'
export { arc4EncodedLengthImpl, getArc4TypeName, getMaxLengthOfStaticContentType, minLengthForType } from './utils'

export function decodeArc4Impl<T>(
  sourceTypeInfoString: string,
  targetTypeInfoString: string,
  bytes: StubBytesCompat,
  prefix: 'none' | 'log' = 'none',
): T {
  const sourceTypeInfo = JSON.parse(sourceTypeInfoString)
  const targetTypeInfo = JSON.parse(targetTypeInfoString)
  const encoder = getEncoder(sourceTypeInfo)
  const source = encoder(bytes, sourceTypeInfo, prefix) as { typeInfo: TypeInfo }
  return getNativeValue(source, targetTypeInfo) as T
}

export function interpretAsArc4Impl<T extends ARC4Encoded>(
  typeInfoString: string,
  bytes: StubBytesCompat,
  prefix: 'none' | 'log' = 'none',
): T {
  const typeInfo = JSON.parse(typeInfoString)
  return getEncoder<T>(typeInfo)(bytes, typeInfo, prefix)
}
