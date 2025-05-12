import {
  type AnyTransactionComposeFields,
  type ApplicationCallComposeFields,
  type AssetConfigComposeFields,
  type AssetFreezeComposeFields,
  type AssetTransferComposeFields,
  type ComposeItxnParams,
  type Contract,
  type ItxnCompose,
  type KeyRegistrationComposeFields,
  type PaymentComposeFields,
} from '@algorandfoundation/algorand-typescript'
import type { TypedApplicationCallFields } from '@algorandfoundation/algorand-typescript/arc4'
import { lazyContext } from '../context-helpers/internal-context'
import type { DeliberateAny, InstanceMethod } from '../typescript-helpers'
import { getApplicationCallInnerTxnContext } from './c2c'

class ItxnComposeImpl {
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
  begin<TArgs extends DeliberateAny[]>(...args: unknown[]): void {
    lazyContext.txn.activeGroup.constructingItxnGroup.push(
      args.length === 1
        ? (args[0] as AnyTransactionComposeFields)
        : getApplicationCallInnerTxnContext(
            args[0] as InstanceMethod<Contract, TArgs>,
            args[1] as TypedApplicationCallFields<TArgs>,
            args[2] as Contract | { new (): Contract },
          ),
    )
  }

  next(fields: PaymentComposeFields): void
  next(fields: KeyRegistrationComposeFields): void
  next(fields: AssetConfigComposeFields): void
  next(fields: AssetTransferComposeFields): void
  next(fields: AssetFreezeComposeFields): void
  next(fields: ApplicationCallComposeFields): void
  next(fields: AnyTransactionComposeFields): void
  next(fields: ComposeItxnParams): void
  next<TArgs extends DeliberateAny[]>(_method: InstanceMethod<Contract, TArgs>, _fields: TypedApplicationCallFields<TArgs>): void
  next<TArgs extends DeliberateAny[]>(...args: unknown[]): void {
    lazyContext.txn.activeGroup.constructingItxnGroup.push(
      args.length === 1
        ? (args[0] as AnyTransactionComposeFields)
        : getApplicationCallInnerTxnContext(
            args[0] as InstanceMethod<Contract, TArgs>,
            args[1] as TypedApplicationCallFields<TArgs>,
            args[2] as Contract | { new (): Contract },
          ),
    )
  }

  submit(): void {
    lazyContext.txn.activeGroup.submitInnerTransactionGroup()
  }
}

export const itxnCompose: ItxnCompose = new ItxnComposeImpl()
