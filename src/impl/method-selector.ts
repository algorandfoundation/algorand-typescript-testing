import type { arc4, bytes } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { getArc4Selector, getContractMethodAbiMetadata } from '../abi-metadata'
import type { Overloads } from '../typescript-helpers'
import type { Contract } from './contract'
import { sha512_256 } from './crypto'
import { Bytes } from './primitives'

/** @internal */
export const methodSelector = <TContract extends Contract>(
  methodSignature: Parameters<Overloads<typeof arc4.methodSelector>>[0],
  contract?: TContract | { new (): TContract },
): bytes => {
  if (typeof methodSignature === 'string' && contract === undefined) {
    return sha512_256(Bytes(encodingUtil.utf8ToUint8Array(methodSignature))).slice(0, 4)
  } else {
    const abiMetadata = getContractMethodAbiMetadata(
      contract!,
      typeof methodSignature === 'string' ? methodSignature : methodSignature.name,
    )
    return Bytes(getArc4Selector(abiMetadata))
  }
}
