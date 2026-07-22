import type { arc4, OnCompleteActionStr } from '@algorandfoundation/algorand-typescript'
import js_sha512 from 'js-sha512'
import { ConventionalRouting } from './constants'
import { InternalError } from './errors'
import { Arc4MethodConfigSymbol, Contract } from './impl/contract'
import type { TypeInfo } from './impl/encoded-types'
import { getArc4TypeName } from './impl/encoded-types'
import type { DeliberateAny, InstanceMethod } from './typescript-helpers'

/** @internal */
export interface AbiMetadata {
  methodName: string
  name?: string
  methodSignature: string | undefined
  argTypes: string[]
  returnType: string
  onCreate?: arc4.CreateOptions
  allowActions?: OnCompleteActionStr[]
  resourceEncoding?: arc4.ResourceEncodingOptions
}

const metadataStore: Map<{ new (): Contract }, Record<string, AbiMetadata>> = new Map()
const contractMap: Map<string, { new (): Contract }> = new Map()
/** @internal */
export const attachAbiMetadata = (
  contract: { new (): Contract },
  methodName: string,
  metadata: AbiMetadata,
  fileName: string,
  contractName: string,
): void => {
  const contractFullName = `${fileName}::${contractName}`
  if (!contractMap.has(contractFullName)) {
    contractMap.set(contractFullName, contract)
  }
  let storedMetadata = metadataStore.get(contract)
  if (!storedMetadata) {
    storedMetadata = {}
    metadataStore.set(contract, storedMetadata)
  }

  const conventionalRoutingConfig = getConventionalRoutingConfig(methodName)
  storedMetadata[methodName] = {
    ...metadata,
    allowActions: metadata.allowActions ?? conventionalRoutingConfig?.allowActions,
    onCreate: metadata.onCreate ?? conventionalRoutingConfig?.onCreate,
  }
}

/** @internal */
export const getContractAbiMetadata = <T extends Contract>(contract: T | { new (): T }): Record<string, AbiMetadata> => {
  // Initialize result object to store merged metadata
  const result: Record<string, AbiMetadata> = {}

  // Get the contract's class
  let currentClass = contract instanceof Contract ? (contract.constructor as { new (): T }) : contract

  // Walk up the prototype chain
  while (currentClass) {
    // Find metadata for current class
    const currentMetadata = metadataStore.get(currentClass)

    if (currentMetadata) {
      // Merge metadata with existing result (don't override existing entries)
      for (const [methodName, metadata] of Object.entries(currentMetadata)) {
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

/** @internal */
export const getContractMethodAbiMetadata = <T extends Contract>(contract: T | { new (): T }, methodName: string): AbiMetadata => {
  const metadatas = getContractAbiMetadata(contract)
  return metadatas[methodName]
}

const computeArc4Signature = (metadata: AbiMetadata): string => {
  const argTypes = metadata.argTypes.map((t) => JSON.parse(t) as TypeInfo).map((t) => getArc4TypeName(t, metadata.resourceEncoding, 'in'))
  const returnType = getArc4TypeName(JSON.parse(metadata.returnType) as TypeInfo, metadata.resourceEncoding, 'out')
  return `${metadata.name ?? metadata.methodName}(${argTypes.join(',')})${returnType}`
}

/** @internal */
export const getArc4Selector = (metadata: AbiMetadata): Uint8Array => {
  metadata.methodSignature ??= computeArc4Signature(metadata)
  const hash = js_sha512.sha512_256.array(metadata.methodSignature)
  return new Uint8Array(hash.slice(0, 4))
}

/** @internal */
export const getContractMethod = (contractFullName: string, methodName: string) => {
  const contract = contractMap.get(contractFullName)

  if (contract === undefined) {
    throw new InternalError(`Unknown contract: ${contractFullName}`)
  }

  if (!(methodName in contract.prototype)) {
    throw new InternalError(`Unknown method: ${methodName} in contract: ${contractFullName}`)
  }

  return {
    method: contract.prototype[methodName] as InstanceMethod<Contract, DeliberateAny[]>,
    contract,
  }
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
