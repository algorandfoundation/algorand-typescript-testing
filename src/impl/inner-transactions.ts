import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  bytes,
  itxn,
} from '@algorandfoundation/algorand-typescript'
import { TransactionType } from '@algorandfoundation/algorand-typescript'
import type { BareCreateApplicationCallFields, TypedApplicationCallFields } from '@algorandfoundation/algorand-typescript/arc4'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { encodeArc4Impl } from '../runtime-helpers'
import { asBytes, asNumber } from '../util'
import { getApp } from './app-params'
import { getAsset } from './asset-params'
import type { InnerTxn, InnerTxnFields } from './itxn'
import { BytesCls, Uint64Cls } from './primitives'
import { Account, asAccount, asApplication, asAsset } from './reference'
import {
  ApplicationCallTransaction,
  AssetConfigTransaction,
  AssetFreezeTransaction,
  AssetTransferTransaction,
  KeyRegistrationTransaction,
  PaymentTransaction,
} from './transactions'

const mapCommonFields = <T extends InnerTxnFields>(
  fields: T,
): Omit<T, 'sender' | 'note' | 'rekeyTo'> & { sender?: AccountType; note?: bytes; rekeyTo?: AccountType } => {
  const { sender, note, rekeyTo, ...rest } = fields

  return {
    sender: asAccount(sender),
    note: note !== undefined ? asBytes(note) : undefined,
    rekeyTo: asAccount(rekeyTo),
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
    super({
      ...mapCommonFields(fields),
      receiver: asAccount(fields.receiver),
      closeRemainderTo: asAccount(fields.closeRemainderTo),
    })
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
    const { assetName, unitName, url, manager, reserve, freeze, clawback, configAsset, ...rest } = mapCommonFields(fields)
    const createdAsset =
      !configAsset || !asNumber(asAsset(configAsset)!.id)
        ? lazyContext.any.asset({
            name: typeof assetName === 'string' ? asBytes(assetName) : assetName,
            unitName: typeof unitName === 'string' ? asBytes(unitName) : unitName,
            url: typeof url === 'string' ? asBytes(url) : url,
            manager: asAccount(manager),
            reserve: asAccount(reserve),
            freeze: asAccount(freeze),
            clawback: asAccount(clawback),
            ...rest,
          })
        : undefined

    super({
      assetName: typeof assetName === 'string' ? asBytes(assetName) : assetName,
      unitName: typeof unitName === 'string' ? asBytes(unitName) : unitName,
      url: typeof url === 'string' ? asBytes(url) : url,
      manager: asAccount(manager),
      reserve: asAccount(reserve),
      freeze: asAccount(freeze),
      clawback: asAccount(clawback),
      configAsset: asAsset(configAsset),
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
    super({
      ...mapCommonFields(fields),
      assetSender: asAccount(fields.assetSender),
      assetReceiver: asAccount(fields.assetReceiver),
      assetCloseTo: asAccount(fields.assetCloseTo),
      xferAsset: asAsset(fields.xferAsset),
    })
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
    const asset: AssetType | undefined = freezeAsset instanceof Uint64Cls ? getAsset(freezeAsset) : (freezeAsset as AssetType)
    const account: AccountType | undefined =
      typeof freezeAccount === 'string' ? Account(asBytes(freezeAccount)) : (freezeAccount as AccountType)
    super({
      freezeAsset: asset,
      freezeAccount: account,
      ...rest,
    })
  }
}

export type ApplicationCallFields = itxn.ApplicationCallFields & {
  createdApp?: ApplicationType
  appLogs?: Array<bytes>
}

export class ApplicationCallInnerTxn extends ApplicationCallTransaction implements itxn.ApplicationCallInnerTxn {
  readonly isItxn?: true

  /* @internal */
  static create(fields: Partial<ApplicationCallFields>) {
    return new ApplicationCallInnerTxn(fields)
  }

  /* @internal */
  constructor(fields: Partial<ApplicationCallFields>) {
    const { appId, approvalProgram, clearStateProgram, onCompletion, appArgs, accounts, assets, apps, ...rest } = mapCommonFields(fields)
    super({
      appId: appId instanceof Uint64Cls ? getApp(appId) : (appId as ApplicationType),
      onCompletion,
      approvalProgram: Array.isArray(approvalProgram) ? undefined : (approvalProgram as bytes),
      approvalProgramPages: Array.isArray(approvalProgram) ? approvalProgram : undefined,
      clearStateProgram: Array.isArray(clearStateProgram) ? undefined : (clearStateProgram as bytes),
      clearStateProgramPages: Array.isArray(clearStateProgram) ? clearStateProgram : undefined,
      appArgs: appArgs?.map((x) => x),
      accounts: accounts?.map((x) => asAccount(x)!),
      assets: assets?.map((x) => asAsset(x)!),
      apps: apps?.map((x) => asApplication(x)!),
      appLogs: fields.appLogs,
      createdApp: fields.createdApp,
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
      return new AssetTransferInnerTxn(fields)
    case TransactionType.AssetFreeze:
      return new AssetFreezeInnerTxn(fields)
    case TransactionType.ApplicationCall:
      return new ApplicationCallInnerTxn(fields)
    case TransactionType.KeyRegistration:
      return new KeyRegistrationInnerTxn(fields)
    default:
      throw new InternalError(`Invalid inner transaction type: ${fields.type}`)
  }
}

export function submitGroup<TFields extends [...itxn.ItxnParams[]]>(...transactionFields: TFields): itxn.TxnFor<TFields> {
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
  return new ItxnParams<itxn.ApplicationCallFields, itxn.ApplicationCallInnerTxn>(fields, TransactionType.ApplicationCall)
}

export class ItxnParams<TFields extends InnerTxnFields, TTransaction extends InnerTxn> {
  #fields: TFields & { type: TransactionType }
  constructor(fields: TFields, type: TransactionType) {
    this.#fields = { ...fields, type }
  }

  private isApplicationCall(): boolean {
    return this.#fields.type === TransactionType.ApplicationCall
  }

  private getMethodSelector(): bytes | 'bareCreate' | undefined {
    const applicationCallFields = this.#fields as itxn.ApplicationCallFields
    return applicationCallFields.appArgs?.length && applicationCallFields.appArgs[0] instanceof BytesCls
      ? asBytes(applicationCallFields.appArgs[0])
      : !applicationCallFields.appArgs?.length
        ? 'bareCreate'
        : undefined
  }
  submit(): TTransaction {
    let itxnContext: ApplicationCallInnerTxnContext | undefined

    if (this.isApplicationCall()) {
      const methodSelector = this.getMethodSelector()
      const onAbiCall = methodSelector && lazyContext.value.getOnAbiCall(methodSelector)
      itxnContext = ApplicationCallInnerTxnContext(this.#fields)
      onAbiCall?.value?.forEach((cb) => cb(itxnContext!))
    }
    const innerTxn = createInnerTxn<InnerTxnFields>(itxnContext ?? this.#fields) as unknown as TTransaction
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

export type ApplicationCallInnerTxnContext<TArgs extends bytes[] | [] = bytes[], TReturn = unknown> = Omit<
  ApplicationCallFields,
  'appArgs'
> & {
  args: TArgs
  returnValue?: TReturn
}

export function ApplicationCallInnerTxnContext<TArgs extends bytes[] | [] = bytes[], TReturn = unknown>(
  fields: Partial<itxn.ApplicationCallFields>,
  methodArgs?: TypedApplicationCallFields<TArgs> | BareCreateApplicationCallFields,
): ApplicationCallInnerTxnContext<TArgs, TReturn> {
  const itxn = {
    ...fields,
    args: fields.appArgs?.slice(1),
    ...(methodArgs ?? {}),
  }
  return new Proxy(itxn, {
    get: (target, prop) => {
      if (prop === 'appLogs') {
        const returnValue = Reflect.get(target, 'returnValue')
        const appLogs = Reflect.get(target, 'appLogs')
        return appLogs !== undefined || returnValue !== undefined
          ? [...(appLogs ?? []), ...(returnValue ? [ABI_RETURN_VALUE_LOG_PREFIX.concat(encodeArc4Impl(undefined, returnValue))] : [])]
          : undefined
      }
      return Reflect.get(target, prop)
    },
    set: (target, prop, value) => {
      return Reflect.set(target, prop, value)
    },
  }) as ApplicationCallInnerTxnContext<TArgs, TReturn>
}
