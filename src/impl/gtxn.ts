import type { Account, Application, Asset, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asUint64, asUint64Cls } from '../util'
import type { StubUint64Compat } from './primitives'

/** @internal */
export const GTxn: typeof op.GTxn = {
  sender(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).sender
  },
  fee(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).fee
  },
  firstValid(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).firstValid
  },
  firstValidTime(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).firstValidTime
  },
  lastValid(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).lastValid
  },
  note(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).note
  },
  lease(t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).lease
  },
  receiver(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getPaymentTransaction(asUint64(t)).receiver
  },
  amount(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getPaymentTransaction(asUint64(t)).amount
  },
  closeRemainderTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getPaymentTransaction(asUint64(t)).closeRemainderTo
  },
  votePk(t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).voteKey
  },
  selectionPk(t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).selectionKey
  },
  voteFirst(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).voteFirst
  },
  voteLast(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).voteLast
  },
  voteKeyDilution(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).voteKeyDilution
  },
  type(t: StubUint64Compat): bytes {
    return asUint64Cls(lazyContext.activeGroup.getTransaction(asUint64(t)).type)
      .toBytes()
      .asAlgoTs()
  },
  typeEnum(t: StubUint64Compat): uint64 {
    return asUint64(lazyContext.activeGroup.getTransaction(asUint64(t)).type)
  },
  xferAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetTransferTransaction(asUint64(t)).xferAsset
  },
  assetAmount(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetTransferTransaction(asUint64(t)).assetAmount
  },
  assetSender(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(asUint64(t)).assetSender
  },
  assetReceiver(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(asUint64(t)).assetReceiver
  },
  assetCloseTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(asUint64(t)).assetCloseTo
  },
  groupIndex(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).groupIndex
  },
  txId(t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).txnId
  },
  applicationId(t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).appId
  },
  onCompletion(t: StubUint64Compat): uint64 {
    const onCompletion = lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).onCompletion
    return asUint64(onCompletion)
  },
  applicationArgs(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).appArgs(asUint64(b))
  },
  numAppArgs(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numAppArgs
  },
  accounts(a: StubUint64Compat, b: StubUint64Compat): Account {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).accounts(asUint64(b))
  },
  numAccounts(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numAccounts
  },
  approvalProgram(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).approvalProgram
  },
  clearStateProgram(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).clearStateProgram
  },
  rekeyTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getTransaction(asUint64(t)).rekeyTo
  },
  configAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).configAsset
  },
  configAssetTotal(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).total
  },
  configAssetDecimals(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).decimals
  },
  configAssetDefaultFrozen(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).defaultFrozen
  },
  configAssetUnitName(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).unitName
  },
  configAssetName(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).assetName
  },
  configAssetUrl(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).url
  },
  configAssetMetadataHash(t: StubUint64Compat): bytes<32> {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).metadataHash
  },
  configAssetManager(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).manager
  },
  configAssetReserve(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).reserve
  },
  configAssetFreeze(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).freeze
  },
  configAssetClawback(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).clawback
  },
  freezeAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetFreezeTransaction(asUint64(t)).freezeAsset
  },
  freezeAssetAccount(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetFreezeTransaction(asUint64(t)).freezeAccount
  },
  freezeAssetFrozen(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getAssetFreezeTransaction(asUint64(t)).frozen
  },
  assets(a: StubUint64Compat, b: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).assets(asUint64(b))
  },
  numAssets(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numAssets
  },
  applications(a: StubUint64Compat, b: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).apps(asUint64(b))
  },
  numApplications(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numApps
  },
  globalNumUint(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).globalNumUint
  },
  globalNumByteSlice(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).globalNumBytes
  },
  localNumUint(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).localNumUint
  },
  localNumByteSlice(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).localNumBytes
  },
  extraProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).extraProgramPages
  },
  nonparticipation(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).nonparticipation
  },
  logs(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).logs(asUint64(b))
  },
  numLogs(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numLogs
  },
  createdAssetId(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction(asUint64(t)).createdAsset
  },
  createdApplicationId(t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).createdApp
  },
  lastLog(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).lastLog
  },
  stateProofPk(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(asUint64(t)).stateProofKey
  },
  approvalProgramPages(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).approvalProgramPages(asUint64(b))
  },
  numApprovalProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numApprovalProgramPages
  },
  clearStateProgramPages(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(a)).clearStateProgramPages(asUint64(b))
  },
  numClearStateProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationCallTransaction(asUint64(t)).numClearStateProgramPages
  },
}

/** @internal */
export const Transaction = (index: uint64) => lazyContext.txn.activeGroup.getTransaction(index)
/** @internal */
export const PaymentTxn = (index: uint64) => lazyContext.txn.activeGroup.getPaymentTransaction(index)
/** @internal */
export const KeyRegistrationTxn = (index: uint64) => lazyContext.txn.activeGroup.getKeyRegistrationTransaction(index)
/** @internal */
export const AssetConfigTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetConfigTransaction(index)
/** @internal */
export const AssetTransferTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetTransferTransaction(index)
/** @internal */
export const AssetFreezeTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetFreezeTransaction(index)
/** @internal */
export const ApplicationCallTxn = (index: uint64) => lazyContext.txn.activeGroup.getApplicationCallTransaction(index)
