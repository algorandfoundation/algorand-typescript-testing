import {
  Account,
  Application,
  arc4,
  Asset,
  bytes,
  Bytes,
  gtxn,
  internal,
  TransactionType,
  uint64,
  Uint64,
} from '@algorandfoundation/algorand-typescript'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_ITEMS_IN_LOG } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { toBytes } from '../encoders'
import { Mutable, ObjectKeys } from '../typescript-helpers'
import { asBytes, asMaybeBytesCls, asMaybeUint64Cls, asNumber, asUint64Cls, combineIntoMaxBytePages, getRandomBytes } from '../util'
import { AccountImpl, ApplicationImpl, AssetImpl } from './reference'

const baseDefaultFields = () => ({
  sender: lazyContext.defaultSender,
  fee: Uint64(0),
  firstValid: Uint64(0),
  firstValidTime: Uint64(0),
  lastValid: Uint64(0),
  note: Bytes(),
  lease: Bytes(),
  groupIndex: Uint64(0),
  txnId: getRandomBytes(32).asAlgoTs(),
  rekeyTo: AccountImpl(),
})

export type TxnFields<TTxn> = Partial<Mutable<Pick<TTxn, ObjectKeys<TTxn>>>>

abstract class TransactionBase {
  protected constructor(fields: Partial<ReturnType<typeof baseDefaultFields>>) {
    const baseDefaults = baseDefaultFields()
    this.sender = fields.sender ?? baseDefaults.sender
    this.fee = fields.fee ?? baseDefaults.fee
    this.firstValid = fields.firstValid ?? baseDefaults.firstValid
    this.firstValidTime = fields.firstValidTime ?? baseDefaults.firstValidTime
    this.lastValid = fields.lastValid ?? baseDefaults.lastValid
    this.note = fields.note ?? baseDefaults.note
    this.lease = fields.lease ?? baseDefaults.lease
    this.groupIndex = fields.groupIndex ?? baseDefaults.groupIndex
    this.txnId = fields.txnId ?? baseDefaults.txnId
    this.rekeyTo = fields.rekeyTo ?? baseDefaults.rekeyTo
    this.scratchSpace = Array(256).fill(Uint64(0))
  }

  readonly sender: Account
  readonly fee: uint64
  readonly firstValid: uint64
  readonly firstValidTime: uint64
  readonly lastValid: uint64
  readonly note: bytes
  readonly lease: bytes
  readonly groupIndex: uint64
  readonly txnId: bytes
  readonly rekeyTo: Account
  readonly scratchSpace: Array<bytes | uint64>

  setScratchSlot(
    index: internal.primitives.StubUint64Compat,
    value: internal.primitives.StubBytesCompat | internal.primitives.StubUint64Compat,
  ): void {
    const i = asNumber(index)
    if (i >= this.scratchSpace.length) {
      throw internal.errors.internalError('invalid scratch slot')
    }
    const bytesValue = asMaybeBytesCls(value)
    const uint64Value = asMaybeUint64Cls(value)
    this.scratchSpace[i] = bytesValue?.asAlgoTs() ?? uint64Value?.asAlgoTs() ?? Uint64(0)
  }

  getScratchSlot(index: internal.primitives.StubUint64Compat): bytes | uint64 {
    const i = asNumber(index)
    if (i >= this.scratchSpace.length) {
      throw internal.errors.internalError('invalid scratch slot')
    }
    return this.scratchSpace[i]
  }
}

export class PaymentTransaction extends TransactionBase implements gtxn.PaymentTxn {
  /* @internal */
  static create(fields: TxnFields<gtxn.PaymentTxn>) {
    return new PaymentTransaction(fields)
  }

  protected constructor(fields: TxnFields<gtxn.PaymentTxn>) {
    super(fields)
    this.receiver = fields.receiver ?? AccountImpl()
    this.amount = fields.amount ?? Uint64(0)
    this.closeRemainderTo = fields.closeRemainderTo ?? AccountImpl()
  }

  readonly receiver: Account
  readonly amount: uint64
  readonly closeRemainderTo: Account
  readonly type: TransactionType.Payment = TransactionType.Payment
  readonly typeBytes: bytes = asUint64Cls(TransactionType.Payment).toBytes().asAlgoTs()
}

export class KeyRegistrationTransaction extends TransactionBase implements gtxn.KeyRegistrationTxn {
  /* @internal */
  static create(fields: TxnFields<gtxn.KeyRegistrationTxn>) {
    return new KeyRegistrationTransaction(fields)
  }

  protected constructor(fields: TxnFields<gtxn.KeyRegistrationTxn>) {
    super(fields)
    this.voteKey = fields.voteKey ?? Bytes()
    this.selectionKey = fields.selectionKey ?? Bytes()
    this.voteFirst = fields.voteFirst ?? Uint64(0)
    this.voteLast = fields.voteLast ?? Uint64(0)
    this.voteKeyDilution = fields.voteKeyDilution ?? Uint64(0)
    this.nonparticipation = fields.nonparticipation ?? false
    this.stateProofKey = fields.stateProofKey ?? Bytes()
    const globalData = lazyContext.ledger.globalData
    if (this.fee >= globalData.payoutsGoOnlineFee && globalData.payoutsEnabled) {
      lazyContext.ledger.patchAccountData(this.sender, {
        incentiveEligible: true,
      })
    }
  }

  readonly voteKey: bytes
  readonly selectionKey: bytes
  readonly voteFirst: uint64
  readonly voteLast: uint64
  readonly voteKeyDilution: uint64
  readonly nonparticipation: boolean
  readonly stateProofKey: bytes
  readonly type: TransactionType.KeyRegistration = TransactionType.KeyRegistration
  readonly typeBytes: bytes = asUint64Cls(TransactionType.KeyRegistration).toBytes().asAlgoTs()
}

export class AssetConfigTransaction extends TransactionBase implements gtxn.AssetConfigTxn {
  /* @internal */
  static create(fields: TxnFields<gtxn.AssetConfigTxn>) {
    return new AssetConfigTransaction(fields)
  }

  protected constructor(fields: TxnFields<gtxn.AssetConfigTxn>) {
    super(fields)
    this.configAsset = fields.configAsset ?? AssetImpl()
    this.total = fields.total ?? Uint64(0)
    this.decimals = fields.decimals ?? Uint64(0)
    this.defaultFrozen = fields.defaultFrozen ?? false
    this.unitName = fields.unitName ?? Bytes()
    this.assetName = fields.assetName ?? Bytes()
    this.url = fields.url ?? Bytes()
    this.metadataHash = fields.metadataHash ?? Bytes()
    this.manager = fields.manager ?? AccountImpl()
    this.reserve = fields.reserve ?? AccountImpl()
    this.freeze = fields.freeze ?? AccountImpl()
    this.clawback = fields.clawback ?? AccountImpl()
    this.createdAsset = fields.createdAsset ?? AssetImpl()
  }

  readonly configAsset: Asset
  readonly total: uint64
  readonly decimals: uint64
  readonly defaultFrozen: boolean
  readonly unitName: bytes
  readonly assetName: bytes
  readonly url: bytes
  readonly metadataHash: bytes
  readonly manager: Account
  readonly reserve: Account
  readonly freeze: Account
  readonly clawback: Account
  readonly createdAsset: Asset
  readonly type: TransactionType.AssetConfig = TransactionType.AssetConfig
  readonly typeBytes: bytes = asUint64Cls(TransactionType.AssetConfig).toBytes().asAlgoTs()
}

export class AssetTransferTransaction extends TransactionBase implements gtxn.AssetTransferTxn {
  /* @internal */
  static create(fields: TxnFields<gtxn.AssetTransferTxn>) {
    return new AssetTransferTransaction(fields)
  }

  protected constructor(fields: TxnFields<gtxn.AssetTransferTxn>) {
    super(fields)
    this.xferAsset = fields.xferAsset ?? AssetImpl()
    this.assetAmount = fields.assetAmount ?? Uint64(0)
    this.assetSender = fields.assetSender ?? AccountImpl()
    this.assetReceiver = fields.assetReceiver ?? AccountImpl()
    this.assetCloseTo = fields.assetCloseTo ?? AccountImpl()
  }

  readonly xferAsset: Asset
  readonly assetAmount: uint64
  readonly assetSender: Account
  readonly assetReceiver: Account
  readonly assetCloseTo: Account

  readonly type: TransactionType.AssetTransfer = TransactionType.AssetTransfer
  readonly typeBytes: bytes = asUint64Cls(TransactionType.AssetTransfer).toBytes().asAlgoTs()
}

export class AssetFreezeTransaction extends TransactionBase implements gtxn.AssetFreezeTxn {
  /* @internal */
  static create(fields: TxnFields<gtxn.AssetFreezeTxn>) {
    return new AssetFreezeTransaction(fields)
  }

  protected constructor(fields: TxnFields<gtxn.AssetFreezeTxn>) {
    super(fields)
    this.freezeAsset = fields.freezeAsset ?? AssetImpl()
    this.freezeAccount = fields.freezeAccount ?? AccountImpl()
    this.frozen = fields.frozen ?? false
  }

  readonly freezeAsset: Asset
  readonly freezeAccount: Account
  readonly frozen: boolean

  readonly type: TransactionType.AssetFreeze = TransactionType.AssetFreeze
  readonly typeBytes: bytes = asUint64Cls(TransactionType.AssetFreeze).toBytes().asAlgoTs()
}

export type ApplicationTransactionFields = TxnFields<gtxn.ApplicationTxn> &
  Partial<{
    appArgs: Array<unknown>
    accounts: Array<Account>
    assets: Array<Asset>
    apps: Array<Application>
    approvalProgramPages: Array<bytes>
    clearStateProgramPages: Array<bytes>
    appLogs: Array<bytes>
    scratchSpace: Record<number, bytes | uint64>
  }>

export class ApplicationTransaction extends TransactionBase implements gtxn.ApplicationTxn {
  /* @internal */
  static create(fields: ApplicationTransactionFields) {
    return new ApplicationTransaction(fields)
  }
  #appArgs: Array<unknown>
  #accounts: Array<Account>
  #assets: Array<Asset>
  #apps: Array<Application>
  #approvalProgramPages: Array<bytes>
  #clearStateProgramPages: Array<bytes>
  #appLogs: Array<bytes>

  protected constructor(fields: ApplicationTransactionFields) {
    super(fields)
    this.appId = fields.appId ?? ApplicationImpl()
    this.onCompletion = fields.onCompletion ?? 'NoOp'
    this.globalNumUint = fields.globalNumUint ?? Uint64(0)
    this.globalNumBytes = fields.globalNumBytes ?? Uint64(0)
    this.localNumUint = fields.localNumUint ?? Uint64(0)
    this.localNumBytes = fields.localNumBytes ?? Uint64(0)
    this.extraProgramPages = fields.extraProgramPages ?? Uint64(0)
    this.createdApp = fields.createdApp ?? ApplicationImpl()
    this.#appArgs = fields.appArgs ?? []
    this.#appLogs = fields.appLogs ?? []
    this.#accounts = fields.accounts ?? []
    this.#assets = fields.assets ?? []
    this.#apps = fields.apps ?? []
    this.#approvalProgramPages = fields.approvalProgramPages ?? (fields.approvalProgram ? [fields.approvalProgram] : [])
    this.#clearStateProgramPages = fields.clearStateProgramPages ?? (fields.clearStateProgram ? [fields.clearStateProgram] : [])
    Object.entries(fields.scratchSpace ?? {}).forEach(([k, v]) => this.setScratchSlot(Number(k), v))
  }

  readonly appId: Application
  readonly onCompletion: arc4.OnCompleteActionStr
  readonly globalNumUint: uint64
  readonly globalNumBytes: uint64
  readonly localNumUint: uint64
  readonly localNumBytes: uint64
  readonly extraProgramPages: uint64
  readonly createdApp: Application
  get approvalProgram() {
    return this.approvalProgramPages(0)
  }
  get clearStateProgram() {
    return this.clearStateProgramPages(0)
  }
  get numAppArgs() {
    return Uint64(this.#appArgs.length)
  }
  get numAccounts() {
    return Uint64(this.#accounts.length)
  }
  get numAssets() {
    return Uint64(this.#assets.length)
  }
  get numApps() {
    return Uint64(this.#apps.length)
  }
  get numApprovalProgramPages() {
    return Uint64(this.approvalProgramPages.length)
  }
  get numClearStateProgramPages() {
    return Uint64(this.clearStateProgramPages.length)
  }
  get numLogs() {
    return Uint64(this.#appLogs.length || lazyContext.getApplicationData(this.appId.id).appLogs.length)
  }
  get lastLog() {
    return this.#appLogs.at(-1) ?? lazyContext.getApplicationData(this.appId.id).appLogs.at(-1) ?? Bytes()
  }
  get apat() {
    return this.#accounts
  }
  get apas() {
    return this.#assets
  }
  get apfa() {
    return this.#apps
  }
  appArgs(index: internal.primitives.StubUint64Compat): bytes {
    return toBytes(this.#appArgs[asNumber(index)])
  }
  accounts(index: internal.primitives.StubUint64Compat): Account {
    return this.#accounts[asNumber(index)]
  }
  assets(index: internal.primitives.StubUint64Compat): Asset {
    return this.#assets[asNumber(index)]
  }
  apps(index: internal.primitives.StubUint64Compat): Application {
    return this.#apps[asNumber(index)]
  }
  approvalProgramPages(index: internal.primitives.StubUint64Compat): bytes {
    return combineIntoMaxBytePages(this.#approvalProgramPages)[asNumber(index)]
  }
  clearStateProgramPages(index: internal.primitives.StubUint64Compat): bytes {
    return combineIntoMaxBytePages(this.#clearStateProgramPages)[asNumber(index)]
  }
  logs(index: internal.primitives.StubUint64Compat): bytes {
    const i = asNumber(index)
    return this.#appLogs[i] ?? lazyContext.getApplicationData(this.appId.id).appLogs ?? Bytes()
  }
  readonly type: TransactionType.ApplicationCall = TransactionType.ApplicationCall
  readonly typeBytes: bytes = asUint64Cls(TransactionType.ApplicationCall).toBytes().asAlgoTs()

  /* @internal */
  get appLogs() {
    return this.#appLogs
  }
  /* @internal */
  appendLog(value: internal.primitives.StubBytesCompat): void {
    if (this.#appLogs.length + 1 > MAX_ITEMS_IN_LOG) {
      throw internal.errors.internalError(`Too many log calls in program, up to ${MAX_ITEMS_IN_LOG} is allowed`)
    }
    this.#appLogs.push(asBytes(value))
  }
  /* @internal */
  logArc4ReturnValue(value: unknown): void {
    this.appendLog(ABI_RETURN_VALUE_LOG_PREFIX.concat(toBytes(value)))
  }
}

export type Transaction =
  | PaymentTransaction
  | KeyRegistrationTransaction
  | AssetConfigTransaction
  | AssetTransferTransaction
  | AssetFreezeTransaction
  | ApplicationTransaction

export type AllTransactionFields = TxnFields<gtxn.PaymentTxn> &
  TxnFields<gtxn.KeyRegistrationTxn> &
  TxnFields<gtxn.AssetConfigTxn> &
  TxnFields<gtxn.AssetTransferTxn> &
  TxnFields<gtxn.AssetFreezeTxn> &
  ApplicationTransactionFields
