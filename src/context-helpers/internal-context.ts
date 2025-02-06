import type { Account } from '@algorandfoundation/algorand-typescript'
import { InternalError } from '../errors'
import { BaseContract } from '../impl/base-contract'
import type { StubUint64Compat } from '../impl/primitives'
import { Uint64Cls } from '../impl/primitives'
import type { AccountData, ApplicationData, AssetData } from '../impl/reference'
import type { VoterData } from '../impl/voter-params'
import type { TransactionGroup } from '../subcontexts/transaction-context'
import type { TestExecutionContext } from '../test-execution-context'
import { ContextManager } from './context-manager'

/**
 * For accessing implementation specific functions, with a convenient single entry
 * point for other modules to import Also allows for a single place to check and
 * provide.
 */
class InternalContext {
  get value() {
    return ContextManager.instance as TestExecutionContext
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
      throw new InternalError('Unknown account, check correct testing context is active')
    }
    return data
  }

  getAssetData(id: StubUint64Compat): AssetData {
    const key = Uint64Cls.fromCompat(id)
    const data = this.ledger.assetDataMap.get(key.asBigInt())
    if (!data) {
      throw new InternalError('Unknown asset, check correct testing context is active')
    }
    return data
  }

  getApplicationData(id: StubUint64Compat | BaseContract): ApplicationData {
    const uint64Id = id instanceof BaseContract ? this.ledger.getApplicationForContract(id).id : Uint64Cls.fromCompat(id)
    const data = this.ledger.applicationDataMap.get(uint64Id)
    if (!data) {
      throw new InternalError('Unknown application, check correct testing context is active')
    }
    return data
  }

  getVoterData(account: Account): VoterData {
    const data = this.ledger.voterDataMap.get(account)
    if (!data) {
      throw new InternalError('Unknown voter, check correct testing context is active')
    }
    return data
  }
}

export const lazyContext = new InternalContext()
