import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  bytes,
  LocalState,
  uint64,
} from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import js_sha512 from 'js-sha512'
import type { AccountMap } from '../collections/custom-key-map'
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
import { AvmError, InternalError } from '../errors'
import type { DeliberateAny, Mutable } from '../typescript-helpers'
import { asBigInt, asBytes, asUint64, asUint64Cls, asUint8Array, concatUint8Arrays } from '../util'
import { BytesBackedCls, Uint64BackedCls } from './base'
import type { StubUint64Compat } from './primitives'
import { Bytes, BytesCls, Uint64Cls } from './primitives'
import type { GlobalStateCls, LocalStateCls } from './state'

export class AssetHolding {
  balance: uint64
  frozen: boolean

  /** @internal */
  constructor(balance: StubUint64Compat, frozen: boolean) {
    this.balance = asUint64(balance)
    this.frozen = frozen
  }
}

export class AccountData {
  optedAssets = new Uint64Map<AssetHolding>()
  optedApplications = new Uint64Map<ApplicationType>()
  incentiveEligible = false
  lastProposed?: uint64
  lastHeartbeat?: uint64
  account: Mutable<Omit<AccountType, 'bytes' | 'isOptedIn'>>

  /** @internal */
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
      authAddress: Account(),
    }
  }
}

/** @internal */
export function Account(address?: bytes): AccountType {
  return new AccountCls(address)
}

/** @internal */
export class AccountCls extends BytesBackedCls implements AccountType {
  constructor(address?: bytes) {
    const addressBytes = address ?? ZERO_ADDRESS
    if (![32n, 36n].includes(asUint64Cls(addressBytes.length).valueOf())) {
      throw new AvmError('Address must be 32 bytes long, or 36 bytes including checksum')
    }
    super(addressBytes.slice(0, 32))
  }

  get bytes() {
    return super.bytes.toFixed({ length: 32 })
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
  get authAddress(): AccountType {
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

  isOptedIn(assetOrApp: AssetType | ApplicationType): boolean {
    if (assetOrApp instanceof AssetCls) {
      return this.data.optedAssets.has(assetOrApp.id)
    }
    if (assetOrApp instanceof ApplicationCls) {
      return this.data.optedApplications.has(asUint64Cls(assetOrApp.id).asBigInt())
    }
    throw new InternalError('Invalid argument type. Must be an `Asset` or `Application` instance.')
  }
}

export class ApplicationData {
  application: Mutable<Omit<ApplicationType, 'id' | 'address'>> & {
    appLogs: bytes[]
    globalStates: BytesMap<GlobalStateCls<unknown>>
    localStates: BytesMap<LocalState<unknown>>
    localStateMaps: BytesMap<AccountMap<LocalStateCls<unknown>>>
    boxes: BytesMap<Uint8Array>
    materialisedBoxes: BytesMap<DeliberateAny>
  }

  /** @internal */
  isCreating: boolean = false

  /** @internal */
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
      localStateMaps: new BytesMap(),
      boxes: new BytesMap(),
      materialisedBoxes: new BytesMap(),
      version: 0,
    }
  }
}

/** @internal */
export function Application(id?: uint64): ApplicationType {
  return new ApplicationCls(id)
}

/** @internal */
export class ApplicationCls extends Uint64BackedCls implements ApplicationType {
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
  get creator(): AccountType {
    return this.data.application.creator
  }
  get address(): AccountType {
    const result = getApplicationAddress(this.id)
    if (!lazyContext.ledger.accountDataMap.has(result)) {
      lazyContext.any.account({ address: result.bytes })
    }
    return result
  }
  get version(): uint64 {
    return this.data.application.version
  }
}

export type AssetData = Mutable<Omit<AssetType, 'id' | 'balance' | 'frozen'>>
/** @internal */
export const getDefaultAssetData = (): AssetData => ({
  total: lazyContext.any.uint64(),
  decimals: lazyContext.any.uint64(1, 6),
  defaultFrozen: false,
  unitName: lazyContext.any.bytes(4),
  name: lazyContext.any.bytes(32),
  url: lazyContext.any.bytes(10),
  metadataHash: lazyContext.any.bytes(32).toFixed({ length: 32 }),
  manager: Account(ZERO_ADDRESS),
  freeze: Account(ZERO_ADDRESS),
  clawback: Account(ZERO_ADDRESS),
  creator: lazyContext.defaultSender,
  reserve: Account(ZERO_ADDRESS),
})

/** @internal */
export function Asset(id?: uint64): AssetType {
  return new AssetCls(id)
}

/** @internal */
export class AssetCls extends Uint64BackedCls implements AssetType {
  get id(): uint64 {
    return this.uint64
  }

  constructor(id?: StubUint64Compat) {
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
  get metadataHash(): bytes<32> {
    return this.data.metadataHash
  }
  get manager(): AccountType {
    return this.data.manager
  }
  get reserve(): AccountType {
    return this.data.reserve
  }
  get freeze(): AccountType {
    return this.data.freeze
  }
  get clawback(): AccountType {
    return this.data.clawback
  }
  get creator(): AccountType {
    return this.data.creator
  }
  balance(account: AccountType): uint64 {
    return this.getAssetHolding(account).balance
  }
  frozen(account: AccountType): boolean {
    return this.getAssetHolding(account).frozen
  }

  private getAssetHolding(account: AccountType): AssetHolding {
    const accountData = lazyContext.getAccountData(account)
    const assetHolding = accountData.optedAssets.get(this.id)
    if (assetHolding === undefined) {
      throw new InternalError(
        'The asset is not opted into the account! Use `ctx.any.account(opted_asset_balances={{ASSET_ID: VALUE}})` to set emulated opted asset into the account.',
      )
    }
    return assetHolding
  }
}

/** @internal */
export const checksumFromPublicKey = (pk: Uint8Array): Uint8Array => {
  return Uint8Array.from(js_sha512.sha512_256.array(pk).slice(HASH_BYTES_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH, HASH_BYTES_LENGTH))
}

/** @internal */
export const getApplicationAddress = (appId: StubUint64Compat): AccountType => {
  const toBeSigned = concatUint8Arrays(asUint8Array(APP_ID_PREFIX), encodingUtil.bigIntToUint8Array(asBigInt(appId), 8))
  const appIdHash = js_sha512.sha512_256.array(toBeSigned)
  const publicKey = Uint8Array.from(appIdHash)
  const address = encodeAddress(publicKey)
  return Account(Bytes.fromBase32(address))
}

/** @internal */
export const encodeAddress = (address: Uint8Array): string => {
  const checksum = checksumFromPublicKey(address)
  return encodingUtil.uint8ArrayToBase32(concatUint8Arrays(address, checksum)).slice(0, ALGORAND_ADDRESS_LENGTH)
}

/** @internal */
export const decodePublicKey = (address: string): Uint8Array => {
  const decoded = encodingUtil.base32ToUint8Array(address)
  return decoded.slice(0, ALGORAND_ADDRESS_BYTE_LENGTH - ALGORAND_CHECKSUM_BYTE_LENGTH)
}

/** @internal */
export const asAccount = (val: AccountType | bytes | string | undefined): AccountType | undefined => {
  return val instanceof AccountCls
    ? val
    : typeof val === 'string'
      ? Account(asBytes(val))
      : val instanceof BytesCls
        ? Account(val.asAlgoTs())
        : undefined
}

/** @internal */
export const asAsset = (val: AssetType | uint64 | undefined): AssetType | undefined => {
  return val instanceof Uint64Cls ? Asset(val.asAlgoTs()) : val instanceof AssetCls ? val : undefined
}

/** @internal */
export const asApplication = (val: ApplicationType | uint64 | undefined): ApplicationType | undefined => {
  return val instanceof Uint64Cls ? Application(val.asAlgoTs()) : val instanceof ApplicationCls ? val : undefined
}
