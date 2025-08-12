import type { arc4, OnCompleteActionStr } from '@algorandfoundation/algorand-typescript'
import type { DeliberateAny } from '../typescript-helpers'
import { BaseContract } from './base-contract'

/** @internal */
export class Contract extends BaseContract {
  static isArc4 = true

  override approvalProgram(): boolean {
    return true
  }
}

/** @internal */
export const Arc4MethodConfigSymbol = Symbol('Arc4MethodConfig')
/** @internal */
export function abimethod<TContract extends Contract>(config?: arc4.AbiMethodConfig<TContract>) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: { [Arc4MethodConfigSymbol]: arc4.AbiMethodConfig<TContract> } & ((this: TContract, ...args: TArgs) => TReturn),
  ): (this: TContract, ...args: TArgs) => TReturn {
    target[Arc4MethodConfigSymbol] = {
      ...config,
      onCreate: config?.onCreate ?? 'disallow',
      allowActions: ([] as OnCompleteActionStr[]).concat(config?.allowActions ?? 'NoOp'),
    }
    return target
  }
}

/** @internal */
export function baremethod<TContract extends Contract>(config?: arc4.BareMethodConfig) {
  return function <TArgs extends DeliberateAny[], TReturn>(
    target: { [Arc4MethodConfigSymbol]: arc4.AbiMethodConfig<TContract> } & ((this: TContract, ...args: TArgs) => TReturn),
  ): (this: TContract, ...args: TArgs) => TReturn {
    target[Arc4MethodConfigSymbol] = {
      ...config,
      onCreate: config?.onCreate ?? 'disallow',
      allowActions: ([] as OnCompleteActionStr[]).concat(config?.allowActions ?? 'NoOp'),
    }
    return target
  }
}
