import { Account, Application, Asset, BaseContract, internal } from '@algorandfoundation/algorand-typescript'
import { AccountMap } from '../collections/custom-key-map'
import { MAX_UINT64 } from '../constants'
import { AccountData, AssetHolding } from '../impl/account'
import { ApplicationData } from '../impl/application'
import { AssetData } from '../impl/asset'
import { GlobalData } from '../impl/global'
import { asBigInt, asBytes, asMaybeBytesCls, asMaybeUint64Cls, asUint64, asUint64Cls, iterBigInt } from '../util'

interface BlockData {
  seed: bigint
  timestamp: bigint
}

export class LedgerContext {
  appIdIter = iterBigInt(1001n, MAX_UINT64)
  assetIdIter = iterBigInt(1001n, MAX_UINT64)
  applicationDataMap = new Map<bigint, ApplicationData>()
  appIdContractMap = new Map<bigint, BaseContract>()
  accountDataMap = new AccountMap<AccountData>()
  assetDataMap = new Map<bigint, AssetData>()
  blocks = new Map<bigint, BlockData>()
  globalData = new GlobalData()

  addAppIdContractMap(appId: internal.primitives.StubUint64Compat, contract: BaseContract): void {
    this.appIdContractMap.set(asBigInt(appId), contract)
  }

  getAsset(assetId: internal.primitives.StubUint64Compat): Asset {
    const id = asBigInt(assetId)
    if (this.assetDataMap.has(id)) {
      return Asset(asUint64(id))
    }
    throw internal.errors.internalError('Unknown asset, check correct testing context is active')
  }

  getApplication(applicationId: internal.primitives.StubUint64Compat): Application {
    const id = asBigInt(applicationId)
    if (this.applicationDataMap.has(id)) {
      return Application(asUint64(id))
    }
    throw internal.errors.internalError('Unknown application, check correct testing context is active')
  }

  getApplicationForContract(contract: BaseContract): Application {
    for (const [appId, c] of this.appIdContractMap) {
      if (c === contract) {
        if (this.applicationDataMap.has(appId)) {
          return Application(asUint64(appId))
        }
      }
    }
    throw internal.errors.internalError('Unknown contract, check correct testing context is active')
  }

  /**
   * Update asset holdings for account, only specified values will be updated.
   * Account will also be opted-in to asset
   * @param account
   * @param assetId
   * @param balance
   * @param frozen
   */
  updateAssetHolding(
    account: Account,
    assetId: internal.primitives.StubUint64Compat | Asset,
    balance?: internal.primitives.StubUint64Compat,
    frozen?: boolean,
  ): void {
    const id = (asMaybeUint64Cls(assetId) ?? asUint64Cls((assetId as Asset).id)).asBigInt()
    const accountData = this.accountDataMap.get(account)!
    const asset = this.assetDataMap.get(id)!
    const holding = accountData.optedAssets.get(id) ?? new AssetHolding(0n, asset.defaultFrozen)
    if (balance !== undefined) holding.balance = asUint64(balance)
    if (frozen !== undefined) holding.frozen = frozen
    accountData.optedAssets.set(id, holding)
  }

  patchGlobalData(data: Partial<GlobalData>) {
    this.globalData = {
      ...this.globalData,
      ...data,
    }
  }

  setBlock(
    index: internal.primitives.StubUint64Compat,
    seed: internal.primitives.StubUint64Compat,
    timestamp: internal.primitives.StubUint64Compat,
  ): void {
    const i = asBigInt(index)
    const s = asBigInt(seed)
    const t = asBigInt(timestamp)

    this.blocks.set(i, { seed: s, timestamp: t })
  }

  getBlockContent(index: internal.primitives.StubUint64Compat): BlockData {
    const i = asBigInt(index)
    if (this.blocks.has(i)) {
      return this.blocks.get(i)!
    }
    throw internal.errors.internalError(`Block ${i} not set`)
  }

  getGlobalState(
    app: Application,
    key: internal.primitives.StubBytesCompat,
  ): [internal.state.GlobalStateCls<unknown> | undefined, boolean] {
    const appId = asBigInt(app.id)
    const keyBytes = asBytes(key)
    if (!this.applicationDataMap.has(appId)) {
      return [undefined, false]
    }
    const appData = this.applicationDataMap.get(appId)!
    if (!appData.application.globalStates.has(keyBytes)) {
      return [undefined, false]
    }
    return [appData.application.globalStates.get(keyBytes), true]
  }

  setGlobalState(
    app: Application,
    key: internal.primitives.StubBytesCompat,
    value: internal.primitives.StubUint64Compat | internal.primitives.StubBytesCompat | undefined,
  ): void {
    const appId = asBigInt(app.id)
    const keyBytes = asBytes(key)
    const appData = this.applicationDataMap.get(appId)!
    const globalState = appData.application.globalStates.get(keyBytes)!
    if (value === undefined) {
      globalState.delete()
    } else {
      globalState.value = asMaybeUint64Cls(value) ?? asMaybeBytesCls(value)
    }
  }
}
