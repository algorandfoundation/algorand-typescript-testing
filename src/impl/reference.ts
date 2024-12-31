import { Account, Application, Asset, bytes, Bytes, internal, LocalState, uint64 } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import { sha512_256 as js_sha512_256 } from 'js-sha512'
import { BytesMap, Uint64Map } from '../collections/custom-key-map'
import {
  ALGORAND_ADDRESS_BYTE_LENGTH,
  ALGORAND_ADDRESS_LENGTH,
  ALGORAND_CHECKSUM_BYTE_LENGTH,
  ALWAYS_APPROVE_TEAL_PROGRAM,
  APP_ID_PREFIX,
  DEFAULT_ACCOUNT_MIN_BALANCE,
  HASH_BYTES_LENGTH,
  ZERO_ADDRESS,
} from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { Mutable } from '../typescript-helpers'
import { asBigInt, asUint64, asUint64Cls, asUint8Array, conactUint8Arrays } from '../util'
import { BytesBackedCls, Uint64BackedCls } from './base'
import { GlobalStateCls } from './state'

export class AssetHolding {
  balance: uint64
  frozen: boolean
  constructor(balance: internal.primitives.StubUint64Compat, frozen: boolean) {
    this.balance = asUint64(balance)
    this.frozen = frozen
  }
}

export class AccountData {
  optedAssets = new Uint64Map<AssetHolding>()
  optedApplications = new Uint64Map<Application>()
  incentiveEligible = false
  lastProposed?: uint64
  lastHeartbeat?: uint64
  account: Mutable<Omit<Account, 'bytes' | 'isOptedIn'>>

  constructor() {
    this.account = {
      totalAppsCreated: 0,
      totalAppsOptedIn: 0,
      totalAssets: 0,
      totalAssetsCreated: 0,
      totalBoxBytes: 0,
      totalBoxes: 0,
      totalExtraAppPages: 0,
      totalNumByteSlice: 0,
      totalNumUint: 0,
      minBalance: DEFAULT_ACCOUNT_MIN_BALANCE,
      balance: 0,
      authAddress: AccountImpl(),
    }
  }
}

export function AccountImpl(address?: bytes): Account {
  return new AccountCls(address)
}

export class AccountCls extends BytesBackedCls implements Account {
  constructor(address?: bytes) {
    const addressBytes = address ?? ZERO_ADDRESS
    if (![32n, 36n].includes(asUint64Cls(addressBytes.length).valueOf())) {
      throw new internal.errors.AvmError('Address must be 32 bytes long, or 36 bytes including checksum')
    }
    super(addressBytes.slice(0, 32))
  }

  private get data(): AccountData {
    return lazyContext.getAccountData(this)
  }

  get balance(): uint64 {
    return this.data.account.balance
  }
  get minBalance(): uint64 {
    return this.data.account.minBalance
  }
  get authAddress(): Account {
    return this.data.account.authAddress
  }
  get totalNumUint(): uint64 {
    return this.data.account.totalNumUint
  }
  get totalNumByteSlice(): uint64 {
    return this.data.account.totalNumByteSlice
  }
  get totalExtraAppPages(): uint64 {
    return this.data.account.totalExtraAppPages
  }
  get totalAppsCreated(): uint64 {
    return this.data.account.totalAppsCreated
  }
  get totalAppsOptedIn(): uint64 {
    return this.data.account.totalAppsOptedIn
  }
  get totalAssetsCreated(): uint64 {
    return this.data.account.totalAssetsCreated
  }
  get totalAssets(): uint64 {
    return this.data.account.totalAssets
  }
  get totalBoxes(): uint64 {
    return this.data.account.totalBoxes
  }
  get totalBoxBytes(): uint64 {
    return this.data.account.totalBoxBytes
  }

  isOptedIn(assetOrApp: Asset | Application): boolean {
    if (assetOrApp instanceof AssetCls) {
      return this.data.optedAssets.has(assetOrApp.id)
    }
    if (assetOrApp instanceof ApplicationCls) {
      return this.data.optedApplications.has(asUint64Cls(assetOrApp.id).asBigInt())
    }
    throw new internal.errors.InternalError('Invalid argument type. Must be an `Asset` or `Application` instance.')
  }
}

export class ApplicationData {
  application: Mutable<Omit<Application, 'id' | 'address'>> & {
    appLogs: bytes[]
    globalStates: BytesMap<GlobalStateCls<unknown>>
    localStates: BytesMap<LocalState<unknown>>
    boxes: BytesMap<Uint8Array>
  }
  isCreating: boolean = false

  get appLogs() {
    return this.application.appLogs
  }

  constructor() {
    this.application = {
      approvalProgram: ALWAYS_APPROVE_TEAL_PROGRAM,
      clearStateProgram: ALWAYS_APPROVE_TEAL_PROGRAM,
      globalNumUint: 0,
      globalNumBytes: 0,
      localNumUint: 0,
      localNumBytes: 0,
      extraProgramPages: 0,
      creator: lazyContext.defaultSender,
      appLogs: [],
      globalStates: new BytesMap(),
      localStates: new BytesMap(),
      boxes: new BytesMap(),
    }
  }
}

export function ApplicationImpl(applicationId?: uint64): Application {
  return new ApplicationCls(applicationId)
}

export class ApplicationCls extends Uint64BackedCls implements Application {
  get id() {
    return this.uint64
  }

  constructor(id?: uint64) {
    super(asUint64(id ?? 0))
  }

  private get data(): ApplicationData {
    return lazyContext.getApplicationData(this.id)
  }
  get approvalProgram(): bytes {
    return this.data.application.approvalProgram
  }
  get clearStateProgram(): bytes {
    return this.data.application.clearStateProgram
  }
  get globalNumUint(): uint64 {
    return this.data.application.globalNumUint
  }
  get globalNumBytes(): uint64 {
    return this.data.application.globalNumBytes
  }
  get localNumUint(): uint64 {
    return this.data.application.localNumUint
  }
  get localNumBytes(): uint64 {
    return this.data.application.localNumBytes
  }
  get extraProgramPages(): uint64 {
    return this.data.application.extraProgramPages
  }
  get creator(): Account {
    return this.data.application.creator
  }
  get address(): Account {
    return getApplicationAddress(this.id)
  }
}

export type AssetData = Mutable<Omit<Asset, 'id' | 'balance' | 'frozen'>>

export function AssetImpl(assetId?: uint64): Asset {
  return new AssetCls(assetId)
}
export class AssetCls extends Uint64BackedCls implements Asset {
  get id(): uint64 {
    return this.uint64
  }

  constructor(id?: internal.primitives.StubUint64Compat) {
    super(asUint64(id ?? 0))
  }

  private get data(): AssetData {
    return lazyContext.getAssetData(this.id)
  }

  get total(): uint64 {
    return this.data.total
  }
  get decimals(): uint64 {
    return this.data.decimals
  }
  get defaultFrozen(): boolean {
    return this.data.defaultFrozen
  }
  get unitName(): bytes {
    return this.data.unitName
  }
  get name(): bytes {
    return this.data.name
  }
  get url(): bytes {
    return this.data.url
  }
  get metadataHash(): bytes {
    return this.data.metadataHash
  }
  get manager(): Account {
    return this.data.manager
  }
  get reserve(): Account {
    return this.data.reserve
  }
  get freeze(): Account {
    return this.data.freeze
  }
  get clawback(): Account {
    return this.data.clawback
  }
  get creator(): Account {
    return this.data.creator
  }
  balance(account: Account): uint64 {
    return this.getAssetHolding(account).balance
  }
  frozen(account: Account): boolean {
    return this.getAssetHolding(account).frozen
  }

  private getAssetHolding(account: Account): AssetHolding {
    const accountData = lazyContext.getAccountData(account)
    const assetHolding = accountData.optedAssets.get(this.id)
    if (assetHolding === undefined) {
      internal.errors.internalError(
        'The asset is not opted into the account! Use `ctx.any.account(opted_asset_balances={{ASSET_ID: VALUE}})` to set emulated opted asset into the account.',
      )
    }
    return assetHolding
  }
}

export const checksumFromPublicKey = (pk: Uint8Array): Uint8Array => {
  return Uint8Array.from(js_sha512_256.array(pk).slice(HASH_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, HASH_BYTES_LENGTH))
}

export const getApplicationAddress = (appId: internal.primitives.StubUint64Compat): Account => {
  const toBeSigned = conactUint8Arrays(asUint8Array(APP_ID_PREFIX), encodingUtil.bigIntToUint8Array(asBigInt(appId), 8))
  const appIdHash = js_sha512_256.array(toBeSigned)
  const publicKey = Uint8Array.from(appIdHash)
  const address = encodeAddress(publicKey)
  return AccountImpl(Bytes.fromBase32(address))
}

export const encodeAddress = (address: Uint8Array): string => {
  const checksum = checksumFromPublicKey(address)
  return encodingUtil.uint8ArrayToBase32(conactUint8Arrays(address, checksum)).slice(0, ALGORAND_ADDRESS_LENGTH)
}

export const decodePublicKey = (address: string): Uint8Array => {
  const decoded = encodingUtil.base32ToUint8Array(address)
  return decoded.slice(0, ALGORAND_ADDRESS_BYTE_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH)
}
