import { getEncoder, toBytes } from './encoded-types'

export function clone<T>(typeInfoString: string, value: T): T {
  if (value && typeof value === 'object' && 'copy' in value && typeof value.copy === 'function') {
    return value.copy() as T
  }
  const bytes = toBytes(value, typeInfoString)
  const typeInfo = JSON.parse(typeInfoString)
  const encoder = getEncoder(typeInfo)
  return encoder(bytes, typeInfo) as T
}
