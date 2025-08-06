import type { uint64 } from '@algorandfoundation/algorand-typescript'
import type { ResourceEncodingOptions } from '@algorandfoundation/algorand-typescript/arc4'
import { BITS_IN_BYTE, UINT512_SIZE, UINT64_SIZE } from '../../constants'
import { CodeError } from '../../errors'
import { findBoolTypes, trimGenericTypeName } from './helpers'
import type { DynamicArrayGenericArgs, StaticArrayGenericArgs, TypeInfo, uFixedGenericArgs } from './types'

export const getMaxLengthOfStaticContentType = (type: TypeInfo, asArc4Encoded: boolean = true): number => {
  const getMaxBytesLengthForStaticArray = (typeInfo: { genericArgs: StaticArrayGenericArgs }) => {
    const genericArgs = typeInfo.genericArgs
    const arraySize = parseInt(genericArgs.size.name, 10)
    const childTypes = Array(arraySize).fill(genericArgs.elementType)
    let i = 0
    let size = 0
    if (['Bool', 'boolean'].includes(genericArgs.elementType.name)) {
      while (i < childTypes.length) {
        const after = findBoolTypes(childTypes, i, 1)
        const boolNum = after + 1
        size += Math.floor(boolNum / BITS_IN_BYTE)
        size += boolNum % BITS_IN_BYTE ? 1 : 0
        i += after + 1
      }
    } else {
      size = getMaxLengthOfStaticContentType(genericArgs.elementType) * arraySize
    }
    return size
  }
  const getMaxBytesLengthForObjectType = (typeInfo: TypeInfo) => {
    const genericArgs = Object.values(typeInfo.genericArgs as Record<string, TypeInfo>)
    let i = 0
    let size = 0

    while (i < genericArgs.length) {
      const childType = genericArgs[i]
      if (['Bool', 'boolean'].includes(childType.name)) {
        const after = findBoolTypes(genericArgs, i, 1)
        const boolNum = after + 1
        size += Math.floor(boolNum / BITS_IN_BYTE)
        size += boolNum % BITS_IN_BYTE ? 1 : 0
        i += after
      } else {
        size += getMaxLengthOfStaticContentType(childType)
      }
      i += 1
    }
    return size
  }
  if (trimGenericTypeName(type.name) === 'bytes') {
    // Extract length from bytes<N> type
    const match = type.name.match(/bytes<(\d+)>/)
    if (match) {
      return parseInt(match[1], 10)
    }
  }
  switch (trimGenericTypeName(type.name)) {
    case 'uint64':
      return UINT64_SIZE / BITS_IN_BYTE
    case 'biguint':
      return UINT512_SIZE / BITS_IN_BYTE
    case 'boolean':
      return asArc4Encoded ? 1 : 8
    case 'Bool':
      return 1
    case 'Byte':
    case 'Uint':
      return parseInt((type.genericArgs as TypeInfo[])![0].name, 10) / BITS_IN_BYTE
    case 'UFixed':
      return parseInt((type.genericArgs as uFixedGenericArgs).n.name, 10) / BITS_IN_BYTE
    case 'Address':
    case 'StaticBytes':
    case 'StaticArray':
    case 'FixedArray':
      return getMaxBytesLengthForStaticArray(type as unknown as { genericArgs: StaticArrayGenericArgs })
    case 'Tuple':
    case 'ReadonlyTuple':
    case 'MutableTuple':
    case 'Struct':
    case 'Object':
    case 'ReadonlyObject':
      return getMaxBytesLengthForObjectType(type)
    default:
      throw new CodeError(`unsupported type ${type.name}`)
  }
}

export const getArc4TypeName = (
  typeInfo: TypeInfo,
  resourceEncoding: ResourceEncodingOptions | undefined = undefined,
  direction: 'in' | 'out' = 'in',
): string | undefined => {
  const getArc4TypeNameForObjectType = (typeInfo: TypeInfo): string => {
    const genericArgs = Object.values(typeInfo.genericArgs as Record<string, TypeInfo>)
    return `(${genericArgs.map((arg) => getArc4TypeName(arg, resourceEncoding, direction)).join(',')})`
  }
  const map: Record<string, string | ((t: TypeInfo) => string)> = {
    void: 'void',
    account: (_) => (resourceEncoding === 'Index' && direction === 'in' ? 'account' : 'address'),
    application: (_) => (resourceEncoding === 'Index' && direction === 'in' ? 'application' : 'uint64'),
    asset: (_) => (resourceEncoding === 'Index' && direction === 'in' ? 'asset' : 'uint64'),
    boolean: 'bool',
    biguint: 'uint512',
    bytes: 'byte[]',
    string: 'string',
    uint64: 'uint64',
    OnCompleteAction: 'uint64',
    TransactionType: 'uint64',
    Transaction: 'txn',
    PaymentTxn: 'pay',
    KeyRegistrationTxn: 'keyreg',
    AssetConfigTxn: 'acfg',
    AssetTransferTxn: 'axfer',
    AssetFreezeTxn: 'afrz',
    ApplicationCallTxn: 'appl',
    '(Readonly|Mutable)?Tuple(<.*>)?': getArc4TypeNameForObjectType,

    Address: 'address',
    Bool: 'bool',
    Byte: 'byte',
    Str: 'string',
    'Uint<.*>': (t: TypeInfo) => `uint${getMaxLengthOfStaticContentType(t) * BITS_IN_BYTE}`,
    'UFixed<.*>': (t: TypeInfo) => {
      const genericArgs = t.genericArgs as uFixedGenericArgs
      return `ufixed${genericArgs.n.name}x${genericArgs.m.name}`
    },
    '(StaticArray|FixedArray)(<.*>)?': (t: TypeInfo) => {
      const genericArgs = t.genericArgs as StaticArrayGenericArgs
      return `${getArc4TypeName(genericArgs.elementType, resourceEncoding, direction)}[${genericArgs.size.name}]`
    },
    '(Dynamic|Readonly)?Array<.*>': (t: TypeInfo) => {
      const genericArgs = t.genericArgs as DynamicArrayGenericArgs
      return `${getArc4TypeName(genericArgs.elementType, resourceEncoding, direction)}[]`
    },
    'Struct(<.*>)?': getArc4TypeNameForObjectType,
    '(Readonly)?Object(<.*>)?': getArc4TypeNameForObjectType,
    DynamicBytes: 'byte[]',
    'StaticBytes<.*>': (t: TypeInfo) => {
      const genericArgs = t.genericArgs as StaticArrayGenericArgs
      return `byte[${genericArgs.size.name}]`
    },
  }
  const name = Object.entries(map).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(typeInfo.name))?.[1]
  if (typeof name === 'string') return name
  else if (typeof name === 'function') return name(typeInfo)
  return undefined
}

export const arc4EncodedLengthImpl = (typeInfoString: string): uint64 => {
  const typeInfo = JSON.parse(typeInfoString)
  return getMaxLengthOfStaticContentType(typeInfo, true)
}

export const minLengthForType = (typeInfo: TypeInfo): number | undefined => {
  try {
    return getMaxLengthOfStaticContentType(typeInfo, false)
  } catch (e) {
    if (e instanceof CodeError && e.message.startsWith('unsupported type')) {
      return undefined
    }
    throw e
  }
}
