import type { bytes, Contract } from '@algorandfoundation/algorand-typescript'
import type { ApplicationCallInnerTxnContext } from './impl/inner-transactions'
import { methodSelector } from './impl/method-selector'
import type { AnyFunction, ConstructorFor } from './typescript-helpers'

export type AppSpyCb<TArgs extends bytes[] | [] = bytes[], TReturn = unknown> = (
  itxnContext: ApplicationCallInnerTxnContext<TArgs, TReturn>,
) => void

const predicates = {
  bareCall: (cb: AppSpyCb<[], unknown>): AppSpyCb => {
    return (ctx) => {
      if (!ctx.appArgs?.length) {
        cb(ctx as ApplicationCallInnerTxnContext<[], unknown>)
      }
    }
  },
  methodSelector: (cb: AppSpyCb, selectorBytes: bytes): AppSpyCb => {
    return (ctx) => {
      if (ctx.appArgs && selectorBytes.equals(ctx.appArgs[0] as bytes)) {
        cb(ctx)
      }
    }
  },
}

/*
 * The `ApplicationSpy` class is a utility for testing Algorand smart contracts.
 * It allows you to spy on application calls and register callbacks for specific method signatures.
 *
 * @template TContract - The type of the contract being spied on.
 */
export class ApplicationSpy<TContract extends Contract> {
  #spyFns: AppSpyCb[] = []

  /**
   * The `on` property is a proxy that allows you to register callbacks for specific method signatures.
   * It dynamically creates methods based on the contract's methods.
   */
  readonly on: _TypedApplicationSpyCallBacks<TContract>

  /* @internal */
  contract: TContract | ConstructorFor<TContract>

  constructor(contract: TContract | ConstructorFor<TContract>) {
    this.contract = contract
    this.on = this.createOnProxy()
  }

  /* @internal */
  notify(itxn: ApplicationCallInnerTxnContext) {
    for (const cb of this.#spyFns) {
      cb(itxn)
    }
  }

  /**
   * Registers a callback for a bare call (no arguments).
   * @param callback - The callback to be executed when a bare call is detected.
   */
  onBareCall(callback: AppSpyCb<[], unknown>) {
    this.#spyFns.push(predicates.bareCall(callback))
  }

  private onAbiCall(methodSignature: bytes, callback: AppSpyCb) {
    this.#spyFns.push(predicates.methodSelector(callback, methodSignature))
  }

  private _tryGetMethod(name: string | symbol) {
    if (typeof this.contract === 'function') {
      return this.contract.prototype[name]
    } else {
      return Reflect.get(this.contract, name)
    }
  }

  private createOnProxy(spy: ApplicationSpy<TContract> = this): _TypedApplicationSpyCallBacks<TContract> {
    return new Proxy({} as _TypedApplicationSpyCallBacks<TContract>, {
      get(_: _TypedApplicationSpyCallBacks<TContract>, methodName) {
        const fn = spy._tryGetMethod(methodName)
        if (fn === undefined) return fn
        return function (callback: AppSpyCb) {
          const selector = methodSelector(fn, spy.contract)
          spy.onAbiCall(selector, callback)
        }
      },
    }) as _TypedApplicationSpyCallBacks<TContract>
  }
}

type _TypedApplicationSpyCallBacks<TContract> = {
  [key in keyof TContract as key extends 'approvalProgram' | 'clearStateProgram'
    ? never
    : TContract[key] extends AnyFunction
      ? key extends string
        ? key
        : never
      : never]: (
    callback: AppSpyCb<
      TContract[key] extends AnyFunction ? Parameters<TContract[key]> : bytes[],
      TContract[key] extends AnyFunction ? ReturnType<TContract[key]> : unknown
    >,
  ) => void
}
