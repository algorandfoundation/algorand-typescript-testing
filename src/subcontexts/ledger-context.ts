import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  BaseContract,
  bytes,
  BytesCompat,
  LocalStateForAccount,
  uint64,
  Uint64Compat,
} from '@algorandfoundation/algorand-typescript'
import { AccountMap, Uint64Map } from '../collections/custom-key-map'
import { MAX_UINT64 } from '../constants'
import { InternalError } from '../errors'
import { BlockData } from '../impl/block'
import { toBytes } from '../impl/encoded-types'
import { GlobalData } from '../impl/global'
import { Uint64Cls } from '../impl/primitives'
import type { AssetData } from '../impl/reference'
import {
  AccountCls,
  AccountData,
  Application,
  ApplicationCls,
  ApplicationData,
  Asset,
  AssetHolding,
  getDefaultAssetData,
} from '../impl/reference'
import { GlobalStateCls, LocalStateCls } from '../impl/state'
import { VoterData } from '../impl/voter-params'
import type { PickPartial } from '../typescript-helpers'
import { asBigInt, asBytes, asMaybeBytesCls, asMaybeUint64Cls, asUint64, asUint64Cls, asUint8Array, iterBigInt } from '../util'

export class LedgerContext {
  /** @internal */
  appIdIter = iterBigInt(1001n, MAX_UINT64)
  /** @internal */
  assetIdIter = iterBigInt(1001n, MAX_UINT64)
  /** @internal */
  applicationDataMap = new Uint64Map<ApplicationData>()
  /** @internal */
  appIdContractMap = new Uint64Map<BaseContract>()
  /** @internal */
  accountDataMap = new AccountMap<AccountData>()
  /** @internal */
  assetDataMap = new Uint64Map<AssetData>()
  /** @internal */
  voterDataMap = new AccountMap<VoterData>()
  /** @internal */
  blocks = new Uint64Map<BlockData>()
  /** @internal */
  globalData = new GlobalData()
  onlineStake = 0

  /**
   * Adds a contract to the application ID contract map.
   * @internal
   * @param appId - The application ID.
   * @param contract - The contract to add.
   */
  addAppIdContractMap(appId: Uint64Compat, contract: BaseContract): void {
    this.appIdContractMap.set(appId, contract)
  }

  /**
   * Retrieves an account by address.
   * @param address - The account address.
   * @returns The account.
   */
  getAccount(address: AccountType | BytesCompat): AccountType {
    return new AccountCls(address instanceof AccountCls ? address.bytes : asBytes(address as BytesCompat))
  }

  /**
   * Retrieves an asset by asset ID.
   * @param assetId - The asset ID.
   * @returns The asset.
   * @throws If the asset is unknown.
   */
  getAsset(assetId: Uint64Compat): AssetType {
    if (this.assetDataMap.has(assetId)) {
      return Asset(asUint64(assetId))
    }
    throw new InternalError('Unknown asset, check correct testing context is active')
  }

  /**
   * Retrieves an application by application ID.
   * @param applicationId - The application ID.
   * @returns The application.
   * @throws If the application is unknown.
   */
  getApplication(applicationId: Uint64Compat): ApplicationType {
    if (this.applicationDataMap.has(applicationId)) {
      return Application(asUint64(applicationId))
    }
    throw new InternalError('Unknown application, check correct testing context is active')
  }

  /**
   * Retrieves an application for a given contract.
   * @param contract - The contract.
   * @returns The application.
   * @throws If the contract is unknown.
   */
  getApplicationForContract(contract: BaseContract): ApplicationType {
    for (const [appId, c] of this.appIdContractMap) {
      if (c === contract) {
        if (this.applicationDataMap.has(appId)) {
          return Application(asUint64(appId))
        }
      }
    }
    throw new InternalError('Unknown contract, check correct testing context is active')
  }

  /**
   * Retrieves an application for a given approval program.
   * @param approvalProgram - The approval program.
   * @returns The application or undefined if not found.
   */
  getApplicationForApprovalProgram(approvalProgram: bytes | readonly bytes[] | undefined): ApplicationType | undefined {
    if (approvalProgram === undefined) {
      return undefined
    }
    const entries = this.applicationDataMap.entries()
    let next = entries.next()
    let found = false
    while (!next.done && !found) {
      found = next.value[1].application.approvalProgram === approvalProgram
      if (!found) {
        next = entries.next()
      }
    }
    if (found && next?.value) {
      const appId = asUint64(next.value[0])
      if (this.applicationDataMap.has(appId)) {
        return Application(appId)
      }
    }
    return undefined
  }

  /**
   * Update asset holdings for account, only specified values will be updated.
   * AccountType will also be opted-in to asset
   * @param account
   * @param assetId
   * @param balance
   * @param frozen
   */
  updateAssetHolding(account: AccountType, assetId: Uint64Compat | AssetType, balance?: Uint64Compat, frozen?: boolean): void {
    const id = (asMaybeUint64Cls(assetId) ?? asUint64Cls((assetId as AssetType).id)).asAlgoTs()
    const accountData = this.accountDataMap.get(account)!
    const asset = this.assetDataMap.get(id)!
    const holding = accountData.optedAssets.get(id) ?? new AssetHolding(0n, asset.defaultFrozen)
    if (balance !== undefined) holding.balance = asUint64(balance)
    if (frozen !== undefined) holding.frozen = frozen
    accountData.optedAssets.set(id, holding)
  }

  /**
   * Patches global data with the provided partial data.
   * @param data - The partial global data.
   */
  patchGlobalData(data: Partial<GlobalData>) {
    this.globalData = {
      ...this.globalData,
      ...data,
    }
  }

  /**
   * Patches account data with the provided partial data.
   * @param account - The account.
   * @param data - The partial account data.
   */
  patchAccountData(account: AccountType, data: Partial<Omit<AccountData, 'account'>> & Partial<PickPartial<AccountData, 'account'>>): void {
    const accountData = this.accountDataMap.get(account) ?? new AccountData()
    this.accountDataMap.set(account, {
      ...accountData,
      ...data,
      account: {
        ...accountData.account,
        ...data.account,
      },
    })
  }

  /**
   * Patches application data with the provided partial data.
   * @param app - The application.
   * @param data - The partial application data.
   */
  patchApplicationData(
    app: ApplicationType,
    data: Partial<Omit<ApplicationData, 'application'>> & Partial<PickPartial<ApplicationData, 'application'>>,
  ): void {
    const applicationData = this.applicationDataMap.get(app.id) ?? new ApplicationData()
    this.applicationDataMap.set(app.id, {
      ...applicationData,
      ...data,
      application: {
        ...applicationData.application,
        ...data.application,
      },
    })
  }

  /**
   * Patches asset data with the provided partial data.
   * @param account - The asset.
   * @param data - The partial asset data.
   */
  patchAssetData(asset: AssetType, data: Partial<AssetData>) {
    const assetData = this.assetDataMap.get(asset.id) ?? getDefaultAssetData()
    this.assetDataMap.set(asset.id, {
      ...assetData,
      ...data,
    })
  }

  /**
   * Patches voter data with the provided partial data.
   * @param account - The account.
   * @param data - The partial voter data.
   */
  patchVoterData(account: AccountType, data: Partial<VoterData>) {
    const voterData = this.voterDataMap.get(account) ?? new VoterData()
    this.voterDataMap.set(account, {
      ...voterData,
      ...data,
    })
  }

  /**
   * Patches block data with the provided partial data.
   * @param index - The block index.
   * @param data - The partial block data.
   */
  patchBlockData(index: Uint64Compat, data: Partial<BlockData>): void {
    const i = asUint64(index)
    const blockData = this.blocks.get(i) ?? new BlockData()
    this.blocks.set(i, {
      ...blockData,
      ...data,
    })
  }

  /**
   * Retrieves block data by index.
   * @param index - The block index.
   * @returns The block data.
   * @throws If the block is not set.
   */
  getBlockData(index: Uint64Compat): BlockData {
    const i = asBigInt(index)
    if (this.blocks.has(i)) {
      return this.blocks.get(i)!
    }
    throw new InternalError(`Block ${i} not set`)
  }

  /**
   * Retrieves global state for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @returns The global state and a boolean indicating if it was found.
   */
  getGlobalState(app: ApplicationType | BaseContract, key: BytesCompat): [GlobalStateCls<unknown>, true] | [undefined, false] {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.get(appId)
    if (!appData?.application.globalStates.has(key)) {
      return [undefined, false]
    }
    return [appData.application.globalStates.getOrFail(key), true]
  }

  /**
   * Sets global state for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @param value - The value (optional).
   */
  setGlobalState(app: ApplicationType | BaseContract, key: BytesCompat, value: Uint64Compat | BytesCompat | undefined): void {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    const globalState = appData.application.globalStates.get(key)
    if (value === undefined) {
      globalState?.delete()
    } else if (globalState === undefined) {
      appData.application.globalStates.set(key, new GlobalStateCls(asBytes(key), asMaybeUint64Cls(value) ?? asMaybeBytesCls(value)))
    } else {
      globalState.value = asMaybeUint64Cls(value) ?? asMaybeBytesCls(value)
    }
  }

  /**
   * Retrieves local state for an application and account by key.
   * @param app - The application.
   * @param account - The account.
   * @param key - The key.
   * @returns The local state and a boolean indicating if it was found.
   */
  getLocalState(
    app: ApplicationType | BaseContract | uint64,
    account: AccountType,
    key: BytesCompat,
  ): [LocalStateForAccount<unknown>, true] | [undefined, false] {
    const appId = app instanceof Uint64Cls ? app.asAlgoTs() : this.getAppId(app as ApplicationType | BaseContract)
    const appData = this.applicationDataMap.get(appId)
    if (!appData?.application.localStates.has(key)) {
      return [undefined, false]
    }
    const localState = appData.application.localStateMaps.getOrFail(key)
    const accountLocalState = localState.get(account)
    return [accountLocalState as LocalStateForAccount<unknown>, true]
  }

  /**
   * Sets local state for an application and account by key.
   * @param app - The application.
   * @param account - The account.
   * @param key - The key.
   * @param value - The value (optional).
   */
  setLocalState<T>(app: ApplicationType | BaseContract | uint64, account: AccountType, key: BytesCompat, value: T | undefined): void {
    const appId = app instanceof Uint64Cls ? app.asAlgoTs() : this.getAppId(app as ApplicationType | BaseContract)
    const appData = this.applicationDataMap.getOrFail(appId)
    if (!appData.application.localStateMaps.has(key)) {
      appData.application.localStateMaps.set(key, new AccountMap())
    }
    const localState = appData.application.localStateMaps.getOrFail(key)
    if (!localState.has(account)) {
      localState.set(account, new LocalStateCls())
    }
    const accountLocalState = localState.getOrFail(account)
    if (value === undefined) {
      accountLocalState.delete()
    } else {
      accountLocalState.value = asMaybeUint64Cls(value) ?? asMaybeBytesCls(value)
    }
  }

  /**
   * Retrieves a box for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @returns The box data.
   */
  getBox(app: ApplicationType | BaseContract, key: BytesCompat): Uint8Array {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    const materialised = appData.application.materialisedBoxes.get(key)
    if (materialised !== undefined) {
      return asUint8Array(toBytes(materialised))
    }
    return appData.application.boxes.get(key) ?? new Uint8Array()
  }

  /**
   * Retrieves a materialised box for an application by key.
   * @internal
   * @param app - The application.
   * @param key - The key.
   * @returns The materialised box data if exists or undefined.
   */
  getMaterialisedBox<T>(app: ApplicationType | BaseContract, key: BytesCompat): T | undefined {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    return appData.application.materialisedBoxes.get(key) as T | undefined
  }

  /**
   * Sets a box for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @param value - The box data.
   */
  setBox(app: ApplicationType | BaseContract, key: BytesCompat, value: BytesCompat | Uint8Array): void {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    const uint8ArrayValue = value instanceof Uint8Array ? value : asUint8Array(value)
    appData.application.boxes.set(key, uint8ArrayValue)
    appData.application.materialisedBoxes.set(key, undefined)
  }

  /**

 * Cache the materialised box for an application by key.
* @internal
 * @param app - The application.
 * @param key - The key.
 * @param value - The box data.
 */
  setMaterialisedBox<TValue>(app: ApplicationType | BaseContract, key: BytesCompat, value: TValue | undefined): void {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    appData.application.materialisedBoxes.set(key, value)
  }

  /**
   * Deletes a box for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @returns True if the box was deleted, false otherwise.
   */
  deleteBox(app: ApplicationType | BaseContract, key: BytesCompat): boolean {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    appData.application.materialisedBoxes.delete(key)
    return appData.application.boxes.delete(key)
  }

  /**
   * Checks if a box exists for an application by key.
   * @param app - The application.
   * @param key - The key.
   * @returns True if the box exists, false otherwise.
   */
  boxExists(app: ApplicationType | BaseContract, key: BytesCompat): boolean {
    const appId = this.getAppId(app)
    const appData = this.applicationDataMap.getOrFail(appId)
    return appData.application.boxes.has(key)
  }

  /** @internal */
  private getAppId(app: ApplicationType | BaseContract): uint64 {
    return app instanceof ApplicationCls ? app.id : this.getApplicationForContract(app as BaseContract).id
  }
}
