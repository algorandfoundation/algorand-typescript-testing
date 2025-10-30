import type { contract as contractType, uint64 } from '@algorandfoundation/algorand-typescript'
import type { ConstructorFor } from '../typescript-helpers'

/** @internal */
export abstract class BaseContract {
  static isArc4 = false

  public abstract approvalProgram(): boolean | uint64
  public clearStateProgram(): boolean | uint64 {
    return true
  }
}

/** @internal */
export const ContractOptionsSymbol = Symbol('ContractOptions')
/** @internal */
export function contract(options: Parameters<typeof contractType>[0]) {
  return <T extends ConstructorFor<BaseContract>>(contract: T, ctx: ClassDecoratorContext) => {
    ctx.addInitializer(function () {
      Object.defineProperty(this, ContractOptionsSymbol, {
        value: options,
        writable: false,
        enumerable: false,
      })
    })
    return contract
  }
}
