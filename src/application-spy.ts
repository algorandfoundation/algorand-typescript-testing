import type { arc4, bytes, Contract } from '@algorandfoundation/algorand-typescript'
import { BytesMap } from './collections/custom-key-map'
import type { ApplicationCallInnerTxnContext } from './impl/inner-transactions'
import { methodSelector } from './impl/method-selector'
import { BytesCls } from './impl/primitives'
import type { ConstructorFor, DeliberateAny, InstanceMethod, Overloads } from './typescript-helpers'
import { asBytes } from './util'

/*
 * The `ApplicationSpy` class is a utility for testing Algorand smart contracts.
 * It allows you to spy on application calls and register callbacks for specific method signatures.
 *
 * @template TContract - The type of the contract being spied on.
 */
export class ApplicationSpy<TContract extends Contract> {
  #abiCallHooks: BytesMap<((innerTxnContext: ApplicationCallInnerTxnContext<DeliberateAny, DeliberateAny>) => void)[]> = new BytesMap()

  /* @internal */
  contract: TContract | ConstructorFor<TContract>

  /* @internal */
  get abiCallHooks() {
    return this.#abiCallHooks
  }

  constructor(contract: TContract | ConstructorFor<TContract>) {
    this.contract = contract
  }

  private getOnAbiCall<TContract extends Contract>(methodSignature: InstanceMethod<TContract> | bytes | 'bareCreate') {
    const selector =
      methodSignature === 'bareCreate'
        ? asBytes(methodSignature)
        : methodSignature instanceof BytesCls
          ? asBytes(methodSignature)
          : methodSelector(methodSignature as Parameters<Overloads<typeof arc4.methodSelector>>[0], this.contract)

    return this.#abiCallHooks.get(selector)
  }

  /**
   * Registers a callback for a specific method signature.
   *
   * @template TContract - The type of the contract being spied on.
   * @template TMethod - The type of the method being spied on.
   * @param {TMethod} methodSignature - The method signature to spy on.
   * @param {function} callback - The callback function to execute when the method is called.
   */
  onAbiCall<TContract extends Contract, TMethod extends InstanceMethod<TContract> | 'bareCreate'>(
    methodSignature: TMethod,
    callback: (
      itxnContext: ApplicationCallInnerTxnContext<
        TMethod extends InstanceMethod<TContract> ? Parameters<TMethod> : [],
        TMethod extends InstanceMethod<TContract> ? ReturnType<TMethod> : void
      >,
    ) => void,
  ) {
    const selector =
      methodSignature === 'bareCreate'
        ? asBytes(methodSignature)
        : methodSelector(methodSignature as Parameters<Overloads<typeof arc4.methodSelector>>[0], this.contract)
    const existing = this.getOnAbiCall(selector)
    if (existing) {
      existing.push(callback)
    } else {
      this.#abiCallHooks.set(selector, [callback])
    }
  }
}
