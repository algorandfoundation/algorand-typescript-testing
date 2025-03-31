import type { Account, Application, Asset, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { OnCompleteAction } from '@algorandfoundation/algorand-typescript'
import { lazyContext } from '../context-helpers/internal-context'
import { asUint64, asUint64Cls } from '../util'
import type { StubUint64Compat } from './primitives'

export const GTxn: typeof op.GTxn = {
  sender(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getTransaction(t).sender
  },
  fee(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(t).fee
  },
  firstValid(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(t).firstValid
  },
  firstValidTime(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(t).firstValidTime
  },
  lastValid(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(t).lastValid
  },
  note(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getTransaction(t).note
  },
  lease(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getTransaction(t).lease
  },
  receiver(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getPaymentTransaction(t).receiver
  },
  amount(t: uint64): uint64 {
    return lazyContext.activeGroup.getPaymentTransaction(t).amount
  },
  closeRemainderTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getPaymentTransaction(t).closeRemainderTo
  },
  votePk(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).voteKey
  },
  selectionPk(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).selectionKey
  },
  voteFirst(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).voteFirst
  },
  voteLast(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).voteLast
  },
  voteKeyDilution(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).voteKeyDilution
  },
  type(t: StubUint64Compat): bytes {
    return asUint64Cls(lazyContext.activeGroup.getTransaction(t).type).toBytes().asAlgoTs()
  },
  typeEnum(t: uint64): uint64 {
    return asUint64(lazyContext.activeGroup.getTransaction(t).type)
  },
  xferAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetTransferTransaction(t).xferAsset
  },
  assetAmount(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetTransferTransaction(t).assetAmount
  },
  assetSender(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(t).assetSender
  },
  assetReceiver(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(t).assetReceiver
  },
  assetCloseTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetTransferTransaction(t).assetCloseTo
  },
  groupIndex(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getTransaction(t).groupIndex
  },
  txId(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getTransaction(t).txnId
  },
  applicationId(t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationTransaction(t).appId
  },
  onCompletion(t: StubUint64Compat): uint64 {
    const onCompletionStr = lazyContext.activeGroup.getApplicationTransaction(t).onCompletion
    return asUint64(OnCompleteAction[onCompletionStr])
  },
  applicationArgs(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(a).appArgs(asUint64(b))
  },
  numAppArgs(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numAppArgs
  },
  accounts(a: StubUint64Compat, b: StubUint64Compat): Account {
    return lazyContext.activeGroup.getApplicationTransaction(a).accounts(asUint64(b))
  },
  numAccounts(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numAccounts
  },
  approvalProgram(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(t).approvalProgram
  },
  clearStateProgram(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(t).clearStateProgram
  },
  rekeyTo(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getTransaction(t).rekeyTo
  },
  configAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).configAsset
  },
  configAssetTotal(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).total
  },
  configAssetDecimals(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).decimals
  },
  configAssetDefaultFrozen(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).defaultFrozen
  },
  configAssetUnitName(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).unitName
  },
  configAssetName(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).assetName
  },
  configAssetUrl(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).url
  },
  configAssetMetadataHash(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).metadataHash
  },
  configAssetManager(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).manager
  },
  configAssetReserve(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).reserve
  },
  configAssetFreeze(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).freeze
  },
  configAssetClawback(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).clawback
  },
  freezeAsset(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetFreezeTransaction(t).freezeAsset
  },
  freezeAssetAccount(t: StubUint64Compat): Account {
    return lazyContext.activeGroup.getAssetFreezeTransaction(t).freezeAccount
  },
  freezeAssetFrozen(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getAssetFreezeTransaction(t).frozen
  },
  assets(a: StubUint64Compat, b: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getApplicationTransaction(a).assets(asUint64(b))
  },
  numAssets(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numAssets
  },
  applications(a: StubUint64Compat, b: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationTransaction(a).apps(asUint64(b))
  },
  numApplications(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numApps
  },
  globalNumUint(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).globalNumUint
  },
  globalNumByteSlice(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).globalNumBytes
  },
  localNumUint(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).localNumUint
  },
  localNumByteSlice(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).localNumBytes
  },
  extraProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).extraProgramPages
  },
  nonparticipation(t: StubUint64Compat): boolean {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).nonparticipation
  },
  logs(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(a).logs(asUint64(b))
  },
  numLogs(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numLogs
  },
  createdAssetId(t: StubUint64Compat): Asset {
    return lazyContext.activeGroup.getAssetConfigTransaction(t).createdAsset
  },
  createdApplicationId(t: StubUint64Compat): Application {
    return lazyContext.activeGroup.getApplicationTransaction(t).createdApp
  },
  lastLog(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(t).lastLog
  },
  stateProofPk(t: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getKeyRegistrationTransaction(t).stateProofKey
  },
  approvalProgramPages(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(a).approvalProgramPages(asUint64(b))
  },
  numApprovalProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numApprovalProgramPages
  },
  clearStateProgramPages(a: StubUint64Compat, b: StubUint64Compat): bytes {
    return lazyContext.activeGroup.getApplicationTransaction(a).clearStateProgramPages(asUint64(b))
  },
  numClearStateProgramPages(t: StubUint64Compat): uint64 {
    return lazyContext.activeGroup.getApplicationTransaction(t).numClearStateProgramPages
  },
}

export const Transaction = (index: uint64) => lazyContext.txn.activeGroup.getTransaction(index)
export const PaymentTxn = (index: uint64) => lazyContext.txn.activeGroup.getPaymentTransaction(index)
export const KeyRegistrationTxn = (index: uint64) => lazyContext.txn.activeGroup.getKeyRegistrationTransaction(index)
export const AssetConfigTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetConfigTransaction(index)
export const AssetTransferTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetTransferTransaction(index)
export const AssetFreezeTxn = (index: uint64) => lazyContext.txn.activeGroup.getAssetFreezeTransaction(index)
export const ApplicationTxn = (index: uint64) => lazyContext.txn.activeGroup.getApplicationTransaction(index)
