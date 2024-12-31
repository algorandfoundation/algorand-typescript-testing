import { Account, BaseContract, internal } from '@algorandfoundation/algorand-typescript'
import { AccountData, ApplicationData, AssetData } from '../impl/reference'
import { VoterData } from '../impl/voter-params'
import { TransactionGroup } from '../subcontexts/transaction-context'
import { TestExecutionContext } from '../test-execution-context'

/**
 * For accessing implementation specific functions, with a convenient single entry
 * point for other modules to import Also allows for a single place to check and
 * provide.
 */
class InternalContext {
  get value() {
    return internal.ctxMgr.instance as TestExecutionContext
  }

  get defaultSender() {
    return this.value.defaultSender
  }

  get ledger() {
    return this.value.ledger
  }

  get txn() {
    return this.value.txn
  }

  get contract() {
    return this.value.contract
  }

  get any() {
    return this.value.any
  }

  get activeApplication() {
    return this.ledger.getApplication(this.activeGroup.activeApplicationId)
  }

  get activeGroup(): TransactionGroup {
    return this.value.txn.activeGroup
  }

  getAccountData(account: Account): AccountData {
    const data = this.ledger.accountDataMap.get(account)
    if (!data) {
      throw internal.errors.internalError('Unknown account, check correct testing context is active')
    }
    return data
  }

  getAssetData(id: internal.primitives.StubUint64Compat): AssetData {
    const key = internal.primitives.Uint64Cls.fromCompat(id)
    const data = this.ledger.assetDataMap.get(key.asBigInt())
    if (!data) {
      throw internal.errors.internalError('Unknown asset, check correct testing context is active')
    }
    return data
  }

  getApplicationData(id: internal.primitives.StubUint64Compat | BaseContract): ApplicationData {
    const uint64Id =
      id instanceof BaseContract ? this.ledger.getApplicationForContract(id).id : internal.primitives.Uint64Cls.fromCompat(id)
    const data = this.ledger.applicationDataMap.get(uint64Id)
    if (!data) {
      throw internal.errors.internalError('Unknown application, check correct testing context is active')
    }
    return data
  }

  getVoterData(account: Account): VoterData {
    const data = this.ledger.voterDataMap.get(account)
    if (!data) {
      throw internal.errors.internalError('Unknown voter, check correct testing context is active')
    }
    return data
  }
}

export const lazyContext = new InternalContext()
