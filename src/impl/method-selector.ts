import type { bytes } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { getArc4Selector, getContractByName, getContractMethodAbiMetadata } from '../abi-metadata'
import { CodeError, InternalError } from '../errors'
import type { InstanceMethod } from '../typescript-helpers'
import type { Contract } from './contract'
import { sha512_256 } from './crypto'
import { Bytes } from './primitives'

/**
 * Computes the method selector for an ARC-4 contract method.
 *
 * Supports three invocation patterns:
 * 1. `methodSelector('sink(string,uint8[])void')`:
 *       Direct method signature string (no contract): Returns SHA-512/256 hash of signature
 * 2. `methodSelector<typeof SignaturesContract.prototype.sink>()`:
 *       Contract name as string + method name as string: Looks up registered contract and returns ARC-4 selector
 * 3. `methodSelector(SignaturesContract.prototype.sink)`:
 *       Contract class/instance + method instance/name: Returns ARC-4 selector from ABI metadata
 *
 * @internal
 */
export const methodSelector = <TContract extends Contract>({
  method,
  contract,
}: {
  method?: string | InstanceMethod<Contract>
  contract?: string | TContract | { new (): TContract }
}): bytes => {
  const isDirectSignature = typeof method === 'string' && contract === undefined
  const isContractNameLookup = typeof contract === 'string' && typeof method === 'string' && contract && method
  const isContractMethodLookup = typeof contract !== 'string' && contract && method

  // Pattern 1: Direct method signature string (e.g., "add(uint64,uint64)uint64")
  if (isDirectSignature) {
    const signatureBytes = Bytes(encodingUtil.utf8ToUint8Array(method as string))
    return sha512_256(signatureBytes).slice(0, 4)
  }

  // Pattern 2: Contract name as string with method name
  if (isContractNameLookup) {
    const registeredContract = getContractByName(contract)

    if (registeredContract === undefined || typeof registeredContract !== 'function') {
      throw new InternalError(`Unknown contract: ${contract}`)
    }

    if (!Object.hasOwn(registeredContract.prototype, method)) {
      throw new InternalError(`Unknown method: ${method} in contract: ${contract}`)
    }

    const abiMetadata = getContractMethodAbiMetadata(registeredContract, method)
    return Bytes(getArc4Selector(abiMetadata))
  }

  // Pattern 3: Contract class/instance with method signature or name
  if (isContractMethodLookup) {
    const methodName = typeof method === 'string' ? method : method.name

    const abiMetadata = getContractMethodAbiMetadata(contract, methodName)
    return Bytes(getArc4Selector(abiMetadata))
  }

  throw new CodeError('Invalid arguments to methodSelector')
}
