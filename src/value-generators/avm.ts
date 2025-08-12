import type {
  Account as AccountType,
  Application as ApplicationType,
  Asset as AssetType,
  biguint,
  BigUintCompat,
  bytes,
  uint64,
  Uint64Compat,
} from '@algorandfoundation/algorand-typescript'
import { randomBytes } from 'crypto'
import { MAX_BYTES_SIZE, MAX_UINT512, MAX_UINT64 } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { InternalError } from '../errors'
import { BigUint, Bytes, Uint64 } from '../impl/primitives'
import type { AssetData } from '../impl/reference'
import { Account, AccountData, ApplicationCls, ApplicationData, AssetCls, getDefaultAssetData } from '../impl/reference'
import { asBigInt, asBigUintCls, asUint64, asUint64Cls, getRandomBigInt, getRandomBytes } from '../util'

type AccountContextData = Partial<AccountData['account']> & {
  address?: bytes
  incentiveEligible?: boolean
  lastProposed?: uint64
  lastHeartbeat?: uint64
  optedAssetBalances?: Map<Uint64Compat, Uint64Compat>
  optedApplications?: ApplicationType[]
}

type AssetContextData = Partial<AssetData> & { assetId?: Uint64Compat }

type ApplicationContextData = Partial<ApplicationData['application']> & { applicationId?: Uint64Compat }

export class AvmValueGenerator {
  /**
   * Generates a random uint64 value within the specified range.
   * @param {Uint64Compat} [minValue=0n] - The minimum value (inclusive).
   * @param {Uint64Compat} [maxValue=MAX_UINT64] - The maximum value (inclusive).
   * @returns {uint64} - A random uint64 value.
   */
  uint64(minValue: Uint64Compat = 0n, maxValue: Uint64Compat = MAX_UINT64): uint64 {
    const min = asBigInt(minValue)
    const max = asBigInt(maxValue)
    if (max > MAX_UINT64) {
      throw new InternalError('maxValue must be less than or equal to 2n ** 64n - 1n')
    }
    if (min > max) {
      throw new InternalError('minValue must be less than or equal to maxValue')
    }
    if (min < 0n || max < 0n) {
      throw new InternalError('minValue and maxValue must be greater than or equal to 0')
    }
    return Uint64(getRandomBigInt(min, max))
  }

  /**
   * Generates a random biguint value within the specified range.
   * @param {BigUintCompat} [minValue=0n] - The minimum value (inclusive).
   * @returns {biguint} - A random biguint value.
   */
  biguint(minValue: BigUintCompat = 0n): biguint {
    const min = asBigUintCls(minValue).asBigInt()
    if (min < 0n) {
      throw new InternalError('minValue must be greater than or equal to 0')
    }

    return BigUint(getRandomBigInt(min, MAX_UINT512))
  }

  /**
   * Generates a random bytes of the specified length.
   * @param {number} [length=MAX_BYTES_SIZE] - The length of the bytes.
   * @returns {bytes} - A random bytes.
   */
  bytes(length = MAX_BYTES_SIZE): bytes {
    return Bytes(new Uint8Array(randomBytes(length)))
  }

  /**
   * Generates a random string of the specified length.
   * @param {number} [length=11] - The length of the string.
   * @returns {string} - A random string.
   */
  string(length = 11): string {
    const setLength = 11
    return Array(Math.ceil(length / setLength))
      .fill(0)
      .map(() => Math.random().toString(36).substring(2))
      .join('')
      .substring(0, length)
  }

  /**
   * Generates a random account with the specified context data.
   * @param {AccountContextData} [input] - The context data for the account.
   * @returns {Account} - A random account.
   */
  account(input?: AccountContextData): AccountType {
    const account = input?.address ? Account(input.address) : Account(getRandomBytes(32).asAlgoTs())

    if (input?.address && lazyContext.ledger.accountDataMap.has(account)) {
      throw new InternalError(
        'Account with such address already exists in testing context. Use `context.ledger.getAccount(address)` to retrieve the existing account.',
      )
    }

    const data = new AccountData()
    const { address, optedAssetBalances, optedApplications, incentiveEligible, lastProposed, lastHeartbeat, ...accountData } = input ?? {}
    data.incentiveEligible = incentiveEligible ?? false
    data.lastProposed = lastProposed
    data.lastHeartbeat = lastHeartbeat
    data.account = {
      ...data.account,
      ...accountData,
    }
    lazyContext.ledger.accountDataMap.set(account, data)

    if (input?.optedAssetBalances) {
      for (const [assetId, balance] of input.optedAssetBalances) {
        lazyContext.ledger.updateAssetHolding(account, assetId, balance)
      }
    }
    if (input?.optedApplications) {
      for (const app of input.optedApplications) {
        data.optedApplications.set(asBigInt(app.id), app)
      }
    }
    return account
  }

  /**
   * Generates a random asset with the specified context data.
   * @param {AssetContextData} [input] - The context data for the asset.
   * @returns {Asset} - A random asset.
   */
  asset(input?: AssetContextData): AssetType {
    const id = input?.assetId
    if (id && lazyContext.ledger.assetDataMap.has(asUint64(id))) {
      throw new InternalError('Asset with such ID already exists in testing context!')
    }
    const assetId = asUint64Cls(id ?? lazyContext.ledger.assetIdIter.next().value).asAlgoTs()
    const defaultAssetData = getDefaultAssetData()
    const { assetId: _, ...assetData } = input ?? {}
    lazyContext.ledger.assetDataMap.set(assetId, {
      ...defaultAssetData,
      ...assetData,
    })
    return new AssetCls(assetId)
  }

  /**
   * Generates a random application with the specified context data.
   * @param {ApplicationContextData} [input] - The context data for the application.
   * @returns {Application} - A random application.
   */
  application(input?: ApplicationContextData): ApplicationType {
    const id = input?.applicationId
    if (id && lazyContext.ledger.applicationDataMap.has(id)) {
      throw new InternalError('Application with such ID already exists in testing context!')
    }
    const applicationId = asUint64Cls(id ?? lazyContext.ledger.appIdIter.next().value).asAlgoTs()
    const data = new ApplicationData()
    const { applicationId: _, ...applicationData } = input ?? {}
    data.application = {
      ...data.application,
      ...applicationData,
    }
    lazyContext.ledger.applicationDataMap.set(applicationId, data)
    return new ApplicationCls(applicationId)
  }
}
