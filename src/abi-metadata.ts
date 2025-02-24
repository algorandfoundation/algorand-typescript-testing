import type { AbiMethodConfig, BareMethodConfig, CreateOptions, OnCompleteActionStr } from '@algorandfoundation/algorand-typescript/arc4'
import js_sha512 from 'js-sha512'
import type { TypeInfo } from './encoders'
import { Contract } from './impl/contract'
import { getArc4TypeName as getArc4TypeNameForARC4Encoded } from './impl/encoded-types'

export interface AbiMetadata {
  methodName: string
  name?: string
  methodSignature: string | undefined
  argTypes: string[]
  returnType: string
  onCreate?: CreateOptions
  allowActions?: OnCompleteActionStr[]
}
export const AbiMetaSymbol = Symbol('AbiMetadata')
export const isContractProxy = Symbol('isContractProxy')
const metadataStore: Map<{ new (): Contract }, Record<string, AbiMetadata>> = new Map()
export const attachAbiMetadata = (contract: { new (): Contract }, methodName: string, metadata: AbiMetadata): void => {
  if (!metadataStore.has(contract)) {
    metadataStore.set(contract, {})
  }
  const metadatas: Record<string, AbiMetadata> = metadataStore.get(contract) as Record<string, AbiMetadata>
  metadatas[methodName] = metadata
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

export const getContractAbiMetadata = <T extends Contract>(contract: T | { new (): T }): Record<string, AbiMetadata> => {
  // Initialize result object to store merged metadata
  const result: Record<string, AbiMetadata> = {}

  // Get the contract's class
  let currentClass = contract instanceof Contract ? (contract.constructor as { new (): T }) : contract

  // Walk up the prototype chain
  while (currentClass && currentClass.prototype) {
    // Find metadata for current class
    const currentMetadata = metadataStore.get(currentClass)

    if (currentMetadata) {
      // Merge metadata with existing result (don't override existing entries)
      const classMetadata = currentMetadata
      for (const [methodName, metadata] of Object.entries(classMetadata)) {
        if (!(methodName in result)) {
          result[methodName] = metadata
        }
      }
    }

    // Move up the prototype chain
    currentClass = Object.getPrototypeOf(currentClass)
  }

  return result
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
