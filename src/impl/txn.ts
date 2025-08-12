import type { Account, Application, Asset, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { TransactionType } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { asNumber, asUint64, asUint64Cls } from '../util'
import type { StubUint64Compat } from './primitives'

/** @internal */
export const gaid = (a: StubUint64Compat): uint64 => {
  const group = lazyContext.activeGroup
  const transaction = group.getTransaction(asUint64(a))
  if (transaction.type === TransactionType.ApplicationCall) {
    return transaction.createdApp.id
  } else if (transaction.type === TransactionType.AssetConfig) {
    return transaction.createdAsset.id
  } else {
    throw new InternalError(`transaction at index ${asNumber(a)} is not an Application Call or Asset Config`)
  }
}

/** @internal */
export const Txn: typeof op.Txn = {
  get sender(): Account {
    return lazyContext.activeGroup.getTransaction().sender
  },

  /**
   * microalgos
   */
  get fee(): uint64 {
    return lazyContext.activeGroup.getTransaction().fee
  },

  /**
   * round number
   */
  get firstValid(): uint64 {
    return lazyContext.activeGroup.getTransaction().firstValid
  },

  /**
   * UNIX timestamp of block before txn.FirstValid. Fails if negative
   */
  get firstValidTime(): uint64 {
    return lazyContext.activeGroup.getTransaction().firstValidTime
  },

  /**
   * round number
   */
  get lastValid(): uint64 {
    return lazyContext.activeGroup.getTransaction().lastValid
  },

  /**
   * Any data up to 1024 bytes
   */
  get note(): bytes {
    return lazyContext.activeGroup.getTransaction().note
  },

  /**
   * 32 byte lease value
   */
  get lease(): bytes<32> {
    return lazyContext.activeGroup.getTransaction().lease
  },

  /**
   * 32 byte address
   */
  get receiver(): Account {
    return lazyContext.activeGroup.getPaymentTransaction().receiver
  },

  /**
   * microalgos
   */
  get amount(): uint64 {
    return lazyContext.activeGroup.getPaymentTransaction().amount
  },

  /**
   * 32 byte address
   */
  get closeRemainderTo(): Account {
    return lazyContext.activeGroup.getPaymentTransaction().closeRemainderTo
  },

  /**
   * 32 byte address
   */
  get votePk(): bytes<32> {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().voteKey
  },

  /**
   * 32 byte address
   */
  get selectionPk(): bytes<32> {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().selectionKey
  },

  /**
   * The first round that the participation key is valid.
   */
  get voteFirst(): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().voteFirst
  },

  /**
   * The last round that the participation key is valid.
   */
  get voteLast(): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().voteLast
  },

  /**
   * Dilution for the 2-level participation key
   */
  get voteKeyDilution(): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().voteKeyDilution
  },

  /**
   * Transaction type as bytes
   */
  get type(): bytes {
    return asUint64Cls(lazyContext.activeGroup.getTransaction().type).toBytes().asAlgoTs()
  },

  /**
   * Transaction type as integer
   */
  get typeEnum(): uint64 {
    return asUint64(lazyContext.activeGroup.getTransaction().type)
  },

  /**
   * Asset ID
   */
  get xferAsset(): Asset {
    return lazyContext.activeGroup.getAssetTransferTransaction().xferAsset
  },

  /**
   * value in Asset's units
   */
  get assetAmount(): uint64 {
    return lazyContext.activeGroup.getAssetTransferTransaction().assetAmount
  },

  /**
   * 32 byte address. Source of assets if Sender is the Asset's Clawback address.
   */
  get assetSender(): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction().assetSender
  },

  /**
   * 32 byte address
   */
  get assetReceiver(): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction().assetReceiver
  },

  /**
   * 32 byte address
   */
  get assetCloseTo(): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction().assetCloseTo
  },

  /**
   * Position of this transaction within an atomic transaction group. A stand-alone transaction is implicitly element 0 in a group of 1
   */
  get groupIndex(): uint64 {
    return lazyContext.activeGroup.getTransaction().groupIndex
  },

  /**
   * The computed ID for this transaction. 32 bytes.
   */
  get txId(): bytes<32> {
    return lazyContext.activeGroup.getTransaction().txnId
  },

  /**
   * ApplicationID from ApplicationCall transaction
   */
  get applicationId(): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction().appId
  },

  /**
   * ApplicationCall transaction on completion action
   */
  get onCompletion(): uint64 {
    const onCompletion = lazyContext.activeGroup.getApplicationCallTransaction().onCompletion
    return asUint64(onCompletion)
  },

  /**
   * Arguments passed to the application in the ApplicationCall transaction
   */
  applicationArgs(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().appArgs(asUint64(a))
  },

  /**
   * Number of ApplicationArgs
   */
  get numAppArgs(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numAppArgs
  },

  /**
   * Accounts listed in the ApplicationCall transaction
   */
  accounts(a: StubUint64Compat): Account {
    return lazyContext.activeGroup.getApplicationCallTransaction().accounts(asUint64(a))
  },

  /**
   * Number of Accounts
   */
  get numAccounts(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numAccounts
  },

  /**
   * Approval program
   */
  get approvalProgram(): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().approvalProgram
  },

  /**
   * Clear state program
   */
  get clearStateProgram(): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().clearStateProgram
  },

  /**
   * 32 byte Sender's new AuthAddr
   */
  get rekeyTo(): Account {
    return lazyContext.activeGroup.getTransaction().rekeyTo
  },

  /**
   * Asset ID in asset config transaction
   */
  get configAsset(): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction().configAsset
  },

  /**
   * Total number of units of this asset created
   */
  get configAssetTotal(): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction().total
  },

  /**
   * Number of digits to display after the decimal place when displaying the asset
   */
  get configAssetDecimals(): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction().decimals
  },

  /**
   * Whether the asset's slots are frozen by default or not, 0 or 1
   */
  get configAssetDefaultFrozen(): boolean {
    return lazyContext.activeGroup.getAssetConfigTransaction().defaultFrozen
  },

  /**
   * Unit name of the asset
   */
  get configAssetUnitName(): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction().unitName
  },

  /**
   * The asset name
   */
  get configAssetName(): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction().assetName
  },

  /**
   * URL
   */
  get configAssetUrl(): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction().url
  },

  /**
   * 32 byte commitment to unspecified asset metadata
   */
  get configAssetMetadataHash(): bytes<32> {
    return lazyContext.activeGroup.getAssetConfigTransaction().metadataHash
  },

  /**
   * 32 byte address
   */
  get configAssetManager(): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction().manager
  },

  /**
   * 32 byte address
   */
  get configAssetReserve(): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction().reserve
  },

  /**
   * 32 byte address
   */
  get configAssetFreeze(): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction().freeze
  },

  /**
   * 32 byte address
   */
  get configAssetClawback(): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction().clawback
  },

  /**
   * Asset ID being frozen or un-frozen
   */
  get freezeAsset(): Asset {
    return lazyContext.activeGroup.getAssetFreezeTransaction().freezeAsset
  },

  /**
   * 32 byte address of the account whose asset slot is being frozen or un-frozen
   */
  get freezeAssetAccount(): Account {
    return lazyContext.activeGroup.getAssetFreezeTransaction().freezeAccount
  },

  /**
   * The new frozen value, 0 or 1
   */
  get freezeAssetFrozen(): boolean {
    return lazyContext.activeGroup.getAssetFreezeTransaction().frozen
  },

  /**
   * Foreign Assets listed in the ApplicationCall transaction
   */
  assets(a: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getApplicationCallTransaction().assets(asUint64(a))
  },

  /**
   * Number of Assets
   */
  get numAssets(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numAssets
  },

  /**
   * Foreign Apps listed in the ApplicationCall transaction
   */
  applications(a: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction().apps(asUint64(a))
  },

  /**
   * Number of Applications
   */
  get numApplications(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numApps
  },

  /**
   * Number of global state integers in ApplicationCall
   */
  get globalNumUint(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().globalNumUint
  },

  /**
   * Number of global state byteslices in ApplicationCall
   */
  get globalNumByteSlice(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().globalNumBytes
  },

  /**
   * Number of local state integers in ApplicationCall
   */
  get localNumUint(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().localNumUint
  },

  /**
   * Number of local state byteslices in ApplicationCall
   */
  get localNumByteSlice(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().localNumBytes
  },

  /**
   * Number of additional pages for each of the application's approval and clear state programs. An ExtraProgramPages of 1 means 2048 more total bytes, or 1024 for each program.
   */
  get extraProgramPages(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().extraProgramPages
  },

  /**
   * Marks an account nonparticipating for rewards
   */
  get nonparticipation(): boolean {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().nonparticipation
  },

  /**
   * Log messages emitted by an application call (only with `itxn` in v5). Application mode only
   */
  logs(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().logs(asUint64(a))
  },

  /**
   * Number of Logs (only with `itxn` in v5). Application mode only
   */
  get numLogs(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numLogs
  },

  /**
   * Asset ID allocated by the creation of an ASA (only with `itxn` in v5). Application mode only
   */
  get createdAssetId(): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction().createdAsset
  },

  /**
   * ApplicationID allocated by the creation of an application (only with `itxn` in v5). Application mode only
   */
  get createdApplicationId(): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction().createdApp
  },

  /**
   * The last message emitted. Empty bytes if none were emitted. Application mode only
   */
  get lastLog(): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().lastLog
  },

  /**
   * 64 byte state proof public key
   */
  get stateProofPk(): bytes {
    return lazyContext.activeGroup.getKeyRegistrationTransaction().stateProofKey
  },

  /**
   * Approval Program as an array of pages
   */
  approvalProgramPages(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().approvalProgramPages(asUint64(a))
  },

  /**
   * Number of Approval Program pages
   */
  get numApprovalProgramPages(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numApprovalProgramPages
  },

  /**
   * ClearState Program as an array of pages
   */
  clearStateProgramPages(a: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction().clearStateProgramPages(asUint64(a))
  },

  /**
   * Number of ClearState Program pages
   */
  get numClearStateProgramPages(): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction().numClearStateProgramPages
  },
}
