import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  bytes,
  itxn,
} from '@algorandfoundation/algorand-typescript'
import { TransactionType } from '@algorandfoundation/algorand-typescript'
import type { BareCreateApplicationCallFields, TypedApplicationCallFields } from '@algorandfoundation/algorand-typescript/arc4'
import { invariant } from '../../tests/util'
import { ABI_RETURN_VALUE_LOG_PREFIX } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { extractArraysFromArgs } from '../subcontexts/contract-context'
import type { DeliberateAny } from '../typescript-helpers'
import { asBytes, asNumber, asUint8Array } from '../util'
import { getApp } from './app-params'
import { getAsset } from './asset-params'
import { encodeArc4Impl } from './encoded-types'
import type { InnerTxn, InnerTxnFields } from './itxn'
import type { StubBytesCompat } from './primitives'
import { Uint64Cls } from './primitives'
import { Account, asAccount, asApplication, asAsset } from './reference'
import type { Transaction } from './transactions'
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

  submit(): TTransaction {
    let itxnContext: ApplicationCallInnerTxnContext | undefined

    if (this.isApplicationCall()) {
      itxnContext = ApplicationCallInnerTxnContext.createFromFields(this.#fields)
      lazyContext.value.notifyApplicationSpies(itxnContext)
    }
    const innerTxn = (itxnContext ?? createInnerTxn<InnerTxnFields>(this.#fields)) as unknown as TTransaction
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
const UNSET = Symbol('UNSET_SYMBOL')
export class ApplicationCallInnerTxnContext<TReturn = unknown> extends ApplicationCallInnerTxn {
  static createFromFields(fields: ApplicationCallFields) {
    return new ApplicationCallInnerTxnContext(fields)
  }
  static createFromTypedApplicationCallFields<TReturn = unknown>(
    methodArgs: TypedApplicationCallFields<DeliberateAny>,
    methodSelector: bytes,
  ) {
    const app =
      (methodArgs.appId instanceof Uint64Cls ? getApp(methodArgs.appId) : (methodArgs.appId as ApplicationType | undefined)) ??
      lazyContext.any.application()
    const args = (methodArgs.args ?? []).map((x: DeliberateAny) => (x instanceof ItxnParams ? x.submit() : x))
    const { transactions, ...appCallArgs } = extractArraysFromArgs(app, asUint8Array(methodSelector), args)
    const { args: _, ...methodArgsFields } = methodArgs
    const fields = {
      ...methodArgsFields,
      ...appCallArgs,
    }
    return new ApplicationCallInnerTxnContext<TReturn>(fields, transactions)
  }
  static createFromBareCreateApplicationCallFields(methodArgs: BareCreateApplicationCallFields) {
    return new ApplicationCallInnerTxnContext(methodArgs)
  }

  #returnValue: TReturn | typeof UNSET = UNSET
  setReturnValue(value: TReturn) {
    // Ignore undefined (void) values
    if (value === undefined) return
    super.appendLog(ABI_RETURN_VALUE_LOG_PREFIX.concat(encodeArc4Impl(undefined, value)))
    this.#returnValue = value
  }
  /* @internal */
  get loggedReturnValue(): TReturn {
    return this.#returnValue === UNSET ? (undefined as TReturn) : this.#returnValue
  }

  override appendLog(value: StubBytesCompat) {
    /*
    As per https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0004.md#implementing-a-method
    If the method is non-void, the Application MUST encode the return value as described in the Encoding section and then log it with the
    prefix 151f7c75. Other values MAY be logged before the return value, but other values MUST NOT be logged after the return value.
     */
    invariant(this.#returnValue === UNSET, 'Cannot add logs after a return value has been set')
    super.appendLog(value)
  }

  private constructor(
    fields: ApplicationCallFields,
    public itxns?: Transaction[],
  ) {
    super(fields)
  }
}
