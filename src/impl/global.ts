import type { Account as AccountType, Application as ApplicationType, bytes, op, uint64 } from '@algorandfoundation/algorand-typescript'
import { encodingUtil } from '@algorandfoundation/puya-ts'
import {
  DEFAULT_ACCOUNT_MIN_BALANCE,
  DEFAULT_ASSET_CREATE_MIN_BALANCE,
  DEFAULT_ASSET_OPT_IN_MIN_BALANCE,
  DEFAULT_GLOBAL_GENESIS_HASH,
  DEFAULT_MAX_TXN_LIFE,
  MIN_TXN_FEE,
  ZERO_ADDRESS,
} from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { getObjectReference } from '../util'
import { sha256 } from './crypto'
import { Bytes, Uint64 } from './primitives'
import { Account, getApplicationAddress } from './reference'

export class GlobalData {
  minTxnFee: uint64
  minBalance: uint64
  maxTxnLife: uint64
  zeroAddress: AccountType
  logicSigVersion?: uint64
  round?: uint64
  latestTimestamp?: uint64
  groupId?: bytes
  callerApplicationId: uint64
  assetCreateMinBalance: uint64
  assetOptInMinBalance: uint64
  genesisHash: bytes
  opcodeBudget?: uint64
  payoutsEnabled: boolean
  payoutsGoOnlineFee: uint64
  payoutsPercent: uint64
  payoutsMinBalance: uint64

  constructor() {
    this.minTxnFee = Uint64(MIN_TXN_FEE)
    this.minBalance = Uint64(DEFAULT_ACCOUNT_MIN_BALANCE)
    this.maxTxnLife = Uint64(DEFAULT_MAX_TXN_LIFE)
    this.zeroAddress = Account(ZERO_ADDRESS)
    this.callerApplicationId = Uint64(0)
    this.assetCreateMinBalance = Uint64(DEFAULT_ASSET_CREATE_MIN_BALANCE)
    this.assetOptInMinBalance = Uint64(DEFAULT_ASSET_OPT_IN_MIN_BALANCE)
    this.genesisHash = DEFAULT_GLOBAL_GENESIS_HASH
    this.payoutsEnabled = false
    this.payoutsGoOnlineFee = Uint64(0)
    this.payoutsPercent = Uint64(0)
    this.payoutsMinBalance = Uint64(0)
  }
}
const getGlobalData = (): GlobalData => {
  return lazyContext.ledger.globalData
}

const getMissingValueErrorMessage = (name: keyof GlobalData) =>
  `'Global' object has no value set for attribute named '${name}'. Use \`context.ledger.patchGlobalData({${name}: your_value})\` to set the value in your test setup."`

export const Global: typeof op.Global = {
  /**
   * microalgos
   */
  get minTxnFee(): uint64 {
    return getGlobalData().minTxnFee
  },

  /**
   * microalgos
   */
  get minBalance(): uint64 {
    return getGlobalData().minBalance
  },

  /**
   * rounds
   */
  get maxTxnLife(): uint64 {
    return getGlobalData().maxTxnLife
  },

  /**
   * 32 byte address of all zero bytes
   */
  get zeroAddress(): AccountType {
    return getGlobalData().zeroAddress
  },

  /**
   * Number of transactions in this atomic transaction group. At least 1
   */
  get groupSize(): uint64 {
    const currentTransactionGroup = lazyContext.activeGroup.transactions
    return Uint64(currentTransactionGroup.length)
  },

  /**
   * Maximum supported version
   */
  get logicSigVersion(): uint64 {
    const data = getGlobalData()
    if (data.logicSigVersion !== undefined) return data.logicSigVersion
    throw new InternalError(getMissingValueErrorMessage('logicSigVersion'))
  },

  /**
   * Current round number. ApplicationType mode only.
   */
  get round(): uint64 {
    const data = getGlobalData()
    if (data.round !== undefined) return data.round
    return Uint64(lazyContext.txn.groups.length + 1)
  },

  /**
   * Last confirmed block UNIX timestamp. Fails if negative. ApplicationType mode only.
   */
  get latestTimestamp(): uint64 {
    const data = getGlobalData()
    if (data.latestTimestamp !== undefined) return data.latestTimestamp
    return Uint64(lazyContext.activeGroup.latestTimestamp)
  },

  /**
   * ID of current application executing. ApplicationType mode only.
   */
  get currentApplicationId(): ApplicationType {
    return lazyContext.activeApplication
  },

  /**
   * Address of the creator of the current application. ApplicationType mode only.
   */
  get creatorAddress(): AccountType {
    const app = lazyContext.activeApplication
    return app.creator
  },

  /**
   * Address that the current application controls. ApplicationType mode only.
   */
  get currentApplicationAddress(): AccountType {
    return this.currentApplicationId.address
  },

  /**
   * ID of the transaction group. 32 zero bytes if the transaction is not part of a group.
   */
  get groupId(): bytes {
    const data = getGlobalData()
    if (data.groupId !== undefined) return data.groupId
    const reference = getObjectReference(lazyContext.activeGroup)
    const referenceBytes = Bytes(encodingUtil.bigIntToUint8Array(reference))
    return sha256(referenceBytes)
  },

  /**
   * The remaining cost that can be spent by opcodes in this program.
   */
  get opcodeBudget(): uint64 {
    const data = getGlobalData()
    if (data.opcodeBudget !== undefined) return data.opcodeBudget
    throw new InternalError(getMissingValueErrorMessage('opcodeBudget'))
  },

  /**
   * The application ID of the application that called this application. 0 if this application is at the top-level. ApplicationType mode only.
   */
  get callerApplicationId(): uint64 {
    return getGlobalData().callerApplicationId
  },

  /**
   * The application address of the application that called this application. ZeroAddress if this application is at the top-level. ApplicationType mode only.
   */
  get callerApplicationAddress(): AccountType {
    return getApplicationAddress(this.callerApplicationId)
  },

  /**
   * The additional minimum balance required to create (and opt-in to) an asset.
   */
  get assetCreateMinBalance(): uint64 {
    return getGlobalData().assetCreateMinBalance
  },

  /**
   * The additional minimum balance required to opt-in to an asset.
   */
  get assetOptInMinBalance(): uint64 {
    return getGlobalData().assetOptInMinBalance
  },

  /**
   * The Genesis Hash for the network.
   */
  get genesisHash(): bytes {
    return getGlobalData().genesisHash
  },

  /**
   * Whether block proposal payouts are enabled.
   * Min AVM version: 11
   */
  get payoutsEnabled(): boolean {
    return getGlobalData().payoutsEnabled
  },

  /**
   * The fee required in a keyreg transaction to make an account incentive eligible.
   * Min AVM version: 11
   */
  get payoutsGoOnlineFee(): uint64 {
    return getGlobalData().payoutsGoOnlineFee
  },

  /**
   * The percentage of transaction fees in a block that can be paid to the block proposer.
   * Min AVM version: 11
   */
  get payoutsPercent(): uint64 {
    return getGlobalData().payoutsPercent
  },

  /**
   * The minimum algo balance an account must have in the agreement round to receive block payouts in the proposal round.
   * Min AVM version: 11
   */
  get payoutsMinBalance(): uint64 {
    return getGlobalData().payoutsMinBalance
  },

  /**
   * The maximum algo balance an account can have in the agreement round to receive block payouts in the proposal round.
   * Min AVM version: 11
   */
  get payoutsMaxBalance(): uint64 {
    return getGlobalData().payoutsMinBalance
  },
}
