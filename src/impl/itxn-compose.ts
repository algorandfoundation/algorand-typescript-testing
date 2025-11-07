import type {
  ItxnCompose as _ItxnCompose,
  AnyTransactionComposeFields,
  ApplicationCallComposeFields,
  AssetConfigComposeFields,
  AssetFreezeComposeFields,
  AssetTransferComposeFields,
  ComposeItxnParams,
  Contract,
  KeyRegistrationComposeFields,
  PaymentComposeFields,
} from '@algorandfoundation/algorand-typescript'
import type { AbiCallOptions, TypedApplicationCallFields } from '@algorandfoundation/algorand-typescript/arc4'
import { getContractMethod } from '../abi-metadata'
import { lazyContext } from '../context-helpers/internal-context'
import type { DeliberateAny, InstanceMethod } from '../typescript-helpers'
import { getApplicationCallInnerTxnContext } from './c2c'

class ItxnCompose {
  begin(fields: PaymentComposeFields): void
  begin(fields: KeyRegistrationComposeFields): void
  begin(fields: AssetConfigComposeFields): void
  begin(fields: AssetTransferComposeFields): void
  begin(fields: AssetFreezeComposeFields): void
  begin(fields: ApplicationCallComposeFields): void
  begin(fields: AnyTransactionComposeFields): void
  begin(fields: ComposeItxnParams): void
  begin<TArgs extends DeliberateAny[]>(
    method: InstanceMethod<Contract, TArgs>,
    fields: TypedApplicationCallFields<TArgs>,
    contract?: Contract | { new (): Contract },
  ): void
  begin<TMethod>(options: AbiCallOptions<TMethod>, contract: string, method: string): void
  begin(...args: unknown[]): void {
    this.addInnerTransaction(...args)
  }

  next(fields: PaymentComposeFields): void
  next(fields: KeyRegistrationComposeFields): void
  next(fields: AssetConfigComposeFields): void
  next(fields: AssetTransferComposeFields): void
  next(fields: AssetFreezeComposeFields): void
  next(fields: ApplicationCallComposeFields): void
  next(fields: AnyTransactionComposeFields): void
  next(fields: ComposeItxnParams): void
  next<TArgs extends DeliberateAny[]>(
    _method: InstanceMethod<Contract, TArgs>,
    _fields: TypedApplicationCallFields<TArgs>,
    contract?: Contract | { new (): Contract },
  ): void
  next<TMethod>(options: AbiCallOptions<TMethod>, contract: string, method: string): void
  next(...args: unknown[]): void {
    this.addInnerTransaction(...args)
  }

  submit(): void {
    lazyContext.txn.activeGroup.submitInnerTransactionGroup()
  }

  private addInnerTransaction<TArgs extends DeliberateAny[]>(...args: unknown[]): void {
    let innerTxnFields

    // Single argument: direct transaction fields
    if (args.length === 1) {
      innerTxnFields = args[0] as AnyTransactionComposeFields
    }
    // Three arguments with object fields (deprecated signature):
    // e.g. `itxnCompose.begin(Hello.prototype.greet, { appId, args: ['ho'] })`
    else if (args.length === 3 && typeof args[1] === 'object') {
      innerTxnFields = getApplicationCallInnerTxnContext(
        args[0] as InstanceMethod<Contract, TArgs>,
        args[1] as TypedApplicationCallFields<TArgs>,
        args[2] as Contract | { new (): Contract },
      )
    }
    // Three arguments with string contract name:
    // e.g. `itxnCompose.next({ method: Hello.prototype.greet, appId, args: ['ho'] })`
    // or `itxnCompose.next<typeof Hello.prototype.greet>({ appId, args: ['ho'] })`
    else {
      const contractFullName = args[1] as string
      const methodName = args[2] as string
      const { method, contract } = getContractMethod(contractFullName, methodName)

      innerTxnFields = getApplicationCallInnerTxnContext(method, args[0] as TypedApplicationCallFields<TArgs>, contract)
    }

    lazyContext.txn.activeGroup.constructingItxnGroup.push(innerTxnFields)
  }
}

/** @internal */
export const itxnCompose: _ItxnCompose = new ItxnCompose()
