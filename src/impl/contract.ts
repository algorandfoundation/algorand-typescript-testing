import type { arc4, bytes } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { captureMethodConfig } from '../abi-metadata'
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

export function abimethod<TContract extends Contract>(config?: arc4.AbiMethodConfig<TContract>) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: (this: TContract, ...args: TArgs) => TReturn,
    ctx: ClassMethodDecoratorContext<TContract>,
  ): (this: TContract, ...args: TArgs) => TReturn {
    ctx.addInitializer(function () {
      captureMethodConfig(this, target.name, config)
    })
    return target
  }
}

export function baremethod<TContract extends Contract>(config?: arc4.BareMethodConfig) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: (this: TContract, ...args: TArgs) => TReturn,
    ctx: ClassMethodDecoratorContext<TContract>,
  ): (this: TContract, ...args: TArgs) => TReturn {
    ctx.addInitializer(function () {
      captureMethodConfig(this, target.name, config)
    })
    return target
  }
}

export const methodSelector: typeof arc4.methodSelector = (methodSignature: string): bytes => {
  return sha512_256(Bytes(encodingUtil.utf8ToUint8Array(methodSignature))).slice(0, 4)
}
