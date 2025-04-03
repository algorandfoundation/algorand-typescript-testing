import type { bytes, Contract } from '@algorandfoundation/algorand-typescript'
import type { ApplicationCallInnerTxnContext } from './impl/inner-transactions'
import { methodSelector } from './impl/method-selector'
import type { AnyFunction, ConstructorFor } from './typescript-helpers'

export type AppSpyCb = (itxnContext: ApplicationCallInnerTxnContext) => void

const predicates = {
  bareCall: (cb: AppSpyCb): AppSpyCb => {
    return (ctx) => {
      if (ctx.args.length === 0) {
        cb(ctx)
      }
    }
  },
  methodSelector: (cb: AppSpyCb, selectorBytes: bytes): AppSpyCb => {
    return (ctx) => {
      if (ctx.args[0] === selectorBytes) {
        cb(ctx)
      }
    }
  },
}

/*
 * The `ApplicationSpy` class is a utility for testing Algorand smart contracts.
 * It allows you to spy on application calls and register callbacks for specific method signatures.
 */
export class ApplicationSpy {
  #spyFns: AppSpyCb[] = []

  notify(itxn: ApplicationCallInnerTxnContext) {
    for (const cb of this.#spyFns) {
      cb(itxn)
    }
  }

  constructor() {}

  /**
   * Registers a callback for a specific method signature.
   *
   * @template TContract - The type of the contract being spied on.
   * @template TMethod - The type of the method being spied on.
   * @param {TMethod} methodSignature - The method signature to spy on.
   * @param {function} callback - The callback function to execute when the method is called.
   */
  onAbiCall(methodSignature: bytes, callback: AppSpyCb) {
    this.#spyFns.push(predicates.methodSelector(callback, methodSignature))
  }

  onBareCall(callback: AppSpyCb) {
    this.#spyFns.push(predicates.bareCall(callback))
  }
}

type _TypedApplicationSpyCallBacks<TContract> = {
  [key in keyof TContract as key extends 'approvalProgram' | 'clearStateProgram'
    ? never
    : TContract[key] extends AnyFunction
      ? key extends string
        ? key
        : never
      : never]: (callback: AppSpyCb) => void
}

export type TypedApplicationSpy<TContract> = { on: _TypedApplicationSpyCallBacks<TContract> } & ApplicationSpy

type TypedApplicationSpyCtor = new <TContract>(contract: TContract | ConstructorFor<TContract>) => TypedApplicationSpy<TContract>

/*
 * The `ApplicationSpy` class is a utility for testing Algorand smart contracts.
 * It allows you to spy on application calls and register callbacks for specific method signatures.
 *
 * @template TContract - The type of the contract being spied on.
 */
export const TypedApplicationSpy = function <TContract extends Contract>(
  contract: TContract | ConstructorFor<TContract>,
): TypedApplicationSpy<TContract> {
  const base = new ApplicationSpy()

  function _tryGetMethod(name: string | symbol) {
    if (typeof contract === 'function') {
      return contract.prototype[name]
    } else {
      return Reflect.get(contract, name)
    }
  }

  return new Proxy(base, {
    get(target, property) {
      if (property === 'on') {
        return new Proxy(
          {},
          {
            get(_, methodName) {
              const fn = _tryGetMethod(methodName)
              if (fn === undefined) return fn
              return function (callback: AppSpyCb) {
                /*
                TODO: Need to know if the function is an abi method or bare call
                TODO: Ideally we predicate a specific on completion action too
                 */

                const selector = methodSelector(fn, contract)
                base.onAbiCall(selector, callback)
              }
            },
          },
        )
      }
    },
  }) as unknown as TypedApplicationSpy<TContract>
  // constructor {
  //   this.contract = contract
  // }
  //
  // private getOnAbiCall<TContract extends Contract>(methodSignature: InstanceMethod<TContract> | bytes | 'bareCreate') {
  //   const selector =
  //     methodSignature === 'bareCreate'
  //       ? asBytes(methodSignature)
  //       : methodSignature instanceof BytesCls
  //         ? asBytes(methodSignature)
  //         : methodSelector(methodSignature as Parameters<Overloads<typeof arc4.methodSelector>>[0], this.contract)
  //
  //   return this.#abiCallHooks.get(selector)
  // }
  //
  // /**
  //  * Registers a callback for a specific method signature.
  //  *
  //  * @template TContract - The type of the contract being spied on.
  //  * @template TMethod - The type of the method being spied on.
  //  * @param {TMethod} methodSignature - The method signature to spy on.
  //  * @param {function} callback - The callback function to execute when the method is called.
  //  */
  // onAbiCall<TContract extends Contract, TMethod extends InstanceMethod<TContract> | 'bareCreate'>(
  //   methodSignature: TMethod,
  //   callback: (
  //     itxnContext: ApplicationCallInnerTxnContext<
  //       TMethod extends InstanceMethod<TContract> ? Parameters<TMethod> : [],
  //       TMethod extends InstanceMethod<TContract> ? ReturnType<TMethod> : void
  //     >,
  //   ) => void,
  // ) {
  //   const selector =
  //     methodSignature === 'bareCreate'
  //       ? asBytes(methodSignature)
  //       : methodSelector(methodSignature as Parameters<Overloads<typeof arc4.methodSelector>>[0], this.contract)
  //   const existing = this.getOnAbiCall(selector)
  //   if (existing) {
  //     existing.push(callback)
  //   } else {
  //     this.#abiCallHooks.set(selector, [callback])
  //   }
  // }
} as unknown as TypedApplicationSpyCtor
