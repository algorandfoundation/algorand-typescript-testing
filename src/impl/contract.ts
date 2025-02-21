import type { arc4, bytes } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { getArc4Selector, getContractMethodAbiMetadata } from '../abi-metadata'
import type { DeliberateAny } from '../typescript-helpers'
import { BaseContract } from './base-contract'
import { sha512_256 } from './crypto'
import { Bytes } from './primitives'

export class Contract extends BaseContract {
  static isArc4 = true

  override approvalProgram(): boolean {
    return true
  }
}

export function abimethod<TContract extends Contract>(_config?: arc4.AbiMethodConfig<TContract>) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: (this: TContract, ...args: TArgs) => TReturn,
  ): (this: TContract, ...args: TArgs) => TReturn {
    return target
  }
}

export function baremethod<TContract extends Contract>(_config?: arc4.BareMethodConfig) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: (this: TContract, ...args: TArgs) => TReturn,
  ): (this: TContract, ...args: TArgs) => TReturn {
    return target
  }
}

export const methodSelector = <TContract extends Contract>(
  methodSignature: Parameters<typeof arc4.methodSelector>[0],
  contract?: TContract,
): bytes => {
  if (typeof methodSignature === 'string') {
    return sha512_256(Bytes(encodingUtil.utf8ToUint8Array(methodSignature))).slice(0, 4)
  } else {
    const abiMetadata = getContractMethodAbiMetadata(contract!, methodSignature.name)
    return Bytes(getArc4Selector(abiMetadata))
  }
}
