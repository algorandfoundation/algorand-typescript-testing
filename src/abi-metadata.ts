import type { Contract } from '@algorandfoundation/algorand-typescript'
import type { AbiMethodConfig, BareMethodConfig, CreateOptions, OnCompleteActionStr } from '@algorandfoundation/algorand-typescript/arc4'
import js_sha512 from 'js-sha512'
import type { TypeInfo } from './encoders'
import { getArc4TypeName as getArc4TypeNameForARC4Encoded } from './impl/encoded-types'
import type { DeliberateAny } from './typescript-helpers'

export interface AbiMetadata {
  methodName: string
  name?: string
  methodSignature: string | undefined
  argTypes: string[]
  returnType: string
  onCreate?: CreateOptions
  allowActions?: OnCompleteActionStr[]
}
const AbiMetaSymbol = Symbol('AbiMetadata')
const overwrittenMetadata: Array<readonly [Contract | { new (): Contract }, Record<string, AbiMetadata>]> = []
export const isContractProxy = Symbol('isContractProxy')
export const attachAbiMetadata = (contract: { new (): Contract }, methodName: string, metadata: AbiMetadata): void => {
  const metadatas: Record<string, AbiMetadata> = (AbiMetaSymbol in contract ? contract[AbiMetaSymbol] : {}) as Record<string, AbiMetadata>

  // classes inherited from the same parent shares the same metadata object stored in `AbiMetaSymbol`
  // to prevent one subclass from overwriting the metadata of another subclass, we store the overwritten metadata in a separate array
  if (metadatas[methodName]) {
    let contractMetadatas = overwrittenMetadata.find(([c]) => c === contract)
    if (!contractMetadatas) {
      contractMetadatas = [contract, {}]
      overwrittenMetadata.push(contractMetadatas)
    }
    contractMetadatas[1][methodName] = metadata
  } else {
    metadatas[methodName] = metadata
  }
  if (!(AbiMetaSymbol in contract)) {
    Object.defineProperty(contract, AbiMetaSymbol, {
      value: metadatas,
      writable: true,
      enumerable: true,
    })
  }
}

export const copyAbiMetadatas = <T extends Contract>(sourceContract: T, targetContract: T): void => {
  const metadatas = getContractAbiMetadata(sourceContract)
  Object.defineProperty(targetContract, AbiMetaSymbol, {
    value: metadatas,
    writable: true,
    enumerable: false,
  })
}

export const captureMethodConfig = <T extends Contract>(
  contract: T,
  methodName: string,
  config?: AbiMethodConfig<T> | BareMethodConfig,
): void => {
  const metadata = getContractMethodAbiMetadata(contract, methodName)
  metadata.name = (config as AbiMethodConfig<T>)?.name ?? methodName
  metadata.onCreate = config?.onCreate ?? 'disallow'
  metadata.allowActions = ([] as OnCompleteActionStr[]).concat(config?.allowActions ?? 'NoOp')
}

export const hasAbiMetadata = <T extends Contract>(contract: T): boolean => {
  const contractClass = contract.constructor as { new (): T }
  return (
    Object.getOwnPropertySymbols(contractClass).some((s) => s.toString() === AbiMetaSymbol.toString()) || AbiMetaSymbol in contractClass
  )
}
export const getContractAbiMetadata = <T extends Contract>(contract: T): Record<string, AbiMetadata> => {
  const overwrittenMetadataEntry = overwrittenMetadata.find(([c]) => c === contract)
  if ((contract as DeliberateAny)[AbiMetaSymbol]) {
    return { ...((contract as DeliberateAny)[AbiMetaSymbol] as Record<string, AbiMetadata>), ...overwrittenMetadataEntry?.[1] }
  }
  const contractClass = contract.constructor as { new (): T }
  const s = Object.getOwnPropertySymbols(contractClass).find((s) => s.toString() === AbiMetaSymbol.toString())
  const metadatas: Record<string, AbiMetadata> = (
    s ? (contractClass as DeliberateAny)[s] : AbiMetaSymbol in contractClass ? contractClass[AbiMetaSymbol] : {}
  ) as Record<string, AbiMetadata>
  return { ...metadatas, ...overwrittenMetadataEntry?.[1] }
}

export const getContractMethodAbiMetadata = <T extends Contract>(contract: T, methodName: string): AbiMetadata => {
  const metadatas = getContractAbiMetadata(contract)
  return metadatas[methodName]
}

export const getArc4Signature = (metadata: AbiMetadata): string => {
  if (metadata.methodSignature === undefined) {
    const argTypes = metadata.argTypes.map((t) => JSON.parse(t) as TypeInfo).map(getArc4TypeName)
    const returnType = getArc4TypeName(JSON.parse(metadata.returnType) as TypeInfo)
    metadata.methodSignature = `${metadata.name ?? metadata.methodName}(${argTypes.join(',')})${returnType}`
  }
  return metadata.methodSignature
}

export const getArc4Selector = (metadata: AbiMetadata): Uint8Array => {
  const hash = js_sha512.sha512_256.array(getArc4Signature(metadata))
  return new Uint8Array(hash.slice(0, 4))
}

const getArc4TypeName = (t: TypeInfo): string => {
  const map: Record<string, string | ((t: TypeInfo) => string)> = {
    void: 'void',
    account: 'account',
    application: 'application',
    asset: 'asset',
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
    ApplicationTxn: 'appl',
    'Tuple(<.*>)?': (t) =>
      `(${Object.values(t.genericArgs as Record<string, TypeInfo>)
        .map(getArc4TypeName)
        .join(',')})`,
  }
  const entry = Object.entries(map).find(([k, _]) => new RegExp(`^${k}$`, 'i').test(t.name))?.[1]
  if (entry === undefined) {
    return getArc4TypeNameForARC4Encoded(t) ?? t.name
  }
  if (entry instanceof Function) {
    return entry(t)
  }
  return entry
}
