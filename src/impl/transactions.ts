import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  bytes,
  gtxn,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { OnCompleteAction, TransactionType } from '@algorandfoundation/algorand-typescript'
import { ABI_RETURN_VALUE_LOG_PREFIX, MAX_ITEMS_IN_LOG } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { toBytes } from '../encoders'
import { InternalError } from '../errors'
import type { Mutable, ObjectKeys } from '../typescript-helpers'
import { asBytes, asMaybeBytesCls, asMaybeUint64Cls, asNumber, asUint64Cls, combineIntoMaxBytePages, getRandomBytes } from '../util'
import { Bytes, Uint64, type StubBytesCompat, type StubUint64Compat } from './primitives'
import { Account, Application, Asset } from './reference'

const baseDefaultFields = () => ({
  sender: lazyContext.defaultSender,
  fee: Uint64(0),
  firstValid: Uint64(0),
  firstValidTime: Uint64(0),
  lastValid: Uint64(0),
  note: Bytes(),
  lease: Bytes() as bytes<32>,
  groupIndex: Uint64(0),
  txnId: getRandomBytes(32).asAlgoTs().toFixed({ length: 32 }),
  rekeyTo: Account(),
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

  readonly sender: AccountType
  readonly fee: uint64
  readonly firstValid: uint64
  readonly firstValidTime: uint64
  readonly lastValid: uint64
  readonly note: bytes
  readonly lease: bytes<32>
  readonly groupIndex: uint64
  readonly txnId: bytes<32>
  readonly rekeyTo: AccountType
  readonly scratchSpace: Array<bytes | uint64>

  setScratchSlot(index: StubUint64Compat, value: StubBytesCompat | StubUint64Compat): void {
    const i = asNumber(index)
    if (i >= this.scratchSpace.length) {
      throw new InternalError('invalid scratch slot')
    }
    const bytesValue = asMaybeBytesCls(value)
    const uint64Value = asMaybeUint64Cls(value)
    this.scratchSpace[i] = bytesValue?.asAlgoTs() ?? uint64Value?.asAlgoTs() ?? Uint64(0)
  }

  getScratchSlot(index: StubUint64Compat): bytes | uint64 {
    const i = asNumber(index)
    if (i >= this.scratchSpace.length) {
      throw new InternalError('invalid scratch slot')
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
    this.receiver = fields.receiver ?? Account()
    this.amount = fields.amount ?? Uint64(0)
    this.closeRemainderTo = fields.closeRemainderTo ?? Account()
  }

  readonly receiver: AccountType
  readonly amount: uint64
  readonly closeRemainderTo: AccountType
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
    this.voteKey = fields.voteKey ?? (Bytes() as bytes<32>)
    this.selectionKey = fields.selectionKey ?? (Bytes() as bytes<32>)
    this.voteFirst = fields.voteFirst ?? Uint64(0)
    this.voteLast = fields.voteLast ?? Uint64(0)
    this.voteKeyDilution = fields.voteKeyDilution ?? Uint64(0)
    this.nonparticipation = fields.nonparticipation ?? false
    this.stateProofKey = fields.stateProofKey ?? (Bytes() as bytes<64>)
    const globalData = lazyContext.ledger.globalData
    if (this.fee >= globalData.payoutsGoOnlineFee && globalData.payoutsEnabled) {
      lazyContext.ledger.patchAccountData(this.sender, {
        incentiveEligible: true,
      })
    }
  }

  readonly voteKey: bytes<32>
  readonly selectionKey: bytes<32>
  readonly voteFirst: uint64
  readonly voteLast: uint64
  readonly voteKeyDilution: uint64
  readonly nonparticipation: boolean
  readonly stateProofKey: bytes<64>
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
    this.configAsset = fields.configAsset ?? Asset()
    this.total = fields.total ?? Uint64(0)
    this.decimals = fields.decimals ?? Uint64(0)
    this.defaultFrozen = fields.defaultFrozen ?? false
    this.unitName = fields.unitName ?? Bytes()
    this.assetName = fields.assetName ?? Bytes()
    this.url = fields.url ?? Bytes()
    this.metadataHash = fields.metadataHash ?? (Bytes() as bytes<32>)
    this.manager = fields.manager ?? Account()
    this.reserve = fields.reserve ?? Account()
    this.freeze = fields.freeze ?? Account()
    this.clawback = fields.clawback ?? Account()
    this.createdAsset = fields.createdAsset ?? Asset()
  }

  readonly configAsset: AssetType
  readonly total: uint64
  readonly decimals: uint64
  readonly defaultFrozen: boolean
  readonly unitName: bytes
  readonly assetName: bytes
  readonly url: bytes
  readonly metadataHash: bytes<32>
  readonly manager: AccountType
  readonly reserve: AccountType
  readonly freeze: AccountType
  readonly clawback: AccountType
  readonly createdAsset: AssetType
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
    this.xferAsset = fields.xferAsset ?? Asset()
    this.assetAmount = fields.assetAmount ?? Uint64(0)
    this.assetSender = fields.assetSender ?? Account()
    this.assetReceiver = fields.assetReceiver ?? Account()
    this.assetCloseTo = fields.assetCloseTo ?? Account()
  }

  readonly xferAsset: AssetType
  readonly assetAmount: uint64
  readonly assetSender: AccountType
  readonly assetReceiver: AccountType
  readonly assetCloseTo: AccountType

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
    this.freezeAsset = fields.freezeAsset ?? Asset()
    this.freezeAccount = fields.freezeAccount ?? Account()
    this.frozen = fields.frozen ?? false
  }

  readonly freezeAsset: AssetType
  readonly freezeAccount: AccountType
  readonly frozen: boolean

  readonly type: TransactionType.AssetFreeze = TransactionType.AssetFreeze
  readonly typeBytes: bytes = asUint64Cls(TransactionType.AssetFreeze).toBytes().asAlgoTs()
}

export type ApplicationCallTransactionFields = TxnFields<gtxn.ApplicationCallTxn> &
  Partial<{
    appArgs: Array<unknown>
    accounts: Array<AccountType>
    assets: Array<AssetType>
    apps: Array<ApplicationType>
    approvalProgramPages: Array<bytes>
    clearStateProgramPages: Array<bytes>
    appLogs: Array<bytes>
    scratchSpace: Record<number, bytes | uint64>
  }>

export class ApplicationCallTransaction extends TransactionBase implements gtxn.ApplicationCallTxn {
  /* @internal */
  static create(fields: ApplicationCallTransactionFields) {
    return new ApplicationCallTransaction(fields)
  }
  private args: Array<unknown>
  #accounts: Array<AccountType>
  #assets: Array<AssetType>
  #apps: Array<ApplicationType>
  #approvalProgramPages: Array<bytes>
  #clearStateProgramPages: Array<bytes>
  #appLogs: Array<bytes>
  #appId: ApplicationType

  protected constructor(fields: ApplicationCallTransactionFields) {
    super(fields)
    this.#appId = fields.appId ?? Application()
    this.onCompletion = fields.onCompletion ?? OnCompleteAction.NoOp
    this.globalNumUint = fields.globalNumUint ?? Uint64(0)
    this.globalNumBytes = fields.globalNumBytes ?? Uint64(0)
    this.localNumUint = fields.localNumUint ?? Uint64(0)
    this.localNumBytes = fields.localNumBytes ?? Uint64(0)
    this.extraProgramPages = fields.extraProgramPages ?? Uint64(0)
    this.createdApp = fields.createdApp ?? Application()
    this.args = fields.appArgs ?? []
    this.#appLogs = fields.appLogs ?? []
    this.#accounts = fields.accounts ?? []
    this.#assets = fields.assets ?? []
    this.#apps = fields.apps ?? []
    this.#approvalProgramPages = fields.approvalProgramPages ?? (fields.approvalProgram ? [fields.approvalProgram] : [])
    this.#clearStateProgramPages = fields.clearStateProgramPages ?? (fields.clearStateProgram ? [fields.clearStateProgram] : [])
    Object.entries(fields.scratchSpace ?? {}).forEach(([k, v]) => this.setScratchSlot(Number(k), v))
  }

  get backingAppId(): ApplicationType {
    return this.#appId
  }

  get appId(): ApplicationType {
    if (asNumber(this.#appId.id) === 0) {
      return this.#appId
    }
    const appData = lazyContext.getApplicationData(this.#appId.id)
    if (appData && appData.isCreating) {
      return Application(0)
    }
    return this.#appId
  }
  readonly onCompletion: OnCompleteAction
  readonly globalNumUint: uint64
  readonly globalNumBytes: uint64
  readonly localNumUint: uint64
  readonly localNumBytes: uint64
  readonly extraProgramPages: uint64
  createdApp: ApplicationType
  get approvalProgram() {
    return this.approvalProgramPages(0)
  }
  get clearStateProgram() {
    return this.clearStateProgramPages(0)
  }
  get numAppArgs() {
    return Uint64(this.args.length)
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
    return Uint64(this.appLogs.length || lazyContext.getApplicationData(this.appId.id).application.appLogs!.length)
  }
  get lastLog() {
    return this.appLogs.at(-1) ?? lazyContext.getApplicationData(this.appId.id).application.appLogs!.at(-1) ?? Bytes()
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
  appArgs(index: StubUint64Compat): bytes {
    return toBytes(this.args[asNumber(index)])
  }
  accounts(index: StubUint64Compat): AccountType {
    return this.#accounts[asNumber(index)]
  }
  assets(index: StubUint64Compat): AssetType {
    return this.#assets[asNumber(index)]
  }
  apps(index: StubUint64Compat): ApplicationType {
    return this.#apps[asNumber(index)]
  }
  approvalProgramPages(index: StubUint64Compat): bytes {
    return combineIntoMaxBytePages(this.#approvalProgramPages)[asNumber(index)]
  }
  clearStateProgramPages(index: StubUint64Compat): bytes {
    return combineIntoMaxBytePages(this.#clearStateProgramPages)[asNumber(index)]
  }
  logs(index: StubUint64Compat): bytes {
    const i = asNumber(index)
    return this.appLogs[i] ?? lazyContext.getApplicationData(this.appId.id).application.appLogs ?? Bytes()
  }
  readonly type: TransactionType.ApplicationCall = TransactionType.ApplicationCall
  readonly typeBytes: bytes = asUint64Cls(TransactionType.ApplicationCall).toBytes().asAlgoTs()

  /* @internal */
  get appLogs() {
    return this.#appLogs
  }
  /* @internal */
  appendLog(value: StubBytesCompat): void {
    if (this.#appLogs.length + 1 > MAX_ITEMS_IN_LOG) {
      throw new InternalError(`Too many log calls in program, up to ${MAX_ITEMS_IN_LOG} is allowed`)
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
  | ApplicationCallTransaction

export type AllTransactionFields = TxnFields<gtxn.PaymentTxn> &
  TxnFields<gtxn.KeyRegistrationTxn> &
  TxnFields<gtxn.AssetConfigTxn> &
  TxnFields<gtxn.AssetTransferTxn> &
  TxnFields<gtxn.AssetFreezeTxn> &
  ApplicationCallTransactionFields
