import type { OnCompleteActionStr } from '@algorandfoundation/algorand-typescript'
import type { CreateOptions } from '@algorandfoundation/algorand-typescript/arc4'
import js_sha512 from 'js-sha512'
import { ConventionalRouting } from './constants'
import { Arc4MethodConfigSymbol, Contract } from './impl/contract'
import type { TypeInfo } from './impl/encoded-types'
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

const metadataStore: WeakMap<{ new (): Contract }, Record<string, AbiMetadata>> = new WeakMap()
export const attachAbiMetadata = (contract: { new (): Contract }, methodName: string, metadata: AbiMetadata): void => {
  if (!metadataStore.has(contract)) {
    metadataStore.set(contract, {})
  }
  const metadatas: Record<string, AbiMetadata> = metadataStore.get(contract) as Record<string, AbiMetadata>
  const conventionalRoutingConfig = getConventionalRoutingConfig(methodName)
  metadatas[methodName] = {
    ...metadata,
    allowActions: metadata.allowActions ?? conventionalRoutingConfig?.allowActions,
    onCreate: metadata.onCreate ?? conventionalRoutingConfig?.onCreate,
  }
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
          result[methodName] = {
            ...metadata,
            ...(currentClass.prototype as DeliberateAny)?.[methodName]?.[Arc4MethodConfigSymbol],
          }
        }
      }
    }

    // Move up the prototype chain
    currentClass = Object.getPrototypeOf(currentClass)
  }

  return result
}

export const getContractMethodAbiMetadata = <T extends Contract>(contract: T | { new (): T }, methodName: string): AbiMetadata => {
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
    ApplicationCallTxn: 'appl',
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

/**
 * Get routing properties inferred by conventional naming
 * @param methodName The name of the method
 */
const getConventionalRoutingConfig = (methodName: string): Pick<AbiMetadata, 'allowActions' | 'onCreate'> | undefined => {
  switch (methodName) {
    case ConventionalRouting.methodNames.closeOutOfApplication:
      return {
        allowActions: ['CloseOut'],
        onCreate: 'disallow',
      }
    case ConventionalRouting.methodNames.createApplication:
      return {
        onCreate: 'require',
      }
    case ConventionalRouting.methodNames.deleteApplication:
      return {
        allowActions: ['DeleteApplication'],
      }
    case ConventionalRouting.methodNames.optInToApplication:
      return {
        allowActions: ['OptIn'],
      }
    case ConventionalRouting.methodNames.updateApplication:
      return {
        allowActions: ['UpdateApplication'],
        onCreate: 'disallow',
      }
    default:
      return undefined
  }
}
