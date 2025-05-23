import type { Account, Application, Asset, bytes, itxn, op, TransactionType, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asBytes, asBytesCls, asNumber, asUint64, asUint64Cls } from '../util'
import { getApp } from './app-params'
import { getAsset } from './asset-params'
import type { StubBytesCompat, StubUint64Compat } from './primitives'

export type InnerTxn =
  | itxn.PaymentInnerTxn
  | itxn.KeyRegistrationInnerTxn
  | itxn.AssetConfigInnerTxn
  | itxn.AssetTransferInnerTxn
  | itxn.AssetFreezeInnerTxn
  | itxn.ApplicationCallInnerTxn

export type InnerTxnFields = (
  | itxn.PaymentFields
  | itxn.KeyRegistrationFields
  | itxn.AssetConfigFields
  | itxn.AssetTransferFields
  | itxn.AssetFreezeFields
  | itxn.ApplicationCallFields
) & { type?: TransactionType }

export const GITxn: typeof op.GITxn = {
  sender: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).sender
  },
  fee: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).fee
  },
  firstValid: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).firstValid
  },
  firstValidTime: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).firstValidTime
  },
  lastValid: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).lastValid
  },
  note: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).note
  },
  lease: function (t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).lease
  },
  receiver: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn(t).receiver
  },
  amount: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn(t).amount
  },
  closeRemainderTo: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn(t).closeRemainderTo
  },
  votePk: function (t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).voteKey
  },
  selectionPk: function (t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).selectionKey
  },
  voteFirst: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).voteFirst
  },
  voteLast: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).voteLast
  },
  voteKeyDilution: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).voteKeyDilution
  },
  type: function (t: StubUint64Compat): bytes {
    return asUint64Cls(lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).type).toBytes().asAlgoTs()
  },
  typeEnum: function (t: StubUint64Compat): uint64 {
    return asUint64(lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).type)
  },
  xferAsset: function (t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn(t).xferAsset
  },
  assetAmount: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn(t).assetAmount
  },
  assetSender: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn(t).assetSender
  },
  assetReceiver: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn(t).assetReceiver
  },
  assetCloseTo: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn(t).assetCloseTo
  },
  groupIndex: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).groupIndex
  },
  txId: function (t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).txnId
  },
  applicationId: function (t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).appId
  },
  onCompletion: function (t: StubUint64Compat): uint64 {
    const onCompletion = lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).onCompletion
    return asUint64(onCompletion)
  },
  applicationArgs: function (t: StubUint64Compat, a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).appArgs(asUint64(a))
  },
  numAppArgs: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numAppArgs
  },
  accounts: function (t: StubUint64Compat, a: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).accounts(asUint64(a))
  },
  numAccounts: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numAccounts
  },
  approvalProgram: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).approvalProgram
  },
  clearStateProgram: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).clearStateProgram
  },
  rekeyTo: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn(t).rekeyTo
  },
  configAsset: function (t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).configAsset
  },
  configAssetTotal: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).total
  },
  configAssetDecimals: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).decimals
  },
  configAssetDefaultFrozen: function (t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).defaultFrozen
  },
  configAssetUnitName: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).unitName
  },
  configAssetName: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).assetName
  },
  configAssetUrl: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).url
  },
  configAssetMetadataHash: function (t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).metadataHash
  },
  configAssetManager: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).manager
  },
  configAssetReserve: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).reserve
  },
  configAssetFreeze: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).freeze
  },
  configAssetClawback: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).clawback
  },
  freezeAsset: function (t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn(t).freezeAsset
  },
  freezeAssetAccount: function (t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn(t).freezeAccount
  },
  freezeAssetFrozen: function (t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn(t).frozen
  },
  assets: function (t: StubUint64Compat, a: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).assets(asUint64(a))
  },
  numAssets: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numAssets
  },
  applications: function (t: StubUint64Compat, a: StubUint64Compat): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).apps(asUint64(a))
  },
  numApplications: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numApps
  },
  globalNumUint: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).globalNumUint
  },
  globalNumByteSlice: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).globalNumBytes
  },
  localNumUint: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).localNumUint
  },
  localNumByteSlice: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).localNumBytes
  },
  extraProgramPages: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).extraProgramPages
  },
  nonparticipation: function (t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).nonparticipation
  },
  logs: function (t: StubUint64Compat, a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).logs(asUint64(a))
  },
  numLogs: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numLogs
  },
  createdAssetId: function (t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn(t).createdAsset
  },
  createdApplicationId: function (t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).createdApp
  },
  lastLog: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).lastLog
  },
  stateProofPk: function (t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn(t).stateProofKey
  },
  approvalProgramPages: function (t: StubUint64Compat, a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).approvalProgramPages(asUint64(a))
  },
  numApprovalProgramPages: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numApprovalProgramPages
  },
  clearStateProgramPages: function (t: StubUint64Compat, a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).clearStateProgramPages(asUint64(a))
  },
  numClearStateProgramPages: function (t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn(t).numClearStateProgramPages
  },
}
export const ITxn: typeof op.ITxn = {
  /**
   * 32 byte address
   */
  get sender(): Account {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().sender
  },
  /**
   * microalgos
   */
  get fee(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().fee
  },
  /**
   * round number
   */
  get firstValid(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().firstValid
  },
  /**
   * UNIX timestamp of block before txn.FirstValid. Fails if negative
   */
  get firstValidTime(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().firstValidTime
  },
  /**
   * round number
   */
  get lastValid(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().lastValid
  },
  /**
   * Any data up to 1024 bytes
   */
  get note(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().note
  },
  /**
   * 32 byte lease value
   */
  get lease(): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().lease
  },
  /**
   * 32 byte address
   */
  get receiver(): Account {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn().receiver
  },
  /**
   * microalgos
   */
  get amount(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn().amount
  },
  /**
   * 32 byte address
   */
  get closeRemainderTo(): Account {
    return lazyContext.activeGroup.getItxnGroup().getPaymentInnerTxn().closeRemainderTo
  },
  /**
   * 32 byte address
   */
  get votePk(): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().voteKey
  },
  /**
   * 32 byte address
   */
  get selectionPk(): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().selectionKey
  },
  /**
   * The first round that the participation key is valid.
   */
  get voteFirst(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().voteFirst
  },
  /**
   * The last round that the participation key is valid.
   */
  get voteLast(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().voteLast
  },
  /**
   * Dilution for the 2-level participation key
   */
  get voteKeyDilution(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().voteKeyDilution
  },
  /**
   * Transaction type as bytes
   */
  get type(): bytes {
    return asUint64Cls(lazyContext.activeGroup.getItxnGroup().getInnerTxn().type).toBytes().asAlgoTs()
  },
  /**
   * Transaction type as integer
   */
  get typeEnum(): uint64 {
    return asUint64(lazyContext.activeGroup.getItxnGroup().getInnerTxn().type)
  },
  /**
   * Asset ID
   */
  get xferAsset(): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn().xferAsset
  },
  /**
   * value in Asset's units
   */
  get assetAmount(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn().assetAmount
  },
  /**
   * 32 byte address. Source of assets if Sender is the Asset's Clawback address.
   */
  get assetSender(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn().assetSender
  },
  /**
   * 32 byte address
   */
  get assetReceiver(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn().assetReceiver
  },
  /**
   * 32 byte address
   */
  get assetCloseTo(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetTransferInnerTxn().assetCloseTo
  },
  /**
   * Position of this transaction within an atomic transaction group. A stand-alone transaction is implicitly element 0 in a group of 1
   */
  get groupIndex(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().groupIndex
  },
  /**
   * The computed ID for this transaction. 32 bytes.
   */
  get txId(): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().txnId
  },
  /**
   * ApplicationID from ApplicationCall transaction
   */
  get applicationId(): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().appId
  },
  /**
   * ApplicationCall transaction on completion action
   */
  get onCompletion(): uint64 {
    const onCompletion = lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().onCompletion
    return asUint64(onCompletion)
  },
  /**
   * Arguments passed to the application in the ApplicationCall transaction
   */
  applicationArgs(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().appArgs(asUint64(a))
  },
  /**
   * Number of ApplicationArgs
   */
  get numAppArgs(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numAppArgs
  },
  /**
   * Accounts listed in the ApplicationCall transaction
   */
  accounts(a: StubUint64Compat): Account {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().accounts(asUint64(a))
  },
  /**
   * Number of Accounts
   */
  get numAccounts(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numAccounts
  },
  /**
   * Approval program
   */
  get approvalProgram(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().approvalProgram
  },
  /**
   * Clear state program
   */
  get clearStateProgram(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().clearStateProgram
  },
  /**
   * 32 byte Sender's new AuthAddr
   */
  get rekeyTo(): Account {
    return lazyContext.activeGroup.getItxnGroup().getInnerTxn().rekeyTo
  },
  /**
   * Asset ID in asset config transaction
   */
  get configAsset(): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().configAsset
  },
  /**
   * Total number of units of this asset created
   */
  get configAssetTotal(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().total
  },
  /**
   * Number of digits to display after the decimal place when displaying the asset
   */
  get configAssetDecimals(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().decimals
  },
  /**
   * Whether the asset's slots are frozen by default or not, 0 or 1
   */
  get configAssetDefaultFrozen(): boolean {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().defaultFrozen
  },
  /**
   * Unit name of the asset
   */
  get configAssetUnitName(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().unitName
  },
  /**
   * The asset name
   */
  get configAssetName(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().assetName
  },
  /**
   * URL
   */
  get configAssetUrl(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().url
  },
  /**
   * 32 byte commitment to unspecified asset metadata
   */
  get configAssetMetadataHash(): bytes<32> {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().metadataHash
  },
  /**
   * 32 byte address
   */
  get configAssetManager(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().manager
  },
  /**
   * 32 byte address
   */
  get configAssetReserve(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().reserve
  },
  /**
   * 32 byte address
   */
  get configAssetFreeze(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().freeze
  },
  /**
   * 32 byte address
   */
  get configAssetClawback(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().clawback
  },
  /**
   * Asset ID being frozen or un-frozen
   */
  get freezeAsset(): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn().freezeAsset
  },
  /**
   * 32 byte address of the account whose asset slot is being frozen or un-frozen
   */
  get freezeAssetAccount(): Account {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn().freezeAccount
  },
  /**
   * The new frozen value, 0 or 1
   */
  get freezeAssetFrozen(): boolean {
    return lazyContext.activeGroup.getItxnGroup().getAssetFreezeInnerTxn().frozen
  },
  /**
   * Foreign Assets listed in the ApplicationCall transaction
   */
  assets(a: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().assets(asUint64(a))
  },
  /**
   * Number of Assets
   */
  get numAssets(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numAssets
  },
  /**
   * Foreign Apps listed in the ApplicationCall transaction
   */
  applications(a: StubUint64Compat): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().apps(asUint64(a))
  },
  /**
   * Number of Applications
   */
  get numApplications(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numApps
  },
  /**
   * Number of global state integers in ApplicationCall
   */
  get globalNumUint(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().globalNumUint
  },
  /**
   * Number of global state byteslices in ApplicationCall
   */
  get globalNumByteSlice(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().globalNumBytes
  },
  /**
   * Number of local state integers in ApplicationCall
   */
  get localNumUint(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().localNumUint
  },
  /**
   * Number of local state byteslices in ApplicationCall
   */
  get localNumByteSlice(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().localNumBytes
  },
  /**
   * Number of additional pages for each of the application's approval and clear state programs. An ExtraProgramPages of 1 means 2048 more total bytes, or 1024 for each program.
   */
  get extraProgramPages(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().extraProgramPages
  },
  /**
   * Marks an account nonparticipating for rewards
   */
  get nonparticipation(): boolean {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().nonparticipation
  },
  /**
   * Log messages emitted by an application call (only with `itxn` in v5). Application mode only
   */
  logs(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().logs(asUint64(a))
  },
  /**
   * Number of Logs (only with `itxn` in v5). Application mode only
   */
  get numLogs(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numLogs
  },
  /**
   * Asset ID allocated by the creation of an ASA (only with `itxn` in v5). Application mode only
   */
  get createdAssetId(): Asset {
    return lazyContext.activeGroup.getItxnGroup().getAssetConfigInnerTxn().createdAsset
  },
  /**
   * ApplicationID allocated by the creation of an application (only with `itxn` in v5). Application mode only
   */
  get createdApplicationId(): Application {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().createdApp
  },
  /**
   * The last message emitted. Empty bytes if none were emitted. Application mode only
   */
  get lastLog(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().lastLog
  },
  /**
   * 64 byte state proof public key
   */
  get stateProofPk(): bytes {
    return lazyContext.activeGroup.getItxnGroup().getKeyRegistrationInnerTxn().stateProofKey
  },
  /**
   * Approval Program as an array of pages
   */
  approvalProgramPages(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().approvalProgramPages(asUint64(a))
  },
  /**
   * Number of Approval Program pages
   */
  get numApprovalProgramPages(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numApprovalProgramPages
  },
  /**
   * ClearState Program as an array of pages
   */
  clearStateProgramPages(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().clearStateProgramPages(asUint64(a))
  },
  /**
   * Number of ClearState Program pages
   */
  get numClearStateProgramPages(): uint64 {
    return lazyContext.activeGroup.getItxnGroup().getApplicationCallInnerTxn().numClearStateProgramPages
  },
}

const setConstructingItxnField = (fields: Partial<InnerTxnFields>): void => {
  Object.assign(lazyContext.activeGroup.constructingItxn, fields)
}

const getConstructingItxn = <T extends InnerTxnFields>(): T => {
  return lazyContext.activeGroup.constructingItxn as T
}

export const ITxnCreate: typeof op.ITxnCreate = {
  begin: function (): void {
    lazyContext.activeGroup.beginInnerTransactionGroup()
  },
  setSender: function (a: Account): void {
    setConstructingItxnField({ sender: a })
  },
  setFee: function (a: StubUint64Compat): void {
    setConstructingItxnField({ fee: asUint64(a) })
  },
  setNote: function (a: StubBytesCompat): void {
    setConstructingItxnField({ note: asBytes(a) })
  },
  setReceiver: function (a: Account): void {
    setConstructingItxnField({ receiver: a })
  },
  setAmount: function (a: StubUint64Compat): void {
    setConstructingItxnField({ amount: asUint64(a) })
  },
  setCloseRemainderTo: function (a: Account): void {
    setConstructingItxnField({ closeRemainderTo: a })
  },
  setVotePk: function (a: StubBytesCompat): void {
    setConstructingItxnField({ voteKey: asBytes(a).toFixed({ length: 32 }) })
  },
  setSelectionPk: function (a: StubBytesCompat): void {
    setConstructingItxnField({ selectionKey: asBytes(a).toFixed({ length: 32 }) })
  },
  setVoteFirst: function (a: StubUint64Compat): void {
    setConstructingItxnField({ voteFirst: asUint64(a) })
  },
  setVoteLast: function (a: StubUint64Compat): void {
    setConstructingItxnField({ voteLast: asUint64(a) })
  },
  setVoteKeyDilution: function (a: StubUint64Compat): void {
    setConstructingItxnField({ voteKeyDilution: asUint64(a) })
  },
  setType: function (a: StubBytesCompat): void {
    setConstructingItxnField({ type: asBytesCls(a).toUint64().asNumber() as TransactionType })
  },
  setTypeEnum: function (a: StubUint64Compat): void {
    setConstructingItxnField({ type: asUint64Cls(a).asNumber() as TransactionType })
  },
  setXferAsset: function (a: Asset | StubUint64Compat): void {
    setConstructingItxnField({ xferAsset: getAsset(a) })
  },
  setAssetAmount: function (a: StubUint64Compat): void {
    setConstructingItxnField({ assetAmount: asUint64(a) })
  },
  setAssetSender: function (a: Account): void {
    setConstructingItxnField({ assetSender: a })
  },
  setAssetReceiver: function (a: Account): void {
    setConstructingItxnField({ assetReceiver: a })
  },
  setAssetCloseTo: function (a: Account): void {
    setConstructingItxnField({ assetCloseTo: a })
  },
  setApplicationId: function (a: Application | StubUint64Compat): void {
    setConstructingItxnField({ appId: getApp(a) })
  },
  setOnCompletion: function (a: StubUint64Compat): void {
    setConstructingItxnField({ onCompletion: asNumber(a) })
  },
  setApplicationArgs: function (a: StubBytesCompat): void {
    const appArgs = (getConstructingItxn<itxn.ApplicationCallFields>().appArgs ?? []) as bytes[]
    appArgs.push(asBytes(a))
    setConstructingItxnField({ appArgs })
  },
  setAccounts: function (a: Account): void {
    const accounts = (getConstructingItxn<itxn.ApplicationCallFields>().accounts ?? []) as Account[]
    accounts.push(a)
    setConstructingItxnField({ accounts })
  },
  setApprovalProgram: function (a: StubBytesCompat): void {
    setConstructingItxnField({ approvalProgram: asBytes(a) })
  },
  setClearStateProgram: function (a: StubBytesCompat): void {
    setConstructingItxnField({ clearStateProgram: asBytes(a) })
  },
  setRekeyTo: function (a: Account): void {
    setConstructingItxnField({ rekeyTo: a })
  },
  setConfigAsset: function (a: Asset | StubUint64Compat): void {
    setConstructingItxnField({ configAsset: getAsset(a) })
  },
  setConfigAssetTotal: function (a: StubUint64Compat): void {
    setConstructingItxnField({ total: asUint64(a) })
  },
  setConfigAssetDecimals: function (a: StubUint64Compat): void {
    setConstructingItxnField({ decimals: asUint64(a) })
  },
  setConfigAssetDefaultFrozen: function (a: boolean): void {
    setConstructingItxnField({ defaultFrozen: a })
  },
  setConfigAssetUnitName: function (a: StubBytesCompat): void {
    setConstructingItxnField({ unitName: asBytes(a) })
  },
  setConfigAssetName: function (a: StubBytesCompat): void {
    setConstructingItxnField({ assetName: asBytes(a) })
  },
  setConfigAssetUrl: function (a: StubBytesCompat): void {
    setConstructingItxnField({ url: asBytes(a) })
  },
  setConfigAssetMetadataHash: function (a: StubBytesCompat): void {
    setConstructingItxnField({ metadataHash: asBytes(a).toFixed({ length: 32 }) })
  },
  setConfigAssetManager: function (a: Account): void {
    setConstructingItxnField({ manager: a })
  },
  setConfigAssetReserve: function (a: Account): void {
    setConstructingItxnField({ reserve: a })
  },
  setConfigAssetFreeze: function (a: Account): void {
    setConstructingItxnField({ freeze: a })
  },
  setConfigAssetClawback: function (a: Account): void {
    setConstructingItxnField({ clawback: a })
  },
  setFreezeAsset: function (a: Asset | StubUint64Compat): void {
    setConstructingItxnField({ freezeAsset: getAsset(a) })
  },
  setFreezeAssetAccount: function (a: Account): void {
    setConstructingItxnField({ freezeAccount: a })
  },
  setFreezeAssetFrozen: function (a: boolean): void {
    setConstructingItxnField({ frozen: a })
  },
  setAssets: function (a: StubUint64Compat): void {
    const asset = getAsset(a)
    if (asset) {
      const assets = (getConstructingItxn<itxn.ApplicationCallFields>().assets ?? []) as Asset[]
      assets.push(asset)
      setConstructingItxnField({ assets })
    }
  },
  setApplications: function (a: StubUint64Compat): void {
    const app = getApp(a)
    if (app) {
      const apps = (getConstructingItxn<itxn.ApplicationCallFields>().apps ?? []) as Application[]
      apps.push(app)
      setConstructingItxnField({ apps })
    }
  },
  setGlobalNumUint: function (a: StubUint64Compat): void {
    setConstructingItxnField({ globalNumUint: asUint64(a) })
  },
  setGlobalNumByteSlice: function (a: StubUint64Compat): void {
    setConstructingItxnField({ globalNumBytes: asUint64(a) })
  },
  setLocalNumUint: function (a: StubUint64Compat): void {
    setConstructingItxnField({ localNumUint: asUint64(a) })
  },
  setLocalNumByteSlice: function (a: StubUint64Compat): void {
    setConstructingItxnField({ localNumBytes: asUint64(a) })
  },
  setExtraProgramPages: function (a: StubUint64Compat): void {
    setConstructingItxnField({ extraProgramPages: asUint64(a) })
  },
  setNonparticipation: function (a: boolean): void {
    setConstructingItxnField({ nonparticipation: a })
  },
  setStateProofPk: function (a: StubBytesCompat): void {
    setConstructingItxnField({ stateProofKey: asBytes(a).toFixed({ length: 64 }) })
  },
  setApprovalProgramPages: function (a: StubBytesCompat): void {
    let pages = (getConstructingItxn<itxn.ApplicationCallFields>().approvalProgram ?? []) as bytes[]
    if (!Array.isArray(pages)) {
      pages = [pages]
    }
    pages.push(asBytes(a))
    setConstructingItxnField({ approvalProgram: pages })
  },
  setClearStateProgramPages: function (a: StubBytesCompat): void {
    let pages = (getConstructingItxn<itxn.ApplicationCallFields>().clearStateProgram ?? []) as bytes[]
    if (!Array.isArray(pages)) {
      pages = [pages]
    }
    pages.push(asBytes(a))
    setConstructingItxnField({ clearStateProgram: pages })
  },
  next: function (): void {
    lazyContext.activeGroup.appendInnerTransactionGroup()
  },
  submit: function (): void {
    lazyContext.activeGroup.submitInnerTransactionGroup()
  },
}
