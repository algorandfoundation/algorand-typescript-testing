import { Account, Application, arc4, Asset, bytes, internal, itxn, TransactionType, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { Mutable } from '../typescript-helpers'
import { asBytes, asNumber } from '../util'
import { getApp } from './app-params'
import { getAsset } from './asset-params'
import { InnerTxn, InnerTxnFields } from './itxn'
import { AccountImpl } from './reference'
import {
  ApplicationTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
} from './transactions'

const mapCommonFields = <T extends InnerTxnFields>(
  fields: T,
): Omit<T, 'sender' | 'note' | 'rekeyTo'> & { sender?: Account; note?: bytes; rekeyTo?: Account } => {
  const { sender, note, rekeyTo, ...rest } = fields

  return {
    sender:
      sender instanceof Account
        ? sender
        : typeof sender === 'string'
          ? AccountImpl(asBytes(sender))
          : lazyContext.activeApplication.address,
    note: note !== undefined ? asBytes(note) : undefined,
    rekeyTo: rekeyTo instanceof Account ? rekeyTo : typeof rekeyTo === 'string' ? AccountImpl(asBytes(rekeyTo)) : undefined,
    ...rest,
  }
}
export class PaymentInnerTxn extends PaymentTransaction implements itxn.PaymentInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: itxn.PaymentFields) {
    return new PaymentInnerTxn(fields)
  }

  /* @internal */
  constructor(fields: itxn.PaymentFields) {
    super(mapCommonFields(fields))
  }
}

export class KeyRegistrationInnerTxn extends KeyRegistrationTransaction implements itxn.KeyRegistrationInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: itxn.KeyRegistrationFields) {
    return new KeyRegistrationInnerTxn(fields)
  }

  /* @internal */
  constructor(fields: itxn.KeyRegistrationFields) {
    super(mapCommonFields(fields))
  }
}

export class AssetConfigInnerTxn extends AssetConfigTransaction implements itxn.AssetConfigInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: itxn.AssetConfigFields) {
    return new AssetConfigInnerTxn(fields)
  }

  /* @internal */
  constructor(fields: itxn.AssetConfigFields) {
    const { assetName, unitName, url, ...rest } = mapCommonFields(fields)
    const createdAsset =
      !rest.configAsset || !asNumber(rest.configAsset.id)
        ? lazyContext.any.asset({
            name: typeof assetName === 'string' ? asBytes(assetName) : assetName,
            unitName: typeof unitName === 'string' ? asBytes(unitName) : unitName,
            url: typeof url === 'string' ? asBytes(url) : url,
            ...rest,
          })
        : undefined

    super({
      assetName: typeof assetName === 'string' ? asBytes(assetName) : assetName,
      unitName: typeof unitName === 'string' ? asBytes(unitName) : unitName,
      url: typeof url === 'string' ? asBytes(url) : url,
      ...rest,
      createdAsset: createdAsset,
    })
  }
}

export class AssetTransferInnerTxn extends AssetTransferTransaction implements itxn.AssetTransferInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: Partial<itxn.AssetTransferFields>) {
    if (fields.xferAsset === undefined) {
      throw new Error('xferAsset is required')
    }
    return new AssetTransferInnerTxn(fields as itxn.AssetTransferFields)
  }

  /* @internal */
  constructor(fields: itxn.AssetTransferFields) {
    super(mapCommonFields(fields))
  }
}

export class AssetFreezeInnerTxn extends AssetFreezeTransaction implements itxn.AssetFreezeInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: Partial<itxn.AssetFreezeFields>) {
    if (fields.freezeAsset === undefined) {
      throw new Error('freezeAsset is required')
    }
    return new AssetFreezeInnerTxn(fields as itxn.AssetFreezeFields)
  }

  /* @internal */
  constructor(fields: itxn.AssetFreezeFields) {
    const { freezeAsset, freezeAccount, ...rest } = mapCommonFields(fields)
    const asset: Asset | undefined = freezeAsset instanceof internal.primitives.Uint64Cls ? getAsset(freezeAsset) : (freezeAsset as Asset)
    const account: Account | undefined =
      typeof freezeAccount === 'string' ? AccountImpl(asBytes(freezeAccount)) : (freezeAccount as Account)
    super({
      freezeAsset: asset,
      freezeAccount: account,
      ...rest,
    })
  }
}

export class ApplicationInnerTxn extends ApplicationTransaction implements itxn.ApplicationInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(
    fields: Omit<itxn.ApplicationCallFields, 'onCompletion'> & { onCompletion?: arc4.OnCompleteAction | uint64 | arc4.OnCompleteActionStr },
  ) {
    return new ApplicationInnerTxn(fields as itxn.ApplicationCallFields)
  }

  /* @internal */
  constructor(fields: Mutable<itxn.ApplicationCallFields>) {
    const { appId, approvalProgram, clearStateProgram, onCompletion, appArgs, accounts, assets, apps, ...rest } = mapCommonFields(fields)
    const compiledApp =
      appId === undefined && approvalProgram !== undefined
        ? lazyContext.ledger.getApplicationForApprovalProgram(approvalProgram)
        : undefined
    super({
      appId:
        appId === undefined && compiledApp
          ? compiledApp
          : appId instanceof internal.primitives.Uint64Cls
            ? getApp(appId)
            : (appId as Application),
      onCompletion:
        typeof onCompletion === 'string'
          ? (onCompletion as arc4.OnCompleteActionStr)
          : onCompletion !== undefined
            ? (arc4.OnCompleteAction[onCompletion] as arc4.OnCompleteActionStr)
            : undefined,
      approvalProgram: Array.isArray(approvalProgram) ? undefined : (approvalProgram as bytes),
      approvalProgramPages: Array.isArray(approvalProgram) ? approvalProgram : undefined,
      clearStateProgram: Array.isArray(clearStateProgram) ? undefined : (clearStateProgram as bytes),
      clearStateProgramPages: Array.isArray(clearStateProgram) ? clearStateProgram : undefined,
      appArgs: appArgs?.map((x) => x),
      accounts: accounts?.map((x) => x),
      assets: assets?.map((x) => x),
      apps: apps?.map((x) => x),
      createdApp: compiledApp,
      ...rest,
    })
  }
}

export const createInnerTxn = <TFields extends InnerTxnFields>(fields: TFields) => {
  switch (fields.type) {
    case TransactionType.Payment:
      return new PaymentInnerTxn(fields)
    case TransactionType.AssetConfig:
      return new AssetConfigInnerTxn(fields)
    case TransactionType.AssetTransfer:
      return new AssetTransferInnerTxn(fields as itxn.AssetTransferFields)
    case TransactionType.AssetFreeze:
      return new AssetFreezeInnerTxn(fields as itxn.AssetFreezeFields)
    case TransactionType.ApplicationCall:
      return new ApplicationInnerTxn(fields)
    case TransactionType.KeyRegistration:
      return new KeyRegistrationInnerTxn(fields)
    default:
      throw new internal.errors.InternalError(`Invalid inner transaction type: ${fields.type}`)
  }
}

export function submitGroup<TFields extends itxn.InnerTxnList>(...transactionFields: TFields): itxn.TxnFor<TFields> {
  return transactionFields.map((f: (typeof transactionFields)[number]) => f.submit()) as itxn.TxnFor<TFields>
}
export function payment(fields: itxn.PaymentFields): itxn.PaymentItxnParams {
  return new ItxnParams<itxn.PaymentFields, itxn.PaymentInnerTxn>(fields, TransactionType.Payment)
}
export function keyRegistration(fields: itxn.KeyRegistrationFields): itxn.KeyRegistrationItxnParams {
  return new ItxnParams<itxn.KeyRegistrationFields, itxn.KeyRegistrationInnerTxn>(fields, TransactionType.KeyRegistration)
}
export function assetConfig(fields: itxn.AssetConfigFields): itxn.AssetConfigItxnParams {
  return new ItxnParams<itxn.AssetConfigFields, itxn.AssetConfigInnerTxn>(fields, TransactionType.AssetConfig)
}
export function assetTransfer(fields: itxn.AssetTransferFields): itxn.AssetTransferItxnParams {
  return new ItxnParams<itxn.AssetTransferFields, itxn.AssetTransferInnerTxn>(fields, TransactionType.AssetTransfer)
}
export function assetFreeze(fields: itxn.AssetFreezeFields): itxn.AssetFreezeItxnParams {
  return new ItxnParams<itxn.AssetFreezeFields, itxn.AssetFreezeInnerTxn>(fields, TransactionType.AssetFreeze)
}
export function applicationCall(fields: itxn.ApplicationCallFields): itxn.ApplicationCallItxnParams {
  return new ItxnParams<itxn.ApplicationCallFields, itxn.ApplicationInnerTxn>(fields, TransactionType.ApplicationCall)
}

export class ItxnParams<TFields extends InnerTxnFields, TTransaction extends InnerTxn> {
  #fields: TFields & { type: TransactionType }
  constructor(fields: TFields, type: TransactionType) {
    this.#fields = { ...fields, type }
  }
  submit(): TTransaction {
    const innerTxn = createInnerTxn<InnerTxnFields>(this.#fields) as unknown as TTransaction
    lazyContext.txn.activeGroup.addInnerTransactionGroup(innerTxn)
    return innerTxn
  }

  set(p: Partial<TFields>) {
    Object.assign(this.#fields, p)
  }

  copy() {
    return new ItxnParams<TFields, TTransaction>(this.#fields, this.#fields.type)
  }
}
