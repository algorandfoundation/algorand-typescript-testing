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

const metadataStore: WeakMap<{ new (): Contract }, Record<string, AbiMetadata>> = new WeakMap()
const contractSymbolMap: Map<string, symbol> = new Map()
const contractMap: WeakMap<symbol, { new (): Contract }> = new WeakMap()
/** @internal */
export const attachAbiMetadata = (
  contract: { new (): Contract },
  methodName: string,
  metadata: AbiMetadata,
  fileName: string,
  contractName: string,
): void => {
  const contractFullName = `${fileName}::${contractName}`
  if (!contractSymbolMap.has(contractFullName)) {
    contractSymbolMap.set(contractFullName, Symbol(contractFullName))
  }
  const contractSymbol = contractSymbolMap.get(contractFullName)!
  if (!contractMap.has(contractSymbol)) {
    contractMap.set(contractSymbol, contract)
  }
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

export const getContractByName = (contractFullname: string): { new (): Contract } | undefined => {
  const contractSymbol = contractSymbolMap.get(contractFullname)
  return !contractSymbol ? undefined : contractMap.get(contractSymbol)
}

/** @internal */
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

/** @internal */
export const getContractMethodAbiMetadata = <T extends Contract>(contract: T | { new (): T }, methodName: string): AbiMetadata => {
  const metadatas = getContractAbiMetadata(contract)
  return metadatas[methodName]
}

/** @internal */
export const getArc4Signature = (metadata: AbiMetadata): string => {
  if (metadata.methodSignature === undefined) {
    const argTypes = metadata.argTypes.map((t) => JSON.parse(t) as TypeInfo).map((t) => getArc4TypeName(t, metadata.resourceEncoding, 'in'))
    const returnType = getArc4TypeName(JSON.parse(metadata.returnType) as TypeInfo, metadata.resourceEncoding, 'out')
    metadata.methodSignature = `${metadata.name ?? metadata.methodName}(${argTypes.join(',')})${returnType}`
  }
  return metadata.methodSignature
}

/** @internal */
export const getArc4Selector = (metadata: AbiMetadata): Uint8Array => {
  const hash = js_sha512.sha512_256.array(getArc4Signature(metadata))
  return new Uint8Array(hash.slice(0, 4))
}

/** @internal */
export const getContractMethod = (contractFullName: string, methodName: string) => {
  const contract = getContractByName(contractFullName)

  if (contract === undefined || typeof contract !== 'function') {
    throw new InternalError(`Unknown contract: ${contractFullName}`)
  }

  if (!Object.hasOwn(contract.prototype, methodName)) {
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
